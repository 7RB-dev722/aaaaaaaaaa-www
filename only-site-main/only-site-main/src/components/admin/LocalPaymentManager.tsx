import React, { useState, useEffect } from 'react';
import { localPaymentService, LocalPaymentMethod, productService, Product } from '@/lib/supabase';
import { Plus, Edit, Trash2, CheckCircle, AlertCircle, Globe, DollarSign, X, Bitcoin, Wallet, CreditCard, Coins } from 'lucide-react';

const SUPPORTED_COUNTRIES = ['Global', 'Iraq', 'Turkey', 'Jordan', 'Egypt', 'Saudi Arabia', 'Kuwait', 'UAE', 'Qatar', 'Oman', 'Bahrain'];

const COUNTRY_CURRENCIES: Record<string, string> = {
  'Iraq': 'IQD',
  'Turkey': 'TRY',
  'Jordan': 'JOD',
  'Egypt': 'EGP',
  'Saudi Arabia': 'SAR',
  'Kuwait': 'KWD',
  'UAE': 'AED',
  'Qatar': 'QAR',
  'Oman': 'OMR',
  'Bahrain': 'BHD',
  'Global': 'USD'
};

type PaymentType = 'fiat' | 'crypto' | 'binance';

const LocalPaymentManager: React.FC = () => {
  const [methods, setMethods] = useState<LocalPaymentMethod[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // UI State for form control
  const [paymentType, setPaymentType] = useState<PaymentType>('fiat');

  const [currentMethod, setCurrentMethod] = useState<Partial<LocalPaymentMethod>>({
    country: 'Iraq',
    method_name: '',
    account_holder: '',
    account_number: '',
    iban: '',
    custom_price: '',
    currency_symbol: 'IQD',
    product_prices: {},
    is_active: true,
    is_crypto: false,
    crypto_network: ''
  });

  // State for adding a new product price override
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productPriceOverride, setProductPriceOverride] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [methodsData, productsData] = await Promise.all([
        localPaymentService.getAll(),
        productService.getAllProducts()
      ]);
      setMethods(methodsData);
      // Sort products alphabetically for easier selection
      setProducts(productsData.sort((a, b) => a.title.localeCompare(b.title)));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMethod.country || !currentMethod.method_name) {
      setError('Country and Method Name are required.');
      return;
    }

    try {
      // Ensure flags are set correctly based on type
      const methodToSave = { ...currentMethod };
      if (paymentType === 'binance') {
          methodToSave.is_crypto = true;
          methodToSave.country = 'Global';
          if (!methodToSave.method_name?.toLowerCase().includes('binance')) {
             methodToSave.method_name = 'Binance Pay'; 
          }
      } else if (paymentType === 'crypto') {
          methodToSave.is_crypto = true;
      } else {
          methodToSave.is_crypto = false;
          methodToSave.crypto_network = '';
      }

      if (methodToSave.id) {
        await localPaymentService.updateMethod(methodToSave.id, methodToSave);
        setSuccess('Method updated successfully.');
      } else {
        await localPaymentService.addMethod(methodToSave as Omit<LocalPaymentMethod, 'id' | 'created_at'>);
        setSuccess('Method added successfully.');
      }
      setIsEditing(false);
      resetForm();
      loadData(); // Reload to get fresh data
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    try {
      await localPaymentService.deleteMethod(id);
      setSuccess('Method deleted successfully.');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (method: LocalPaymentMethod) => {
    setCurrentMethod({
        ...method,
        product_prices: method.product_prices || {},
        is_crypto: method.is_crypto || false,
        crypto_network: method.crypto_network || '',
        currency_symbol: method.currency_symbol || COUNTRY_CURRENCIES[method.country] || ''
    });
    
    // Determine type for UI
    if (method.is_crypto) {
        if (method.method_name.toLowerCase().includes('binance') || method.crypto_network?.toLowerCase().includes('binance')) {
            setPaymentType('binance');
        } else {
            setPaymentType('crypto');
        }
    } else {
        setPaymentType('fiat');
    }
    
    setIsEditing(true);
  };

  const resetForm = () => {
    setCurrentMethod({
      country: 'Iraq',
      method_name: '',
      account_holder: '',
      account_number: '',
      iban: '',
      custom_price: '',
      currency_symbol: 'IQD',
      product_prices: {},
      is_active: true,
      is_crypto: false,
      crypto_network: ''
    });
    setPaymentType('fiat');
    setSelectedProductId('');
    setProductPriceOverride('');
  };

  const handleCountryChange = (country: string) => {
      setCurrentMethod({
          ...currentMethod,
          country,
          currency_symbol: COUNTRY_CURRENCIES[country] || ''
      });
  };

  const handleAddPriceOverride = () => {
    if (!selectedProductId || !productPriceOverride) return;
    
    setCurrentMethod(prev => ({
        ...prev,
        product_prices: {
            ...prev.product_prices,
            [selectedProductId]: productPriceOverride
        }
    }));
    
    setSelectedProductId('');
    setProductPriceOverride('');
  };

  const handleRemovePriceOverride = (productId: string) => {
    const newPrices = { ...currentMethod.product_prices };
    delete newPrices[productId];
    setCurrentMethod(prev => ({
        ...prev,
        product_prices: newPrices
    }));
  };

  const handlePaymentTypeChange = (type: PaymentType) => {
      setPaymentType(type);
      if (type === 'binance') {
          setCurrentMethod(prev => ({
              ...prev,
              is_crypto: true,
              country: 'Global',
              method_name: 'Binance Pay',
              crypto_network: 'Binance ID',
              currency_symbol: 'USDT'
          }));
      } else if (type === 'crypto') {
          setCurrentMethod(prev => ({
              ...prev,
              is_crypto: true,
              country: 'Global', // Default to global for crypto, but allow change
              method_name: 'USDT',
              crypto_network: 'TRC20',
              currency_symbol: 'USDT'
          }));
      } else {
          setCurrentMethod(prev => ({
              ...prev,
              is_crypto: false,
              country: 'Iraq',
              method_name: '',
              crypto_network: '',
              currency_symbol: 'IQD'
          }));
      }
  };

  const getProductName = (id: string) => products.find(p => p.id === id)?.title || 'Unknown Product';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Globe className="w-6 h-6 text-cyan-400" />
          Local & Crypto Payment Methods
        </h2>
        <button 
          onClick={() => { resetForm(); setIsEditing(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2 rounded-xl transition-all"
        >
          <Plus className="w-5 h-5" /> Add Method
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 flex items-center gap-2"><AlertCircle className="w-5 h-5"/>{error}</div>}
      {success && <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-green-400 flex items-center gap-2"><CheckCircle className="w-5 h-5"/>{success}</div>}

      {isEditing && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 animate-fade-in-up">
          <h3 className="text-lg font-bold text-white mb-6">{currentMethod.id ? 'Edit Method' : 'Add New Method'}</h3>
          
          {/* Payment Type Selector */}
          <div className="grid grid-cols-3 gap-4 mb-8">
              <button
                type="button"
                onClick={() => handlePaymentTypeChange('fiat')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${paymentType === 'fiat' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-700/30 border-slate-600 text-gray-400 hover:bg-slate-700'}`}
              >
                  <CreditCard className="w-6 h-6 mb-2" />
                  <span className="font-bold text-sm">Local / Fiat</span>
              </button>
              <button
                type="button"
                onClick={() => handlePaymentTypeChange('crypto')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${paymentType === 'crypto' ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-slate-700/30 border-slate-600 text-gray-400 hover:bg-slate-700'}`}
              >
                  <Bitcoin className="w-6 h-6 mb-2" />
                  <span className="font-bold text-sm">Crypto Wallet</span>
              </button>
              <button
                type="button"
                onClick={() => handlePaymentTypeChange('binance')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${paymentType === 'binance' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-slate-700/30 border-slate-600 text-gray-400 hover:bg-slate-700'}`}
              >
                  <Wallet className="w-6 h-6 mb-2" />
                  <span className="font-bold text-sm">Binance Pay</span>
              </button>
          </div>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
            
            {/* Country Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
              <select 
                value={currentMethod.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                disabled={paymentType === 'binance'} // Binance is always Global
                className={`w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 ${paymentType === 'binance' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {SUPPORTED_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {paymentType === 'binance' && <p className="text-xs text-yellow-500 mt-1">Binance Pay is available globally.</p>}
            </div>

            {/* Method Name / Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                  {paymentType === 'fiat' ? 'Method Name' : 'Currency Symbol'}
              </label>
              <input 
                type="text" 
                value={currentMethod.method_name}
                onChange={(e) => setCurrentMethod({...currentMethod, method_name: e.target.value})}
                placeholder={paymentType === 'fiat' ? "e.g. Zain Cash, Asia Hawala" : "e.g. USDT, BTC"}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Conditional Fields based on Type */}
            {paymentType === 'fiat' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Account Holder Name</label>
                        <input 
                            type="text" 
                            value={currentMethod.account_holder || ''}
                            onChange={(e) => setCurrentMethod({...currentMethod, account_holder: e.target.value})}
                            placeholder="e.g. Abdulawatban"
                            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Account Number / Card</label>
                        <input 
                            type="text" 
                            value={currentMethod.account_number || ''}
                            onChange={(e) => setCurrentMethod({...currentMethod, account_number: e.target.value})}
                            placeholder="e.g. 3923864171"
                            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">IBAN (Optional)</label>
                        <input 
                            type="text" 
                            value={currentMethod.iban || ''}
                            onChange={(e) => setCurrentMethod({...currentMethod, iban: e.target.value})}
                            placeholder="IBAN..."
                            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                </>
            )}

            {paymentType === 'crypto' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Network Type</label>
                        <input 
                            type="text" 
                            value={currentMethod.crypto_network || ''}
                            onChange={(e) => setCurrentMethod({...currentMethod, crypto_network: e.target.value})}
                            placeholder="e.g. TRC20, ERC20"
                            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Wallet Address</label>
                        <input 
                            type="text" 
                            value={currentMethod.account_number || ''}
                            onChange={(e) => setCurrentMethod({...currentMethod, account_number: e.target.value})}
                            placeholder="Wallet Address..."
                            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
                        />
                    </div>
                </>
            )}

            {paymentType === 'binance' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Binance ID / Pay ID</label>
                        <input 
                            type="text" 
                            value={currentMethod.account_number || ''}
                            onChange={(e) => setCurrentMethod({...currentMethod, account_number: e.target.value})}
                            placeholder="e.g. 123456789"
                            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Network / Note (Optional)</label>
                        <input 
                            type="text" 
                            value={currentMethod.crypto_network || ''}
                            onChange={(e) => setCurrentMethod({...currentMethod, crypto_network: e.target.value})}
                            placeholder="e.g. Binance Pay"
                            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                </>
            )}

            <div className="md:col-span-2 grid md:grid-cols-2 gap-6 bg-slate-700/30 p-4 rounded-xl border border-slate-600">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        {paymentType === 'fiat' ? 'Default Price / Instruction' : 'Default Amount'}
                    </label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={currentMethod.custom_price || ''}
                            onChange={(e) => setCurrentMethod({...currentMethod, custom_price: e.target.value})}
                            placeholder={paymentType === 'fiat' ? "e.g. 50,000" : "50"}
                            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                        />
                        <div className="bg-slate-700 border border-slate-600 rounded-xl px-4 flex items-center text-gray-400 font-bold min-w-[60px] justify-center">
                            {currentMethod.currency_symbol || '-'}
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Currency Symbol
                    </label>
                    <div className="relative">
                        <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                            type="text" 
                            value={currentMethod.currency_symbol || ''}
                            onChange={(e) => setCurrentMethod({...currentMethod, currency_symbol: e.target.value})}
                            placeholder="e.g. IQD, USD, TRY"
                            className="w-full p-3 pl-10 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-bold"
                        />
                    </div>
                </div>
            </div>

            {/* Product Specific Prices Section */}
            <div className="md:col-span-2 bg-slate-700/30 p-6 rounded-xl border border-slate-600">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    Set Price Per Product
                </h4>
                <p className="text-sm text-gray-400 mb-4">Specify a different price for each product if needed. If not set, the default price above will be used.</p>
                
                <div className="flex flex-col md:flex-row gap-3 mb-6 p-4 bg-slate-800 rounded-xl border border-slate-700">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Select Product</label>
                        <select 
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500/50"
                        >
                            <option value="">-- Choose Product --</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.title} (Base: ${p.price})</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Price for this product</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={productPriceOverride}
                                onChange={(e) => setProductPriceOverride(e.target.value)}
                                placeholder={paymentType === 'fiat' ? "e.g. 25,000" : "e.g. 40"}
                                className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500/50"
                            />
                            <div className="bg-slate-700 border border-slate-600 rounded-lg px-3 flex items-center text-gray-400 text-sm font-bold">
                                {currentMethod.currency_symbol || '-'}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-end">
                        <button 
                            type="button"
                            onClick={handleAddPriceOverride}
                            disabled={!selectedProductId || !productPriceOverride}
                            className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add Price
                        </button>
                    </div>
                </div>

                {/* List of overrides */}
                <div className="space-y-2">
                    {Object.entries(currentMethod.product_prices || {}).map(([productId, price]) => (
                        <div key={productId} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-gray-400">
                                    {getProductName(productId).charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-white">{getProductName(productId)}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-cyan-400 bg-cyan-950/30 px-3 py-1 rounded-full border border-cyan-500/20">
                                    {price} {currentMethod.currency_symbol}
                                </span>
                                <button 
                                    type="button" 
                                    onClick={() => handleRemovePriceOverride(productId)}
                                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Remove price"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {Object.keys(currentMethod.product_prices || {}).length === 0 && (
                        <div className="text-center py-6 border-2 border-dashed border-slate-700 rounded-xl">
                            <p className="text-sm text-gray-500">No specific prices set yet.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={currentMethod.is_active}
                onChange={(e) => setCurrentMethod({...currentMethod, is_active: e.target.checked})}
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-cyan-600 focus:ring-cyan-500"
              />
              <label className="text-gray-300 font-medium">Method Active</label>
            </div>
            
            <div className="md:col-span-2 flex justify-end gap-4 pt-4 border-t border-slate-700">
              <button 
                type="button" 
                onClick={() => setIsEditing(false)}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-8 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl transition-colors font-bold shadow-lg shadow-cyan-900/20"
              >
                Save Method
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-slate-700/50 text-gray-200 font-medium">
            <tr>
              <th className="p-4">Type</th>
              <th className="p-4">Country</th>
              <th className="p-4">Method/Currency</th>
              <th className="p-4">Details</th>
              <th className="p-4">Price</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {methods.map(method => {
                const isBinance = method.method_name.toLowerCase().includes('binance') || method.crypto_network?.toLowerCase().includes('binance');
                return (
                  <tr key={method.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4">
                        {isBinance ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-yellow-500/20">
                                <Wallet className="w-3 h-3" /> Binance
                            </span>
                        ) : method.is_crypto ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold border border-purple-500/20">
                                <Bitcoin className="w-3 h-3" /> Crypto
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/20">
                                <CreditCard className="w-3 h-3" /> Fiat
                            </span>
                        )}
                    </td>
                    <td className="p-4 text-white font-medium">{method.country}</td>
                    <td className="p-4">
                        <span className="text-white">{method.method_name}</span>
                        {method.crypto_network && <span className="block text-xs text-gray-500 mt-0.5">{method.crypto_network}</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col max-w-[200px]">
                        {method.is_crypto ? (
                            <span className="truncate font-mono text-xs bg-slate-900 px-2 py-1 rounded text-gray-300" title={method.account_number}>
                                {method.account_number?.substring(0, 12)}...
                            </span>
                        ) : (
                            <>
                                {method.account_holder && <span className="truncate text-xs">Holder: {method.account_holder}</span>}
                                {method.account_number && <span className="truncate text-xs">No: {method.account_number}</span>}
                            </>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                        <div className="flex flex-col">
                            <span className="text-cyan-400 font-medium">
                                {method.custom_price || 'Default'} {method.currency_symbol}
                            </span>
                            {method.product_prices && Object.keys(method.product_prices).length > 0 && (
                                <span className="text-xs text-gray-500 mt-0.5">{Object.keys(method.product_prices).length} custom prices</span>
                            )}
                        </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${method.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {method.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(method)} className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(method.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
            })}
            {methods.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-gray-500">
                    <Globe className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No payment methods found. Add one to get started.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LocalPaymentManager;
