import { supabase } from './supabase';

export interface BrevoEmailPayload {
    customer_name: string;
    customer_email: string;
    amount: number;
    product_name: string;
    order_id: string;
    country: string;
    license_key: string;
    discord_url?: string;
    shop_url?: string;
    logo_url?: string;
    bg_color?: string;
    text_color?: string;
    footer_notes?: string;
}

class BrevoService {
    private fallbackApiKey = import.meta.env.VITE_BREVO_API_KEY || '';

    private async getSettings() {
        if (!supabase) return null;
        const { data } = await supabase.from('site_settings').select('*');
        const settings = (data || []).reduce((acc, s) => {
            acc[s.key] = s.value;
            return acc;
        }, {} as Record<string, string>);
        return settings;
    }

    async sendInvoiceEmail(payload: BrevoEmailPayload) {
        try {
            const settings = await this.getSettings();
            const apiKey = settings?.brevo_api_key || this.fallbackApiKey;
            const senderEmail = settings?.brevo_sender_email || 'support@cheatloop.shop';
            const senderName = settings?.brevo_sender_name || 'Cheatloop Team';

            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': apiKey,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: {
                        name: senderName,
                        email: senderEmail
                    },
                    to: [
                        {
                            email: payload.customer_email,
                            name: payload.customer_name
                        }
                    ],
                    subject: `Invoice for ${payload.product_name} - Order #${payload.order_id}`,
                    htmlContent: `
<!DOCTYPE html> 
 <html lang="en"> 
 <head> 
 <meta charset="UTF-8"> 
 <meta name="viewport" content="width=device-width, initial-scale=1.0"> 
 <title>Invoice</title> 
 <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
 <style> 
     body { 
         font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
         background: ${payload.bg_color || '#f3f4f6'}; 
         padding: 40px 20px; 
         margin: 0;
     } 
  
     .invoice-container { 
         max-width: 850px; 
         margin: auto; 
         background: ${payload.bg_color && payload.bg_color !== '#f3f4f6' ? 'rgba(255,255,255,0.05)' : '#ffffff'}; 
         padding: 40px; 
         border-radius: 12px; 
         box-shadow: 0 10px 30px rgba(0,0,0,0.05); 
         border: 1px solid ${payload.text_color ? payload.text_color + '20' : '#e5e7eb'};
     } 
  
     .invoice-header { 
         display: flex; 
         justify-content: space-between; 
         align-items: center; 
         margin-bottom: 40px; 
     } 
  
     .logo img { 
         max-height: 60px; 
     } 
  
     .invoice-title { 
         font-size: 28px; 
         font-weight: 700; 
         color: ${payload.text_color || '#111827'}; 
     } 
  
     .invoice-details { 
         text-align: right; 
         color: ${payload.text_color ? payload.text_color + '80' : '#6b7280'}; 
         font-size: 14px; 
     } 
  
     .section { 
         margin-bottom: 30px; 
     } 
  
     .section h3 { 
         font-size: 13px; 
         font-weight: 600; 
         text-transform: uppercase; 
         color: ${payload.text_color ? payload.text_color + '80' : '#6b7280'}; 
         margin-bottom: 10px; 
         margin-top: 0;
     } 
  
     .section p { 
         margin: 4px 0; 
         color: ${payload.text_color || '#111827'}; 
         font-size: 15px; 
     } 
  
     table { 
         width: 100%; 
         border-collapse: collapse; 
         margin-top: 20px; 
     } 
  
     th { 
         text-align: left; 
         font-size: 14px; 
         font-weight: 600; 
         color: ${payload.text_color ? payload.text_color + '80' : '#6b7280'}; 
         border-bottom: 1px solid ${payload.text_color ? payload.text_color + '20' : '#e5e7eb'}; 
         padding-bottom: 10px; 
     } 
  
     td { 
         padding: 12px 0; 
         border-bottom: 1px solid ${payload.text_color ? payload.text_color + '10' : '#f3f4f6'}; 
         font-size: 15px; 
         color: ${payload.text_color || '#111827'}; 
     } 
  
     .text-right { 
         text-align: right; 
     } 
  
     .total-row td { 
         font-weight: 700; 
         font-size: 16px; 
         border-top: 2px solid ${payload.text_color || '#111827'}; 
         padding-top: 15px; 
     } 
  
     /* License Key Box */ 
     .license-box { 
         background: ${payload.bg_color && payload.bg_color !== '#f3f4f6' ? 'rgba(255,255,255,0.03)' : '#f9fafb'}; 
         border: 1px solid ${payload.text_color ? payload.text_color + '20' : '#e5e7eb'}; 
         padding: 20px; 
         border-radius: 10px; 
         text-align: center;
         margin-top: 15px; 
     } 
 
     .license-key { 
         font-family: monospace; 
         font-size: 18px; 
         font-weight: 700;
         letter-spacing: 1px; 
         color: ${payload.text_color || '#111827'}; 
         word-break: break-all;
         display: block;
     } 
  
     .footer { 
         margin-top: 40px; 
         font-size: 14px; 
         color: ${payload.text_color ? payload.text_color + '70' : '#6b7280'}; 
         text-align: center; 
     } 
 </style> 
 </head> 
  
 <body> 
  
 <div class="invoice-container"> 
  
     <!-- Header --> 
    <div class="invoice-header"> 
        <div class="logo"> 
            <img src="${payload.logo_url || settings?.site_logo_url || 'https://cheatloop.shop/cheatloop.png'}" alt="Company Logo" style="max-height: 60px;"> 
        </div> 
  
         <div class="invoice-details"> 
             <div class="invoice-title">INVOICE</div> 
             <p style="margin: 4px 0;">Invoice ID: #${payload.order_id}</p> 
             <p style="margin: 4px 0;">Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p> 
             <a href="https://cheatloop.shop" target="_blank" style="color: ${payload.text_color || '#111827'}; opacity: 0.6; text-decoration: none; font-size: 13px; font-weight: 600; margin-top: 4px; display: block;">cheatloop.shop</a>
         </div> 
     </div> 
  
     <!-- Billed To --> 
     <div class="section"> 
         <h3>Billed To</h3> 
         <p>${payload.customer_name}</p> 
         <p>${payload.customer_email}</p> 
         <p>${payload.country}</p> 
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
                 <td class="text-right">$${payload.amount.toFixed(2)}</td> 
                 <td class="text-right">$${payload.amount.toFixed(2)}</td> 
             </tr> 
  
             <tr class="total-row"> 
                 <td colspan="3" class="text-right">Total</td> 
                 <td class="text-right">$${payload.amount.toFixed(2)}</td> 
             </tr> 
         </tbody> 
     </table> 
  
     <!-- License Key Section --> 
     <div class="section"> 
         <h3>License Key</h3> 
  
         <div class="license-box"> 
             <div class="license-key"> 
                 ${payload.license_key} 
             </div> 
         </div> 
     </div> 
  
     <!-- Footer --> 
     <div class="footer"> 
         <div style="margin-bottom: 20px;">
             ${payload.footer_notes || 'Thank you for your business.'} 
         </div>
         
         <div style="margin-top: 25px; text-align: center;">
             <a href="${payload.shop_url || settings?.shop_url || 'https://cheatloop.shop'}" 
                target="_blank" 
                style="display: inline-block; background-color: #06b6d4; color: #ffffff; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3); margin-right: 10px;">
                 Shop
             </a>
             <a href="${payload.discord_url || settings?.discord_url || 'https://discord.gg/sY5EcUVjeA'}" 
                target="_blank" 
                style="display: inline-block; background-color: #5865F2; color: #ffffff; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 4px 15px rgba(88, 101, 242, 0.3);">
                 Join Our Discord
             </a>
         </div>
     </div> 
  
 </div> 
 </body> 
 </html> 
                    `
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send email via Brevo');
            }

            return await response.json();
        } catch (error: any) {
            console.error('Brevo Email Error:', error);
            throw error;
        }
    }

    // Adding campaign functionality as requested in the snippet
    async createCampaign(name: string, subject: string) {
        try {
            const settings = await this.getSettings();
            const apiKey = settings?.brevo_api_key || this.fallbackApiKey;
            const senderEmail = settings?.brevo_sender_email || 'support@cheatloop.shop';
            const senderName = settings?.brevo_sender_name || 'Cheatloop Team';

            const response = await fetch('https://api.brevo.com/v3/emailCampaigns', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': apiKey,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    subject: subject,
                    sender: { name: senderName, email: senderEmail },
                    type: 'classic',
                    htmlContent: 'Congratulations! You successfully sent this example campaign via the Brevo API.',
                    recipients: { listIds: [2, 7] },
                    scheduledAt: new Date(Date.now() + 3600000).toISOString()
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Brevo Campaign Error:', error);
            throw error;
        }
    }
}

export const brevoService = new BrevoService();
