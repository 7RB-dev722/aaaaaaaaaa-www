
interface MoneyMotionSessionRequest {
  json: {
    description: string;
    urls: {
      success: string;
      cancel: string;
      failure: string;
    };
    userInfo: {
      email: string;
    };
    lineItems: Array<{
      name: string;
      description: string;
      pricePerItemInCents: number;
      quantity: number;
    }>;
  };
}

interface MoneyMotionSessionResponse {
  result: {
    data: {
      json: {
        checkoutSessionId: string;
      }
    }
  }
}

const MONEYMOTION_ENV_KEY = import.meta.env.VITE_MONEYMOTION_API_KEY;
const MONEYMOTION_BASE_URL = 'https://api.moneymotion.io';
const MONEYMOTION_CHECKOUT_URL = 'https://moneymotion.io/checkout';

export const moneyMotionService = {
  /**
   * Gets the API key from database or fallback to env
   */
  async getApiKey() {
    try {
      const settings = await this.getSettings();
      return settings.moneymotion_api_key || MONEYMOTION_ENV_KEY;
    } catch (error) {
      return MONEYMOTION_ENV_KEY;
    }
  },

  /**
   * Creates a checkout session with MoneyMotion.io using the new API structure
   * @param details - The payment session details
   * @returns The session response including the checkout URL
   */
  async createCheckoutSession(details: {
    amount: number;
    currency: string;
    productName: string;
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: any;
    maskedDomain?: string; // Optional domain to mask the real site
  }) {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('MoneyMotion API Key is not configured');
    }

    const settings = await this.getSettings();
    const globalFakeDomain = settings.moneymotion_fake_domain;
    const fakeDomain = details.maskedDomain || globalFakeDomain;

    // MoneyMotion expects amount in cents
    const amountInCents = Math.round(details.amount * 100);

    // Ensure URLs use HTTPS as required by MoneyMotion
    const ensureHttps = (url: string) => {
      let finalUrl = url;
      
      // Dynamic Domain Support: Always redirect back to the current domain being used
      const currentOrigin = window.location.origin;
      
      // If we are on localhost, we still must send HTTPS to MoneyMotion API
      // even if our local server is HTTP. The user might need to manually
      // change https to http in the address bar after redirect, or run local server with HTTPS.
      if (finalUrl.includes('localhost') || finalUrl.includes('127.0.0.1')) {
        finalUrl = finalUrl.replace('http://', 'https://');
      } else if (!finalUrl.startsWith(currentOrigin)) {
        try {
          const urlObj = new URL(finalUrl);
          finalUrl = currentOrigin + urlObj.pathname + urlObj.search;
        } catch (e) {
          console.error("URL parsing error in ensureHttps:", e);
        }
      }
      
      // Force HTTPS for all production domains
      if (!finalUrl.startsWith('https://')) {
        finalUrl = finalUrl.replace('http://', 'https://');
        if (!finalUrl.startsWith('https://')) {
          finalUrl = 'https://' + finalUrl;
        }
      }
      
      return finalUrl;
    };

    const payload: MoneyMotionSessionRequest = {
      json: {
        description: `Purchase of ${details.productName}`,
        urls: {
          success: ensureHttps(`${details.successUrl}${details.successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`),
          cancel: ensureHttps(details.cancelUrl),
          failure: ensureHttps(details.cancelUrl),
        },
        userInfo: {
          email: details.customerEmail,
        },
        metadata: details.metadata || {},
        lineItems: [
          {
            name: details.productName,
            description: details.productName,
            pricePerItemInCents: amountInCents,
            quantity: 1,
          },
        ],
      },
    };

    try {
      console.log('MoneyMotion: Creating session with new API structure:', payload);
      
      const response = await fetch(`${MONEYMOTION_BASE_URL}/checkoutSessions.createCheckoutSession`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'x-currency': details.currency.toLowerCase(),
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = `API Error ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('MoneyMotion API Error Details:', errorData);
          
          // Improved error extraction to avoid [object Object]
          if (typeof errorData === 'object' && errorData !== null) {
            // Check for authentication errors first to simplify them
            const errorStr = JSON.stringify(errorData).toLowerCase();
            if (errorStr.includes('x-api-key') || errorStr.includes('unauthorized') || response.status === 401) {
              errorMessage = 'UNAUTHORIZED_ACCESS';
            } else if (errorData.message && typeof errorData.message === 'string') {
              errorMessage = errorData.message;
            } else if (errorData.error) {
              if (typeof errorData.error === 'string') {
                errorMessage = errorData.error;
              } else if (typeof errorData.error === 'object' && errorData.error.message) {
                errorMessage = errorData.error.message;
              } else {
                errorMessage = JSON.stringify(errorData.error);
              }
            } else if (errorData.result && errorData.result.error) {
              errorMessage = typeof errorData.result.error === 'string' 
                ? errorData.result.error 
                : JSON.stringify(errorData.result.error);
            } else {
              errorMessage = JSON.stringify(errorData);
            }
          }
        } catch (e) {
          const textError = await response.text();
          console.error('MoneyMotion API Raw Error:', textError);
          errorMessage = textError || response.statusText;
        }
        throw new Error(errorMessage);
      }

      const data: MoneyMotionSessionResponse = await response.json();
      const checkoutSessionId = data.result.data.json.checkoutSessionId;

      if (!checkoutSessionId) {
        throw new Error('No checkoutSessionId returned from MoneyMotion');
      }

      // Return the constructed checkout URL
      return {
        id: checkoutSessionId,
        url: `${MONEYMOTION_CHECKOUT_URL}/${checkoutSessionId}`,
      };
    } catch (error) {
      console.error('MoneyMotion Service Error:', error);
      throw error;
    }
  },

  /**
   * Verifies a session status using the new API structure
   * @param sessionId - The session ID to verify
   */
  async getSessionStatus(sessionId: string) {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('MoneyMotion API Key is not configured');
    }

    try {
      const response = await fetch(`${MONEYMOTION_BASE_URL}/checkoutSessions.getCompletedOrPendingCheckoutSessionInfo?json.checkoutId=${sessionId}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get session status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('MoneyMotion Service Error:', error);
      throw error;
    }
  },

  /**
   * Pings the API to check connectivity
   */
  async ping() {
    try {
      const apiKey = await this.getApiKey();
      const response = await fetch(`${MONEYMOTION_BASE_URL}/ping.ping`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey || '',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('MoneyMotion Ping Error:', error);
      return false;
    }
  },

  /**
   * Fetches the account balance
   */
  async getBalance() {
    try {
      const apiKey = await this.getApiKey();
      const response = await fetch(`${MONEYMOTION_BASE_URL}/balance.getBalance`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey || '',
        },
      });
      if (!response.ok) throw new Error(`Balance fetch failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('MoneyMotion Balance Error:', error);
      throw error;
    }
  },

  /**
   * Fetches the account reserves
   */
  async getReserves() {
    try {
      const apiKey = await this.getApiKey();
      const response = await fetch(`${MONEYMOTION_BASE_URL}/reserve.listReserves`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey || '',
        },
      });
      if (!response.ok) throw new Error(`Reserves fetch failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('MoneyMotion Reserves Error:', error);
      throw error;
    }
  },

  /**
   * Lists checkout sessions
   */
  async listCheckoutSessions(page = 1) {
    try {
      const apiKey = await this.getApiKey();
      const response = await fetch(`${MONEYMOTION_BASE_URL}/checkoutSessions.listCheckoutSessions?json.page=${page}&json.limit=10`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey || '',
        },
      });
      if (!response.ok) throw new Error(`Checkout sessions fetch failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('MoneyMotion List Sessions Error:', error);
      throw error;
    }
  },

  /**
   * Lists withdrawals
   */
  async listWithdrawals(page = 1) {
    try {
      const apiKey = await this.getApiKey();
      const response = await fetch(`${MONEYMOTION_BASE_URL}/payouts.listPayouts?json.page=${page}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey || '',
        },
      });
      if (!response.ok) throw new Error(`Withdrawals fetch failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('MoneyMotion List Withdrawals Error:', error);
      throw error;
    }
  },

  /**
   * Lists disputes
   */
  async listDisputes(page = 1) {
    try {
      const apiKey = await this.getApiKey();
      const response = await fetch(`${MONEYMOTION_BASE_URL}/disputes.listDisputes?json.page=${page}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey || '',
        },
      });
      if (!response.ok) throw new Error(`Disputes fetch failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('MoneyMotion List Disputes Error:', error);
      throw error;
    }
  },

  /**
   * Fetches analytics data
   */
  async getAnalytics(period = '7d') {
    try {
      const apiKey = await this.getApiKey();
      const response = await fetch(`${MONEYMOTION_BASE_URL}/analytics.getAnalytics?json.period=${period}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey || '',
        },
      });
      if (!response.ok) throw new Error(`Analytics fetch failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('MoneyMotion Analytics Error:', error);
      throw error;
    }
  },

  /**
   * Site Settings persistence
   */
  async getSettings() {
    try {
      const { supabase } = await import('./supabase');
      if (!supabase) throw new Error('Supabase not configured');
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      return (data || []).reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});
    } catch (error) {
      console.error('Error fetching settings:', error);
      return {};
    }
  },

  async updateSettings(settings: Record<string, string>) {
    try {
      const { supabase } = await import('./supabase');
      if (!supabase) throw new Error('Supabase not configured');
      const upsertData = Object.entries(settings).map(([key, value]) => ({ key, value }));
      const { error } = await supabase.from('site_settings').upsert(upsertData);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
};
