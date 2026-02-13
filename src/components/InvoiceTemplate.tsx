import React from 'react';
import { PurchaseIntent, InvoiceTemplateData } from '../lib/supabase';

export interface InvoiceTheme {
    backgroundColor: string;
    textColor: string;
    panelColor: string;
    borderColor: string;
    mutedColor: string;
}

interface InvoiceTemplateProps {
    intent: PurchaseIntent;
    productKey: string;
    siteSettings: Record<string, string>;
    productPrice: string | number;
    templateData?: InvoiceTemplateData;
    theme?: InvoiceTheme;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ intent, productKey, siteSettings = {}, productPrice, templateData }) => {
    // Helper to get contrasting color for the copy button text
    const getContrastColor = (hex: string) => {
        if (!hex || hex === 'transparent') return '#ffffff';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#ffffff';
    };

    if (!intent) {
        return <div className="p-4 text-red-500">Error: Missing intent data</div>;
    }

    const textColor = templateData?.text_color || '#111827';
    const bgColor = templateData?.bg_color || '#f3f4f6';
    const isDark = bgColor !== '#f3f4f6' && bgColor !== '#ffffff';
    const buttonTextColor = getContrastColor(textColor);

    const invoiceDate = intent.created_at 
        ? new Date(intent.created_at).toLocaleDateString("en-GB", {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
        : 'N/A';

    const script = `
        function copyKey() {
            const key = document.getElementById("licenseKey").innerText;
            if (key === 'XXXX-XXXX-XXXX-XXXX' || key === '[Enter key to generate]') return;
            navigator.clipboard.writeText(key).then(() => {
                alert("License key copied!");
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        }

        document.addEventListener('DOMContentLoaded', function() {
            const key = "${productKey || 'NO_KEY_PROVIDED'}";
            const productKeyEl = document.getElementById("licenseKey");
            if (productKeyEl) {
                productKeyEl.textContent = key === 'NO_KEY_PROVIDED' ? '[Enter key to generate]' : key;
            }
            
            // Auto-print logic
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('print') === 'true') {
                window.print();
            }
        });
    `;

    return (
        <html lang="en" dir="ltr">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width,initial-scale=1" />
                <title>{`Invoice — ${templateData?.company_name || siteSettings.site_name || 'Cheatloop'}`}</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
                <style>{`
                    body { 
                        font-family: 'Inter', sans-serif; 
                        background: ${bgColor}; 
                        color: ${textColor};
                        padding: 40px 20px; 
                        margin: 0;
                        line-height: 1.5;
                    } 
                
                    .invoice-container { 
                        max-width: 850px; 
                        margin: auto; 
                        background: ${isDark ? 'rgba(255,255,255,0.03)' : '#ffffff'}; 
                        padding: 40px; 
                        border-radius: 16px; 
                        box-shadow: 0 20px 50px rgba(0,0,0,0.1); 
                        border: 1px solid ${textColor}15;
                    } 
                
                    .invoice-header { 
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center; 
                        margin-bottom: 50px;
                        border-bottom: 2px solid ${textColor}10;
                        padding-bottom: 20px;
                    } 
                
                    .logo img { 
                        max-height: 70px; 
                        filter: ${isDark ? 'drop-shadow(0 0 8px rgba(255,255,255,0.2))' : 'none'};
                    } 
                
                    .invoice-title { 
                        font-size: 32px; 
                        font-weight: 800; 
                        color: ${textColor}; 
                        letter-spacing: -0.02em;
                    } 
                
                    .invoice-details { 
                        text-align: right; 
                        color: ${textColor}70; 
                        font-size: 14px; 
                    } 
                
                    .section h3 { 
                        font-size: 12px; 
                        font-weight: 700; 
                        text-transform: uppercase; 
                        letter-spacing: 0.05em;
                        color: ${textColor}60; 
                        margin-bottom: 12px; 
                    } 
                
                    .section p { 
                        margin: 6px 0; 
                        color: ${textColor}; 
                        font-size: 15px; 
                        font-weight: 500;
                    } 
                
                    th { 
                        text-align: left; 
                        font-size: 13px; 
                        font-weight: 700; 
                        text-transform: uppercase;
                        color: ${textColor}60; 
                        border-bottom: 2px solid ${textColor}20; 
                        padding-bottom: 15px; 
                    } 
                
                    td { 
                        padding: 18px 0; 
                        border-bottom: 1px solid ${textColor}10; 
                        font-size: 15px; 
                        color: ${textColor}; 
                    } 
                
                    .total-row td { 
                        font-weight: 800; 
                        font-size: 20px; 
                        border-top: 2px solid ${textColor}; 
                        border-bottom: none;
                        padding-top: 25px; 
                        color: ${textColor};
                    } 
                
                    .license-box { 
                        background: ${isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc'}; 
                        border: 2px dashed ${textColor}30; 
                        padding: 25px; 
                        border-radius: 12px; 
                        text-align: center;
                        margin-top: 30px; 
                    } 
                
                    .license-key { 
                        font-family: 'JetBrains Mono', monospace; 
                        font-size: 22px; 
                        font-weight: 700;
                        color: ${textColor}; 
                        text-shadow: ${isDark ? '0 0 15px rgba(255,255,255,0.1)' : 'none'};
                    } 
                
                    .copy-btn { 
                        background: ${textColor}; 
                        color: ${buttonTextColor}; 
                        border: none; 
                        padding: 8px 14px; 
                        border-radius: 6px; 
                        cursor: pointer; 
                        font-size: 13px; 
                        transition: 0.2s; 
                        white-space: nowrap;
                    } 
                
                    .copy-btn:hover { 
                        opacity: 0.9;
                    } 

                    .discord-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(88, 101, 242, 0.4) !important;
                        opacity: 0.9;
                    }

                    .shop-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(6, 182, 212, 0.4) !important;
                        opacity: 0.9;
                    }
                
                    .footer { 
                        margin-top: 40px; 
                        font-size: 14px; 
                        color: ${textColor}70; 
                        text-align: center; 
                    } 
                
                    @media print { 
                        body { 
                            background: white; 
                            padding: 0; 
                        } 
                        .invoice-container { 
                            box-shadow: none; 
                            border-radius: 0; 
                        } 
                        .copy-btn { 
                            display: none; 
                        } 
                    } 
                `}</style>
            </head>
            <body>
                <div className="invoice-container">
                    {/* Header */}
                    <div className="invoice-header">
                        <div className="logo">
                            <img src={templateData?.logo_url || siteSettings.site_logo_url || 'https://cheatloop.shop/cheatloop.png'} alt="Company Logo" />
                        </div>

                        <div className="invoice-details">
                            <div className="invoice-title">INVOICE</div>
                            <p>Invoice ID: {intent.id.slice(0, 8).toUpperCase()}</p>
                            <p>Date: {invoiceDate}</p>
                            <a href="https://cheatloop.shop" target="_blank" rel="noopener noreferrer" style={{ 
                                color: textColor, 
                                opacity: 0.6, 
                                textDecoration: 'none', 
                                fontSize: '13px',
                                fontWeight: '600',
                                marginTop: '4px',
                                display: 'block'
                            }}>
                                cheatloop.shop
                            </a>
                        </div>
                    </div>

                    {/* Billed To */}
                    <div className="section">
                        <h3>Billed To</h3>
                        <p>{intent.email.split('@')[0]}</p>
                        <p>{intent.email}</p>
                        <p>{intent.country || 'N/A'}</p>
                    </div>

                    {/* Products Table */}
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th className="text-right">Qty</th>
                                <th className="text-right">Price</th>
                                <th className="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{intent.product_title}</td>
                                <td className="text-right">1</td>
                                <td className="text-right">{typeof productPrice === 'number' ? `$${productPrice.toFixed(2)}` : productPrice}</td>
                                <td className="text-right">{typeof productPrice === 'number' ? `$${productPrice.toFixed(2)}` : productPrice}</td>
                            </tr>

                            <tr className="total-row">
                                <td colSpan={3} className="text-right">Total</td>
                                <td className="text-right">{typeof productPrice === 'number' ? `$${productPrice.toFixed(2)}` : productPrice}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* License Key Section */}
                    <div className="section">
                        <h3>LICENSE KEY</h3>
                        <div className="license-box">
                            <div className="license-key" id="licenseKey">
                                {productKey}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="footer">
                        <div style={{ marginBottom: '20px' }}>
                            {templateData?.footer_notes || 'Thank you for your business.'}
                        </div>
                        
                        <div style={{ marginTop: '25px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
                            <a href={siteSettings.discord_url || 'https://discord.gg/sY5EcUVjeA'} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="discord-btn"
                               style={{
                                   display: 'inline-flex',
                                   alignItems: 'center',
                                   gap: '10px',
                                   backgroundColor: '#5865F2',
                                   color: '#ffffff',
                                   padding: '12px 28px',
                                   borderRadius: '12px',
                                   textDecoration: 'none',
                                   fontWeight: '700',
                                   fontSize: '15px',
                                   transition: 'all 0.3s ease',
                                   boxShadow: '0 4px 15px rgba(88, 101, 242, 0.3)',
                                   border: 'none'
                                }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                                </svg>
                                Join Our Discord
                            </a>

                            <a href={siteSettings.shop_url || 'https://cheatloop.shop'} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="shop-btn"
                               style={{
                                   display: 'inline-flex',
                                   alignItems: 'center',
                                   gap: '10px',
                                   backgroundColor: '#06b6d4',
                                   color: '#ffffff',
                                   padding: '12px 28px',
                                   borderRadius: '12px',
                                   textDecoration: 'none',
                                   fontWeight: '700',
                                   fontSize: '15px',
                                   transition: 'all 0.3s ease',
                                   boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)',
                                   border: 'none'
                               }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="9" cy="21" r="1"></circle>
                                    <circle cx="20" cy="21" r="1"></circle>
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                </svg>
                                Shop
                            </a>
                        </div>
                    </div>
                </div>
                <script dangerouslySetInnerHTML={{ __html: script }} />
            </body>
        </html>
    );
};

export default InvoiceTemplate;
