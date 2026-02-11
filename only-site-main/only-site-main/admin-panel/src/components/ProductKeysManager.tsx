import React, { useState, useMemo } from 'react';
import { Product, ProductKey, productKeysService } from '@/lib/supabase';
import { Plus, Trash2, Filter, Undo2, KeyRound, CheckCircle, XCircle, Copy, Search } from 'lucide-react';

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

  const handleAddKeys = async () => {
    if (!newKeysData.productId || !newKeysData.keys.trim()) {
      setError('Please select a product and enter at least one key.');
      return;
    }
    const keysArray = newKeysData.keys.split('\n').map(k => k.trim()).filter(Boolean);
    if (keysArray.length === 0) {
      setError('Please enter at least one valid key.');
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
      onKeysUpdate();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteKey = async (keyId: string) => {
    if (!window.confirm('Are you sure you want to delete this key? This action cannot be undone.')) return;
    setSaving(true);
    setError(null);
    try {
        await productKeysService.deleteKey(keyId);
        setSuccess('Key deleted successfully.');
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

  const handleCopyKey = (keyValue: string) => {
    navigator.clipboard.writeText(keyValue).then(() => {
      setCopiedKey(keyValue);
      setSuccess('تم نسخ المفتاح!');
      setTimeout(() => {
        setCopiedKey(null);
        setSuccess(null);
      }, 2000);
    }).catch(err => {
      console.warn("Clipboard API failed, falling back to execCommand.", err);
      const textArea = document.createElement("textarea");
      textArea.value = keyValue;
      textArea.style.position = "absolute";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopiedKey(keyValue);
          setSuccess('تم نسخ المفتاح!');
          setTimeout(() => {
            setCopiedKey(null);
            setSuccess(null);
          }, 2000);
        } else {
          throw new Error('Copy command was not successful');
        }
      } catch (fallbackErr) {
        console.error("Fallback copy method failed.", fallbackErr);
        setError('Failed to copy key to clipboard.');
        setTimeout(() => setError(null), 3000);
      }
      document.body.removeChild(textArea);
    });
  };

  const productStats = useMemo(() => {
    return products.map(product => {
        const productKeys = keys.filter(key => key.product_id === product.id);
        const total = productKeys.length;
        const used = productKeys.filter(key => key.is_used).length;
        const available = total - used;
        return {
            id: product.id,
            title: product.title,
            total,
            used,
            available
        };
    }).sort((a, b) => a.title.localeCompare(b.title));
  }, [products, keys]);

  const filteredKeys = useMemo(() => {
    return keys
      .filter(key => {
        const productMatch = filters.productId === 'all' || key.product_id === filters.productId;
        const statusMatch = filters.status === 'all' || (filters.status === 'used' ? key.is_used : !key.is_used);
        const searchMatch = !keySearchTerm || (key.used_by_email && key.used_by_email.toLowerCase().includes(keySearchTerm.toLowerCase()));
        return productMatch && statusMatch && searchMatch;
      })
      .sort((a, b) => {
        if (a.is_used !== b.is_used) {
            return a.is_used ? 1 : -1;
        }
        if (a.is_used) {
            return new Date(b.used_at!).getTime() - new Date(a.used_at!).getTime();
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [keys, filters, keySearchTerm]);

  const getProductName = (productId: string) => products.find(p => p.id === productId)?.title || 'Unknown Product';
  
  const maskKey = (key: string) => {
    if (key.length <= 8) return key;
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="space-y-8">
      {/* Add Keys Form */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-6">إضافة مفاتيح منتجات جديدة</h3>
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">المنتج *</label>
            <select value={newKeysData.productId} onChange={(e) => setNewKeysData({ ...newKeysData, productId: e.target.value })} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500">
              <option value="">اختر منتجًا</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">المفاتيح (كل مفتاح في سطر) *</label>
            <textarea value={newKeysData.keys} onChange={(e) => setNewKeysData({ ...newKeysData, keys: e.target.value })} rows={5} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500" placeholder="KEY-1234-ABCD..."></textarea>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={handleAddKeys} disabled={saving} className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl transition-all duration-300 disabled:opacity-50">
            <Plus className="w-5 h-5" />
            <span>{saving ? 'جاري الإضافة...' : 'إضافة المفاتيح'}</span>
          </button>
        </div>
      </div>

      {/* Product-wise Stats */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">إحصائيات المفاتيح حسب المنتج</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productStats.map(stat => (
            <div key={stat.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col">
              <h4 className="text-lg font-bold text-cyan-400 mb-4 truncate" title={stat.title}>{stat.title}</h4>
              <div className="space-y-3 flex-grow">
                <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm flex items-center gap-2"><KeyRound className="w-4 h-4"/> إجمالي المفاتيح</span>
                    <span className="font-bold text-white text-lg">{stat.total}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-green-400 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4"/> المفاتيح المتاحة</span>
                    <span className="font-bold text-green-400 text-lg">{stat.available}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-red-400 text-sm flex items-center gap-2"><XCircle className="w-4 h-4"/> المفاتيح المستخدمة</span>
                    <span className="font-bold text-red-400 text-lg">{stat.used}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Keys Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700">
        <div className="p-4 border-b border-slate-700 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-white">إدارة مفاتيح المنتجات ({filteredKeys.length})</h3>
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select value={filters.productId} onChange={e => setFilters({...filters, productId: e.target.value})} className="p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500">
                        <option value="all">كل المنتجات</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                    <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500">
                        <option value="all">كل الحالات</option>
                        <option value="available">متاح</option>
                        <option value="used">مستخدم</option>
                    </select>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="ابحث بالإيميل..."
                        value={keySearchTerm}
                        onChange={e => setKeySearchTerm(e.target.value)}
                        className="p-2 pl-9 rtl:pr-9 rtl:pl-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                </div>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="p-3 text-left font-medium text-gray-300">المفتاح</th>
                <th className="p-3 text-left font-medium text-gray-300">المنتج</th>
                <th className="p-3 text-left font-medium text-gray-300">الحالة</th>
                <th className="p-3 text-left font-medium text-gray-300">مستخدم بواسطة</th>
                <th className="p-3 text-left font-medium text-gray-300">تاريخ الاستخدام</th>
                <th className="p-3 text-left font-medium text-gray-300">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredKeys.map(key => (
                <tr key={key.id} className={`border-b border-slate-700 hover:bg-slate-700/30 transition-colors ${key.is_used ? 'bg-red-900/10' : ''}`}>
                  <td className="p-3 text-gray-300 font-mono">
                    <div className="flex items-center gap-2">
                      <span title={key.key_value}>{maskKey(key.key_value)}</span>
                      <button onClick={() => handleCopyKey(key.key_value)} className="text-gray-500 hover:text-white transition-colors">
                        {copiedKey === key.key_value ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-white">{getProductName(key.product_id)}</td>
                  <td className="p-3">
                    {key.is_used ? <span className="px-2 py-1 text-xs font-medium text-red-300 bg-red-500/20 rounded-full">مستخدم</span> : <span className="px-2 py-1 text-xs font-medium text-green-300 bg-green-500/20 rounded-full">متاح</span>}
                  </td>
                  <td className="p-3 text-gray-400">{key.used_by_email || 'N/A'}</td>
                  <td className="p-3 text-gray-400">{key.used_at ? new Date(key.used_at).toLocaleString() : 'N/A'}</td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      {key.is_used ? (
                        <button onClick={() => handleReturnKey(key.id)} disabled={saving} className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors disabled:opacity-50" title="إرجاع المفتاح">
                          <Undo2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => handleDeleteKey(key.id)} disabled={saving} className="p-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50" title="حذف المفتاح">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredKeys.length === 0 && <p className="text-center text-gray-500 py-8">{keySearchTerm ? 'لا توجد نتائج تطابق بحثك.' : 'لا توجد مفاتيح تطابق الفلاتر الحالية.'}</p>}
        </div>
      </div>
    </div>
  );
};

export default ProductKeysManager;
