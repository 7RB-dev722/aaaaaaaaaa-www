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
  async getBannedCountries(): Promise<BannedCountry[]> {
      if (!supabase) return [];
      const { data, error } = await supabase.from('banned_countries').select('*').order('country_name');
      if (error) throw error;
      return data || [];
  },

  async addBannedCountry(countryName: string): Promise<void> {
      if (!supabase) return;
      const { error } = await supabase.from('banned_countries').insert({ country_name: countryName });
      if (error) throw error;
  },

  async removeBannedCountry(id: string): Promise<void> {
      const client = supabaseAdmin || supabase;
      if (!client) return;
      const { error } = await client.from('banned_countries').delete().eq('id', id);
      if (error) throw error;
  },

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

  // Deep Fingerprinting: Canvas
  async getCanvasFingerprint(): Promise<string> {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return 'no-canvas';
        
        canvas.width = 200;
        canvas.height = 50;
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125,1,62,20);
        ctx.fillStyle = "#069";
        ctx.fillText("VPN-Detection-Fingerprint-123!@#", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("VPN-Detection-Fingerprint-123!@#", 4, 17);
        
        return canvas.toDataURL();
    } catch (e) {
        return 'error';
    }
  },

  // Deep Fingerprinting: Audio
  async getAudioFingerprint(): Promise<number> {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return 0;
        
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const analyser = context.createAnalyser();
        const gain = context.createGain();
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(10000, context.currentTime);
        
        gain.gain.setValueAtTime(0, context.currentTime);
        oscillator.connect(analyser);
        analyser.connect(gain);
        gain.connect(context.destination);
        
        oscillator.start(0);
        const data = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(data);
        oscillator.stop();
        
        return data.reduce((a, b) => a + b, 0);
    } catch (e) {
        return 0;
    }
  },

  // Automation Detection
  detectAutomation(): { isAutomated: boolean; factors: string[] } {
    const factors: string[] = [];
    const nav = navigator as any;
    
    if (nav.webdriver) factors.push('WebDriver Detected');
    if (nav.plugins.length === 0) factors.push('No Plugins (Headless?)');
    if (nav.languages.length === 0) factors.push('No Languages');
    if (window.domAutomation || window.domAutomationController) factors.push('DOM Automation Detected');
    if (nav.userAgent.includes('HeadlessChrome')) factors.push('Headless Chrome');
    
    // Check for common automation properties
    const automationProps = ['__webdriver_evaluate', '__selenium_evaluate', '__webdriver_script_fn', '__webdriver_script_func', '__webdriver_script_function', '__webdriver_unwrapped', '__selenium_unwrapped', '__webdriver_driver_unwrap', '__webdriver_driver_unwrapped'];
    automationProps.forEach(prop => {
        if (prop in document || prop in window) factors.push(`Automation Prop: ${prop}`);
    });

    return {
        isAutomated: factors.length > 0,
        factors
    };
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
        // Start parallel checks
        const webRTCIPPromise = this.getWebRTCIP();
        const canvasFingerprintPromise = this.getCanvasFingerprint();
        const audioFingerprintPromise = this.getAudioFingerprint();
        const automationCheck = this.detectAutomation();

        if (automationCheck.isAutomated) {
            riskScore += 40;
            riskFactors.push(...automationCheck.factors.map(f => `Automation: ${f} (+40)`));
        }

        // 1. Try to get just the IP first from very reliable sources
        let detectedIp = '';
        try {
            const ipifyRes = await fetchWithTimeout('https://api.ipify.org?format=json', { timeout: 2000 });
            if (ipifyRes.ok) {
                const ipifyData = await ipifyRes.json();
                detectedIp = ipifyData.ip;
            }
        } catch (e) {}

        if (!detectedIp) {
            try {
                const ipapiIpRes = await fetchWithTimeout('https://ipapi.co/ip/', { timeout: 2000 });
                if (ipapiIpRes.ok) {
                    detectedIp = await ipapiIpRes.text();
                    detectedIp = detectedIp.trim();
                }
            } catch (e) {}
        }

        // 2. Now try to get Geo data using the detected IP or implicitly
        let data: any = null;
        const geoSources = [
            `https://ipwho.is/${detectedIp}`,
            `https://ipapi.co/${detectedIp ? detectedIp + '/' : ''}json/`,
            `https://freeipapi.com/api/json/${detectedIp}`
        ];

        for (const source of geoSources) {
            try {
                const response = await fetchWithTimeout(source, { timeout: 3000 });
                if (response.ok) {
                    const resData = await response.json();
                    
                    // Normalize data structure
                    if (source.includes('ipwho.is') && resData.success) {
                        data = resData;
                        break;
                    } else if (source.includes('ipapi.co') && !resData.error) {
                        data = {
                            success: true,
                            ip: resData.ip,
                            country: resData.country_name,
                            country_code: resData.country_code,
                            city: resData.city,
                            timezone: { offset: resData.utc_offset ? parseInt(resData.utc_offset) * 36 : undefined },
                            connection: { isp: resData.org },
                            security: { vpn: resData.security?.vpn || false, proxy: resData.security?.proxy || false }
                        };
                        break;
                    } else if (source.includes('freeipapi.com')) {
                        data = {
                            success: true,
                            ip: resData.ipAddress,
                            country: resData.countryName,
                            country_code: resData.countryCode,
                            city: resData.cityName,
                            connection: { isp: resData.asName },
                            security: { proxy: resData.isProxy }
                        };
                        break;
                    }
                }
            } catch (e) {
                console.warn(`Geo source ${source} failed:`, e);
            }
        }

        // If still no data, try ip-api.com as last resort (note: http only on free tier)
        if (!data) {
            try {
                const response = await fetchWithTimeout('http://ip-api.com/json/?fields=status,message,country,countryCode,city,isp,org,mobile,proxy,hosting,query', { timeout: 3000 });
                if (response.ok) {
                    const geo = await response.json();
                    if (geo.status === 'success') {
                        data = {
                            success: true,
                            ip: geo.query,
                            country: geo.country,
                            country_code: geo.countryCode,
                            city: geo.city,
                            connection: { isp: geo.isp, org: geo.org },
                            security: { proxy: geo.proxy || geo.hosting }
                        };
                    }
                }
            } catch (e) {}
        }

        if (data && data.success) {
            let riskScore = 0;
            let riskFactors: string[] = [];
            
            // Re-use detected IP if available and API didn't provide one
            if (!data.ip && detectedIp) data.ip = detectedIp;
            if (!data.ip) data.ip = 'Unknown';

            // Security flags from API
            const isApiVpn = data.security?.vpn || data.security?.proxy || data.security?.tor || data.security?.relay;
            
            // ISP checks
            const isp = (data.connection?.isp || data.connection?.org || '').toLowerCase();
            const suspiciousISPs = ['hosting', 'google', 'amazon', 'azure', 'digitalocean', 'cloudflare', 'm247', 'ovh', 'vultr', 'akamai', 'fastly'];
            const isSuspiciousISP = suspiciousISPs.some(s => isp.includes(s));
            
            if (isSuspiciousISP) {
                riskScore += 25;
                riskFactors.push('Data Center ISP (+25)');
            }

            // --- 1. WebRTC Anomaly (+40) ---
            const webRTCIP = await webRTCIPPromise;
            const isDataIPv6 = data.ip.includes(':');
            const isWebRTCIPv6 = webRTCIP && webRTCIP.includes(':');
            
            if (webRTCIP && isDataIPv6 === isWebRTCIPv6 && webRTCIP !== data.ip && data.ip !== 'Unknown') {
                riskScore += 40;
                riskFactors.push('WebRTC Anomaly (+40)');
            }

            // --- 2. Header Anomaly (+30) ---
            let headerAnomaly = false;
            if (navigator.webdriver) headerAnomaly = true;
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
            const arabCountries = ['SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'EG', 'JO', 'LB', 'IQ', 'YE', 'SY', 'PS', 'DZ', 'MA', 'TN', 'LY', 'SD'];
            const browserLangs = navigator.languages || [navigator.language];
            const hasArabic = browserLangs.some(l => l.toLowerCase().startsWith('ar'));
            const isArabCountry = arabCountries.includes(data.country_code);

            if (!isArabCountry && hasArabic) {
                riskScore += 20;
                riskFactors.push('Language Mismatch (+20)');
            }

            // --- 3. Screen/Window Anomaly (+25) ---
            let screenAnomaly = false;
            if (window.innerHeight > window.screen.height) screenAnomaly = true;
            if (window.innerWidth > window.screen.width) screenAnomaly = true;
            if (window.screen.width === 0 || window.screen.height === 0) screenAnomaly = true;
            
            // --- Deep Fingerprinting Anomalies ---
            const canvasFP = await canvasFingerprintPromise;
            const audioFP = await audioFingerprintPromise;
            
            // Basic check: If canvas or audio fails completely or returns static error
            if (canvasFP === 'error' || canvasFP === 'no-canvas') {
                riskScore += 15;
                riskFactors.push('Canvas Fingerprint Blocked (+15)');
            }
            if (audioFP === 0) {
                riskScore += 10;
                riskFactors.push('Audio Stack Virtualized/Blocked (+10)');
            }

            if (screenAnomaly) {
                riskScore += 25;
                riskFactors.push('Screen Anomaly (+25)');
            }

            // --- 4. Timing/Fingerprint (+25) ---
            let timingAnomaly = false;
            try {
                if (Intl.DateTimeFormat().resolvedOptions().timeZone === 'UTC') {
                    // Check if it's really UTC or just a fallback
                    const date = new Date();
                    const offset = date.getTimezoneOffset();
                    if (offset !== 0) timingAnomaly = true;
                }
                
                // Compare with API timezone if available
                if (data.timezone && data.timezone.id) {
                    const apiTz = data.timezone.id;
                    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    if (apiTz !== browserTz) {
                        // Some TZs are equivalent, this is a weak check but adds to score
                        riskScore += 15;
                        riskFactors.push('Timezone Name Mismatch (+15)');
                    }
                }
            } catch (e) {
                timingAnomaly = true;
            }

            if (timingAnomaly) {
                riskScore += 25;
                riskFactors.push('Timing/Environment Fingerprint (+25)');
            }

            // --- 5. Timezone Mismatch (+20) ---
            let isTimezoneMismatch = false;
            if (data.timezone && data.timezone.offset !== undefined) {
                const browserOffsetSeconds = new Date().getTimezoneOffset() * -60;
                const ipOffsetSeconds = data.timezone.offset;
                if (Math.abs(browserOffsetSeconds - ipOffsetSeconds) > 3600) {
                    isTimezoneMismatch = true;
                }
            }

            if (isTimezoneMismatch) {
                riskScore += 20;
                riskFactors.push('Timezone Offset Mismatch (+20)');
            }

            // --- 6. Hardware Anomaly (+20) ---
            let hardwareAnomaly = false;
            try {
                if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 2) hardwareAnomaly = true;
                if ((navigator as any).deviceMemory && (navigator as any).deviceMemory < 2) hardwareAnomaly = true;
            } catch (e) {}

            if (hardwareAnomaly) {
                riskScore += 20;
                riskFactors.push('Hardware Anomaly (+20)');
            }

            const isVpnScore = riskScore >= 40;
            const legacyVpnReason = riskFactors.join(' | ');
            const isVpnFinal = isApiVpn || (isSuspiciousISP && riskScore >= 25) || isVpnScore;

            ipData = {
                ip: data.ip,
                country_name: data.country || 'Unknown',
                city: data.city || 'Unknown',
                country_code: data.country_code || '??',
                is_vpn: isVpnFinal, 
                vpn_reason: legacyVpnReason || (isApiVpn ? 'API Detected' : (isSuspiciousISP ? 'Suspicious ISP' : '')),
                risk_score: riskScore,
                risk_factors: riskFactors
            };
            
            return ipData;
        }
        
        // Final Fallback: if we have detectedIp but no Geo
        if (detectedIp) {
            ipData.ip = detectedIp;
            ipData.country_name = 'Unknown';
            ipData.city = 'Unknown';
        }
      } catch (e) {
          console.error('Geo-IP detection failed:', e);
      }
      return ipData;
  },

  async checkAccess(): Promise<{ allowed: boolean; country?: string; reason?: string; message?: string }> {
    try {
      // Skip protection for local development
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return { allowed: true };
      }

      if (!supabase) return { allowed: true };

      const ipData = await this.getIpData();
      
      // 1. Fetch Settings
      const { data: settings } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', [
          'block_vpn', 
          'block_timezone_mismatch', 
          'block_advanced_protection', 
          'block_advanced_threshold',
          'vpn_ban_message', 
          'geo_ban_message', 
          'ip_ban_message',
          'advanced_ban_message'
        ]);
        
      const blockStrictVpn = settings?.find(s => s.key === 'block_strict_vpn')?.value === 'true';
      
      // If strict mode is on, add a small "deep inspection" delay to allow async checks to finish
      if (blockStrictVpn) {
          await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s deep inspection
      }

      const blockTimezoneMismatch = settings?.find(s => s.key === 'block_timezone_mismatch')?.value === 'true';
      const blockAdvanced = settings?.find(s => s.key === 'block_advanced_protection')?.value === 'true';
      const advancedThreshold = parseInt(settings?.find(s => s.key === 'block_advanced_threshold')?.value || '50');
      const vpnMessage = settings?.find(s => s.key === 'vpn_ban_message')?.value;
      const geoMessage = settings?.find(s => s.key === 'geo_ban_message')?.value;
      const ipMessage = settings?.find(s => s.key === 'ip_ban_message')?.value;
      const advancedMessage = settings?.find(s => s.key === 'advanced_ban_message')?.value;
      
      let shouldBlock = false;
      let blockReason = '';
      let returnMessage = vpnMessage;

      // --- Advanced Protection Logic ---
      if (blockAdvanced && ipData.risk_score >= advancedThreshold) {
          shouldBlock = true;
          blockReason = `Advanced Protection: Score ${ipData.risk_score}/100 [${ipData.risk_factors.join(', ')}]`;
          returnMessage = advancedMessage || vpnMessage;
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
          return { allowed: false, country: ipData.country_name, reason: 'vpn', message: returnMessage };
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
