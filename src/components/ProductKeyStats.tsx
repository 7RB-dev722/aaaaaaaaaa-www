import React, { useMemo, useState } from 'react';
import { Product, ProductKey, PurchaseIntent } from '../lib/supabase';
import { BarChart3, CheckCircle, XCircle, KeyRound, TrendingUp, DollarSign, ArrowUpDown, Calendar, PieChart, Activity, AlertTriangle, Package, Filter, CalendarRange, ArrowRight, ChevronDown, Clock, Users, Globe, Repeat, MapPin } from 'lucide-react';
import WithdrawalCalculator from './WithdrawalCalculator';

interface ProductKeyStatsProps {
  products: Product[];
  keys: ProductKey[];
  purchaseIntents: PurchaseIntent[]; // Added to link keys to countries
}

const NET_PRICES: Record<string, number> = {
    "sinki tdm": 50.0,
    "cheatloop exclusive": 50.0,
    "cheatloop call of duty mobile": 32.0,
    "cheatloop esp": 30.0,
    "sinki esp": 30.0,
    "sinki gold": 45.0,
    "cheatloop stream": 100.0,
    "sinki stremer": 100.0,
    "cheatloop normal": 42.75,
};

type SortField = 'title' | 'total' | 'available' | 'used' | 'revenue';
type SortDirection = 'asc' | 'desc';
type TimeRange = '24h' | '3days' | 'week' | 'month' | '2months' | '3months' | 'custom';

const ModernDateInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => {
    return (
        <div className="relative group">
            <div className="absolute -top-2 right-3 bg-black px-1 text-[10px] text-cyan-400 font-bold z-10">
                {label}
            </div>
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-cyan-500 transition-colors h-10 w-40">
                <input 
                    type="date" 
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-full bg-transparent text-white px-3 text-sm focus:outline-none font-mono text-center uppercase tracking-wider"
                    style={{ colorScheme: 'dark' }}
                />
            </div>
        </div>
    );
};

const ProductKeyStats: React.FC<ProductKeyStatsProps> = ({ products, keys, purchaseIntents }) => {
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showSubscriberReport, setShowSubscriberReport] = useState(false); // State for report modal
  
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const statsData = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (timeRange === 'custom') {
        if (customStartDate) startDate = new Date(customStartDate);
        if (customEndDate) endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === '24h') {
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        endDate = now;
    } else {
        const daysToSubtract = 
            timeRange === '3days' ? 2 : 
            timeRange === 'week' ? 6 : 
            timeRange === 'month' ? 29 : 
            timeRange === '2months' ? 59 : 
            timeRange === '3months' ? 89 : 6;
        
        startDate.setDate(now.getDate() - daysToSubtract);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    }

    // Filter keys used in the selected period
    const keysInPeriod = keys.filter(key => {
        if (!key.is_used || !key.used_at) return false;
        const usedDate = new Date(key.used_at);
        return usedDate >= startDate && usedDate <= endDate;
    });

    // --- Advanced Stats Logic ---

    // 1. Customer Loyalty (New vs Returning)
    const emailCounts = new Map<string, number>();
    // Count ALL usage history to determine loyalty, not just in period
    keys.filter(k => k.is_used && k.used_by_email).forEach(k => {
        const email = k.used_by_email!;
        emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
    });

    let newCustomers = 0;
    let returningCustomers = 0;
    const uniqueEmailsInPeriod = new Set<string>();

    keysInPeriod.forEach(k => {
        if (k.used_by_email) {
            if (!uniqueEmailsInPeriod.has(k.used_by_email)) {
                uniqueEmailsInPeriod.add(k.used_by_email);
                // Check total history count. If 1, they are new (this is their first key). If > 1, they are returning.
                // Note: This logic assumes 'keys' contains full history.
                if ((emailCounts.get(k.used_by_email) || 0) > 1) {
                    returningCustomers++;
                } else {
                    newCustomers++;
                }
            }
        }
    });

    // 2. Geographic Stats (Top Countries)
    const countryStats = new Map<string, { count: number, revenue: number }>();
    const intentMap = new Map(purchaseIntents.map(i => [i.id, i]));

    keysInPeriod.forEach(key => {
        if (key.purchase_intent_id) {
            const intent = intentMap.get(key.purchase_intent_id);
            if (intent && intent.country) {
                const country = intent.country;
                const current = countryStats.get(country) || { count: 0, revenue: 0 };
                
                // Calculate revenue for this key
                const prod = products.find(p => p.id === key.product_id);
                let price = 0;
                if (prod) {
                    const normalizedTitle = prod.title.toLowerCase().trim();
                    if (NET_PRICES[normalizedTitle]) {
                        price = NET_PRICES[normalizedTitle];
                    } else if (normalizedTitle.includes('codm')) {
                        price = 31.0;
                    } else {
                        price = prod.price * 0.85; 
                    }
                }

                countryStats.set(country, {
                    count: current.count + 1,
                    revenue: current.revenue + price
                });
            }
        }
    });

    const topCountries = Array.from(countryStats.entries())
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5)
        .map(([country, data]) => ({ country, ...data }));


    const availableKeysCount = keys.filter(key => !key.is_used).length;
    
    const productStats = products.map(product => {
        const productKeysTotal = keys.filter(key => key.product_id === product.id);
        const productKeysUsedInPeriod = keysInPeriod.filter(key => key.product_id === product.id);
        
        const totalInventory = productKeysTotal.length;
        const usedTotal = productKeysTotal.filter(k => k.is_used).length;
        const available = totalInventory - usedTotal;
        
        const usedInPeriod = productKeysUsedInPeriod.length;

        const normalizedTitle = product.title.toLowerCase().trim();
        let price = 0;
        if (NET_PRICES[normalizedTitle]) {
            price = NET_PRICES[normalizedTitle];
        } else if (normalizedTitle.includes('codm')) {
            price = 31.0;
        } else {
            price = product.price * 0.85; 
        }
        const revenue = usedInPeriod * price;

        // Calculate Product Specific Subscriber Stats
        const productUsedKeysWithEmail = productKeysTotal.filter(k => k.is_used && k.used_by_email);
        const productUniqueEmails = new Set(productUsedKeysWithEmail.map(k => k.used_by_email));
        const productTotalSubscribers = productUniqueEmails.size;
        
        let productActiveSubscribers = 0;
        const now = new Date();
        productUniqueEmails.forEach(email => {
             const userKeys = productUsedKeysWithEmail.filter(k => k.used_by_email === email);
             const isActive = userKeys.some(k => {
                 if (!k.used_at) return false;
                 let expiryDate: Date;
                 if (k.expiration_date) {
                     expiryDate = new Date(k.expiration_date);
                 } else {
                     // Default 30 days if no explicit expiration date
                     expiryDate = new Date(k.used_at);
                     expiryDate.setDate(expiryDate.getDate() + 30);
                 }
                 return expiryDate > now;
             });
             if (isActive) productActiveSubscribers++;
        });
        const productInactiveSubscribers = productTotalSubscribers - productActiveSubscribers;

        return {
            id: product.id,
            title: product.title,
            image: product.image,
            total: totalInventory,
            usedAllTime: usedTotal,
            available,
            usedInPeriod,
            revenue,
            fillRate: totalInventory > 0 ? (usedTotal / totalInventory) * 100 : 0,
            productTotalSubscribers,
            productActiveSubscribers,
            productInactiveSubscribers
        };
    });

    const totalRevenue = productStats.reduce((acc, curr) => acc + curr.revenue, 0);

    // Calculate Subscriber Stats (Advanced)
    const usedKeysWithEmail = keys.filter(k => k.is_used && k.used_by_email);
    const uniqueEmails = new Set(usedKeysWithEmail.map(k => k.used_by_email));
    const totalSubscribers = uniqueEmails.size;

    let activeSubscribers = 0;
    const subscriberDetails: any[] = []; // Store details for report

    // New: Active Keys Analysis (User Request: "Active vs Inactive Keys with accurate ratios")
    let totalActiveKeys = 0;
    let totalExpiredKeys = 0;
    let usersWithMultiActiveKeys = 0;
    const activeKeysPerUser = new Map<string, number>();

    keys.forEach(k => {
        if (!k.is_used || !k.used_at) return;
        
        let expiryDate: Date;
        if (k.expiration_date) {
            expiryDate = new Date(k.expiration_date);
        } else {
            expiryDate = new Date(k.used_at);
            expiryDate.setDate(expiryDate.getDate() + 30);
        }
        
        if (expiryDate > now) {
            totalActiveKeys++;
            if (k.used_by_email) {
                activeKeysPerUser.set(k.used_by_email, (activeKeysPerUser.get(k.used_by_email) || 0) + 1);
            }
        } else {
            totalExpiredKeys++;
        }
    });

    usersWithMultiActiveKeys = Array.from(activeKeysPerUser.values()).filter(count => count > 1).length;

    uniqueEmails.forEach(email => {
        const userKeys = usedKeysWithEmail.filter(k => k.used_by_email === email);
        
        // Determine status based on ANY valid key
        const isActive = userKeys.some(k => {
            if (!k.used_at) return false;
            let expiryDate: Date;
            if (k.expiration_date) {
                expiryDate = new Date(k.expiration_date);
            } else {
                // Default 30 days if no explicit expiration date
                expiryDate = new Date(k.used_at);
                expiryDate.setDate(expiryDate.getDate() + 30);
            }
            return expiryDate > now;
        });
        
        if (isActive) {
            activeSubscribers++;
        }

        // Find Latest Key for Report
        // Sort by used_at descending (or created_at if used_at is missing, though used keys should have used_at)
        const sortedKeys = [...userKeys].sort((a, b) => {
            const dateA = a.used_at ? new Date(a.used_at).getTime() : 0;
            const dateB = b.used_at ? new Date(b.used_at).getTime() : 0;
            return dateB - dateA;
        });
        
        const latestKey = sortedKeys[0];
        const product = products.find(p => p.id === latestKey.product_id);

        let latestExpirationDate = latestKey.expiration_date;
        if (!latestExpirationDate && latestKey.used_at) {
             const d = new Date(latestKey.used_at);
             d.setDate(d.getDate() + 30);
             latestExpirationDate = d.toISOString();
        }

        subscriberDetails.push({
            email: email,
            status: isActive ? 'Active' : 'Inactive',
            latestKey: latestKey.key_value,
            latestProduct: product ? product.title : 'Unknown Product',
            latestPurchaseDate: latestKey.used_at,
            latestExpirationDate: latestExpirationDate,
            totalKeys: userKeys.length
        });
    });

    const inactiveSubscribers = totalSubscribers - activeSubscribers;

    // Sales Trend Logic (Existing)
    const salesTrend = [];
    if (timeRange === '24h') {
        let currentHour = new Date(startDate);
        currentHour.setMinutes(0, 0, 0);
        while (currentHour <= endDate) {
            const nextHour = new Date(currentHour.getTime() + 60 * 60 * 1000);
            const keysInThisHour = keysInPeriod.filter(k => {
                const kDate = new Date(k.used_at!);
                return kDate >= currentHour && kDate < nextHour;
            });
            const hourRevenue = keysInThisHour.reduce((acc, key) => {
                const prod = products.find(p => p.id === key.product_id);
                if (!prod) return acc;
                const title = prod.title.toLowerCase().trim();
                return acc + (NET_PRICES[title] || (title.includes('codm') ? 32.0 : prod.price * 0.85));
            }, 0);
            salesTrend.push({
                label: currentHour.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
                fullLabel: currentHour.toLocaleString('en-GB', { hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' }),
                count: keysInThisHour.length,
                revenue: hourRevenue,
                isHourly: true
            });
            currentHour = nextHour;
        }
    } else {
        let currentDay = new Date(startDate);
        currentDay.setHours(0, 0, 0, 0);
        const safetyLimit = new Date(endDate);
        safetyLimit.setHours(23, 59, 59, 999);
        while (currentDay <= safetyLimit) {
            const dayStr = currentDay.toISOString().split('T')[0]; 
            const keysInThisDay = keysInPeriod.filter(k => {
                if (!k.used_at) return false;
                return k.used_at.startsWith(dayStr);
            });
            const dayRevenue = keysInThisDay.reduce((acc, key) => {
                const prod = products.find(p => p.id === key.product_id);
                if (!prod) return acc;
                const title = prod.title.toLowerCase().trim();
                return acc + (NET_PRICES[title] || (title.includes('codm') ? 31.0 : prod.price * 0.85));
            }, 0);
            salesTrend.push({
                label: currentDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                fullLabel: currentDay.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                count: keysInThisDay.length,
                revenue: dayRevenue,
                isHourly: false
            });
            currentDay.setDate(currentDay.getDate() + 1);
        }
    }

    const maxTrendValue = Math.max(...salesTrend.map(d => d.revenue), 1);
    const averageRevenue = totalRevenue / (salesTrend.length || 1);

    return { 
        productStats, 
        totalRevenue, 
        totalUsedKeysInPeriod: keysInPeriod.length, 
        totalAvailableKeys: availableKeysCount,
        salesTrend,
        maxTrendValue,
        averageRevenue,
        startDate,
        endDate,
        newCustomers,
        returningCustomers,
        topCountries,
        totalSubscribers,
        activeSubscribers,
        inactiveSubscribers,
        subscriberDetails,
        // New Data
        totalActiveKeys,
        totalExpiredKeys,
        usersWithMultiActiveKeys
    };
  }, [products, keys, purchaseIntents, timeRange, customStartDate, customEndDate]);

  const sortedStats = useMemo(() => {
    return [...statsData.productStats].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'used') {
          comparison = a.usedInPeriod - b.usedInPeriod;
      } else {
        comparison = (a[sortField as keyof typeof a] as number) - (b[sortField as keyof typeof b] as number);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [statsData.productStats, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-600 inline-block ml-1 opacity-50" />;
    return <ArrowUpDown className={`w-3 h-3 text-cyan-400 inline-block ml-1 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />;
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* Time Range Selector */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg flex flex-col xl:flex-row gap-6 items-center justify-between sticky top-4 z-30">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg">
                  <CalendarRange className="w-6 h-6 text-white" />
              </div>
              <div>
                  <h3 className="text-white font-bold text-lg">تحليل المبيعات</h3>
                  <p className="text-gray-400 text-xs font-mono flex items-center gap-2 mt-1">
                      <span className="bg-black px-2 py-0.5 rounded border border-white/10">
                          {timeRange === '24h' 
                            ? statsData.startDate.toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit'}) 
                            : statsData.startDate.toLocaleDateString('en-GB')}
                      </span>
                      <span className="text-cyan-500">→</span>
                      <span className="bg-black px-2 py-0.5 rounded border border-white/10">
                          {timeRange === '24h' ? 'الآن' : statsData.endDate.toLocaleDateString('en-GB')}
                      </span>
                  </p>
              </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 justify-center xl:justify-end flex-1 w-full">
              <div className="flex bg-black/60 p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full no-scrollbar">
                  {[
                      { id: '24h', label: '24 ساعة' },
                      { id: '3days', label: '3 أيام' },
                      { id: 'week', label: 'أسبوع' },
                      { id: 'month', label: 'شهر' },
                      { id: '2months', label: 'شهرين' },
                      { id: '3months', label: '3 أشهر' },
                      { id: 'custom', label: 'مخصص' },
                  ].map((range) => (
                      <button
                          key={range.id}
                          onClick={() => setTimeRange(range.id as TimeRange)}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                              timeRange === range.id 
                                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' 
                                  : 'text-gray-400 hover:text-white hover:bg-black'
                          }`}
                      >
                          {range.label}
                      </button>
                  ))}
              </div>

              {timeRange === 'custom' && (
                  <div className="flex items-center gap-3 bg-black/60 p-2 rounded-xl border border-white/10 animate-fade-in-up">
                      <ModernDateInput label="من" value={customStartDate} onChange={setCustomStartDate} />
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                      <ModernDateInput label="إلى" value={customEndDate} onChange={setCustomEndDate} />
                  </div>
              )}
          </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {/* Total Subscribers */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600/20 to-pink-600/40 rounded-2xl p-6 border border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.2)] group hover:shadow-[0_0_40px_rgba(147,51,234,0.4)] transition-all duration-300 backdrop-blur-sm">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/30 rounded-full blur-2xl group-hover:bg-purple-400/40 transition-all"></div>
            <div className="flex flex-col h-full justify-between relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-purple-200 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-2 drop-shadow-md">
                            <Users className="w-3 h-3" /> المشتركين
                        </p>
                        <h3 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">{statsData.totalSubscribers}</h3>
                        <p className="text-[10px] text-purple-100/70 mt-1">
                            إجمالي المشتركين
                        </p>
                    </div>
                    <div className="p-3 bg-purple-500/30 rounded-xl text-white border border-purple-400/50 shadow-inner cursor-pointer hover:bg-purple-500/50 transition-colors" onClick={() => setShowSubscriberReport(true)}>
                        <Users className="w-6 h-6" />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/10">
                    <div>
                        <p className="text-[10px] text-purple-200 mb-0.5">نشط</p>
                        <div className="flex items-end gap-1">
                             <p className="text-lg font-bold text-emerald-400">{statsData.activeSubscribers}</p>
                             <p className="text-[10px] text-emerald-400/70 mb-1">({((statsData.activeSubscribers / (statsData.totalSubscribers || 1)) * 100).toFixed(0)}%)</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] text-purple-200 mb-0.5">غير نشط</p>
                        <div className="flex items-end gap-1">
                            <p className="text-lg font-bold text-red-400">{statsData.inactiveSubscribers}</p>
                            <p className="text-[10px] text-red-400/70 mb-1">({((statsData.inactiveSubscribers / (statsData.totalSubscribers || 1)) * 100).toFixed(0)}%)</p>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => setShowSubscriberReport(true)}
                    className="mt-3 w-full py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors border border-white/10"
                >
                    عرض التقرير التفصيلي
                </button>
            </div>
        </div>

        {/* Revenue */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600/20 to-teal-600/40 rounded-2xl p-6 border border-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.2)] group hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all duration-300 backdrop-blur-sm">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/30 rounded-full blur-2xl group-hover:bg-emerald-400/40 transition-all"></div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-emerald-200 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-2 drop-shadow-md">
                        <DollarSign className="w-3 h-3" /> أرباح الفترة
                    </p>
                    <h3 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">${statsData.totalRevenue.toFixed(2)}</h3>
                    <p className="text-[10px] text-emerald-100/70 mt-1 font-mono">
                        Avg: ${statsData.averageRevenue.toFixed(1)} / {timeRange === '24h' ? 'hour' : 'day'}
                    </p>
                </div>
                <div className="p-3 bg-emerald-500/30 rounded-xl text-white border border-emerald-400/50 shadow-inner">
                    <TrendingUp className="w-6 h-6" />
                </div>
            </div>
        </div>

        {/* Net Profit (1/3) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-yellow-600/20 to-amber-600/40 rounded-2xl p-6 border border-yellow-400/50 shadow-[0_0_30px_rgba(234,179,8,0.2)] group hover:shadow-[0_0_40px_rgba(234,179,8,0.4)] transition-all duration-300 backdrop-blur-sm">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-yellow-500/30 rounded-full blur-2xl group-hover:bg-yellow-400/40 transition-all"></div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-yellow-200 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-2 drop-shadow-md">
                        <DollarSign className="w-3 h-3" /> صافي اجمالي الارباح
                    </p>
                    <h3 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">${(statsData.totalRevenue / 3).toFixed(2)}</h3>
                    <p className="text-[10px] text-yellow-100/70 mt-1 font-mono">
                        بعد التقسيم على 3
                    </p>
                </div>
                <div className="p-3 bg-yellow-500/30 rounded-xl text-white border border-yellow-400/50 shadow-inner">
                    <PieChart className="w-6 h-6" />
                </div>
            </div>
        </div>

        {/* Sales */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/20 to-cyan-600/40 rounded-2xl p-6 border border-blue-400/50 shadow-[0_0_30px_rgba(59,130,246,0.2)] group hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] transition-all duration-300 backdrop-blur-sm">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/30 rounded-full blur-2xl group-hover:bg-blue-400/40 transition-all"></div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-blue-200 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-2 drop-shadow-md">
                        <Activity className="w-3 h-3" /> مبيعات الفترة
                    </p>
                    <h3 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">{statsData.totalUsedKeysInPeriod}</h3>
                    <p className="text-[10px] text-blue-100/70 mt-1">
                        مفتاح تم بيعه
                    </p>
                </div>
                <div className="p-3 bg-blue-500/30 rounded-xl text-white border border-blue-400/50 shadow-inner">
                    <CheckCircle className="w-6 h-6" />
                </div>
            </div>
        </div>

        {/* Inventory */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600/20 to-violet-600/40 rounded-2xl p-6 border border-indigo-400/50 shadow-[0_0_30px_rgba(99,102,241,0.2)] group hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] transition-all duration-300 backdrop-blur-sm">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/30 rounded-full blur-2xl group-hover:bg-indigo-400/40 transition-all"></div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-indigo-200 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-2 drop-shadow-md">
                        <Package className="w-3 h-3" /> المخزون الحالي
                    </p>
                    <h3 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">{statsData.totalAvailableKeys}</h3>
                    <p className="text-[10px] text-indigo-100/70 mt-1">
                        مفتاح متاح للبيع الآن
                    </p>
                </div>
                <div className="p-3 bg-indigo-500/30 rounded-xl text-white border border-indigo-400/50 shadow-inner">
                    <KeyRound className="w-6 h-6" />
                </div>
            </div>
        </div>

        {/* Alert */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-600/20 to-orange-600/40 rounded-2xl p-6 border border-red-400/50 shadow-[0_0_30px_rgba(220,38,38,0.2)] group hover:shadow-[0_0_40px_rgba(220,38,38,0.4)] transition-all duration-300 backdrop-blur-sm">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/30 rounded-full blur-2xl group-hover:bg-red-400/40 transition-all"></div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-red-200 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-2 drop-shadow-md">
                        <AlertTriangle className="w-3 h-3" /> تنبيه المخزون
                    </p>
                    <h3 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">
                        {statsData.productStats.filter(p => p.available < 5).length}
                    </h3>
                    <p className="text-[10px] text-red-100/70 mt-1">منتجات أوشكت على النفاذ</p>
                </div>
                <div className="p-3 bg-red-500/30 rounded-xl text-white border border-red-400/50 shadow-inner">
                    <XCircle className="w-6 h-6" />
                </div>
            </div>
        </div>
      </div>

      {/* Advanced Stats: Loyalty & Geography & Keys */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Loyalty */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                  <Users className="w-5 h-5 text-purple-400" />
                  تحليل المشتركين (النمو والولاء)
              </h3>
              <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 bg-black/30 rounded-xl p-4 border border-white/5 text-center">
                      <p className="text-gray-400 text-xs mb-1">مشترك جديد</p>
                      <h4 className="text-2xl font-bold text-white">{statsData.newCustomers}</h4>
                      <div className="w-full bg-gray-700 h-1 mt-3 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full" style={{ width: `${(statsData.newCustomers / (statsData.newCustomers + statsData.returningCustomers || 1)) * 100}%` }}></div>
                      </div>
                  </div>
                  <div className="flex-1 bg-black/30 rounded-xl p-4 border border-white/5 text-center">
                      <p className="text-gray-400 text-xs mb-1">تجديد اشتراك</p>
                      <h4 className="text-2xl font-bold text-white">{statsData.returningCustomers}</h4>
                      <div className="w-full bg-gray-700 h-1 mt-3 rounded-full overflow-hidden">
                          <div className="bg-purple-500 h-full" style={{ width: `${(statsData.returningCustomers / (statsData.newCustomers + statsData.returningCustomers || 1)) * 100}%` }}></div>
                      </div>
                  </div>
              </div>
              <div className="mt-4 text-xs text-gray-500 text-center">
                  نسبة التجديد: <span className="text-purple-400 font-bold">{((statsData.returningCustomers / (statsData.newCustomers + statsData.returningCustomers || 1)) * 100).toFixed(1)}%</span> من العملاء قاموا بالشراء مرة أخرى.
              </div>
          </div>

          {/* Key Status Analysis */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                  <KeyRound className="w-5 h-5 text-cyan-400" />
                  تحليل حالة المفاتيح
              </h3>
              
              <div className="space-y-4">
                  {/* Active Keys */}
                  <div>
                      <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">مفاتيح نشطة</span>
                          <span className="text-emerald-400 font-bold">
                              {statsData.totalActiveKeys} 
                              <span className="text-xs text-gray-500 ml-1">
                                  ({((statsData.totalActiveKeys / (statsData.totalActiveKeys + statsData.totalExpiredKeys || 1)) * 100).toFixed(1)}%)
                              </span>
                          </span>
                      </div>
                      <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div 
                              className="bg-emerald-500 h-full" 
                              style={{ width: `${(statsData.totalActiveKeys / (statsData.totalActiveKeys + statsData.totalExpiredKeys || 1)) * 100}%` }}
                          ></div>
                      </div>
                  </div>

                  {/* Expired Keys */}
                  <div>
                      <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">مفاتيح منتهية</span>
                          <span className="text-red-400 font-bold">
                              {statsData.totalExpiredKeys}
                              <span className="text-xs text-gray-500 ml-1">
                                  ({((statsData.totalExpiredKeys / (statsData.totalActiveKeys + statsData.totalExpiredKeys || 1)) * 100).toFixed(1)}%)
                              </span>
                          </span>
                      </div>
                      <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div 
                              className="bg-red-500 h-full" 
                              style={{ width: `${(statsData.totalExpiredKeys / (statsData.totalActiveKeys + statsData.totalExpiredKeys || 1)) * 100}%` }}
                          ></div>
                      </div>
                  </div>

                  {/* Multi-Active Users */}
                  <div className="mt-6 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">مشتركين لديهم أكثر من مفتاح نشط</span>
                          <span className="text-xl font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20">
                              {statsData.usersWithMultiActiveKeys}
                          </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-2">
                          هؤلاء المستخدمين يساهمون في زيادة نسبة المفاتيح النشطة مقارنة بعدد المشتركين الفعلي.
                      </p>
                  </div>
              </div>
          </div>

          {/* Top Countries */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                  <Globe className="w-5 h-5 text-green-400" />
                  أعلى الدول شراءً
              </h3>
              <div className="space-y-3">
                  {statsData.topCountries.length > 0 ? (
                      statsData.topCountries.map((country, idx) => (
                          <div key={country.country} className="flex items-center justify-between p-2 rounded-lg bg-black/20 hover:bg-black/40 transition-colors">
                              <div className="flex items-center gap-3">
                                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? 'bg-yellow-500 text-black' : 'bg-white/10 text-gray-400'}`}>
                                      {idx + 1}
                                  </span>
                                  <span className="text-white font-medium">{country.country}</span>
                              </div>
                              <div className="text-right">
                                  <div className="text-green-400 font-mono font-bold text-sm">${country.revenue.toFixed(0)}</div>
                                  <div className="text-gray-500 text-[10px]">{country.count} عملية شراء</div>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="text-center text-gray-500 py-8">لا توجد بيانات جغرافية كافية للفترة المحددة.</div>
                  )}
              </div>
          </div>
      </div>

      {/* Sales Trend Chart & Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    المسار الزمني للمبيعات
                </h3>
                <div className="text-xs text-gray-400 flex items-center gap-1 bg-black px-3 py-1 rounded-full border border-white/10">
                    {timeRange === '24h' ? <Clock className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                    <span>{statsData.salesTrend.length} {timeRange === '24h' ? 'ساعة' : 'يوم'}</span>
                </div>
            </div>
            
            <div className="flex-1 w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/50">
                <div className="h-64 flex items-end gap-2 px-2" style={{ minWidth: `${Math.max(100, statsData.salesTrend.length * (timeRange === '24h' ? 40 : 20))}px`, width: '100%' }}>
                    {statsData.salesTrend.map((point, index) => {
                        const heightPercent = (point.revenue / statsData.maxTrendValue) * 100;
                        const barWidthClass = statsData.salesTrend.length > 60 ? 'w-2' : statsData.salesTrend.length > 30 ? 'w-3' : 'flex-1 max-w-[50px]';

                        return (
                            <div key={index} className={`flex flex-col items-center gap-2 group relative ${barWidthClass} h-full justify-end`}>
                                <div className="absolute bottom-[calc(100%+10px)] mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black text-white text-xs p-3 rounded-xl border border-white/20 shadow-2xl whitespace-nowrap z-20 pointer-events-none left-1/2 -translate-x-1/2 transform translate-y-2 group-hover:translate-y-0">
                                    <div className="font-bold mb-1 border-b border-white/10 pb-1 text-cyan-300">{point.fullLabel}</div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-400">الإيرادات:</span>
                                        <span className="text-green-400 font-mono font-bold">${point.revenue.toFixed(1)}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-400">المبيعات:</span>
                                        <span className="text-white font-mono">{point.count}</span>
                                    </div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black"></div>
                                </div>
                                
                                <div className="w-full bg-white/5 rounded-t-lg relative flex items-end overflow-hidden hover:bg-white/10 transition-colors h-full">
                                    <div 
                                        className={`w-full rounded-t-lg transition-all duration-700 ease-out relative 
                                            ${point.revenue > 0 
                                                ? 'bg-gradient-to-t from-cyan-600 via-blue-500 to-indigo-500 group-hover:from-cyan-500 group-hover:via-blue-400 group-hover:to-indigo-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                                                : 'bg-white/5'}`}
                                        style={{ height: `${Math.max(heightPercent, 2)}%` }}
                                    >
                                        {point.revenue > 0 && (
                                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/50 shadow-[0_0_10px_white]"></div>
                                        )}
                                    </div>
                                </div>
                                
                                {(statsData.salesTrend.length <= 14 || index % (timeRange === '24h' ? 3 : 5) === 0) && (
                                    <span className="text-[10px] text-gray-500 font-mono rotate-0 whitespace-nowrap mt-1">{point.label}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        <div className="lg:col-span-1 h-full">
            <WithdrawalCalculator totalSales={statsData.totalRevenue} />
        </div>
      </div>

      {/* Product Performance Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-indigo-400" />
                  تفاصيل أداء المنتجات (للفترة المحددة)
              </h3>
              <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span> متوفر
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span> منخفض
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span> نفذ
                  </div>
              </div>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full text-sm">
                  <thead className="bg-black/50 text-gray-400 text-xs uppercase tracking-wider font-bold">
                      <tr>
                          <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('title')}>
                              المنتج <SortIcon field="title" />
                          </th>
                          <th className="p-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('revenue')}>
                              إيرادات الفترة <SortIcon field="revenue" />
                          </th>
                          <th className="p-4 text-center">
                              المشتركين
                          </th>
                          <th className="p-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('used')}>
                              مبيعات الفترة <SortIcon field="used" />
                          </th>
                          <th className="p-4 text-center w-1/5">حالة المخزون</th>
                          <th className="p-4 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('available')}>
                              المتاح حالياً <SortIcon field="available" />
                          </th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                      {sortedStats.map((stat) => {
                          let progressColor = 'bg-blue-500';
                          if (stat.available === 0) progressColor = 'bg-red-500';
                          else if (stat.available < 5) progressColor = 'bg-yellow-500';
                          else progressColor = 'bg-green-500';

                          return (
                              <tr key={stat.id} className="hover:bg-white/5 transition-colors group">
                                  <td className="p-4">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-lg bg-black border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                              {stat.image ? (
                                                  <img src={stat.image} alt={stat.title} className="w-full h-full object-cover" />
                                              ) : (
                                                  <Package className="w-5 h-5 text-slate-500" />
                                              )}
                                          </div>
                                          <div>
                                              <div className="font-bold text-white">{stat.title}</div>
                                              <div className="text-xs text-gray-500 mt-0.5">ID: {stat.id.substring(0, 8)}</div>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="p-4 text-center">
                                      <span className="text-emerald-400 font-mono font-bold bg-emerald-900/20 px-2 py-1 rounded border border-emerald-500/20">
                                          ${stat.revenue.toFixed(2)}
                                      </span>
                                  </td>
                                  <td className="p-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                  <span className="text-white font-bold text-lg">{stat.productTotalSubscribers}</span>
                                  <div className="flex items-center gap-2 text-[10px]">
                                      <span className="text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{stat.productActiveSubscribers} نشط</span>
                                      <span className="text-red-400 font-medium bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">{stat.productInactiveSubscribers} غير نشط</span>
                                  </div>
                              </div>
                          </td>
                                  <td className="p-4 text-center">
                                      <span className="text-white font-bold">{stat.usedInPeriod}</span>
                                      <span className="text-gray-500 text-xs ml-1">/ {stat.usedAllTime}</span>
                                  </td>
                                  <td className="p-4">
                                      <div className="flex items-center gap-3">
                                          <div className="flex-1 h-2 bg-black rounded-full overflow-hidden">
                                              <div 
                                                  className={`h-full ${progressColor} rounded-full transition-all duration-1000`} 
                                                  style={{ width: `${stat.fillRate}%` }}
                                              ></div>
                                          </div>
                                          <span className="text-xs text-gray-400 w-8 text-left">{Math.round(stat.fillRate)}%</span>
                                      </div>
                                  </td>
                                  <td className="p-4 text-center">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${stat.available > 0 ? (stat.available < 5 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20') : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                          {stat.available}
                                      </span>
                                  </td>
                              </tr>
                          );
                      })}
                      {sortedStats.length === 0 && (
                          <tr>
                              <td colSpan={6} className="p-8 text-center text-gray-400">لا توجد بيانات لعرضها.</td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
      {/* Subscriber Report Modal */}
      {showSubscriberReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-400" />
                            تقرير المشتركين التفصيلي
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                            إجمالي: {statsData.totalSubscribers} | نشط: {statsData.activeSubscribers} | غير نشط: {statsData.inactiveSubscribers}
                        </p>
                    </div>
                    <button 
                        onClick={() => setShowSubscriberReport(false)}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="overflow-y-auto flex-1 p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/50">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase bg-white/5 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 rounded-tl-lg">البريد الإلكتروني</th>
                                <th className="px-6 py-3">الحالة</th>
                                <th className="px-6 py-3">آخر منتج تم شراؤه</th>
                                <th className="px-6 py-3">تاريخ الشراء</th>
                                <th className="px-6 py-3">تاريخ الانتهاء</th>
                                <th className="px-6 py-3 rounded-tr-lg">إجمالي المفاتيح</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {statsData.subscriberDetails.map((sub: any, idx: number) => (
                                <tr key={idx} className="bg-transparent hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">
                                        {sub.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            sub.status === 'Active' 
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        }`}>
                                            {sub.status === 'Active' ? 'نشط' : 'غير نشط'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">
                                        {sub.latestProduct}
                                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">{sub.latestKey}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">
                                        {sub.latestPurchaseDate ? new Date(sub.latestPurchaseDate).toLocaleDateString('en-GB') : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {sub.latestExpirationDate ? (
                                            <span className={`${new Date(sub.latestExpirationDate) > new Date() ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {new Date(sub.latestExpirationDate).toLocaleDateString('en-GB')}
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">غير محدد</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-300">
                                        {sub.totalKeys}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end">
                    <button 
                        onClick={() => setShowSubscriberReport(false)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default ProductKeyStats;
