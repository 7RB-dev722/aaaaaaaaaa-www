import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Product, ProductKey } from '../lib/supabase';
import { 
    ArrowRightLeft, Calendar, Clock, Download, Filter, Search, TrendingUp, 
    AlertCircle, ArrowRight, User, X, History, ShoppingBag, Award, Zap, Eye 
} from 'lucide-react';

interface ProductMigrationTrackerProps {
    keys: ProductKey[];
    products: Product[];
}

interface MigrationEvent {
    email: string;
    fromProduct: Product | null;
    toProduct: Product | null;
    fromKey: ProductKey;
    toKey: ProductKey;
    timeDiffDays: number;
    switchDate: Date;
    isUpgrade: boolean;
    isCrossCategory: boolean;
}

const CustomerDetailsModal = ({ email, keys, products, onClose }: { email: string, keys: ProductKey[], products: Product[], onClose: () => void }) => {
    const stats = useMemo(() => {
        const userKeys = keys
            .filter(k => k.used_by_email === email && k.is_used && k.used_at)
            .sort((a, b) => new Date(b.used_at!).getTime() - new Date(a.used_at!).getTime());
        
        const productCounts = new Map<string, number>();
        const uniqueProductIds = new Set<string>();
        
        userKeys.forEach(k => {
            productCounts.set(k.product_id, (productCounts.get(k.product_id) || 0) + 1);
            uniqueProductIds.add(k.product_id);
        });

        let mostPurchasedId = null;
        let maxCount = 0;
        productCounts.forEach((count, id) => {
            if (count > maxCount) {
                maxCount = count;
                mostPurchasedId = id;
            }
        });

        const mostPurchased = mostPurchasedId ? products.find(p => p.id === mostPurchasedId) : null;
        const lastProduct = userKeys.length > 0 ? products.find(p => p.id === userKeys[0].product_id) : null;
        const uniqueProductsList = Array.from(uniqueProductIds)
            .map(id => products.find(p => p.id === id))
            .filter(Boolean) as Product[];

        const history = userKeys.map(k => ({
            key: k,
            product: products.find(p => p.id === k.product_id) || null,
            date: new Date(k.used_at!)
        }));

        return {
            total: userKeys.length,
            mostPurchased: mostPurchased ? { product: mostPurchased, count: maxCount } : null,
            lastProduct,
            uniqueProducts: uniqueProductsList,
            history
        };
    }, [email, keys, products]);

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0f1724] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-cyan-500/20 rounded-xl text-cyan-400">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">تحليل المشترك</h2>
                            <p className="text-sm text-gray-400 font-mono mt-1">{email}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Key Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                    <ShoppingBag className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold text-gray-400 uppercase">إجمالي المشتريات</span>
                            </div>
                            <div className="text-2xl font-bold text-white">{stats.total}</div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
                                    <Award className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold text-gray-400 uppercase">المنتج الأكثر شراءً</span>
                            </div>
                            {stats.mostPurchased ? (
                                <div>
                                    <div className="text-lg font-bold text-white truncate" title={stats.mostPurchased.product.title}>
                                        {stats.mostPurchased.product.title}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        تم الشراء {stats.mostPurchased.count} مرات
                                    </div>
                                </div>
                            ) : (
                                <span className="text-gray-500">-</span>
                            )}
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                                    <Zap className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold text-gray-400 uppercase">آخر منتج مستقر</span>
                            </div>
                            {stats.lastProduct ? (
                                <div className="text-lg font-bold text-white truncate" title={stats.lastProduct.title}>
                                    {stats.lastProduct.title}
                                </div>
                            ) : (
                                <span className="text-gray-500">-</span>
                            )}
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                    <History className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold text-gray-400 uppercase">المنتجات المجربة</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {stats.uniqueProducts.map(p => (
                                    <span key={p.id} className="text-[10px] px-2 py-1 bg-white/10 rounded-md text-gray-300 border border-white/5">
                                        {p.title}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Timeline History */}
                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-white/10 bg-black/20">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <History className="w-4 h-4 text-gray-400" />
                                سجل التحركات الكامل
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-black/50 text-xs font-bold text-gray-400 uppercase">
                                    <tr>
                                        <th className="p-4">التاريخ</th>
                                        <th className="p-4">المنتج</th>
                                        <th className="p-4">المفتاح</th>
                                        <th className="p-4">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {stats.history.map((item, idx) => {
                                        const prevItem = stats.history[idx + 1];
                                        const isSwitch = prevItem && prevItem.product?.id !== item.product?.id;
                                        
                                        return (
                                            <tr key={item.key.id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-mono text-gray-300">
                                                    {item.date.toLocaleDateString('en-GB')}
                                                    <span className="text-gray-600 text-xs ml-2">
                                                        {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="font-bold text-white">{item.product?.title || 'Unknown'}</span>
                                                </td>
                                                <td className="p-4 font-mono text-xs text-gray-500">
                                                    {item.key.key_value.substring(0, 8)}...
                                                </td>
                                                <td className="p-4">
                                                    {isSwitch ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                                            تغيير منتج
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                            تجديد
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const ProductMigrationTracker: React.FC<ProductMigrationTrackerProps> = ({ keys, products }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterProduct, setFilterProduct] = useState('all');
    const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

    const migrations = useMemo(() => {
        const emailGroups = new Map<string, ProductKey[]>();
        
        // Group used keys by email
        keys.filter(k => k.is_used && k.used_by_email && k.used_at).forEach(key => {
            const email = key.used_by_email!;
            const current = emailGroups.get(email) || [];
            current.push(key);
            emailGroups.set(email, current);
        });

        const events: MigrationEvent[] = [];

        emailGroups.forEach((userKeys, email) => {
            // Sort by date ascending
            const sorted = userKeys.sort((a, b) => new Date(a.used_at!).getTime() - new Date(b.used_at!).getTime());

            // Iterate through all keys to find ALL transitions
            for (let i = 1; i < sorted.length; i++) {
                const current = sorted[i];
                const previous = sorted[i - 1];

                // Check if product changed
                if (current.product_id !== previous.product_id) {
                    const fromProd = products.find(p => p.id === previous.product_id) || null;
                    const toProd = products.find(p => p.id === current.product_id) || null;
                    
                    const fromDate = new Date(previous.used_at!);
                    const toDate = new Date(current.used_at!);
                    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    events.push({
                        email,
                        fromProduct: fromProd,
                        toProduct: toProd,
                        fromKey: previous,
                        toKey: current,
                        timeDiffDays: diffDays,
                        switchDate: toDate,
                        isUpgrade: (toProd?.price || 0) > (fromProd?.price || 0),
                        isCrossCategory: (fromProd?.category !== toProd?.category)
                    });
                }
            }
        });

        // Sort events by date descending (newest switches first)
        return events.sort((a, b) => b.switchDate.getTime() - a.switchDate.getTime());
    }, [keys, products]);

    const filteredMigrations = useMemo(() => {
        return migrations.filter(event => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = 
                event.email.toLowerCase().includes(searchLower) ||
                event.fromProduct?.title.toLowerCase().includes(searchLower) ||
                event.toProduct?.title.toLowerCase().includes(searchLower);
            
            const matchesFilter = filterProduct === 'all' || 
                event.fromProduct?.id === filterProduct || 
                event.toProduct?.id === filterProduct;

            return matchesSearch && matchesFilter;
        });
    }, [migrations, searchTerm, filterProduct]);

    const stats = useMemo(() => {
        const totalSwitches = migrations.length;
        const avgDays = migrations.reduce((acc, curr) => acc + curr.timeDiffDays, 0) / (totalSwitches || 1);
        
        // Find most common path
        const paths = new Map<string, number>();
        migrations.forEach(m => {
            if (m.fromProduct && m.toProduct) {
                const key = `${m.fromProduct.title} -> ${m.toProduct.title}`;
                paths.set(key, (paths.get(key) || 0) + 1);
            }
        });
        
        const sortedPaths = Array.from(paths.entries()).sort((a, b) => b[1] - a[1]);
        const topPath = sortedPaths.length > 0 ? sortedPaths[0] : null;

        return { totalSwitches, avgDays, topPath };
    }, [migrations]);

    const handleExportCSV = () => {
        const headers = ['البريد الإلكتروني', 'المنتج السابق', 'تاريخ الشراء السابق', 'المنتج الحالي', 'تاريخ الشراء الحالي', 'الفترة (أيام)', 'نوع الانتقال'];
        const rows = filteredMigrations.map(m => [
            m.email,
            m.fromProduct?.title || 'Unknown',
            new Date(m.fromKey.used_at!).toLocaleDateString('en-GB'),
            m.toProduct?.title || 'Unknown',
            new Date(m.toKey.used_at!).toLocaleDateString('en-GB'),
            m.timeDiffDays,
            m.isCrossCategory ? 'تغيير قسم (Category Switch)' : (m.isUpgrade ? 'ترقية (Upgrade)' : 'تغيير (Switch)')
        ]);

        const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "migrations_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/20 rounded-xl text-cyan-400">
                        <ArrowRightLeft className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase">إجمالي التنقلات</p>
                        <h3 className="text-2xl font-bold text-white">{stats.totalSwitches}</h3>
                    </div>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase">متوسط فترة الانتقال</p>
                        <h3 className="text-2xl font-bold text-white">{stats.avgDays.toFixed(1)} <span className="text-sm font-normal text-gray-500">يوم</span></h3>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-gray-400 text-xs font-bold uppercase">المسار الأكثر شيوعاً</p>
                        {stats.topPath ? (
                            <div className="truncate text-sm font-bold text-white mt-1" title={stats.topPath[0]}>
                                {stats.topPath[0]}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm mt-1">-</p>
                        )}
                        {stats.topPath && <p className="text-[10px] text-green-400/70">{stats.topPath[1]} مستخدم</p>}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="relative flex-1 w-full md:w-auto">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="بحث بالبريد الإلكتروني أو اسم المنتج..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 bg-black border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative">
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select 
                            value={filterProduct}
                            onChange={(e) => setFilterProduct(e.target.value)}
                            className="appearance-none bg-black border border-white/10 rounded-xl px-10 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 min-w-[200px]"
                        >
                            <option value="all">كل المنتجات</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                    </div>

                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                    >
                        <Download className="w-4 h-4" />
                        تصدير Excel
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-black/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <tr>
                                <th className="p-4">المشترك</th>
                                <th className="p-4">المفتاح السابق (المنتج 1)</th>
                                <th className="p-4 text-center">
                                    <ArrowRight className="w-4 h-4 mx-auto" />
                                </th>
                                <th className="p-4">المفتاح الحالي (المنتج 2)</th>
                                <th className="p-4 text-center">الفترة الزمنية</th>
                                <th className="p-4 text-center">التصنيف والحالة</th>
                                <th className="p-4 text-center">تفاصيل</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredMigrations.map((event, idx) => {
                                const isRecent = (new Date().getTime() - event.switchDate.getTime()) < (24 * 60 * 60 * 1000); // 24h

                                return (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-black rounded-full border border-white/10">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                </div>
                                                <span className="font-medium text-white font-mono text-xs">{event.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-gray-300 font-bold">{event.fromProduct?.title || 'Unknown'}</span>
                                                <span className="text-[10px] text-gray-500 font-mono mt-0.5">
                                                    {new Date(event.fromKey.used_at!).toLocaleDateString('en-GB')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center">
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                                    <ArrowRight className="w-4 h-4 text-cyan-500" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-cyan-300 font-bold">{event.toProduct?.title || 'Unknown'}</span>
                                                <span className="text-[10px] text-gray-500 font-mono mt-0.5">
                                                    {new Date(event.toKey.used_at!).toLocaleDateString('en-GB')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/5 text-gray-300 border border-white/10">
                                                {event.timeDiffDays} يوم
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col gap-1 items-center">
                                                {event.isCrossCategory ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                        تغيير نوع
                                                    </span>
                                                ) : event.isUpgrade ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        ترقية
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                        تبديل
                                                    </span>
                                                )}
                                                
                                                {isRecent && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
                                                        <AlertCircle className="w-3 h-3" />
                                                        انتقال جديد
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => setSelectedEmail(event.email)}
                                                className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors group-hover:bg-cyan-500/20 group-hover:text-cyan-300"
                                                title="عرض تحليل المشترك"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredMigrations.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        لا توجد بيانات انتقال تطابق البحث.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {selectedEmail && (
                <CustomerDetailsModal 
                    email={selectedEmail} 
                    keys={keys} 
                    products={products} 
                    onClose={() => setSelectedEmail(null)} 
                />
            )}
        </div>
    );
};

export default ProductMigrationTracker;
