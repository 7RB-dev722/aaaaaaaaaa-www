import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productService, Product } from '../lib/supabase';
import { AnimatedBackground } from './AnimatedBackground';
import { AlertTriangle, CheckCircle, ArrowRight, ArrowLeft, ShoppingCart, Check, X, Server, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '@/lib/utils';

type Lang = 'en' | 'ar' | 'tr';

// Custom Hardware Icons
const IntelIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg"><path d="M12.87 1.2c-2.45 0-4.78.67-6.84 1.84l.87 1.5c1.8-1.02 3.86-1.6 6.07-1.6 5.95 0 10.9 4.33 11.9 10.02h1.72C25.54 6.04 19.86 1.2 12.87 1.2zm-6.9 1.9L5.1 4.6C2.65 6.66 1.05 9.63 1.05 12.95c0 3.32 1.6 6.29 4.05 8.35l.87-1.5c-2.06-1.73-3.4-4.23-3.4-7.09 0-2.86 1.34-5.36 3.4-7.09zm13.74 1.5l-.87 1.5c2.06 1.73 3.4 4.23 3.4 7.09 0 2.86-1.34 5.36-3.4 7.09l.87 1.5c2.45-2.06 4.05-5.03 4.05-8.35 0-3.32-1.6-6.29-4.05-8.35zM6.03 4.6l-.87-1.5C3.1 4.27 1.2 6.6 1.2 12.95c0 6.35 1.9 8.68 3.96 9.85l.87-1.5c-1.8-1.02-3.46-3.05-3.46-8.35 0-5.3 1.66-7.33 3.46-8.35zm6.84 16.45c-2.21 0-4.27-.58-6.07-1.6l-.87 1.5c2.06 1.17 4.39 1.84 6.84 1.84 6.99 0 12.67-4.84 13.73-11.75h-1.72c-1 5.69-5.95 10.02-11.9 10.02z"/></svg>
);

const AmdIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg"><path d="M2.66 2.66v18.68h18.68V2.66H2.66zm15.7 15.7H5.64V5.64h12.72v12.72z"/><path d="M8.62 8.62h6.76v6.76H8.62z"/></svg>
);

const NvidiaIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg"><path d="M21.5 13.6c-.1-1.4-1-2.5-2.3-2.9 1.1-.6 1.7-1.8 1.5-3.1-.2-1.2-1.2-2.2-2.4-2.3-1.3-.1-2.5.6-3 1.7-.5-1.1-1.7-1.8-3-1.7-1.2.1-2.2 1.1-2.4 2.3-.2 1.3.4 2.5 1.5 3.1-1.3.4-2.2 1.5-2.3 2.9-.1 1.6.9 3 2.4 3.4-1.6.4-2.6 2-2.3 3.6.3 1.4 1.5 2.4 2.9 2.4h9.3c1.4 0 2.6-1 2.9-2.4.3-1.6-.7-3.2-2.3-3.6 1.5-.4 2.4-1.8 2.3-3.4zM5.4 10.8c0-2.5 2-4.6 4.6-4.6s4.6 2 4.6 4.6-2 4.6-4.6 4.6-4.6-2.1-4.6-4.6z"/></svg>
);

const SelectionCard = ({ 
    label, 
    value, 
    selectedValue, 
    onSelect, 
    icon: Icon,
    customIcon
}: { 
    label: string, 
    value: string, 
    selectedValue: string, 
    onSelect: (val: string) => void,
    icon?: React.ElementType,
    customIcon?: React.ReactNode
}) => {
    const isSelected = value === selectedValue;
    
    return (
        <button
            onClick={() => onSelect(value)}
            className={cn(
                "relative group flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 w-full h-full min-h-[140px]",
                isSelected 
                    ? "bg-cyan-500/10 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.2)]" 
                    : "bg-slate-800/40 border-white/5 hover:border-white/20 hover:bg-slate-800/60"
            )}
        >
            <div className={cn(
                "mb-4 p-4 rounded-xl transition-all duration-300",
                isSelected ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-gray-400 group-hover:text-white group-hover:scale-110"
            )}>
                {customIcon ? customIcon : (Icon && <Icon className="w-8 h-8" />)}
            </div>
            
            <span className={cn(
                "font-bold text-lg tracking-wide transition-colors",
                isSelected ? "text-white" : "text-gray-400 group-hover:text-white"
            )}>
                {label}
            </span>

            {isSelected && (
                <div className="absolute top-3 right-3 animate-scale-in">
                    <div className="bg-cyan-500 rounded-full p-1 shadow-lg shadow-cyan-500/50">
                        <Check className="w-3 h-3 text-black stroke-[4]" />
                    </div>
                </div>
            )}
        </button>
    );
};

const CompatibilityCheckPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { lang, setLang, t } = useLanguage();

    const [step, setStep] = useState(1);
    const [cpuType, setCpuType] = useState<'intel' | 'amd' | ''>('');
    const [gpuType, setGpuType] = useState<'nvidia' | 'amd' | 'intel' | ''>('');
    const [hasIntelIGPU, setHasIntelIGPU] = useState<'yes' | 'no' | ''>('');

    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
    const [checkResult, setCheckResult] = useState<'pending' | 'compatible' | 'incompatible'>('pending');
    
    useEffect(() => {
        const fetchData = async () => {
            if (!productId) {
                setError(t.error || 'Error');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setCheckResult('pending');
                const [productData, allProductsData] = await Promise.all([
                    productService.getProductById(productId),
                    productService.getVisibleProducts()
                ]);

                if (productData) {
                    const title = productData.title.toLowerCase();
                    const isSinki = title.includes('sinki');
                    const isCodm = title.includes('codm') || title.includes('call of duty');

                    // If it's Sinki or CODM, skip check and go directly to pre-purchase
                    if (isSinki || isCodm) {
                        navigate(`/pre-purchase/${productData.id}`, { replace: true });
                        return;
                    }
                }

                setProduct(productData);
                setAllProducts(allProductsData);
            } catch (err: any) {
                console.error("Fetch error:", err);
                setError(t.error || 'Failed to load product');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [productId, t.error, navigate]);

    const checkProductCompatibility = (productToCheck: Product, hardware: { gpuType: string; hasIntelIGPU: string }): { compatible: boolean; reason: 'sinki' | 'cheatloop' | null } => {
        const title = productToCheck.title.toLowerCase();
        
        if (title.includes('codm') || title.includes('call of duty')) {
            return { compatible: true, reason: null };
        }

        const brand = title.includes('sinki') ? 'sinki' : 'cheatloop';

        if (brand === 'sinki' && hardware.gpuType !== 'nvidia') {
            return { compatible: false, reason: 'sinki' };
        }

        // Updated Logic: If product is Cheatloop AND user has Intel iGPU (either as primary or secondary), it's incompatible.
        if (brand === 'cheatloop' && (hardware.hasIntelIGPU === 'yes' || hardware.gpuType === 'intel')) {
            return { compatible: false, reason: 'cheatloop' };
        }
        
        return { compatible: true, reason: null };
    };

    const handleCheckCompatibility = () => {
        if (!product) return;

        const { compatible } = checkProductCompatibility(product, { gpuType, hasIntelIGPU });

        if (compatible) {
            setCheckResult('compatible');
        } else {
            setCheckResult('incompatible');
            findSuggestions();
        }
    };

    const findSuggestions = () => {
        const hardware = { gpuType, hasIntelIGPU };
        const suggestions = allProducts.filter(p => {
            if (p.id === productId) return false;
            const { compatible } = checkProductCompatibility(p, hardware);
            return compatible;
        });
        setSuggestedProducts(suggestions);
    };

    const handleProceed = () => {
        if (!product) return;
        navigate(`/pre-purchase/${product.id}`);
    };

    const LangButton = ({ targetLang, children }: { targetLang: Lang, children: React.ReactNode }) => (
        <button
            onClick={() => setLang(targetLang)}
            className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all border",
                lang === targetLang
                    ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                    : "bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5"
            )}
        >
            {children}
        </button>
    );

    // Progress Bar Component
    const ProgressBar = () => (
        <div className="flex items-center justify-between mb-8 px-2">
            {[
                { s: 1, label: t.cpuLabel || 'CPU' },
                { s: 2, label: t.gpuLabel || 'GPU' },
                { s: 3, label: t.igpuLabel || 'iGPU' }
            ].map((item, idx) => (
                <div key={item.s} className="flex flex-col items-center relative z-10 w-1/3">
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 border-2",
                        step >= item.s 
                            ? "bg-cyan-500 border-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]" 
                            : "bg-slate-800 border-slate-600 text-slate-500"
                    )}>
                        {step > item.s ? <Check className="w-4 h-4" /> : item.s}
                    </div>
                    <span className={cn(
                        "text-[10px] mt-2 font-medium uppercase tracking-wider transition-colors duration-300",
                        step >= item.s ? "text-cyan-400" : "text-slate-600"
                    )}>
                        {item.label ? item.label.split(' ')[0] : ''}
                    </span>
                    {idx < 2 && (
                        <div className={cn(
                            "absolute top-4 left-1/2 w-full h-[2px] -z-10 transition-colors duration-500",
                            step > item.s ? "bg-cyan-500" : "bg-slate-800"
                        )} />
                    )}
                </div>
            ))}
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030014] relative flex items-center justify-center">
                <AnimatedBackground />
                <div className="text-center z-10">
                    <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="text-white font-medium tracking-wider animate-pulse">{t.loading || 'Loading...'}</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
             <div className="min-h-screen bg-[#030014] relative flex items-center justify-center p-4">
                <AnimatedBackground />
                <div className="text-center bg-red-500/10 border border-red-500/20 p-8 rounded-3xl max-w-lg z-10 backdrop-blur-xl">
                    <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-2">{t.errorTitle || 'Error'}</h2>
                    <p className="text-red-300 mb-8">{error || 'Product not found.'}</p>
                    <Link to="/" className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl transition-colors border border-white/5">
                        <ArrowLeft className="w-5 h-5" />
                        <span>{t.goBack || 'Go Back'}</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030014] relative text-white py-12 overflow-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <AnimatedBackground />
            
            {/* Decorative Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />

            <div className="relative z-10 container mx-auto px-4">
                <div className="max-w-3xl mx-auto">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <Link to="/" className="group flex items-center space-x-2 rtl:space-x-reverse text-gray-400 hover:text-white transition-colors">
                            <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:border-cyan-500/50 transition-all">
                                <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                            </div>
                            <span className="text-sm font-medium">{t.backToProducts || 'Back'}</span>
                        </Link>
                        <div className="flex gap-1 bg-[#0a0a0c]/80 p-1 rounded-xl backdrop-blur-md border border-white/10">
                            <LangButton targetLang="en">EN</LangButton>
                            <LangButton targetLang="ar">AR</LangButton>
                            <LangButton targetLang="tr">TR</LangButton>
                        </div>
                    </div>

                    {/* Main Card */}
                    <div className="bg-[#0a0a0c]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative">
                        {/* Top Gradient Line */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-70" />

                        <div className="p-8 md:p-10">
                            <div className="text-center mb-10">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-4">
                                    <Server className="w-3 h-3" /> System Check
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
                                    {t.compatibilityTitle || 'System Compatibility'}
                                </h1>
                                <p className="text-gray-400 text-lg max-w-xl mx-auto">
                                    {t.checkingFor || 'Checking for'} <span className="text-white font-bold border-b border-cyan-500/50">{product.title}</span>
                                </p>
                            </div>

                            {checkResult === 'pending' ? (
                                <>
                                    <ProgressBar />
                                    
                                    <div className="min-h-[300px] transition-all duration-500">
                                        {step === 1 && (
                                            <div className="animate-fade-in-up">
                                                <h3 className="text-xl font-bold text-white mb-6 text-center">{t.cpuLabel || 'Processor (CPU)'}</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <SelectionCard 
                                                        label={t.cpuIntel || 'Intel'} 
                                                        value="intel" 
                                                        selectedValue={cpuType} 
                                                        onSelect={(v) => { setCpuType(v as any); setStep(2); }}
                                                        customIcon={<IntelIcon className="w-10 h-10" />}
                                                    />
                                                    <SelectionCard 
                                                        label={t.cpuAmd || 'AMD'} 
                                                        value="amd" 
                                                        selectedValue={cpuType} 
                                                        onSelect={(v) => { setCpuType(v as any); setStep(2); }}
                                                        customIcon={<AmdIcon className="w-10 h-10" />}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {step === 2 && (
                                            <div className="animate-fade-in-up">
                                                <div className="flex items-center justify-between mb-6">
                                                    <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-white flex items-center gap-1"><ArrowLeft className="w-4 h-4 rtl:rotate-180" /> Back</button>
                                                    <h3 className="text-xl font-bold text-white text-center absolute left-0 right-0 pointer-events-none">{t.gpuLabel || 'Graphics Card (GPU)'}</h3>
                                                    <div className="w-10"></div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    <SelectionCard 
                                                        label={t.gpuNvidia || 'NVIDIA'} 
                                                        value="nvidia" 
                                                        selectedValue={gpuType} 
                                                        onSelect={(v) => { setGpuType(v as any); setStep(3); }}
                                                        customIcon={<NvidiaIcon className="w-10 h-10" />}
                                                    />
                                                    <SelectionCard 
                                                        label={t.gpuAmd || 'AMD'} 
                                                        value="amd" 
                                                        selectedValue={gpuType} 
                                                        onSelect={(v) => { setGpuType(v as any); setStep(3); }}
                                                        customIcon={<AmdIcon className="w-10 h-10" />}
                                                    />
                                                    <SelectionCard 
                                                        label={t.gpuIntel || 'Intel'} 
                                                        value="intel" 
                                                        selectedValue={gpuType} 
                                                        onSelect={(v) => { setGpuType(v as any); setStep(3); }}
                                                        customIcon={<IntelIcon className="w-10 h-10" />}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {step === 3 && (
                                            <div className="animate-fade-in-up">
                                                <div className="flex items-center justify-between mb-6">
                                                    <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-white flex items-center gap-1"><ArrowLeft className="w-4 h-4 rtl:rotate-180" /> Back</button>
                                                    <h3 className="text-xl font-bold text-white text-center absolute left-0 right-0 pointer-events-none">{t.igpuLabel || 'Intel Integrated Graphics'}</h3>
                                                    <div className="w-10"></div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <SelectionCard 
                                                        label={t.igpuYes || 'Yes'} 
                                                        value="yes" 
                                                        selectedValue={hasIntelIGPU} 
                                                        onSelect={(v) => setHasIntelIGPU(v as any)}
                                                        icon={CheckCircle}
                                                    />
                                                    <SelectionCard 
                                                        label={t.igpuNo || 'No'} 
                                                        value="no" 
                                                        selectedValue={hasIntelIGPU} 
                                                        onSelect={(v) => setHasIntelIGPU(v as any)}
                                                        icon={X}
                                                    />
                                                </div>
                                                
                                                {hasIntelIGPU && (
                                                    <div className="mt-8 animate-fade-in-up">
                                                        <button 
                                                            onClick={handleCheckCompatibility}
                                                            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
                                                        >
                                                            <Zap className="w-5 h-5 fill-current" />
                                                            {t.checkButton || 'Check Compatibility'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="animate-fade-in-up">
                                    {checkResult === 'compatible' && (
                                        <div className="text-center">
                                            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                                                <CheckCircle className="w-12 h-12 text-green-400" />
                                            </div>
                                            <h2 className="text-3xl font-black text-white mb-2">{t.compatibleTitle || 'System Compatible'}</h2>
                                            <p className="text-green-400/80 mb-8 text-lg">{t.compatibleMessage || 'Your system meets the requirements.'}</p>
                                            
                                            <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8 text-left rtl:text-right">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">System Specs</h4>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                                        <span className="block text-xs text-gray-500 mb-1">CPU</span>
                                                        <span className="font-bold text-white uppercase">{cpuType}</span>
                                                    </div>
                                                    <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                                        <span className="block text-xs text-gray-500 mb-1">GPU</span>
                                                        <span className="font-bold text-white uppercase">{gpuType}</span>
                                                    </div>
                                                    <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                                        <span className="block text-xs text-gray-500 mb-1">Intel iGPU</span>
                                                        <span className="font-bold text-white uppercase">{hasIntelIGPU}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button onClick={handleProceed} className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3">
                                                <span>{t.proceedButton || 'Proceed'}</span>
                                                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                                            </button>
                                        </div>
                                    )}

                                    {checkResult === 'incompatible' && (
                                        <div className="text-center">
                                            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                                                <AlertTriangle className="w-12 h-12 text-red-400" />
                                            </div>
                                            <h2 className="text-3xl font-black text-white mb-2">{t.incompatibleTitle || 'Not Compatible'}</h2>
                                            <p className="text-red-400/80 mb-8 text-lg">{t.incompatibleMessageGeneral || 'This product is not compatible with your system.'}</p>
                                            
                                            <div className="border-t border-white/10 pt-8 mt-8">
                                                {suggestedProducts.length > 0 ? (
                                                    <>
                                                        <h3 className="text-lg font-bold text-cyan-400 mb-6 flex items-center justify-center gap-2">
                                                            <ShoppingCart className="w-5 h-5" /> {t.suggestionsTitle || 'Recommended Alternatives'}
                                                        </h3>
                                                        <div className="grid gap-4">
                                                            {suggestedProducts.map(p => (
                                                                <Link 
                                                                    key={p.id} 
                                                                    to={`/check-compatibility/${p.id}`} 
                                                                    className="group flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/30 rounded-xl transition-all"
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-12 h-12 bg-black/40 rounded-lg flex items-center justify-center">
                                                                            {p.image ? <img src={p.image} alt={p.title} className="w-8 h-8 object-contain" /> : <Zap className="w-6 h-6 text-gray-600" />}
                                                                        </div>
                                                                        <div className="text-left rtl:text-right">
                                                                            <span className="block font-bold text-white group-hover:text-cyan-400 transition-colors">{p.title}</span>
                                                                            <span className="text-xs text-gray-500">{p.price}$</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-black transition-all">
                                                                        <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                                                                    </div>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
                                                        <p className="text-yellow-400 text-sm">{t.noSuggestions || 'No alternatives found.'}</p>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <button onClick={() => { setCheckResult('pending'); setStep(1); setCpuType(''); setGpuType(''); setHasIntelIGPU(''); }} className="mt-8 text-sm text-gray-500 hover:text-white underline underline-offset-4">
                                                Check Again
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompatibilityCheckPage;
