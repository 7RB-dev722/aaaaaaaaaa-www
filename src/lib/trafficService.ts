import { supabase, supabaseAdmin } from './supabase';

export interface VisitorLog {
  id: string;
  ip_address: string;
  country?: string;
  city?: string;
  user_agent?: string;
  visited_at: string;
  page_url?: string;
}

export interface BlockedLog {
  id: string;
  ip_address: string;
  country?: string;
  city?: string;
  reason?: string;
  user_agent?: string;
  attempted_url?: string;
  blocked_at: string;
}

export interface BannedCountry {
  id: string;
  country_name: string;
  created_at: string;
}

export interface BannedIp {
  id: string;
  ip_address: string;
  reason?: string;
  created_at: string;
}

export interface BannedCustomer {
  id: string;
  identifier: string;
  type: 'email' | 'phone';
  reason?: string;
  created_at: string;
}

const fetchWithTimeout = async (resource: string, options: RequestInit & { timeout?: number } = {}) => {
  const { timeout = 5000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export const trafficService = {
  async logVisit(): Promise<void> {
    try {
      const sessionKey = 'visitor_logged';
      if (sessionStorage.getItem(sessionKey)) {
        return;
      }

      const ipData = await this.getIpData();
      if (!ipData.ip) return;

      if (!supabase) return;

      const { error } = await supabase
        .from('visitor_logs')
        .insert({
          ip_address: ipData.ip,
          country: ipData.country_name,
          city: ipData.city,
          user_agent: navigator.userAgent,
          page_url: window.location.href
        });

      if (error) {
        console.error('Error logging visit:', error);
      } else {
        sessionStorage.setItem(sessionKey, 'true');
      }

    } catch (err) {
      console.error('Traffic logging error:', err);
    }
  },

  async logBlockedAttempt(data: { ip: string, country?: string, city?: string, reason: string, user_agent?: string, attempted_url?: string }): Promise<void> {
      if (!supabase) return;
      try {
          // Check if we recently logged this block to avoid spamming the DB (e.g. strict react re-renders)
          const sessionKey = `blocked_logged_${data.reason}`;
          if (sessionStorage.getItem(sessionKey)) return;

          const { error } = await supabase.from('blocked_logs').insert({
              ip_address: data.ip,
              country: data.country,
              city: data.city,
              reason: data.reason,
              user_agent: data.user_agent || navigator.userAgent,
              attempted_url: data.attempted_url || window.location.href
          });

          if (error) console.error('Error logging blocked attempt:', error);
          else sessionStorage.setItem(sessionKey, 'true');
      } catch (err) {
          console.error('Failed to log blocked attempt:', err);
      }
  },

  async getBlockedLogs(page: number = 1, pageSize: number = 50): Promise<{ data: BlockedLog[], total: number }> {
      if (!supabase) return { data: [], total: 0 };
      
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
          .from('blocked_logs')
          .select('*', { count: 'exact' })
          .order('blocked_at', { ascending: false })
          .range(from, to);
      
      if (error) {
          console.error('Error fetching blocked logs:', error);
          throw error;
      }
      return { data: data || [], total: count || 0 };
  },
  
  async deleteBlockedLogs(ids: string[]): Promise<void> {
      const client = supabaseAdmin || supabase;
      if (!client) return;
      const { error } = await client.from('blocked_logs').delete().in('id', ids);
      if (error) throw error;
  },

  async getWebRTCIP(): Promise<string | undefined> {
    try {
        const rtc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        let ip: string | undefined;
        
        rtc.createDataChannel('');
        rtc.createOffer().then(o => rtc.setLocalDescription(o));
        
        return new Promise((resolve) => {
            rtc.onicecandidate = (e) => {
                if (!e.candidate) return;
                const ipMatch = e.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
                if (ipMatch) {
                    const candidateIP = ipMatch[1];
                    // Ignore private IPs
                    if (!candidateIP.match(/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))/)) {
                        ip = candidateIP;
                        resolve(ip);
                        rtc.close();
                    }
                }
            };
            setTimeout(() => {
                resolve(ip); // Resolve with whatever we found (or undefined)
                try { rtc.close(); } catch(e){}
            }, 1000); // 1s timeout
        });
    } catch (e) {
        return undefined;
    }
  },

  async getIpData() {
      let ipData = { 
          ip: '', 
          country_name: '', 
          city: '', 
          is_vpn: false, 
          country_code: '', 
          vpn_reason: '',
          risk_score: 0,
          risk_factors: [] as string[]
      };
      
      try {
        // Start WebRTC check immediately in parallel
        const webRTCIPPromise = this.getWebRTCIP();

        // Primary: ipwho.is (provides security info including VPN status for free)
        const response = await fetchWithTimeout('https://ipwho.is/', { timeout: 3000 });
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                let riskScore = 0;
                let riskFactors: string[] = [];

                // --- 1. WebRTC Anomaly (+40) ---
                const webRTCIP = await webRTCIPPromise;
                const isDataIPv6 = data.ip.includes(':');
                const isWebRTCIPv6 = webRTCIP && webRTCIP.includes(':');
                
                // Only compare if both are same version to avoid IPv4 vs IPv6 false positives
                if (webRTCIP && isDataIPv6 === isWebRTCIPv6 && webRTCIP !== data.ip) {
                    riskScore += 40;
                    riskFactors.push('WebRTC Anomaly (+40)');
                }

                // --- 2. Header Anomaly (+30) ---
                // Check navigator properties for inconsistencies often found in headless browsers or bad proxies
                let headerAnomaly = false;
                
                // Check 1: WebDriver (Selenium/Puppeteer)
                if (navigator.webdriver) headerAnomaly = true;
                
                // Check 2: Platform mismatch (e.g., UserAgent says Windows, Platform says Linux)
                const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';
                const ua = navigator.userAgent || '';
                if (platform.toLowerCase().includes('linux') && ua.includes('Windows')) headerAnomaly = true;
                if (platform.toLowerCase().includes('mac') && ua.includes('Windows')) headerAnomaly = true;
                if (platform.toLowerCase().includes('win') && !ua.includes('Windows')) headerAnomaly = true;

                if (headerAnomaly) {
                    riskScore += 30;
                    riskFactors.push('Header Anomaly (+30)');
                }

                // --- 2.1 Language Mismatch (+20) ---
                // Heuristic: If Country is NON-ARAB (US, EU, etc.) but Browser Language is ONLY Arabic.
                // This is a strong signal for Arab users using VPNs to access restricted content.
                // Arab Countries Codes (Common ones)
                const arabCountries = ['SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'EG', 'JO', 'LB', 'IQ', 'YE', 'SY', 'PS', 'DZ', 'MA', 'TN', 'LY', 'SD'];
                const browserLangs = navigator.languages || [navigator.language];
                const hasArabic = browserLangs.some(l => l.toLowerCase().startsWith('ar'));
                const isArabCountry = arabCountries.includes(data.country_code);

                if (!isArabCountry && hasArabic) {
                    riskScore += 20;
                    riskFactors.push('Language Mismatch (+20)');
                }

                // --- 3. DNS DoH / ISP Mismatch (+50) ---
                // "DNS DoH mismatch" usually implies the DNS server doesn't match the ISP location.
                // We use "Suspicious ISP" (Datacenter/Hosting) as a strong proxy for this.
                const suspiciousISPs = [
                    'DigitalOcean', 'AWS', 'Amazon', 'Google Cloud', 'Microsoft Azure', 'Oracle', 
                    'Hetzner', 'OVH', 'Linode', 'Vultr', 'Datacenter', 'Hosting', 'Server', 
                    'Cloud', 'VPS', 'Dedibox', 'Leaseweb', 'M247', 'Performive', 'Hostinger', 
                    'Contabo', 'Choopa', 'PONYNET', 'FranTech', 'BuyVM', 'Online S.A.S.',
                    'TeraSwitch', 'Kamatera', 'Akamai', 'Fastly', 'Cloudflare', 'Zenlayer',
                    'DataCamp', 'HostRoyale', 'Zappie', 'Hydra', 'Tzulo', 'Nexeon', 'ColoCrossing',
                    'IPXO', 'PacketHub', 'Melbicom', 'GHOSTnet', 'Selectel', 'Time4VPS'
                ];
                
                const isSuspiciousISP = suspiciousISPs.some(keyword => 
                    (data.connection?.isp || '').toLowerCase().includes(keyword.toLowerCase()) || 
                    (data.connection?.org || '').toLowerCase().includes(keyword.toLowerCase())
                );

                // Also check API flags - IF API SAYS VPN, IT IS A VPN!
                const isApiVpn = data.security?.vpn || data.security?.proxy || data.security?.tor;

                if (isApiVpn) {
                    riskScore += 50; // Critical: Trust the API if it flags it
                    riskFactors.push('API Detected VPN (+50)');
                } else if (isSuspiciousISP) {
                    riskScore += 40; // High: Datacenter IPs are rarely residential
                    riskFactors.push('Suspicious ISP (+40)');
                }

                // --- 4. Timing Fingerprint (+20) ---
                // Check for Date object tampering or inconsistencies
                let timingAnomaly = false;
                try {
                    // Check if Date.toString is native code
                    if (!Date.prototype.toString.toString().includes('[native code]')) timingAnomaly = true;
                    // Check if performance.now is available and monotonic
                    if (!window.performance || !window.performance.now) timingAnomaly = true;
                } catch (e) {
                    timingAnomaly = true;
                }

                if (timingAnomaly) {
                    riskScore += 20;
                    riskFactors.push('Timing Fingerprint (+20)');
                }

                // --- 5. Timezone Mismatch (+15) ---
                let isTimezoneMismatch = false;
                if (data.timezone && data.timezone.offset !== undefined) {
                    const browserOffsetSeconds = new Date().getTimezoneOffset() * -60;
                    const ipOffsetSeconds = data.timezone.offset;
                    // Strict: Allow only 60 minutes difference (was 45)
                    // If difference is large, it's a strong signal.
                    if (Math.abs(browserOffsetSeconds - ipOffsetSeconds) > 3600) {
                        isTimezoneMismatch = true;
                    }
                }

                if (isTimezoneMismatch) {
                    riskScore += 15;
                    riskFactors.push('Timezone Mismatch (+15)');
                }

                // --- Final Decision ---
                // Maintain backward compatibility with 'is_vpn' flag
                // If any "hard" VPN flag is present, is_vpn is true.
                // OR if Score >= 50
                
                const isVpnScore = riskScore >= 50;
                const legacyVpnReason = riskFactors.join(' | ');

                ipData = {
                    ip: data.ip,
                    country_name: data.country,
                    city: data.city,
                    country_code: data.country_code,
                    is_vpn: isVpnScore || isApiVpn || isSuspiciousISP, // Backward compat + Score
                    vpn_reason: legacyVpnReason || (isApiVpn ? 'API Detected' : ''),
                    risk_score: riskScore,
                    risk_factors: riskFactors
                };
                
                return ipData;
            }
        }
        
        // Fallback 1: ipapi.co
        const responseFallback = await fetchWithTimeout('https://ipapi.co/json/', { timeout: 3000 });
        if (responseFallback.ok) {
            const data = await responseFallback.json();
            ipData = {
                ip: data.ip,
                country_name: data.country_name,
                city: data.city,
                country_code: data.country_code,
                is_vpn: false, 
                vpn_reason: '',
                risk_score: 0,
                risk_factors: []
            };
        } else {
            throw new Error('ipapi failed');
        }
      } catch (e) {
        try {
            // Fallback 2: ipify
            const fallback = await fetchWithTimeout('https://api.ipify.org?format=json', { timeout: 3000 });
            if (fallback.ok) {
                const data = await fallback.json();
                ipData.ip = data.ip;
            }
        } catch (fallbackError) {
            console.warn('Failed to fetch IP data from all sources');
        }
      }
      return ipData;
  },

  async checkAccess(): Promise<{ allowed: boolean; country?: string; reason?: string; message?: string }> {
    try {
      if (!supabase) return { allowed: true };

      const ipData = await this.getIpData();
      
      // 1. Fetch Settings
      const { data: settings } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['block_vpn', 'block_timezone_mismatch', 'block_advanced_protection', 'vpn_ban_message', 'geo_ban_message', 'ip_ban_message']);
        
      const blockVpn = settings?.find(s => s.key === 'block_vpn')?.value === 'true';
      const blockTimezoneMismatch = settings?.find(s => s.key === 'block_timezone_mismatch')?.value === 'true';
      const blockAdvanced = settings?.find(s => s.key === 'block_advanced_protection')?.value === 'true';
      const vpnMessage = settings?.find(s => s.key === 'vpn_ban_message')?.value;
      const geoMessage = settings?.find(s => s.key === 'geo_ban_message')?.value;
      const ipMessage = settings?.find(s => s.key === 'ip_ban_message')?.value;
      
      let shouldBlock = false;
      let blockReason = '';

      // --- Advanced Protection Logic (Score >= 50) ---
      if (blockAdvanced && ipData.risk_score >= 50) {
          shouldBlock = true;
          blockReason = `Advanced Protection: Score ${ipData.risk_score}/100 [${ipData.risk_factors.join(', ')}]`;
      } 
      // --- Legacy/Standard Logic ---
      else if (ipData.is_vpn) {
          const isTimezoneReason = ipData.vpn_reason.includes('Timezone Mismatch');
          
          if (isTimezoneReason) {
              if (blockTimezoneMismatch) {
                  shouldBlock = true;
                  blockReason = `Timezone Mismatch (${ipData.vpn_reason})`;
              }
          } else {
              // Other VPN reasons (WebRTC, ISP, Header, etc.)
              if (blockVpn) {
                  shouldBlock = true;
                  blockReason = `VPN Detected (${ipData.vpn_reason || 'Unknown'})`;
              }
          }
      }

      if (shouldBlock) {
          await this.logBlockedAttempt({
              ip: ipData.ip,
              country: ipData.country_name,
              city: ipData.city,
              reason: blockReason
          });
          return { allowed: false, country: ipData.country_name, reason: 'vpn', message: vpnMessage };
      }
      
      // 2. Check if IP is banned explicitly
      if (ipData.ip) {
        const { data: ipBan } = await supabase
            .from('banned_ips')
            .select('ip_address')
            .eq('ip_address', ipData.ip)
            .single();

        if (ipBan) {
            await this.logBlockedAttempt({
                ip: ipData.ip,
                country: ipData.country_name,
                city: ipData.city,
                reason: 'IP Ban'
            });
            return { allowed: false, country: ipData.country_name, message: ipMessage };
        }
      }

      if (!ipData.country_name) return { allowed: true }; // Allow if country unknown (safe fail)

      // Check if country is banned
      const { data, error } = await supabase
        .from('banned_countries')
        .select('country_name')
        .eq('country_name', ipData.country_name)
        .single();

      if (data) {
        await this.logBlockedAttempt({
            ip: ipData.ip,
            country: ipData.country_name,
            city: ipData.city,
            reason: 'Country Ban'
        });
        return { allowed: false, country: ipData.country_name, message: geoMessage };
      }
      
      return { allowed: true, country: ipData.country_name };
    } catch (err) {
      console.error('Access check error:', err);
      return { allowed: true }; // Fail open
    }
  },

  async getVisits(
    period: 'today' | 'last2days' | 'last3days' | 'lastMonth' | 'custom' | 'all_time',
    startDate?: Date,
    endDate?: Date,
    searchQuery?: string,
    country?: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ data: VisitorLog[]; total: number }> {
    if (!supabase) return { data: [], total: 0 };

    let query = supabase
      .from('visitor_logs')
      .select('*', { count: 'exact' });

    const now = new Date();
    
    if (period === 'today') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      query = query.gte('visited_at', startOfDay);
    } else if (period === 'last2days') {
      const twoDaysAgo = new Date(now.setDate(now.getDate() - 2)).toISOString();
      query = query.gte('visited_at', twoDaysAgo);
    } else if (period === 'last3days') {
      const threeDaysAgo = new Date(now.setDate(now.getDate() - 3)).toISOString();
      query = query.gte('visited_at', threeDaysAgo);
    } else if (period === 'lastMonth') {
      const lastMonth = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      query = query.gte('visited_at', lastMonth);
    } else if (period === 'custom' && startDate && endDate) {
      query = query.gte('visited_at', startDate.toISOString()).lte('visited_at', endDate.toISOString());
    }
    // 'all_time' requires no filters, so we just fall through

    // Search Filter
    if (searchQuery) {
        query = query.or(`ip_address.ilike.%${searchQuery}%,country.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,page_url.ilike.%${searchQuery}%`);
    }

    // Country Filter
    if (country) {
        query = query.eq('country', country);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    query = query.order('visited_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) {
        console.error('Error fetching visits:', error);
        throw error;
    }
    return { data: data || [], total: count || 0 };
  },

  async deleteVisitorLogs(ids: string[]): Promise<number> {
    const client = supabaseAdmin || supabase;
    console.log('deleteVisitorLogs: Attempting to delete', ids.length, 'logs');
    console.log('deleteVisitorLogs: Using admin client?', !!supabaseAdmin);
    
    if (!client || ids.length === 0) {
        console.log('deleteVisitorLogs: No client or no IDs');
        return 0;
    }
    
    const { data, error } = await client
      .from('visitor_logs')
      .delete()
      .in('id', ids)
      .select();
    
    if (error) {
      console.error('Error deleting visitor logs:', error);
      throw error;
    }
    
    console.log('deleteVisitorLogs: Deleted count:', data?.length);
    return data ? data.length : 0;
  },

  async getUniqueCountries(): Promise<string[]> {
      if (!supabase) return [];
      try {
          const { data, error } = await supabase.rpc('get_unique_countries');
          if (error) throw error;
          return data.map((d: any) => d.country);
      } catch (err) {
          console.warn('RPC get_unique_countries failed, falling back to client-side distinct', err);
          // Fallback: Fetch recent logs and extract countries (limit to last 1000 to avoid heavy load)
          const { data } = await supabase.from('visitor_logs').select('country').order('visited_at', { ascending: false }).limit(1000);
          if (!data) return [];
          return Array.from(new Set(data.map(d => d.country).filter(Boolean))) as string[];
      }
  },

  async getBannedCountries(): Promise<BannedCountry[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('banned_countries').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async banCountry(countryName: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('banned_countries').insert({ country_name: countryName });
    if (error) throw error;
  },

  async unbanCountry(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('banned_countries').delete().eq('id', id);
    if (error) throw error;
  },

  async getBannedIps(): Promise<BannedIp[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('banned_ips').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async banIp(ip: string, reason?: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('banned_ips').insert({ ip_address: ip, reason });
    if (error) throw error;
  },

  async unbanIp(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('banned_ips').delete().eq('id', id);
    if (error) throw error;
  },

  async checkCustomerBan(email: string, phone: string): Promise<{ banned: boolean; message?: string }> {
    if (!supabase) return { banned: false };
    
    // Build conditions dynamically to avoid matching empty strings
    const conditions: string[] = [];
    
    if (email && email.trim() !== '') {
        conditions.push(`identifier.eq.${email}`);
    }
    
    // Only check phone if it's provided and not just country code or too short
    if (phone && phone.replace(/\D/g, '').length > 5) {
        conditions.push(`identifier.eq.${phone}`);
    }
    
    // If no valid identifiers to check, return not banned
    if (conditions.length === 0) {
        return { banned: false };
    }
    
    // Check if either email or phone exists in banned_customers
    const { data, error } = await supabase
      .from('banned_customers')
      .select('id')
      .or(conditions.join(','))
      .limit(1);
      
    if (error) {
      console.error('Error checking customer ban:', error);
      return { banned: false };
    }
    
    if (data && data.length > 0) {
        const { data: settings } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'customer_ban_message')
            .single();
            
        return { banned: true, message: settings?.value };
    }

    return { banned: false };
  },

  async getBannedCustomers(): Promise<BannedCustomer[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('banned_customers').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async banCustomer(identifier: string, type: 'email' | 'phone', reason?: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('banned_customers').insert({ identifier, type, reason });
    if (error) throw error;
  },

  async unbanCustomer(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('banned_customers').delete().eq('id', id);
    if (error) throw error;
  }
};
