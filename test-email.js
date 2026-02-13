
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envPath = path.join(__dirname, '.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) env[key.trim()] = value.trim()
})

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseKey = env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testEmail() {
  const { data: settings } = await supabase.from('site_settings').select('*')
  const settingsMap = (settings || []).reduce((acc, s) => {
    acc[s.key] = s.value
    return acc
  }, {})

  const apiKey = settingsMap.brevo_api_key
  console.log('Brevo API Key found:', apiKey ? 'Yes' : 'No')

  if (!apiKey) {
    console.error('Brevo API Key is missing in site_settings table')
    return
  }

  // Fetch template for cheatloop (default test brand)
  const { data: template } = await supabase
    .from('invoice_templates')
    .select('*')
    .eq('brand_name', 'cheatloop')
    .single()

  const orderId = 'TEST-' + Date.now().toString().slice(-6)
  const licenseKey = 'CHEA-TLOO-PKEY-TEST-' + Math.random().toString(36).substring(2, 6).toUpperCase()

  const payload = {
    customer_name: 'Abdulawatban',
    customer_email: 'abdulawatban@gmail.com',
    amount: 45,
    product_name: 'Cheatloop Normal',
    order_id: orderId,
    country: 'SA',
    license_key: licenseKey,
    logo_url: template?.logo_url || settingsMap.site_logo_url || 'https://pbdkxzrzbnlajjgubgis.supabase.co/storage/v1/object/public/site-assets/logo-1761638967148-cheatloop.png'
  }

  console.log('Sending test email to:', payload.customer_email)

  const htmlContent = `
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

    .invoice-title { 
        font-size: 32px; 
        font-weight: 800; 
        color: ${template?.text_color || '#111827'}; 
        letter-spacing: -0.02em;
        margin-bottom: 5px;
    } 

    .clearfix::after {
        content: "";
        clear: both;
        display: table;
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
           <img src="${payload.logo_url}" alt="Company Logo"> 
       </div> 
 
        <div class="invoice-details"> 
            <div class="invoice-title">INVOICE</div> 
            <p style="margin: 4px 0;">Invoice ID: #TEST-ORDER</p> 
            <p style="margin: 4px 0;">Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p> 
            <a href="${settingsMap.shop_url || 'https://cheatloop.shop'}" target="_blank" style="color: ${template?.text_color || '#111827'}; opacity: 0.6; text-decoration: none; font-size: 13px; font-weight: 600; margin-top: 4px; display: block;">${(settingsMap.shop_url || 'cheatloop.shop').replace('https://', '')}</a>
        </div> 
    </div> 
 
    <!-- Billed To --> 
    <div class="section"> 
        <h3>Billed To</h3> 
        <p>${payload.customer_name}</p> 
        <p>${payload.customer_email}</p> 
        <p>United Arab Emirates</p> 
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
                <td>${payload.product_name}</td> 
                <td class="text-right">1</td> 
                <td class="text-right">$10.00</td> 
                <td class="text-right">$10.00</td> 
            </tr> 
 
            <tr class="total-row"> 
                <td colspan="3" class="text-right">Total</td> 
                <td class="text-right">$10.00</td> 
            </tr> 
        </tbody> 
    </table> 
 
    <!-- License Key Section --> 
    <div class="section"> 
        <h3>LICENSE KEY</h3> 
 
        <div class="license-box"> 
            <div class="license-key"> 
                ${payload.license_key} 
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
`;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: { 
        name: template?.company_name || 'Cheatloop Test', 
        email: settingsMap.brevo_sender_email || 'support@cheatloop.shop' 
      },
      to: [{ email: payload.customer_email, name: payload.customer_name }],
      subject: `Test Invoice for ${payload.product_name}`,
      htmlContent: htmlContent
    })
  })

  const result = await response.json()
  console.log('Brevo Response:', result)

  // Test Discord Webhook
  const discordWebhookUrl = settingsMap.discord_webhook_url
  if (discordWebhookUrl) {
    console.log('Sending test Discord notification...')
    try {
      const discordResponse = await fetch(discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '✅ [TEST] تم الدفع بنجاح!',
            color: 0x06b6d4,
            fields: [
              { name: 'المنتج', value: payload.product_name, inline: true },
              { name: 'المبلغ', value: `$${payload.amount}`, inline: true },
              { name: 'العميل', value: payload.customer_email, inline: true },
              { name: 'رقم الطلب', value: `#${payload.order_id}`, inline: true },
              { name: 'المفتاح المرسل', value: `\`${payload.license_key}\``, inline: false }
            ],
            timestamp: new Date().toISOString(),
            footer: { text: 'Cheatloop Sales Bot - TEST MODE' }
          }]
        })
      })
      if (discordResponse.ok) {
        console.log('Discord notification sent successfully!')
        console.log('\n--- TEST SCENARIO READY ---')
        console.log('1. Check your Email: abdulawatban@gmail.com')
        console.log('2. Check Discord Channel')
        console.log('3. Open this link to see the Success Page with the SAME key:')
        console.log(`http://localhost:5175/payment-success?session_id=TEST_${orderId}`)
        console.log('---------------------------\n')
      } else {
        console.error('Failed to send Discord notification:', await discordResponse.text())
      }
    } catch (err) {
      console.error('Error sending Discord notification:', err)
    }
  } else {
    console.warn('Discord Webhook URL not found in site_settings')
  }
}

testEmail()
