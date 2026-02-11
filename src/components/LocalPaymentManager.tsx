import React, { useState, useEffect } from 'react';
import { localPaymentService, productService, LocalPaymentMethod, Product, supabase } from '../lib/supabase';
import { countries } from '../data/countries';
import { Plus, Trash2, Edit, Save, X, CreditCard, Wallet, Globe, Check, AlertCircle, Package, Calculator, Upload } from 'lucide-react';

const LocalPaymentManager: React.FC = () => {
    const [methods, setMethods] = useState<LocalPaymentMethod[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [currentMethod, setCurrentMethod] = useState<Partial<LocalPaymentMethod>>({
        country: '',
        method_name: '',
        is_crypto: false,
        is_active: true,
        product_prices: {}
    });

    // Exchange Rate Calculator State
    const [exchangeRate, setExchangeRate] = useState<string>('');
    const [currencySymbol, setCurrencySymbol] = useState<string>('');

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        setUploadingImage(true);
        setError(null);

        try {
            if (!supabase) throw new Error('Supabase not configured');

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `payment-methods/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('purchase-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('purchase-images')
                .getPublicUrl(filePath);

            setCurrentMethod(prev => ({ ...prev, image_url: publicUrl }));
            setSuccess('تم رفع الصورة بنجاح');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            console.error('Upload error:', err);
            setError('فشل في رفع الصورة: ' + err.message);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleApplyExchangeRate = () => {
        if (!exchangeRate || isNaN(parseFloat(exchangeRate)) || !currencySymbol) return;

        const rate = parseFloat(exchangeRate);
        const newPrices = { ...currentMethod.product_prices };
        
        products.forEach(product => {
            const calculatedPrice = Math.ceil(product.price * rate);
            newPrices[product.id] = `${calculatedPrice} ${currencySymbol}`;
        });

        setCurrentMethod(prev => ({
            ...prev,
            product_prices: newPrices
        }));
        
        setSuccess('تم تحديث أسعار جميع المنتجات بناءً على سعر الصرف');
        setTimeout(() => setSuccess(null), 3000);
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [methodsData, productsData] = await Promise.all([
                localPaymentService.getAll(),
                productService.getAllProducts()
            ]);
            setMethods(methodsData);
            setProducts(productsData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!currentMethod.country || !currentMethod.method_name) {
            setError('Country and Method Name are required.');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            // Ensure product_prices is set
            const methodToSave = {
                ...currentMethod,
                product_prices: currentMethod.product_prices || {}
            };

            if (currentMethod.id) {
                await localPaymentService.updateMethod(currentMethod.id, methodToSave);
                setSuccess('Payment method updated successfully.');
            } else {
                await localPaymentService.addMethod(methodToSave as Omit<LocalPaymentMethod, 'id' | 'created_at'>);
                setSuccess('Payment method added successfully.');
            }
            loadData();
            setIsEditing(false);
            resetForm();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this payment method?')) return;
        setSaving(true);
        try {
            await localPaymentService.deleteMethod(id);
            setSuccess('Payment method deleted.');
            loadData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setCurrentMethod({
            country: '',
            method_name: '',
            is_crypto: false,
            is_active: true,
            product_prices: {}
        });
        setExchangeRate('');
        setCurrencySymbol('');
    };

    const handleProductPriceChange = (productId: string, price: string) => {
        setCurrentMethod(prev => ({
            ...prev,
            product_prices: {
                ...prev.product_prices,
                [productId]: price
            }
        }));
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Globe className="w-6 h-6 text-green-400" />
                        <span>طرق الدفع المحلية</span>
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">إدارة خيارات الدفع والأسعار المخصصة لكل دولة</p>
                </div>
                <button 
                    onClick={() => { setIsEditing(true); resetForm(); }} 
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span>إضافة طريقة دفع</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}
            {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3 text-green-400">
                    <Check className="w-5 h-5" />
                    <span>{success}</span>
                </div>
            )}

            {isEditing && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                        <h3 className="text-lg font-bold text-white">{currentMethod.id ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع جديدة'}</h3>
                        <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">الدولة</label>
                            <select 
                                value={currentMethod.country} 
                                onChange={(e) => setCurrentMethod({...currentMethod, country: e.target.value})}
                                className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-green-500 focus:outline-none"
                            >
                                <option value="">اختر الدولة</option>
                                {countries.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2">اسم الطريقة</label>
                            <input 
                                type="text" 
                                value={currentMethod.method_name} 
                                onChange={(e) => setCurrentMethod({...currentMethod, method_name: e.target.value})}
                                placeholder="مثال: زين كاش، تحويل بنكي"
                                className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-green-500 focus:outline-none"
                            />
                        </div>

                        {/* Image Upload */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-400 mb-2">صورة طريقة الدفع (اختياري)</label>
                            <div className="flex items-center gap-4">
                                {currentMethod.image_url && (
                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                                        <img src={currentMethod.image_url} alt="Payment Method" className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => setCurrentMethod({...currentMethod, image_url: undefined})}
                                            className="absolute top-0 right-0 bg-red-500/80 p-1 text-white hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                <label className={`flex items-center gap-2 px-4 py-3 bg-black border border-white/10 rounded-xl cursor-pointer hover:border-green-500 transition-all ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <Upload className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm text-gray-300">{uploadingImage ? 'جاري الرفع...' : 'رفع صورة'}</span>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                        
                        <div className="md:col-span-2 flex items-center gap-4 bg-black/30 p-4 rounded-xl border border-white/5">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={currentMethod.is_crypto} 
                                    onChange={(e) => setCurrentMethod({...currentMethod, is_crypto: e.target.checked})}
                                    className="w-4 h-4 rounded border-gray-600 text-green-600 focus:ring-green-500 bg-gray-700"
                                />
                                <span className="text-white font-bold text-sm">طريقة دفع كريبتو (Crypto)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer ml-6">
                                <input 
                                    type="checkbox" 
                                    checked={currentMethod.is_active} 
                                    onChange={(e) => setCurrentMethod({...currentMethod, is_active: e.target.checked})}
                                    className="w-4 h-4 rounded border-gray-600 text-green-600 focus:ring-green-500 bg-gray-700"
                                />
                                <span className="text-white font-bold text-sm">نشط</span>
                            </label>
                        </div>

                        {/* Account Details */}
                        {currentMethod.is_crypto ? (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2">الشبكة (Network)</label>
                                    <input 
                                        type="text" 
                                        value={currentMethod.crypto_network || ''} 
                                        onChange={(e) => setCurrentMethod({...currentMethod, crypto_network: e.target.value})}
                                        placeholder="TRC20, ERC20"
                                        className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-green-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2">عنوان المحفظة (Wallet Address)</label>
                                    <input 
                                        type="text" 
                                        value={currentMethod.account_number || ''} 
                                        onChange={(e) => setCurrentMethod({...currentMethod, account_number: e.target.value})}
                                        className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-green-500 focus:outline-none font-mono"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2">اسم صاحب الحساب</label>
                                    <input 
                                        type="text" 
                                        value={currentMethod.account_holder || ''} 
                                        onChange={(e) => setCurrentMethod({...currentMethod, account_holder: e.target.value})}
                                        className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-green-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2">رقم الحساب / البطاقة</label>
                                    <input 
                                        type="text" 
                                        value={currentMethod.account_number || ''} 
                                        onChange={(e) => setCurrentMethod({...currentMethod, account_number: e.target.value})}
                                        className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-green-500 focus:outline-none font-mono"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-400 mb-2">IBAN (اختياري)</label>
                                    <input 
                                        type="text" 
                                        value={currentMethod.iban || ''} 
                                        onChange={(e) => setCurrentMethod({...currentMethod, iban: e.target.value})}
                                        className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-green-500 focus:outline-none font-mono"
                                    />
                                </div>
                            </>
                        )}

                        {/* General Custom Price */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-400 mb-2">سعر مخصص عام (نصي)</label>
                            <input 
                                type="text" 
                                value={currentMethod.custom_price || ''} 
                                onChange={(e) => setCurrentMethod({...currentMethod, custom_price: e.target.value})}
                                placeholder="مثال: 1500 IQD لكل دولار (يظهر إذا لم يتم تحديد سعر للمنتج)"
                                className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:border-green-500 focus:outline-none"
                            />
                        </div>

                        {/* Exchange Rate Calculator */}
                        <div className="md:col-span-2 border-t border-white/10 pt-6 mt-2">
                             <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-green-400" />
                                حاسبة سعر الصرف (تطبيق تلقائي)
                            </h4>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-wrap gap-4 items-end">
                                <div className="flex-1 min-w-[150px]">
                                    <label className="block text-xs font-bold text-gray-400 mb-2">سعر صرف الدولار (مثال: 1500)</label>
                                    <input 
                                        type="number" 
                                        value={exchangeRate}
                                        onChange={(e) => setExchangeRate(e.target.value)}
                                        placeholder="1500"
                                        className="w-full p-2.5 bg-black border border-white/10 rounded-lg text-white text-sm focus:border-green-500 focus:outline-none"
                                    />
                                </div>
                                <div className="flex-1 min-w-[150px]">
                                    <label className="block text-xs font-bold text-gray-400 mb-2">رمز العملة (مثال: IQD)</label>
                                    <input 
                                        type="text" 
                                        value={currencySymbol}
                                        onChange={(e) => setCurrencySymbol(e.target.value)}
                                        placeholder="IQD"
                                        className="w-full p-2.5 bg-black border border-white/10 rounded-lg text-white text-sm focus:border-green-500 focus:outline-none"
                                    />
                                </div>
                                <button 
                                    onClick={handleApplyExchangeRate}
                                    type="button"
                                    disabled={!exchangeRate || !currencySymbol}
                                    className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[42px]"
                                >
                                    تطبيق السعر
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                * سيقوم هذا بحساب الأسعار تلقائياً لجميع المنتجات بناءً على سعر الصرف المدخل (السعر بالدولار × سعر الصرف).
                            </p>
                        </div>

                        {/* Product Specific Prices */}
                        <div className="md:col-span-2 border-t border-white/10 pt-6 mt-2">
                            <h4 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                                <Package className="w-4 h-4 text-green-400" />
                                أسعار المنتجات المخصصة (مع العملة)
                            </h4>
                            <p className="text-xs text-gray-500 mb-4">أدخل السعر النهائي مع العملة لكل منتج (مثال: 25000 IQD). اترك الحقل فارغاً لاستخدام السعر العام أو التلقائي.</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar bg-black/20 p-4 rounded-xl border border-white/5">
                                {products.map(product => (
                                    <div key={product.id} className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-300 truncate" title={product.title}>{product.title}</label>
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                placeholder={`Default: $${product.price}`}
                                                value={currentMethod.product_prices?.[product.id] || ''}
                                                onChange={(e) => handleProductPriceChange(product.id, e.target.value)}
                                                className="w-full p-2.5 bg-black border border-white/10 rounded-lg text-white text-sm focus:border-green-500 focus:outline-none placeholder-gray-600"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                        <button onClick={() => setIsEditing(false)} className="px-6 py-2 bg-black hover:bg-white/10 text-white rounded-xl font-bold transition-colors">إلغاء</button>
                        <button onClick={handleSave} disabled={saving} className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50">
                            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {methods.map(method => (
                    <div key={method.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-green-500/30 transition-all group relative">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden ${method.is_crypto ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {method.image_url ? (
                                        <img src={method.image_url} alt={method.method_name} className="w-full h-full object-cover" />
                                    ) : (
                                        method.is_crypto ? <Wallet className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{method.method_name}</h4>
                                    <span className="text-xs text-gray-400 bg-black px-2 py-0.5 rounded border border-white/10">{method.country}</span>
                                </div>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${method.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-400 mt-4 bg-black/30 p-3 rounded-lg">
                            {method.is_crypto ? (
                                <>
                                    <div className="flex justify-between"><span>Network:</span> <span className="text-white">{method.crypto_network}</span></div>
                                    <div className="flex flex-col">
                                        <span className="text-xs mb-1">Address:</span> 
                                        <span className="text-white font-mono text-xs break-all">{method.account_number}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {method.account_holder && <div className="flex justify-between"><span>Holder:</span> <span className="text-white">{method.account_holder}</span></div>}
                                    <div className="flex justify-between"><span>Number:</span> <span className="text-white font-mono">{method.account_number}</span></div>
                                </>
                            )}
                            
                            {/* Price Indicator */}
                            <div className="pt-2 border-t border-white/5 mt-2">
                                <span className="text-xs text-gray-500">التسعير: </span>
                                {Object.keys(method.product_prices || {}).length > 0 ? (
                                    <span className="text-green-400 text-xs">{Object.keys(method.product_prices || {}).length} منتج مخصص</span>
                                ) : (
                                    <span className="text-gray-400 text-xs">{method.custom_price || 'تلقائي (USD)'}</span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setCurrentMethod(method); setIsEditing(true); }} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(method.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LocalPaymentManager;
