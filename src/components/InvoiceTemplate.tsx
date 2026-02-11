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

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ intent, productKey, siteSettings, productPrice, templateData, theme }) => {
    const invoiceDate = new Date(intent.created_at).toLocaleDateString("en-GB");

    // Default to Navy if no theme provided
    const activeTheme = theme || {
        backgroundColor: '#0f1724',
        textColor: '#e6eef8',
        panelColor: '#1e293b',
        borderColor: '#334155',
        mutedColor: '#94a3b8'
    };

    const script = `
        document.addEventListener('DOMContentLoaded', function() {
            const key = "${productKey || 'NO_KEY_PROVIDED'}";
            const productKeyEl = document.getElementById("productKey");
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
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet" />
                <style>{`
                    :root{--bg:#0f1724;--accent:#0ea5e9;--muted:#94a3b8;--white:#e6eef8;}
                    *{box-sizing:border-box}
                    body{font-family:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial;margin:0;background:linear-gradient(180deg,#071021 0%,#071525 100%);color:var(--white);padding:24px;}
                    
                    @media print {
                        @page {
                            size: auto;
                            margin: 0mm;
                        }
                        body { 
                            background-color: ${activeTheme.backgroundColor} !important;
                            color: ${activeTheme.textColor} !important;
                            padding: 20px; 
                            margin: 0;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .invoice-wrap { 
                            max-width: 100%; 
                            margin: 0; 
                            background-color: ${activeTheme.backgroundColor} !important;
                            border: none !important; 
                            box-shadow: none; 
                            padding: 20px;
                            color: ${activeTheme.textColor} !important;
                        }
                        /* Ensure all text elements use the theme text color */
                        .brand .meta .title, .inv-meta .inv-title, .panel h4, .key, table, .notes, .notes strong, td {
                            color: ${activeTheme.textColor} !important;
                        }
                        /* Muted text */
                        .muted, .brand .meta .sub, .inv-meta .small, th {
                            color: ${activeTheme.mutedColor} !important;
                        }
                        /* Panels inside the invoice */
                        .panel, .keybox {
                            background-color: ${activeTheme.panelColor} !important;
                            border: 1px solid ${activeTheme.borderColor} !important;
                            color: ${activeTheme.textColor} !important;
                        }
                        hr {
                            background: ${activeTheme.borderColor} !important;
                        }
                        td, th {
                            border-bottom-color: ${activeTheme.borderColor} !important;
                        }
                        .btn { 
                            display: none !important; 
                        }
                        .notes a {
                            color: #0ea5e9 !important;
                            text-decoration: underline !important;
                        }
                        .invoice-footer {
                            border-top-color: ${activeTheme.borderColor} !important;
                        }
                        .invoice-footer a {
                            color: #0ea5e9 !important;
                        }
                    }

                    .invoice-wrap{max-width:900px;margin:0 auto;background:rgba(255,255,255,0.03);border-radius:14px;padding:24px;box-shadow:0 8px 30px rgba(2,6,23,0.6);border:1px solid rgba(255,255,255,0.05);display:flex;flex-direction:column;}
                    .inv-header{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;}
                    .brand{display:flex;align-items:center;gap:14px;}
                    .brand img{width:72px;height:72px;border-radius:10px;object-fit:cover;}
                    .brand .meta{line-height:1.3;}
                    .brand .meta .title{font-weight:700;font-size:18px}
                    .brand .meta .sub{color:var(--muted);font-size:13px}
                    .inv-meta{text-align:left;}
                    .inv-meta .inv-title{font-weight:700;font-size:20px}
                    .inv-meta .small{color:var(--muted);font-size:13px}
                    hr{border:0;height:1px;background:rgba(255,255,255,0.06);margin:18px 0;}
                    .cols{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
                    .panel{background:rgba(255,255,255,0.02);border-radius:10px;padding:16px;}
                    .panel h4{margin:0 0 8px 0;font-size:14px}
                    .muted{color:var(--muted);font-size:13px}
                    table{width:100%;border-collapse:collapse;margin-top:12px;color:var(--white);}
                    th,td{padding:10px;border-bottom:1px dashed rgba(255,255,255,0.05);text-align:right;}
                    th{color:var(--muted);font-size:13px;font-weight:600}
                    .keybox{background:rgba(14,165,233,0.1);padding:10px;border-radius:8px;display:flex;justify-content:center;align-items:center;margin-top:8px;direction:ltr;min-height:50px;}
                    .key{font-family:monospace;font-weight:700;font-size:15px;letter-spacing:1px;text-align:center;word-break:break-all;}
                    .btn{border:0;padding:8px 12px;border-radius:8px;font-weight:700;cursor:pointer;background:linear-gradient(90deg,var(--accent),#6366f1);color:#fff;}
                    .notes{margin-top:16px;color:var(--muted);font-size:13px;line-height:1.6}
                    .invoice-footer{text-align:center;margin-top:24px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06);}
                    .invoice-footer a{color:var(--accent);text-decoration:none;font-size:14px;font-weight:600;}
                    a{color:var(--accent); text-decoration:none;}
                    @media(max-width:700px){.cols{grid-template-columns:1fr}}
                `}</style>
            </head>
            <body>
                <div className="invoice-wrap">
                    <div>
                        <div className="inv-header">
                            <div className="brand">
                                <img src={templateData?.logo_url || siteSettings.site_logo_url || '/cheatloop copy.png'} alt="Logo" />
                                <div className="meta">
                                    <div className="title">{templateData?.company_name || siteSettings.site_name || 'Cheatloop'}</div>
                                    <div className="sub">Invoice</div>
                                </div>
                            </div>
                            <div className="inv-meta">
                                <div className="inv-title">Invoice</div>
                                <div className="small" id="invoiceDate">Date: {invoiceDate}</div>
                            </div>
                        </div>
                        <hr />
                        <div className="cols">
                            <div className="panel">
                                <h4>Billed To</h4>
                                <div>{intent.email}</div>
                                <div className="muted">{intent.phone_number}</div>
                                <div className="muted" style={{ marginTop: '6px' }}>Country: {intent.country}</div>
                            </div>
                            <div className="panel">
                                <h4>From</h4>
                                <div>{templateData?.company_name || 'Cheatloop Team'}</div>
                                <div className="muted">{templateData?.support_contact || siteSettings.telegram_url || 'Contact via site'}</div>
                            </div>
                        </div>

                        <div className="panel" style={{marginTop: '20px'}}>
                            <h4>Product</h4>
                            <div><strong>{intent.product_title}</strong></div>
                            <div className="keybox">
                                <div className="key" id="productKey"></div>
                            </div>
                        </div>

                        <table>
                            <thead>
                                <tr><th>Product</th><th>Quantity</th><th>Price</th></tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{textAlign: 'left'}}>{intent.product_title}</td>
                                    <td>1</td>
                                    <td>{typeof productPrice === 'number' ? `$${productPrice}` : productPrice}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="notes">
                            <strong>{templateData?.footer_notes || 'Thank you for your purchase!'}</strong><br />
                            If you have any questions, contact us on Discord:
                            <br />
                            <a href="https://discord.gg/pcgamers" target="_blank" rel="noopener noreferrer" style={{ marginTop: '8px', display: 'inline-block' }}>
                                https://discord.gg/pcgamers
                            </a>
                        </div>
                    </div>
                    <div style={{ flexGrow: 1 }}></div>
                    <div className="invoice-footer">
                        <a href="https://cheatloop.shop" target="_blank" rel="noopener noreferrer">
                            cheatloop.shop
                        </a>
                    </div>
                </div>
                <script dangerouslySetInnerHTML={{ __html: script }} />
            </body>
        </html>
    );
};

export default InvoiceTemplate;
