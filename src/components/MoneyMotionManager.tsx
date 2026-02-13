import React, { useState, useEffect } from 'react';
import { 
  CreditCard, TrendingUp, History, AlertTriangle, Settings, 
  ArrowDownCircle, ArrowUpCircle, RefreshCw, ExternalLink, 
  CheckCircle2, XCircle, Clock, Search, Filter, ChevronRight, 
  ChevronLeft, Wallet, Landmark, ShieldAlert, BarChart3
} from 'lucide-react';
import { moneyMotionService } from '../lib/moneyMotionService';

type SubTab = 'overview' | 'transactions' | 'withdrawals' | 'disputes' | 'settings';

export const MoneyMotionManager: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data States
  const [balance, setBalance] = useState<any>(null);
  const [reserves, setReserves] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isPaymentPaused, setIsPaymentPaused] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [fakeDomain, setFakeDomain] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Pagination
  const [txPage, setTxPage] = useState(1);
  const [wdPage, setWdPage] = useState(1);
  const [dsPage, setDsPage] = useState(1);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    
    setError(null);
    try {
      // Check if payment is paused in site settings
      const settings = await moneyMotionService.getSettings();
      setIsPaymentPaused(settings.moneymotion_payment_paused === 'true');
      setApiKey(settings.moneymotion_api_key || '');
      setFakeDomain(settings.moneymotion_fake_domain || '');
      setWebhookSecret(settings.moneymotion_webhook_secret || '');

      // Fetch all data in parallel, but handle each one individually so one failure doesn't block others
      const fetchResults = await Promise.allSettled([
        moneyMotionService.getBalance(),
        moneyMotionService.getReserves(),
        moneyMotionService.listCheckoutSessions(txPage),
        moneyMotionService.listWithdrawals(wdPage),
        moneyMotionService.listDisputes(dsPage),
        moneyMotionService.getAnalytics()
      ]);

      // Process Results
      const balData = fetchResults[0].status === 'fulfilled' ? fetchResults[0].value : null;
      const resData = fetchResults[1].status === 'fulfilled' ? fetchResults[1].value : null;
      const txData = fetchResults[2].status === 'fulfilled' ? fetchResults[2].value : null;
      const wdData = fetchResults[3].status === 'fulfilled' ? fetchResults[3].value : null;
      const dsData = fetchResults[4].status === 'fulfilled' ? fetchResults[4].value : null;
      const alyData = fetchResults[5].status === 'fulfilled' ? fetchResults[5].value : null;

      // Log errors for debugging
      fetchResults.forEach((res, index) => {
        if (res.status === 'rejected') {
          console.warn(`MoneyMotion fetch error at index ${index}:`, res.reason);
        }
      });

      setBalance(balData?.result?.data?.json || null);
      setReserves(resData?.result?.data?.json || null);
      
      // Handle potential different response structures for listCheckoutSessions
      const txItems = txData?.result?.data?.json?.items || txData?.result?.items || txData?.items || [];
      setTransactions(txItems);
      
      const wdItems = wdData?.result?.data?.json?.items || wdData?.result?.items || wdData?.items || [];
      setWithdrawals(wdItems);
      
      const dsItems = dsData?.result?.data?.json?.items || dsData?.result?.items || dsData?.items || [];
      setDisputes(dsItems);
      
      setAnalytics(alyData?.result?.data?.json || alyData?.result || null);
    } catch (err: any) {
      console.error('Error fetching MoneyMotion data:', err);
      setError(err.message || 'فشل تحميل البيانات من MoneyMotion');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [txPage, wdPage, dsPage]);


  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('success') || s.includes('completed') || s.includes('paid')) {
      return <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20 uppercase"><CheckCircle2 className="w-3 h-3" /> ناجح</span>;
    }
    if (s.includes('pending') || s.includes('processing')) {
      return <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20 uppercase"><Clock className="w-3 h-3" /> قيد الانتظار</span>;
    }
    if (s.includes('failed') || s.includes('canceled') || s.includes('expired')) {
      return <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 uppercase"><XCircle className="w-3 h-3" /> فشل</span>;
    }
    return <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 uppercase">{status}</span>;
  };

  const handleTogglePayment = async () => {
    try {
      setRefreshing(true);
      const newValue = !isPaymentPaused;
      await moneyMotionService.updateSettings({
        moneymotion_payment_paused: newValue ? 'true' : 'false'
      });
      setIsPaymentPaused(newValue);
    } catch (err: any) {
      setError('فشل تحديث حالة الدفع: ' + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveApiKey = async () => {
    // We only need the API key to be present to save.
    // If it's missing, we should show an error instead of just returning.
    if (!apiKey) {
      setError('يرجى إدخال مفتاح الـ API أولاً');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      // Send all settings. Empty strings will clear the values in the database.
      await moneyMotionService.updateSettings({
        moneymotion_api_key: apiKey,
        moneymotion_fake_domain: fakeDomain || '', // Explicitly send empty string if cleared
        moneymotion_webhook_secret: webhookSecret || ''
      });
      
      // Refresh data to verify
      await fetchData(true);
      
      // Show success message (optional, but good for UX)
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed bottom-4 left-4 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-fade-in-up';
      successMsg.innerText = 'تم حفظ الإعدادات بنجاح';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);

    } catch (err: any) {
      setError('فشل حفظ الإعدادات: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
        <p className="text-cyan-400 font-bold">جاري الاتصال بـ MoneyMotion...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/20 rounded-xl border border-cyan-500/20">
            <CreditCard className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">بوابة دفع MoneyMotion</h2>
            <p className="text-gray-400 text-sm">إدارة المدفوعات العالمية والعمليات المالية</p>
          </div>
        </div>
        
        <button 
          onClick={() => fetchData(true)} 
          disabled={refreshing}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          تحديث البيانات
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-black/40 rounded-xl border border-white/5 w-fit">
        {[
          { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
          { id: 'transactions', label: 'العمليات', icon: History },
          { id: 'withdrawals', label: 'السحوبات', icon: Landmark },
          { id: 'disputes', label: 'النزاعات', icon: ShieldAlert },
          { id: 'settings', label: 'الإعدادات', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as SubTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeSubTab === tab.id 
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Rendering */}
      <div className="min-h-[400px]">
        {activeSubTab === 'overview' && (
          <div className="space-y-6">
            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Wallet className="w-24 h-24" /></div>
                <p className="text-cyan-400 text-xs font-bold mb-1 uppercase tracking-wider">الرصيد المتاح</p>
                <h3 className="text-3xl font-bold text-white">${(balance?.availableBalanceInCents / 100 || 0).toLocaleString()}</h3>
                <p className="text-gray-500 text-[10px] mt-2 font-mono">AVAILABLE BALANCE</p>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-500/20 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Clock className="w-24 h-24" /></div>
                <p className="text-yellow-400 text-xs font-bold mb-1 uppercase tracking-wider">رصيد قيد المعالجة</p>
                <h3 className="text-3xl font-bold text-white">${(balance?.pendingBalanceInCents / 100 || 0).toLocaleString()}</h3>
                <p className="text-gray-500 text-[10px] mt-2 font-mono">PENDING BALANCE</p>
              </div>

              <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><ShieldAlert className="w-24 h-24" /></div>
                <p className="text-purple-400 text-xs font-bold mb-1 uppercase tracking-wider">الاحتياطي</p>
                <h3 className="text-3xl font-bold text-white">${(reserves?.totalReserveInCents / 100 || 0).toLocaleString()}</h3>
                <p className="text-gray-500 text-[10px] mt-2 font-mono">RESERVE BALANCE</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  تحليلات الأداء (آخر 7 أيام)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <p className="text-gray-500 text-xs mb-1">إجمالي المبيعات</p>
                    <p className="text-xl font-bold text-white">${(analytics?.totalVolumeInCents / 100 || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <p className="text-gray-500 text-xs mb-1">عدد العمليات</p>
                    <p className="text-xl font-bold text-white">{analytics?.transactionCount || 0}</p>
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <p className="text-gray-500 text-xs mb-1">نسبة النجاح</p>
                    <p className="text-xl font-bold text-green-400">{analytics?.successRate || 0}%</p>
                  </div>
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                    <p className="text-gray-500 text-xs mb-1">متوسط قيمة الطلب</p>
                    <p className="text-xl font-bold text-white">${(analytics?.averageOrderValueInCents / 100 || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-cyan-400" />
                  أحدث العمليات
                </h4>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center">
                          <ArrowDownCircle className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white truncate max-w-[150px]">{tx.description || 'بدون وصف'}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{new Date(tx.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">${(tx.amountInCents / 100).toLocaleString()}</p>
                        {renderStatusBadge(tx.status)}
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && <p className="text-center py-10 text-gray-500 text-sm italic">لا توجد عمليات مؤخراً</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'transactions' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
              <h4 className="text-white font-bold">سجل العمليات (Checkout Sessions)</h4>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" placeholder="بحث..." className="bg-black/40 border border-white/10 rounded-lg pr-9 pl-3 py-1.5 text-xs text-white focus:border-cyan-500 outline-none w-48" />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-black/40 text-gray-400 border-b border-white/10 uppercase text-[10px] tracking-wider font-bold">
                    <th className="p-4">المعرف</th>
                    <th className="p-4">الوصف</th>
                    <th className="p-4">المبلغ</th>
                    <th className="p-4">العميل</th>
                    <th className="p-4">التاريخ</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 font-mono text-[10px] text-gray-400">{tx.id.substring(0, 8)}...</td>
                      <td className="p-4 font-bold text-white">{tx.description || '-'}</td>
                      <td className="p-4 font-bold text-cyan-400">${(tx.amountInCents / 100).toLocaleString()}</td>
                      <td className="p-4 text-gray-300">
                        <div className="flex flex-col">
                          <span className="font-medium">{tx.userInfo?.email || tx.customerEmail || tx.email || '-'}</span>
                          {tx.userInfo?.firstName && (
                            <span className="text-[10px] text-gray-500">{tx.userInfo.firstName} {tx.userInfo.lastName}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-gray-500 font-mono text-xs">{new Date(tx.createdAt).toLocaleString()}</td>
                      <td className="p-4">{renderStatusBadge(tx.status)}</td>
                      <td className="p-4 text-center">
                        <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan={7} className="p-10 text-center text-gray-500 italic">لا توجد سجلات متاحة</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/20">
              <p className="text-xs text-gray-500">عرض الصفحة {txPage}</p>
              <div className="flex gap-2">
                <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                <button onClick={() => setTxPage(p => p + 1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'withdrawals' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/20 p-6 rounded-2xl">
                 <p className="text-green-400 text-xs font-bold mb-1">إجمالي المسحوبات</p>
                 <h3 className="text-3xl font-bold text-white">${(withdrawals.reduce((acc, curr) => acc + (curr.status === 'completed' ? curr.amountInCents : 0), 0) / 100).toLocaleString()}</h3>
               </div>
               <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
                 <div>
                   <p className="text-gray-400 text-xs font-bold mb-1">طريقة السحب الحالية</p>
                   <p className="text-white font-bold">Binance Pay (USDT)</p>
                 </div>
                 <button className="mt-4 w-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold py-2 rounded-lg transition-all">تغيير الطريقة</button>
               </div>
               <div className="bg-cyan-600/10 border border-cyan-500/20 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                  <Landmark className="w-8 h-8 text-cyan-400 mb-2" />
                  <p className="text-white font-bold text-sm">طلب سحب جديد</p>
                  <p className="text-gray-400 text-[10px] mt-1">الحد الأدنى للسحب: $50.00</p>
                  <button className="mt-3 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-600/20">سحب الرصيد</button>
               </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-black/20">
                <h4 className="text-white font-bold">سجل السحوبات</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="bg-black/40 text-gray-400 border-b border-white/10 text-[10px] font-bold uppercase">
                      <th className="p-4">المعرف</th>
                      <th className="p-4">المبلغ</th>
                      <th className="p-4">الرسوم</th>
                      <th className="p-4">المستلم</th>
                      <th className="p-4">التاريخ</th>
                      <th className="p-4">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {withdrawals.map((wd) => (
                      <tr key={wd.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-mono text-[10px] text-gray-400">{wd.id.substring(0, 8)}</td>
                        <td className="p-4 font-bold text-white">${(wd.amountInCents / 100).toLocaleString()}</td>
                        <td className="p-4 text-red-400/70">-${(wd.feeInCents / 100).toLocaleString()}</td>
                        <td className="p-4 text-gray-300 font-mono text-xs">{wd.payoutMethod || 'Binance Pay'}</td>
                        <td className="p-4 text-gray-500 font-mono text-xs">{new Date(wd.createdAt).toLocaleString()}</td>
                        <td className="p-4">{renderStatusBadge(wd.status)}</td>
                      </tr>
                    ))}
                    {withdrawals.length === 0 && (
                      <tr><td colSpan={6} className="p-10 text-center text-gray-500 italic">لا توجد طلبات سحب سابقة</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'disputes' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl flex items-center gap-4">
                  <div className="p-4 bg-red-500/20 rounded-full"><ShieldAlert className="w-8 h-8 text-red-400" /></div>
                  <div>
                    <p className="text-red-400 text-xs font-bold mb-1 uppercase tracking-wider">نزاعات نشطة</p>
                    <h3 className="text-3xl font-bold text-white">{disputes.filter(d => d.status === 'needs_response').length}</h3>
                  </div>
               </div>
               <div className="bg-green-500/5 border border-green-500/20 p-6 rounded-2xl flex items-center gap-4">
                  <div className="p-4 bg-green-500/20 rounded-full"><CheckCircle2 className="w-8 h-8 text-green-400" /></div>
                  <div>
                    <p className="text-green-400 text-xs font-bold mb-1 uppercase tracking-wider">نزاعات تم حلها</p>
                    <h3 className="text-3xl font-bold text-white">{disputes.filter(d => d.status === 'won' || d.status === 'lost').length}</h3>
                  </div>
               </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-black/20">
                <h4 className="text-white font-bold">إدارة النزاعات والشكاوى</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="bg-black/40 text-gray-400 border-b border-white/10 text-[10px] font-bold uppercase">
                      <th className="p-4">رقم العملية</th>
                      <th className="p-4">المبلغ</th>
                      <th className="p-4">السبب</th>
                      <th className="p-4">تاريخ النزاع</th>
                      <th className="p-4">الموعد النهائي</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {disputes.map((ds) => (
                      <tr key={ds.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4 font-mono text-[10px] text-gray-400">{ds.transactionId?.substring(0, 12) || ds.id.substring(0, 8)}</td>
                        <td className="p-4 font-bold text-white">${(ds.amountInCents / 100).toLocaleString()}</td>
                        <td className="p-4 text-gray-300 text-xs">{ds.reason || 'غير محدد'}</td>
                        <td className="p-4 text-gray-500 font-mono text-xs">{new Date(ds.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-red-400/80 font-mono text-xs font-bold">{ds.deadline ? new Date(ds.deadline).toLocaleDateString() : '-'}</td>
                        <td className="p-4">{renderStatusBadge(ds.status)}</td>
                        <td className="p-4">
                           <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1 rounded-lg text-[10px] font-bold transition-all">تقديم أدلة</button>
                        </td>
                      </tr>
                    ))}
                    {disputes.length === 0 && (
                      <tr><td colSpan={7} className="p-10 text-center text-gray-500 italic">لا توجد نزاعات حالياً. استمر في العمل الجيد!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'settings' && (
          <div className="max-w-3xl space-y-6">
             <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h4 className="text-white font-bold mb-6 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  إعدادات بوابة MoneyMotion
                </h4>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">مفتاح الـ API (mk_live_...)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={apiKey} 
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="mk_live_..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none focus:border-cyan-500 transition-all" 
                      />
                      <button 
                        onClick={handleSaveApiKey}
                        disabled={isSaving || !apiKey}
                        className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                      >
                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        حفظ التغييرات
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">يمكنك تغيير مفتاح الـ API هنا. إذا كان فارغاً، سيتم استخدام المفتاح الموجود في ملف الإعدادات.</p>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">مفتاح الـ Webhook Secret (الـ Hash)</label>
                    <div className="flex gap-2">
                      <input 
                        type="password" 
                        value={webhookSecret} 
                        onChange={(e) => setWebhookSecret(e.target.value)}
                        placeholder="أدخل الـ Hash هنا (مثلاً: 9978f3...)"
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none focus:border-cyan-500 transition-all" 
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">هذا المفتاح ضروري للتحقق من صحة إشعارات الدفع التلقائية القادمة من موني موشن.</p>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <label className="block text-xs font-bold text-yellow-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      الدومين الوهمي العام (Redirect Masking)
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={fakeDomain} 
                        onChange={(e) => setFakeDomain(e.target.value)}
                        placeholder="مثال: payments.example.com"
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-yellow-500 transition-all" 
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">
                      سيتم استبدال دومين موقعك الحقيقي بهذا الدومين في روابط النجاح والفشل المرسلة لبوابة الدفع. 
                      <span className="text-yellow-500/80 block mt-1">تنبيه: يجب أن يقوم هذا الدومين بالتوجيه لموقعك الحقيقي لكي تعمل الروابط.</span>
                    </p>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">رابط الـ Webhook (هام جداً)</label>
                    
                    <div className="space-y-4">
                      {/* Localhost Warning */}
                      {window.location.hostname === 'localhost' && (
                        <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl flex gap-3 text-orange-400">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div className="text-[10px]">
                            <p className="font-bold mb-1">تنبيه: أنت تستخدم localhost</p>
                            <p>بوابة MoneyMotion لا يمكنها إرسال إشعارات لروابط localhost. لتلقي المدفوعات وتحديث الرصيد، يجب استخدام رابط الـ Edge Function الخاص بـ Supabase.</p>
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-[10px] text-cyan-400 mb-2 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          الرابط الموصى به (Supabase Edge Function):
                        </p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value="https://pbdkxzrzbnlajjgubgis.supabase.co/functions/v1/moneymotion-webhook" 
                            readOnly
                            className="flex-1 bg-cyan-500/5 border border-cyan-500/20 rounded-xl px-4 py-3 text-sm text-cyan-200 font-mono outline-none" 
                          />
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText("https://pbdkxzrzbnlajjgubgis.supabase.co/functions/v1/moneymotion-webhook");
                              const btn = document.activeElement as HTMLButtonElement;
                              const oldText = btn.innerText;
                              btn.innerText = 'تم النسخ!';
                              setTimeout(() => btn.innerText = oldText, 2000);
                            }}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                          >
                            نسخ الرابط
                          </button>
                        </div>
                        <p className="text-[9px] text-gray-500 mt-2 italic">استخدم هذا الرابط في خانة (WEBHOOK URL) داخل لوحة تحكم MoneyMotion.</p>
                      </div>

                      <div className="opacity-50">
                        <p className="text-[10px] text-gray-500 mb-2 uppercase">رابط الموقع الحالي (للمطورين):</p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={`${window.location.origin}/api/webhooks/moneymotion`} 
                            readOnly
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-gray-500 font-mono outline-none" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between p-4 bg-black/40 border border-white/10 rounded-xl">
                      <div>
                        <h5 className="text-white font-bold text-sm">حالة بوابة الدفع</h5>
                        <p className="text-gray-500 text-[10px] mt-1">عند الإيقاف، لن يتمكن العملاء من استخدام MoneyMotion للدفع</p>
                      </div>
                      <button 
                        onClick={handleTogglePayment}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                          isPaymentPaused 
                            ? 'bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30' 
                            : 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30'
                        }`}
                      >
                        {isPaymentPaused ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {isPaymentPaused ? 'تفعيل الدفع الآن' : 'إيقاف الدفع مؤقتاً'}
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                      <p className="text-xs font-bold text-white mb-1">العملة الافتراضية</p>
                      <p className="text-cyan-400 font-bold">USD</p>
                    </div>
                    <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                      <p className="text-xs font-bold text-white mb-1">بيئة العمل</p>
                      <p className="text-green-400 font-bold">LIVE PRODUCTION</p>
                    </div>
                  </div>
                </div>
             </div>

             <div className="bg-yellow-500/5 border border-yellow-500/20 p-6 rounded-2xl flex gap-4">
                <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                <div>
                  <h5 className="text-yellow-400 font-bold text-sm mb-1">تنبيه أمني</h5>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    لا تشارك مفاتيح الـ API الخاصة بك مع أي شخص. أي شخص يمتلك هذه المفاتيح يمكنه الوصول إلى أموالك وإدارة عملياتك المالية.
                  </p>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
