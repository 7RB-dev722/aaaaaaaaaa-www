import React, { useState, useMemo } from 'react';
import { Product, ProductKey, productKeysService } from '../lib/supabase';
import { Plus, Trash2, Undo2, CheckCircle, Copy, Search, X, KeyRound, AlertCircle, Mail, Calendar, Terminal, ShieldCheck, ShieldAlert, Layers, Package, Check, Filter, Eye, EyeOff } from 'lucide-react';

interface ProductKeysManagerProps {
  products: Product[];
  keys: ProductKey[];
  onKeysUpdate: () => void;
  saving: boolean;
  setSaving: (s: boolean) => void;
  setError: (e: string | null) => void;
  setSuccess: (s: string | null) => void;
}

const ProductKeysManager: React.FC<ProductKeysManagerProps> = ({ products, keys, onKeysUpdate, saving, setSaving, setError, setSuccess }) => {
  const [newKeysData, setNewKeysData] = useState({ productId: '', keys: '' });
  const [filters, setFilters] = useState({ productId: 'all', status: 'all' });
  const [keySearchTerm, setKeySearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [isAddMode, setIsAddMode] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const getDynamicProductCount = (pId: string) => {
      return keys.filter(k => 
          k.product_id === pId && 
          (filters.status === 'all' ? true : filters.status === 'used' ? k.is_used : !k.is_used)
      ).length;
  };

  const getDynamicStatusCount = (statusType: 'available' | 'used' | 'all') => {
      return keys.filter(k => 
          (filters.productId === 'all' ? true : k.product_id === filters.productId) &&
          (statusType === 'all' ? true : statusType === 'used' ? k.is_used : !k.is_used)
      ).length;
  };

  const stats = useMemo(() => {
    const total = keys.length;
    const used = keys.filter(k => k.is_used).length;
    const available = total - used;
    return { total, used, available };
  }, [keys]);

  const toggleKeyReveal = (id: string) => {
      setRevealedKeys(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  const handleAddKeys = async () => {
    if (!newKeysData.productId || !newKeysData.keys.trim()) {
      setError('الرجاء اختيار منتج وإدخال مفتاح واحد على الأقل.');
      return;
    }
    const keysArray = newKeysData.keys.split('\n').map(k => k.trim()).filter(Boolean);
    if (keysArray.length === 0) {
      setError('الرجاء إدخال مفاتيح صالحة.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const insertedCount = await productKeysService.addKeys(newKeysData.productId, keysArray);
      const totalAttempted = keysArray.length;
      const skippedCount = totalAttempted - insertedCount;

      let successMessage = `تمت إضافة ${insertedCount} مفتاح جديد بنجاح.`;
      if (skippedCount > 0) {
        successMessage += ` تم تجاهل ${skippedCount} مفتاح مكرر.`;
      }
      
      setSuccess(successMessage);
      setNewKeysData({ productId: '', keys: '' });
      setIsAddMode(false);
      onKeysUpdate();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteKey = async (keyId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المفتاح؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    setSaving(true);
    setError(null);
    try {
        await productKeysService.deleteKey(keyId);
        setSuccess('تم حذف المفتاح بنجاح.');
        onKeysUpdate();
        setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setSaving(false);
    }
  };

  const handleReturnKey = async (keyId: string) => {
    if (!window.confirm('هل أنت متأكد أنك تريد إرجاع هذا المفتاح؟ سيصبح متاحًا للاستخدام مرة أخرى.')) return;
    setSaving(true);
    setError(null);
    try {
        await productKeysService.returnKey(keyId);
        setSuccess('تم إرجاع المفتاح بنجاح.');
        onKeysUpdate();
        setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setSaving(false);
    }
  };

  const handleCopyKey = async (keyValue: string) => {
    if (!keyValue) return;
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(keyValue);
        setCopiedKey(keyValue);
        setSuccess('تم النسخ!');
        setTimeout(() => {
          setCopiedKey(null);
          setSuccess(null);
        }, 2000);
        return;
      }
    } catch (err) {
      console.warn("Clipboard API failed, using fallback", err);
    }

    // Fallback
    try {
      const textArea = document.createElement("textarea");
      textArea.value = keyValue;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      textArea.setAttribute('readonly', '');
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (!successful) throw new Error('Copy command failed');
      
      setCopiedKey(keyValue);
      setSuccess('تم النسخ!');
      setTimeout(() => {
        setCopiedKey(null);
        setSuccess(null);
      }, 2000);
    } catch (err) {
      console.error("Copy failed", err);
      setError('فشل النسخ');
    }
  };

  const filteredKeys = useMemo(() => {
    return keys
      .filter(key => {
        const productMatch = filters.productId === 'all' || key.product_id === filters.productId;
        const statusMatch = filters.status === 'all' || (filters.status === 'used' ? key.is_used : !key.is_used);
        
        const searchTermLower = keySearchTerm.toLowerCase();
        const searchMatch = !keySearchTerm ||
          (key.key_value && key.key_value.toLowerCase().includes(searchTermLower)) ||
          (key.used_by_email && key.used_by_email.toLowerCase().includes(searchTermLower));
        
        return productMatch && statusMatch && searchMatch;
      })
      .sort((a, b) => {
        if (a.is_used !== b.is_used) {
            return a.is_used ? 1 : -1; // Available first
        }
        if (a.is_used && a.used_at && b.used_at) {
            return new Date(b.used_at).getTime() - new Date(a.used_at).getTime();
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [keys, filters, keySearchTerm]);

  const handleToggleKeySelection = (keyId: string) => {
    setSelectedKeys(prev => 
      prev.includes(keyId) 
        ? prev.filter(id => id !== keyId)
        : [...prev, keyId]
    );
  };

  const handleSelectAllKeys = (shouldSelect: boolean) => {
    if (shouldSelect) {
      setSelectedKeys(filteredKeys.map(k => k.id));
    } else {
      setSelectedKeys([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`هل أنت متأكد أنك تريد حذف ${selectedKeys.length} من المفاتيح المحددة؟`)) return;
    setSaving(true);
    setError(null);
    try {
      await productKeysService.deleteKeys(selectedKeys);
      setSuccess(`تم حذف ${selectedKeys.length} مفتاح بنجاح.`);
      setSelectedKeys([]);
      onKeysUpdate();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReturnSelected = async () => {
    if (!window.confirm(`هل أنت متأكد أنك تريد إرجاع ${selectedKeys.length} من المفاتيح المحددة؟`)) return;
    setSaving(true);
    setError(null);
    try {
      await productKeysService.returnKeys(selectedKeys);
      setSuccess(`تم إرجاع ${selectedKeys.length} مفتاح بنجاح.`);
      setSelectedKeys([]);
      onKeysUpdate();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getProduct = (productId: string) => products.find(p => p.id === productId);

  const ModernCheckbox = ({ checked, onChange, disabled = false }: { checked: boolean, onChange: () => void, disabled?: boolean }) => (
    <label className={`relative flex items-center justify-center w-6 h-6 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input 
        type="checkbox" 
        className="peer sr-only" 
        checked={checked} 
        onChange={onChange}
        disabled={disabled}
      />
      <div className={`
        absolute inset-0 rounded-lg border-2 transition-all duration-300 ease-out
        ${checked 
          ? 'bg-gradient-to-br from-cyan-500 to-blue-600 border-transparent shadow-[0_0_10px_rgba(6,182,212,0.5)] scale-100' 
          : 'bg-white/5 border-white/20 group-hover:border-cyan-500'
        }
      `}></div>
      <Check 
        className={`
          w-3.5 h-3.5 text-white z-10 transition-all duration-300 
          ${checked ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'}
        `} 
        strokeWidth={3}
      />
    </label>
  );

  return (
    <div className="space-y-8">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative overflow-hidden bg-white/5 rounded-2xl p-6 border border-white/10 shadow-lg group hover:border-blue-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-blue-500/20"></div>
              <div className="flex justify-between items-start relative z-10">
                  <div>
                      <p className="text-blue-400 font-medium text-sm mb-1 flex items-center gap-2">
                          <Layers className="w-4 h-4" /> إجمالي المفاتيح
                      </p>
                      <h3 className="text-4xl font-bold text-white tracking-tight">{stats.total}</h3>
                  </div>
                  <div className="p-3 bg-black/50 border border-blue-500/20 rounded-xl text-blue-400 shadow-inner">
                      <KeyRound className="w-6 h-6" />
                  </div>
              </div>
          </div>

          <div className="relative overflow-hidden bg-white/5 rounded-2xl p-6 border border-white/10 shadow-lg group hover:border-green-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-green-500/20"></div>
              <div className="flex justify-between items-start relative z-10">
                  <div>
                      <p className="text-green-400 font-medium text-sm mb-1 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" /> متاح للبيع
                      </p>
                      <h3 className="text-4xl font-bold text-white tracking-tight">{stats.available}</h3>
                  </div>
                  <div className="p-3 bg-black/50 border border-green-500/20 rounded-xl text-green-400 shadow-inner">
                      <CheckCircle className="w-6 h-6" />
                  </div>
              </div>
          </div>

          <div className="relative overflow-hidden bg-white/5 rounded-2xl p-6 border border-white/10 shadow-lg group hover:border-red-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-red-500/20"></div>
              <div className="flex justify-between items-start relative z-10">
                  <div>
                      <p className="text-red-400 font-medium text-sm mb-1 flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4" /> مستخدم
                      </p>
                      <h3 className="text-4xl font-bold text-white tracking-tight">{stats.used}</h3>
                  </div>
                  <div className="p-3 bg-black/50 border border-red-500/20 rounded-xl text-red-400 shadow-inner">
                      <AlertCircle className="w-6 h-6" />
                  </div>
              </div>
          </div>
      </div>

      {isAddMode ? (
        <div className="bg-white/5 rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-900/20 animate-fade-in-up overflow-hidden">
            <div className="bg-white/10 p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-cyan-400" />
                    <span className="font-mono">System.AddKeys()</span>
                </h3>
                <button onClick={() => setIsAddMode(false)} className="text-gray-400 hover:text-white transition-colors bg-black hover:bg-red-500/20 hover:text-red-400 p-1.5 rounded-lg">
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">Target Product</label>
                        <select 
                            value={newKeysData.productId} 
                            onChange={(e) => setNewKeysData({ ...newKeysData, productId: e.target.value })} 
                            className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-all hover:bg-white/5"
                        >
                            <option value="">-- Select Product --</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                    </div>
                    <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4">
                        <h4 className="text-blue-400 text-sm font-bold mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> تعليمات</h4>
                        <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                            <li>الصق المفاتيح في الحقل المقابل.</li>
                            <li>يجب أن يكون كل مفتاح في سطر منفصل.</li>
                            <li>سيقوم النظام تلقائيًا بإزالة المسافات الزائدة.</li>
                            <li>المفاتيح المكررة سيتم تجاهلها.</li>
                        </ul>
                    </div>
                </div>
                <div className="flex flex-col h-full">
                    <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">Key Data Stream</label>
                    <textarea 
                        value={newKeysData.keys} 
                        onChange={(e) => setNewKeysData({ ...newKeysData, keys: e.target.value })} 
                        className="flex-1 w-full p-4 bg-black/80 border border-white/10 rounded-xl text-green-400 focus:outline-none focus:border-green-500 font-mono text-sm resize-none shadow-inner" 
                        placeholder="XXXX-XXXX-XXXX-XXXX&#10;YYYY-YYYY-YYYY-YYYY"
                    ></textarea>
                </div>
            </div>
            <div className="p-4 bg-black/50 border-t border-white/10 flex justify-end gap-3">
                <button onClick={() => setIsAddMode(false)} className="px-6 py-2.5 bg-black hover:bg-white/10 text-white rounded-xl transition-colors font-medium text-sm">إلغاء الأمر</button>
                <button onClick={handleAddKeys} disabled={saving} className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-2.5 rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg shadow-cyan-500/20 font-bold text-sm">
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>تنفيذ الإضافة</span>
                </button>
            </div>
        </div>
      ) : (
          <div className="flex justify-end">
              <button onClick={() => setIsAddMode(true)} className="group relative overflow-hidden rounded-xl bg-cyan-600 px-6 py-3 text-white shadow-lg transition-all hover:bg-cyan-500 hover:shadow-cyan-500/25 active:scale-95">
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  <span className="flex items-center gap-2 font-bold relative z-10">
                      <Plus className="w-5 h-5" />
                      إضافة مفاتيح جديدة
                  </span>
              </button>
          </div>
      )}
      
      <div className="sticky top-4 z-30 mx-auto max-w-full">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="flex items-center gap-3 bg-black/50 px-3 py-2 rounded-xl border border-white/10">
                      <ModernCheckbox 
                        checked={selectedKeys.length === filteredKeys.length && filteredKeys.length > 0}
                        onChange={() => handleSelectAllKeys(selectedKeys.length !== filteredKeys.length)}
                        disabled={filteredKeys.length === 0}
                      />
                      <label className="text-sm font-medium text-gray-300 cursor-pointer select-none" onClick={() => handleSelectAllKeys(selectedKeys.length !== filteredKeys.length)}>
                          {selectedKeys.length > 0 ? `تم تحديد ${selectedKeys.length}` : 'تحديد الكل'}
                      </label>
                  </div>

                  {selectedKeys.length > 0 && (
                      <div className="flex items-center gap-2 animate-fade-in-up">
                          <button onClick={handleReturnSelected} disabled={saving} className="p-2 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg transition-colors" title="إرجاع المحدد">
                              <Undo2 className="w-5 h-5" />
                          </button>
                          <button onClick={handleDeleteSelected} disabled={saving} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors" title="حذف المحدد">
                              <Trash2 className="w-5 h-5" />
                          </button>
                      </div>
                  )}
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                  <div className="relative group">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10">
                        <Filter className="w-4 h-4" />
                      </div>
                      <select 
                          value={filters.productId} 
                          onChange={e => setFilters({...filters, productId: e.target.value})} 
                          className="appearance-none pl-4 pr-10 py-2.5 bg-black/80 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-all cursor-pointer hover:bg-white/5 min-w-[180px]"
                      >
                          <option value="all" className="bg-black text-white">كل المنتجات ({getDynamicProductCount('all')})</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id} className="bg-black text-white">
                                {p.title} ({getDynamicProductCount(p.id)})
                            </option>
                          ))}
                      </select>
                  </div>

                  <div className="relative group">
                      <select 
                          value={filters.status} 
                          onChange={e => setFilters({...filters, status: e.target.value})} 
                          className="appearance-none pl-4 pr-10 py-2.5 bg-black/80 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-all cursor-pointer hover:bg-white/5"
                      >
                          <option value="all" className="bg-black text-white">الكل ({getDynamicStatusCount('all')})</option>
                          <option value="available" className="bg-black text-white">متاح ({getDynamicStatusCount('available')})</option>
                          <option value="used" className="bg-black text-white">مستخدم ({getDynamicStatusCount('used')})</option>
                      </select>
                  </div>

                  <div className="relative flex-1 md:flex-none min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input 
                          type="text" 
                          placeholder="بحث..." 
                          value={keySearchTerm} 
                          onChange={e => setKeySearchTerm(e.target.value)} 
                          className="w-full pl-10 pr-4 py-2.5 bg-black/80 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-all placeholder-gray-500" 
                      />
                  </div>
              </div>
          </div>
      </div>

      <div className="flex flex-col gap-3">
          {filteredKeys.map(key => {
              const product = getProduct(key.product_id);
              const isRevealed = revealedKeys.has(key.id);

              return (
              <div 
                  key={key.id} 
                  className={`
                    group relative bg-white/5 backdrop-blur-sm border rounded-xl p-4 transition-all duration-300 flex items-center justify-between gap-4 overflow-hidden
                    ${selectedKeys.includes(key.id) ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)] bg-black' : 'border-white/10 hover:border-white/30 hover:bg-white/10'}
                  `}
              >
                  <div className="flex items-center gap-4 min-w-[250px]">
                      <ModernCheckbox 
                        checked={selectedKeys.includes(key.id)}
                        onChange={() => handleToggleKeySelection(key.id)}
                      />
                      
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-black border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {product?.image ? (
                                  <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                              ) : (
                                  <Package className="w-5 h-5 text-slate-500" />
                              )}
                          </div>
                          <div>
                              <h4 className="text-white font-bold text-sm truncate max-w-[150px]" title={product?.title}>
                                  {product?.title || 'منتج غير معروف'}
                              </h4>
                              <div className="text-xs text-gray-500 mt-0.5 font-mono flex flex-col gap-0.5">
                                  <span>{new Date(key.created_at).toLocaleDateString('en-GB')}</span>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="flex-1 flex justify-center">
                      <div className="bg-black/60 px-4 py-2 rounded-lg border border-white/10 flex items-center gap-3 group-hover:border-white/20 transition-colors max-w-md w-full justify-between">
                          <button onClick={() => toggleKeyReveal(key.id)} className="text-gray-500 hover:text-cyan-400 transition-colors p-1" title={isRevealed ? "إخفاء" : "إظهار"}>
                              {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <code className="text-cyan-100 font-mono text-base tracking-widest select-all" dir="ltr">
                              {isRevealed ? key.key_value : '••••••••••••••••••••••••'}
                          </code>
                          <button onClick={() => handleCopyKey(key.key_value)} className="text-gray-500 hover:text-white transition-colors" title="نسخ">
                              {copiedKey === key.key_value ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                      </div>
                  </div>

                  <div className="flex items-center gap-6 min-w-[200px] justify-end">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${key.is_used ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                          {key.is_used ? (
                              <>
                                  <ShieldAlert className="w-3 h-3" />
                                  <span>مستخدم</span>
                              </>
                          ) : (
                              <>
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>متاح</span>
                              </>
                          )}
                      </div>

                      {key.is_used && (
                          <div className="hidden xl:flex flex-col text-right text-[10px] text-gray-500">
                              <span className="text-gray-400 hover:text-white transition-colors cursor-pointer" title={key.used_by_email || ''}>
                                  {key.used_by_email ? key.used_by_email.split('@')[0] : 'Unknown'}
                              </span>
                              <span>{key.used_at ? new Date(key.used_at).toLocaleDateString('en-GB') : '-'}</span>
                          </div>
                      )}

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {key.is_used ? (
                              <button onClick={() => handleReturnKey(key.id)} className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors border border-transparent hover:border-yellow-500/20" title="إرجاع">
                                  <Undo2 className="w-4 h-4" />
                              </button>
                          ) : (
                              <button onClick={() => handleDeleteKey(key.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20" title="حذف">
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          )}
                      </div>
                  </div>
              </div>
          )})}
      </div>

      {filteredKeys.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 bg-white/5 rounded-3xl border border-white/10 border-dashed">
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <KeyRound className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">لا توجد مفاتيح</h3>
              <p className="text-gray-500 max-w-md text-center px-4">
                  {keySearchTerm ? 'لا توجد نتائج تطابق بحثك. حاول استخدام كلمات مفتاحية مختلفة.' : 'المخزون فارغ حالياً. قم بإضافة مفاتيح جديدة للبدء.'}
              </p>
              {keySearchTerm && (
                  <button onClick={() => setKeySearchTerm('')} className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                      مسح البحث
                  </button>
              )}
          </div>
      )}
    </div>
  );
};

export default ProductKeysManager;
