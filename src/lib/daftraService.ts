import { supabase } from './supabase';

export interface DaftraSettings {
    daftra_client_id: string;
    daftra_client_secret: string;
    daftra_domain: string;
}

export interface DaftraInvoice {
    customer_name: string;
    customer_email: string;
    amount: number;
    product_name: string;
    order_id: string;
}

class DaftraService {
    private async getSettings(): Promise<DaftraSettings | null> {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('site_settings')
            .select('daftra_client_id, daftra_client_secret, daftra_domain')
            .single();
        
        if (error) {
            console.error('Error fetching Daftra settings:', error);
            return null;
        }
        return data as DaftraSettings;
    }

    private async getAccessToken(domain: string, clientId: string, clientSecret: string): Promise<string | null> {
        try {
            const response = await fetch(`https://${domain}/oauth2/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: clientId,
                    client_secret: clientSecret,
                }),
            });

            if (!response.ok) return null;
            const data = await response.json();
            return data.access_token;
        } catch (error) {
            console.error('Daftra OAuth Token Error:', error);
            return null;
        }
    }

    async createInvoice(invoice: DaftraInvoice) {
        const settings = await this.getSettings();
        // Fallback to provided credentials if DB is not updated yet
        const clientId = settings?.daftra_client_id || '1471119';
        const clientSecret = settings?.daftra_client_secret || '3c5269c2400cea5afeb3d8341345c8d3340c3358';
        let domain = settings?.daftra_domain || 'cheatloop.daftra.com';

        // Clean domain: remove http/https and trailing slashes
        domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

        try {
            // Step 1: Create or Get Client (to get client_id)
            const clientPayload = {
                Client: {
                    first_name: invoice.customer_name || invoice.customer_email.split('@')[0],
                    email: invoice.customer_email,
                    active: 1
                }
            };

            const clientResponse = await fetch(`https://${domain}/api2/clients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': clientSecret
                },
                body: JSON.stringify(clientPayload)
            });

            const clientText = await clientResponse.text();
            let clientData;
            try {
                clientData = JSON.parse(clientText);
            } catch (e) {
                console.error('Daftra Client API Raw Response:', clientText);
                throw new Error(`Daftra Client API returned invalid JSON: ${clientText.slice(0, 50)}...`);
            }

            let daftraClientId;
            if (clientResponse.ok && clientData.id) {
                daftraClientId = clientData.id;
            } else {
                // Search for client if creation fails or doesn't return ID (often happens if client exists)
                const searchResponse = await fetch(`https://${domain}/api2/clients?filter[email]=${invoice.customer_email}`, {
                    headers: { 'apikey': clientSecret, 'Accept': 'application/json' }
                });
                const searchText = await searchResponse.text();
                let searchData;
                try {
                    searchData = JSON.parse(searchText);
                } catch (e) {
                    throw new Error(`Daftra Search API returned invalid JSON: ${searchText.slice(0, 50)}...`);
                }

                if (searchData.data && searchData.data.length > 0) {
                    // In Daftra API v2, list results are often in data[0].Client.id
                    daftraClientId = searchData.data[0].Client?.id || searchData.data[0].id;
                }
            }

            if (!daftraClientId) {
                throw new Error(`Could not obtain Daftra client_id. Error: ${clientData.message || 'Unknown'}. Response: ${clientText.slice(0, 100)}`);
            }

            // Step 2: Create Invoice using the numeric client_id
            const invoicePayload = {
                Invoice: {
                    client_id: daftraClientId,
                    status: 1,
                    payment_method: 'Online'
                },
                InvoiceItem: [
                    {
                        item: invoice.product_name,
                        description: `Order ID: ${invoice.order_id}`,
                        unit_price: invoice.amount,
                        quantity: 1
                    }
                ]
            };

            const apiEndpoint = `https://${domain}/api2/invoices`;
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': clientSecret
                },
                body: JSON.stringify(invoicePayload)
            });

            const invoiceText = await response.text();
            let responseData;
            try {
                responseData = JSON.parse(invoiceText);
            } catch (e) {
                console.error('Daftra Invoice API Raw Response:', invoiceText);
                if (invoiceText.includes('Invoice is created successfully')) {
                    return { success: true, message: 'Invoice created successfully' };
                }
                throw new Error(`Daftra Invoice API returned invalid JSON: ${invoiceText.slice(0, 50)}...`);
            }

            if (!response.ok) {
                throw new Error(responseData.message || `Failed to create invoice (Status: ${response.status})`);
            }

            return responseData;
        } catch (error: any) {
            console.error('Daftra Invoice Creation Error:', error);
            throw error;
        }
    }
}

export const daftraService = new DaftraService();
