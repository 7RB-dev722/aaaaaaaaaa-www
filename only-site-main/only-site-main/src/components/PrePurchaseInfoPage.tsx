import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService, purchaseIntentsService, Product, localPaymentService, LocalPaymentMethod } from '../lib/supabase';
import { AnimatedBackground } from './AnimatedBackground';
import { AlertTriangle, ArrowRight, Home, Mail, Phone, RefreshCw, Info, Globe, Lock, CreditCard, Bitcoin, Wallet, ChevronLeft, Building2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { countries } from '../data/countries';
import SearchableSelect from './SearchableSelect';
import { cn } from '@/lib/utils';

type Lang = 'en' | 'ar' | 'tr';

const PrePurchaseInfoPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    
    const { lang, setLang, t } = useLanguage();

    // Wizard State
    const [step, setStep] = useState(1);

    const [country, setCountry] = useState('');
    const [countryCode, setCountryCode] = useState('');
    const [email, setEmail] = useState('');
    const [localPhone, setLocalPhone] = useState('');
    const [errors, setErrors] = useState<{ country?: string, email?: string; phone?: string; general?: string }>({});
    
    const [localMethods, setLocalMethods] = useState<LocalPaymentMethod[]>([]);
    const [cryptoMethods, setCryptoMethods] = useState<LocalPaymentMethod[]>([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

    useEffect(() => {
        const fetchProduct = async () => {
            if (!productId) {
                setFetchError(t.error);
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const productData = await productService.getProductById(productId);
                setProduct(productData);
                
                // Fetch all active crypto methods initially since they are global
                const allMethods = await localPaymentService.getAll();
                const crypto = allMethods.filter(m => m.is_active && m.is_crypto);
                setCryptoMethods(crypto);

            } catch (err: any) {
                setFetchError(t.error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [productId, t.error]);

    const handleCountryChange = async (selectedCountryName: string) => {
        const selectedCountry = countries.find(c => c.name === selectedCountryName);
        if (selectedCountry) {
            setCountry(selectedCountryName);
            setCountryCode(selectedCountry.code);
            
            try {
                const allMethods = await localPaymentService.getAll();
                // Filter for non-crypto local methods
                const relevantMethods = allMethods.filter(
                    m => m.is_active && !m.is_crypto && (
                        m.country.toLowerCase() === selectedCountryName.toLowerCase() || 
                        m.country.toLowerCase() === 'global'
                    )
                );
                
                setLocalMethods(relevantMethods);
            } catch (e) {
                console.error("Failed to fetch local payment methods", e);
                setLocalMethods([]);
            }
        } else {
            setCountry('');
            setCountryCode('');
            setLocalMethods([]);
        }
    };

    const validateStep1 = () => {
        const newErrors: { country?: string, email?: string; phone?: string; general?: string } = {};
        const fullPhoneNumber = countryCode + localPhone;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            newErrors.email = t.emailRequired;
        } else if (!emailRegex.test(email)) {
            newErrors.email = t.emailInvalid;
        }

        if (!localPhone) {
            newErrors.phone = t.phoneRequired;
        } else if (fullPhoneNumber.length < 8 || fullPhoneNumber.length > 20) {
            newErrors.phone = t.phoneInvalid;
        }

        if (!country) {
            newErrors.country = t.countryRequired;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNextStep = () => {
        if (validateStep1()) {
            setStep(2);
        }
    };

    const handleSubmit = async () => {
        if (!selectedPaymentMethod || !product) {
            setErrors({ general: 'Please select a payment method.' });
            return;
        }
        
        setSaving(true);
        setErrors({});
        const fullPhoneNumber = countryCode + localPhone;

        try {
            await purchaseIntentsService.addIntent({
                product_id: product.id,
                product_title: product.title,
                country,
                email,
                phone_number: fullPhoneNumber,
            });

            if (selectedPaymentMethod !== 'standard') {
                // Navigate to local/crypto payment page
                navigate(`/local-pay/${product.id}?method=${selectedPaymentMethod}`);
            } else if (product.purchase_image_id) {
                navigate(`/pay/${product.id}`);
            } else if (product.buy_link) {
                navigate(`/link-pay/${product.id}`);
            } else {
                setErrors({ general: 'No payment method configured for this product.' });
                setSaving(false);
            }
        } catch (err: any) {
            setErrors({ general: err.message || 'Failed to save your information.' });
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030014] relative flex items-center justify-center">
                <AnimatedBackground />
                <div className="text-center z-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                    <p className="text-white font-medium tracking-wider">{t.loading}</p>
                </div>
            </div>
        );
    }

    if (fetchError || !product) {
        return (
             <div className="min-h-screen bg-[#030014] relative flex items-center justify-center p-4">
                <AnimatedBackground />
                <div className="text-center bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-lg z-10 backdrop-blur-md">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">{t.errorTitle}</h2>
                    <p className="text-red-300 mb-6">{fetchError || 'Product not found.'}</p>
                    <Link to="/" className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-colors border border-white/5">
                        <Home className="w-5 h-5" />
                        <span>{t.goBack}</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030014] relative text-white py-12 flex items-center justify-center overflow-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <AnimatedBackground />
            
            {/* Decorative Background Elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />

            <div className="relative z-10 container mx-auto px-4 sm:px-6 max-w-5xl">
                
                {/* Main Card */}
                <div className="bg-[#0a0a0c]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative group">
                    
                    {/* Top Glow Line */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-70" />

                    <div className="grid md:grid-cols-5 h-full">
                        
                        {/* Left Side: Product Info */}
                        <div className="md:col-span-2 bg-gradient-to-b from-slate-900 via-[#050507] to-black p-8 border-b md:border-b-0 md:border-r rtl:md:border-l rtl:md:border-r-0 border-white/5 flex flex-col justify-between relative overflow-hidden">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 to-transparent" />
                            
                            <div>
                                <Link to="/" className="inline-flex items-center text-xs font-medium text-gray-400 hover:text-white transition-colors mb-8 group/link z-20 relative">
                                    <Home className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 group-hover/link:text-cyan-400 transition-colors" />
                                    <span>{t.backToHome}</span>
                                </Link>

                                <div className="mb-8">
                                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">{t.prePurchaseTitle}</h2>
                                    <p className="text-sm text-gray-400 leading-relaxed">{t.prePurchaseSubtitle}</p>
                                </div>

                                {product && (
                                    <div className="bg-white/5 rounded-2xl p-5 border border-white/10 backdrop-blur-sm relative overflow-hidden group/product">
                                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/product:opacity-20 transition-opacity">
                                            <Lock className="w-12 h-12 text-white" />
                                        </div>
                                        <div className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase mb-2">{t.payFor}</div>
                                        <div className="text-xl font-bold text-white mb-1 leading-tight">{product.title}</div>
                                        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{product.price}$</div>
                                        {product.image && (
                                            <div className="mt-6 flex justify-center">
                                                <img 
                                                    src={product.image} 
                                                    alt={product.title} 
                                                    className="w-28 h-28 object-contain drop-shadow-[0_0_20px_rgba(168,85,247,0.4)] transform group-hover/product:scale-110 transition-transform duration-500" 
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* Steps Indicator */}
                            <div className="mt-8 flex items-center justify-center gap-2">
                                <div className={cn("h-1.5 w-8 rounded-full transition-all duration-300", step === 1 ? "bg-cyan-500" : "bg-white/20")}></div>
                                <div className={cn("h-1.5 w-8 rounded-full transition-all duration-300", step === 2 ? "bg-cyan-500" : "bg-white/20")}></div>
                            </div>
                        </div>

                        {/* Right Side: Form / Payment Selection */}
                        <div className="md:col-span-3 p-8 relative bg-[#0a0a0c]/50 flex flex-col">
                            
                            {/* Language Switcher */}
                            <div className="flex justify-end mb-6 gap-2">
                                {['en', 'ar', 'tr'].map((l) => (
                                    <button
                                        key={l}
                                        onClick={() => setLang(l as Lang)}
                                        className={cn(
                                            "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all uppercase tracking-wider border",
                                            lang === l 
                                                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]" 
                                                : "bg-transparent border-transparent text-gray-600 hover:text-gray-300 hover:bg-white/5"
                                        )}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>

                            {/* Step 1: Personal Details */}
                            {step === 1 && (
                                <div className="space-y-6 animate-fade-in-up flex-1">
                                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 text-sm border border-cyan-500/20">1</span>
                                        {t.step1Title}
                                    </h3>

                                    {/* Country Select */}
                                    <div className="group/input">
                                        <div className="relative">
                                            <div className="absolute left-3 rtl:right-3 rtl:left-auto top-[42px] -translate-y-1/2 text-gray-500 z-10">
                                                <Globe className="w-5 h-5" />
                                            </div>
                                            <div className="[&_button]:pl-10 [&_button]:rtl:pr-10 [&_button]:rtl:pl-3">
                                                <SearchableSelect
                                                    label={t.countryLabel}
                                                    options={countries.map(c => c.name)}
                                                    value={country}
                                                    onChange={handleCountryChange}
                                                    placeholder={t.countryPlaceholder}
                                                />
                                            </div>
                                        </div>
                                        {errors.country && <p className="text-red-400 text-xs mt-2 flex items-center gap-1 animate-fade-in"><AlertTriangle className="w-3 h-3"/> {errors.country}</p>}
                                    </div>

                                    {/* Email Input */}
                                    <div className="group/input">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{t.emailLabel}</label>
                                        <div className="relative">
                                            <div className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within/input:text-cyan-400">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <input 
                                                type="email" 
                                                value={email} 
                                                onChange={(e) => setEmail(e.target.value)} 
                                                className="w-full bg-[#050507] border border-white/10 rounded-xl py-3.5 pl-10 rtl:pr-10 rtl:pl-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-inner"
                                                placeholder={t.emailPlaceholder} 
                                            />
                                        </div>
                                        {errors.email && <p className="text-red-400 text-xs mt-2 flex items-center gap-1 animate-fade-in"><AlertTriangle className="w-3 h-3"/> {errors.email}</p>}
                                    </div>

                                    {/* Phone Input */}
                                    <div className="group/input">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{t.phoneLabel}</label>
                                        <div className="relative flex">
                                            <div className="flex items-center justify-center bg-[#050507] border border-white/10 border-r-0 rtl:border-l-0 rtl:border-r rounded-l-xl rtl:rounded-l-none rtl:rounded-r-xl px-3 min-w-[60px] text-gray-400 font-mono text-sm">
                                                {countryCode || '+..'}
                                            </div>
                                            <div className="relative flex-1">
                                                <div className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within/input:text-cyan-400">
                                                    <Phone className="w-4 h-4" />
                                                </div>
                                                <input 
                                                    type="tel" 
                                                    value={localPhone} 
                                                    onChange={(e) => setLocalPhone(e.target.value.replace(/\D/g, ''))}
                                                    className="w-full bg-[#050507] border border-white/10 rounded-r-xl rtl:rounded-r-none rtl:rounded-l-xl py-3.5 pl-10 rtl:pr-10 rtl:pl-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-inner"
                                                    placeholder={t.phonePlaceholder} 
                                                />
                                            </div>
                                        </div>
                                        {errors.phone && <p className="text-red-400 text-xs mt-2 flex items-center gap-1 animate-fade-in"><AlertTriangle className="w-3 h-3"/> {errors.phone}</p>}
                                    </div>

                                    <div className="pt-6 mt-auto">
                                        <button 
                                            onClick={handleNextStep}
                                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 flex items-center justify-center gap-2 group"
                                        >
                                            <span>{t.next}</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Payment Method Selection */}
                            {step === 2 && (
                                <div className="space-y-6 animate-fade-in-up flex-1 flex flex-col">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 text-sm border border-cyan-500/20">2</span>
                                            {t.step2Title}
                                        </h3>
                                        <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
                                            <ChevronLeft className="w-4 h-4 rtl:rotate-180" /> {t.back}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 overflow-y-auto custom-scrollbar pr-2 max-h-[400px]">
                                        {/* Global Payment Card */}
                                        <div 
                                            onClick={() => setSelectedPaymentMethod('standard')}
                                            className={`cursor-pointer relative overflow-hidden rounded-2xl border-2 transition-all duration-300 group ${selectedPaymentMethod === 'standard' ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'border-white/5 hover:border-white/20'}`}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-0"></div>
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <Globe className="w-24 h-24 text-white" />
                                            </div>
                                            
                                            <div className="relative z-10 p-5 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                                                        <CreditCard className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-white text-lg">{t.globalPayment}</h4>
                                                        <p className="text-xs text-gray-400">{t.globalPaymentDesc}</p>
                                                        <div className="flex gap-2 mt-2">
                                                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4 opacity-70 bg-white/10 rounded px-1" />
                                                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4 opacity-70 bg-white/10 rounded px-1" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPaymentMethod === 'standard' ? 'border-cyan-500 bg-cyan-500' : 'border-gray-600'}`}>
                                                    {selectedPaymentMethod === 'standard' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Local Payment Methods */}
                                        {localMethods.map(method => (
                                            <div 
                                                key={method.id}
                                                onClick={() => setSelectedPaymentMethod(method.id)}
                                                className={`cursor-pointer relative overflow-hidden rounded-2xl border-2 transition-all duration-300 group ${selectedPaymentMethod === method.id ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'border-white/5 hover:border-white/20'}`}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-[#1a103c] to-[#0a0a0c] z-0"></div>
                                                
                                                <div className="relative z-10 p-5 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                                                            <Building2 className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-white text-lg">{method.method_name}</h4>
                                                            <p className="text-xs text-gray-400">{t.localPaymentDesc} ({country})</p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPaymentMethod === method.id ? 'border-purple-500 bg-purple-500' : 'border-gray-600'}`}>
                                                        {selectedPaymentMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Crypto Payment Methods */}
                                        {cryptoMethods.map(method => (
                                            <div 
                                                key={method.id}
                                                onClick={() => setSelectedPaymentMethod(method.id)}
                                                className={`cursor-pointer relative overflow-hidden rounded-2xl border-2 transition-all duration-300 group ${selectedPaymentMethod === method.id ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'border-white/5 hover:border-white/20'}`}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-[#1c1917] to-[#0a0a0c] z-0"></div>
                                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                    <Bitcoin className="w-24 h-24 text-yellow-500" />
                                                </div>
                                                
                                                <div className="relative z-10 p-5 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg">
                                                            <Wallet className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-white text-lg">{method.method_name}</h4>
                                                            <p className="text-xs text-gray-400">{t.cryptoPaymentDesc} {method.crypto_network ? `(${method.crypto_network})` : ''}</p>
                                                            <div className="flex gap-2 mt-2">
                                                                <img src="https://cryptologos.cc/logos/tether-usdt-logo.png" alt="USDT" className="h-4 opacity-70" />
                                                                <img src="https://cryptologos.cc/logos/binance-coin-bnb-logo.png" alt="Binance" className="h-4 opacity-70" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPaymentMethod === method.id ? 'border-yellow-500 bg-yellow-500' : 'border-gray-600'}`}>
                                                        {selectedPaymentMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-white/5">
                                        <div className="flex items-start gap-3 bg-yellow-500/5 border border-yellow-500/10 p-4 rounded-xl mb-6">
                                            <Info className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-yellow-200/80 leading-relaxed">{t.infoNote}</p>
                                        </div>

                                        {errors.general && (
                                            <div className="text-center text-sm text-red-400 mb-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20 animate-pulse">
                                                {errors.general}
                                            </div>
                                        )}

                                        <button 
                                            onClick={handleSubmit} 
                                            disabled={saving || !selectedPaymentMethod}
                                            className="group w-full relative py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12" />
                                            <div className="relative flex items-center justify-center gap-2">
                                                {saving ? (
                                                    <>
                                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                                        <span>{t.savingInfo}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>{t.proceedToPurchaseButton}</span>
                                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrePurchaseInfoPage;
