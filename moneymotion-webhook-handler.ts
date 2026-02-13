import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

serve(async (req) => {
  try {
    const signature = req.headers.get("x-checkout-signature");
    if (!signature) {
      return new Response("Missing signature", { status: 401 });
    }

    const bodyText = await req.text();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. جلب الإعدادات من القاعدة
    const { data: allSettings } = await supabase
      .from('site_settings')
      .select('key, value');

    const settingsMap = (allSettings || []).reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    const webhookSecret = settingsMap.moneymotion_webhook_secret;
    if (!webhookSecret) {
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // 2. التحقق من التوقيع (HMAC-SHA512)
    const encoder = new TextEncoder();
    const keyData = encoder.encode(webhookSecret);
    const messageData = encoder.encode(bodyText);

    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );

    const hmacBuffer = await crypto.subtle.sign("HMAC", key, messageData);
    const hmacArray = Array.from(new Uint8Array(hmacBuffer));
    const calculatedSignature = btoa(String.fromCharCode.apply(null, hmacArray));

    if (calculatedSignature !== signature) {
      console.error("Invalid signature detected");
      return new Response("Invalid signature", { status: 401 });
    }

    const payload = JSON.parse(bodyText);
    const event = payload.event;
    const metadata = payload.metadata;
    const intentId = metadata?.intent_id;

    console.log(`Processing event: ${event} for intent: ${intentId}`);

    if (intentId) {
      // 3. تحديث حالة الطلب بناءً على الحدث
      let status = 'pending';
      if (event === 'checkout_session:complete') status = 'completed';
      else if (event === 'checkout_session:failed') status = 'failed';
      else if (event === 'checkout_session:expired') status = 'cancelled';

      const { error: updateError } = await supabase
        .from('purchase_intents')
        .update({ 
          status: status,
          moneymotion_session_id: payload.id 
        })
        .eq('id', intentId);

      if (updateError) throw updateError;

      // 4. إذا اكتمل الدفع، حاول صرف مفتاح تلقائياً (اختياري)
      if (status === 'completed') {
        const productId = metadata.product_id;
        const email = metadata.customer_email || payload.userInfo?.email;
        
        // استدعاء الـ RPC لصرف المفتاح
        const { data: key, error: keyError } = await supabase.rpc('claim_available_key', {
          p_product_id: productId,
          p_email: email,
          p_intent_id: intentId
        });

        if (keyError) {
          console.error("Error claiming key:", keyError);
        } else if (key) {
          console.log(`Key claimed successfully: ${key}`);
          
          // إرسال الإيميل عبر Brevo
          const brevoApiKey = settingsMap.brevo_api_key;
          if (brevoApiKey) {
            try {
              const { data: product } = await supabase
                .from('products')
                .select('title, price')
                .eq('id', productId)
                .single();

              const { data: intent } = await supabase
                .from('purchase_intents')
                .select('country, product_title')
                .eq('id', intentId)
                .single();

              const isSinki = (intent?.product_title || product?.title || '').toLowerCase().includes('sinki');
              const brand = isSinki ? 'sinki' : 'cheatloop';
              
              // جلب قالب الفاتورة الخاص بالبراند
              const { data: template } = await supabase
                .from('invoice_templates')
                .select('*')
                .eq('brand_name', brand)
                .single();

              const logoUrl = template?.logo_url || settingsMap.site_logo_url || 'https://pbdkxzrzbnlajjgubgis.supabase.co/storage/v1/object/public/site-assets/logo-1761638967148-cheatloop.png';

              const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                  'accept': 'application/json',
                  'api-key': brevoApiKey,
                  'content-type': 'application/json'
                },
                body: JSON.stringify({
                  sender: { 
                    name: template?.company_name || settingsMap.brevo_sender_name || 'Cheatloop Team', 
                    email: settingsMap.brevo_sender_email || 'support@cheatloop.shop' 
                  },
                  to: [{ email: email, name: email.split('@')[0] }],
                  subject: `Invoice for ${product?.title || 'Your Order'} - Order #${intentId.slice(0, 8)}`,
                  htmlContent: `
<!DOCTYPE html> 
<html lang="en"> 
<head> 
<meta charset="UTF-8"> 
<meta name="viewport" content="width=device-width, initial-scale=1.0"> 
<title>Invoice</title> 
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style> 
    body { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
        background: ${template?.bg_color || '#f3f4f6'}; 
        color: ${template?.text_color || '#111827'};
        padding: 40px 20px; 
        margin: 0;
        line-height: 1.5;
    } 
 
    .invoice-container { 
        max-width: 850px; 
        margin: auto; 
        background: ${template?.bg_color && template?.bg_color !== '#f3f4f6' ? 'rgba(255,255,255,0.03)' : '#ffffff'}; 
        padding: 40px; 
        border-radius: 16px; 
        box-shadow: 0 20px 50px rgba(0,0,0,0.1); 
        border: 1px solid ${template?.text_color ? template?.text_color + '15' : '#e5e7eb'};
    } 
 
    .invoice-header { 
        display: block; 
        width: 100%;
        margin-bottom: 50px;
        border-bottom: 2px solid ${template?.text_color ? template?.text_color + '10' : '#f3f4f6'};
        padding-bottom: 20px;
        overflow: hidden;
    } 
 
    .logo { 
        float: left;
    } 

    .logo img { 
        max-height: 70px; 
    } 
 
    .invoice-details { 
        float: right;
        text-align: right; 
        color: ${template?.text_color ? template?.text_color + '70' : '#6b7280'}; 
        font-size: 14px; 
    } 

    .clearfix::after {
        content: "";
        clear: both;
        display: table;
    }
 
    .invoice-title { 
        font-size: 32px; 
        font-weight: 800; 
        color: ${template?.text_color || '#111827'}; 
        letter-spacing: -0.02em;
        margin-bottom: 5px;
    } 
 
    .section { 
         margin-bottom: 30px; 
     } 

     .section h3 { 
        font-size: 12px; 
        font-weight: 700; 
        text-transform: uppercase; 
        letter-spacing: 0.05em;
        color: ${template?.text_color ? template?.text_color + '60' : '#6b7280'}; 
        margin-bottom: 12px; 
    } 
 
    .section p { 
        margin: 6px 0; 
        color: ${template?.text_color || '#111827'}; 
        font-size: 15px; 
        font-weight: 500;
    } 
 
    table { 
        width: 100%; 
        border-collapse: collapse; 
        margin-top: 20px; 
    } 
 
    th { 
        text-align: left; 
        font-size: 13px; 
        font-weight: 700; 
        text-transform: uppercase;
        color: ${template?.text_color ? template?.text_color + '60' : '#6b7280'}; 
        border-bottom: 2px solid ${template?.text_color ? template?.text_color + '20' : '#e5e7eb'}; 
        padding-bottom: 15px; 
    } 
 
    td { 
        padding: 18px 0; 
        border-bottom: 1px solid ${template?.text_color ? template?.text_color + '10' : '#f3f4f6'}; 
        font-size: 15px; 
        color: ${template?.text_color || '#111827'}; 
    } 
 
    .text-right { 
        text-align: right; 
    } 
 
    .total-row td { 
        font-weight: 800; 
        font-size: 20px; 
        border-top: 2px solid ${template?.text_color || '#111827'}; 
        padding-top: 25px; 
        color: ${template?.text_color || '#111827'};
    } 
 
    /* License Key Box */ 
    .license-box { 
        background: ${template?.bg_color && template?.bg_color !== '#f3f4f6' ? 'rgba(255,255,255,0.05)' : '#f8fafc'}; 
        border: 2px dashed ${template?.text_color ? template?.text_color + '30' : '#e5e7eb'}; 
        padding: 25px; 
        border-radius: 12px; 
        text-align: center;
        margin-top: 30px; 
    } 
 
    .license-key { 
        font-family: 'JetBrains Mono', monospace; 
        font-size: 22px; 
        font-weight: 700;
        color: ${template?.text_color || '#111827'}; 
    } 
 
    .footer { 
        margin-top: 40px; 
        font-size: 14px; 
        color: ${template?.text_color ? template?.text_color + '70' : '#6b7280'}; 
        text-align: center; 
    } 
</style> 
</head> 
 
<body> 
 
<div class="invoice-container"> 
 
    <!-- Header --> 
   <div class="invoice-header clearfix"> 
       <div class="logo"> 
           <img src="${logoUrl}" alt="Company Logo"> 
       </div> 
 
        <div class="invoice-details"> 
            <div class="invoice-title">INVOICE</div> 
            <p style="margin: 4px 0;">Invoice ID: #${intentId.slice(0, 8).toUpperCase()}</p> 
            <p style="margin: 4px 0;">Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p> 
            <a href="${settingsMap.shop_url || 'https://cheatloop.shop'}" target="_blank" style="color: ${template?.text_color || '#111827'}; opacity: 0.6; text-decoration: none; font-size: 13px; font-weight: 600; margin-top: 4px; display: block;">${(settingsMap.shop_url || 'cheatloop.shop').replace('https://', '')}</a>
        </div> 
    </div> 
 
    <!-- Billed To --> 
    <div class="section"> 
        <h3>Billed To</h3> 
        <p>${email.split('@')[0]}</p> 
        <p>${email}</p> 
        <p>${intent?.country || 'N/A'}</p> 
    </div> 
 
    <!-- Products Table --> 
    <table> 
        <thead> 
            <tr> 
                <th>Product</th> 
                <th class="text-right">Qty</th> 
                <th class="text-right">Price</th> 
                <th class="text-right">Total</th> 
            </tr> 
        </thead> 
        <tbody> 
            <tr> 
                <td>${product?.title || 'Product'}</td> 
                <td class="text-right">1</td> 
                <td class="text-right">$${(product?.price || 0).toFixed(2)}</td> 
                <td class="text-right">$${(product?.price || 0).toFixed(2)}</td> 
            </tr> 
 
            <tr class="total-row"> 
                <td colspan="3" class="text-right">Total</td> 
                <td class="text-right">$${(product?.price || 0).toFixed(2)}</td> 
            </tr> 
        </tbody> 
    </table> 
 
    <!-- License Key Section --> 
    <div class="section"> 
        <h3>LICENSE KEY</h3> 
 
        <div class="license-box"> 
            <div class="license-key"> 
                ${key} 
            </div> 
        </div> 
    </div> 
 
    <!-- Footer --> 
    <div class="footer"> 
        <div style="margin-bottom: 20px;">
            ${template?.footer_notes || 'Thank you for your business.'} 
        </div>
        
        <div style="margin-top: 25px; text-align: center;">
            <a href="${settingsMap.shop_url || 'https://cheatloop.shop'}" 
               target="_blank" 
               style="display: inline-block; background-color: #06b6d4; color: #ffffff; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3); margin-right: 10px;">
                ${settingsMap.invoice_shop_button_text || 'Shop'}
            </a>
            <a href="${settingsMap.discord_url || 'https://discord.gg/sY5EcUVjeA'}" 
               target="_blank" 
               style="display: inline-block; background-color: #5865F2; color: #ffffff; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 4px 15px rgba(88, 101, 242, 0.3);">
                ${settingsMap.invoice_discord_button_text || 'Join Our Discord'}
            </a>
        </div>
    </div> 
 
</div> 
</body> 
</html> 
                  `
                })
              });
              
              if (response.ok) {
                console.log("Email sent successfully via Brevo");
              } else {
                const errorData = await response.json();
                console.error("Failed to send email via Brevo:", errorData);
              }

              // 5. إرسال إشعار ديسكورد بنجاح العملية (اختياري)
              const discordWebhookUrl = settingsMap.discord_webhook_url;
              if (discordWebhookUrl) {
                try {
                  await fetch(discordWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      embeds: [{
                        title: '✅ تم الدفع بنجاح!',
                        color: 0x06b6d4, // Cyan
                        fields: [
                          { name: 'المنتج', value: product?.title || 'غير معروف', inline: true },
                          { name: 'المبلغ', value: `$${product?.price || 0}`, inline: true },
                          { name: 'العميل', value: email, inline: true },
                          { name: 'رقم الطلب', value: `#${intentId.slice(0, 8).toUpperCase()}`, inline: true },
                          { name: 'المفتاح المرسل', value: `\`${key}\``, inline: false }
                        ],
                        timestamp: new Date().toISOString(),
                        footer: { text: 'Cheatloop Sales Bot' }
                      }]
                    })
                  });
                  console.log("Discord success notification sent");
                } catch (discordErr) {
                  console.error("Error sending Discord notification:", discordErr);
                }
              }
            } catch (emailErr) {
              console.error("Error sending email:", emailErr);
            }
          } else {
            console.warn("Brevo API key not found, skipping email.");
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
})
