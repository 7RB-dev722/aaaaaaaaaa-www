import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productService, Product } from '../lib/supabase';
import { AnimatedBackground } from './AnimatedBackground';
import { AlertTriangle, CheckCircle, ArrowRight, ArrowLeft, ShoppingCart, Check, X, Server, Zap, Cpu, Monitor, ShieldCheck, RefreshCw, ScanLine, Binary } from 'lucide-react';
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

// 3D Tilt Wrapper Component
const TiltCard = ({ children, className, onClick, disabled }: { children: React.ReactNode, className?: string, onClick?: () => void, disabled?: boolean }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled || !cardRef.current) return;
        
        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -10; // Rotation range
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleMouseLeave = () => {
        if (!cardRef.current) return;
        cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    };

    return (
        <div 
            ref={cardRef}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={cn("transition-transform duration-200 ease-out transform-style-3d", className)}
        >
            {children}
        </div>
    );
};

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
        <TiltCard 
            onClick={() => onSelect(value)}
            className="w-full h-full"
        >
            <div className={cn(
                "relative h-full flex flex-col items-center justify-center p-8 rounded-3xl border transition-all duration-500 overflow-hidden backdrop-blur-md group",
                isSelected 
                    ? "bg-cyan-500/10 border-cyan-500 shadow-[0_0_50px_rgba(6,182,212,0.15)]" 
                    : "bg-white/5 border-white/10 hover:border-cyan-500/50 hover:bg-white/10"
            )}>
                 {/* Glow effect behind */}
                 <div className={cn(
                    "absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-transparent opacity-0 transition-opacity duration-500",
                    isSelected && "opacity-100"
                )} />

                {/* Scanner Effect when selected */}
                {isSelected && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-x-0 h-[2px] bg-cyan-400/50 shadow-[0_0_10px_#22d3ee] animate-scan" />
                    </div>
                )}

                <div className={cn(
                    "relative z-10 mb-6 p-5 rounded-2xl transition-all duration-500 transform-style-3d translate-z-20",
                    isSelected ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/50 scale-110" : "bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-white/10 group-hover:scale-110"
                )}>
                    {customIcon ? customIcon : (Icon && <Icon className="w-12 h-12" />)}
                </div>
                
                <span className={cn(
                    "relative z-10 font-bold text-xl tracking-wide transition-colors duration-300 translate-z-10",
                    isSelected ? "text-white" : "text-gray-400 group-hover:text-white"
                )}>
                    {label}
                </span>

                 {/* Tech decoration */}
                 {isSelected && (
                     <>
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500 rounded-tl-lg opacity-80" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500 rounded-tr-lg opacity-80" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500 rounded-bl-lg opacity-80" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500 rounded-br-lg opacity-80" />
                        
                        {/* Binary Rain Decoration */}
                        <div className="absolute right-2 top-2 text-[10px] text-cyan-500/30 font-mono flex flex-col leading-none pointer-events-none select-none">
                            <span>01</span>
                            <span>10</span>
                            <span>11</span>
                        </div>
                     </>
                )}
            </div>
        </TiltCard>
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
    
    // Fake scanning state
    const [isScanning, setIsScanning] = useState(false);
    
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
        
        setIsScanning(true);
        
        // Simulate scanning delay for effect
        setTimeout(() => {
            setIsScanning(false);
            const { compatible } = checkProductCompatibility(product, { gpuType, hasIntelIGPU });

            if (compatible) {
                setCheckResult('compatible');
            } else {
                setCheckResult('incompatible');
                findSuggestions();
            }
        }, 2000);
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

    const getFlagUrl = (isoCode: string) => `https://flagcdn.com/w40/${isoCode.toLowerCase()}.png`;

    const LangButton = ({ targetLang, iso, children }: { targetLang: Lang, iso: string, children: React.ReactNode }) => (
        <button
            onClick={() => setLang(targetLang)}
            className={cn(
                "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all border flex items-center gap-1.5",
                lang === targetLang
                    ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                    : "bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5"
            )}
        >
            <div className="w-4 h-3 overflow-hidden rounded-sm border border-white/10 flex-shrink-0">
                <img src={getFlagUrl(iso)} alt="" className="w-full h-full object-cover" />
            </div>
            {children}
        </button>
    );

    // Modern Progress Bar Component
    const ProgressBar = () => (
        <div className="flex items-center justify-between mb-12 px-4 relative">
            {/* Connecting Line */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-800 z-0 mx-10 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-cyan-600 to-blue-600 transition-all duration-700 ease-in-out relative overflow-hidden"
                    style={{ width: `${((step - 1) / 2) * 100}%` }}
                >
                     <div className="absolute inset-0 bg-white/30 w-full animate-shimmer"></div>
                </div>
            </div>

            {[
                { s: 1, label: t.cpuLabel || 'CPU', icon: Cpu },
                { s: 2, label: t.gpuLabel || 'GPU', icon: Monitor },
                { s: 3, label: t.igpuLabel || 'iGPU', icon: Zap }
            ].map((item, idx) => {
                const isActive = step >= item.s;
                const isCompleted = step > item.s;
                const isCurrent = step === item.s;
                const Icon = item.icon;
                
                return (
                <div key={item.s} className="flex flex-col items-center relative z-10 group cursor-default">
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 transform",
                        isActive
                            ? "bg-[#0a0a0c] border-cyan-500 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]" 
                            : "bg-[#0a0a0c] border-slate-700 text-slate-600"
                    )}>
                        {isCompleted ? (
                            <Check className="w-6 h-6 animate-scale-in" />
                        ) : (
                            <Icon className={cn("w-6 h-6", isCurrent && "animate-pulse")} />
                        )}
                    </div>
                    
                    {/* Active Indicator Dot */}
                    {isCurrent && (
                        <span className="absolute -top-2 -right-2 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
                        </span>
                    )}

                    <span className={cn(
                        "absolute -bottom-8 text-xs font-bold uppercase tracking-wider transition-colors duration-300 whitespace-nowrap",
                        isActive ? "text-cyan-400" : "text-slate-600"
                    )}>
                        {item.label ? item.label.split(' ')[0] : ''}
                    </span>
                </div>
            )})}
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030014] relative flex items-center justify-center">
                <AnimatedBackground />
                <div className="text-center z-10 relative">
                    <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-pulse-slow"></div>
                    <div className="relative w-32 h-32 mx-auto mb-8">
                        {/* Complex Loader */}
                        <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping"></div>
                        <div className="absolute inset-0 border-4 border-t-cyan-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-4 border-4 border-b-purple-500 rounded-full animate-reverse-spin"></div>
                        <Server className="absolute inset-0 m-auto w-10 h-10 text-cyan-400 animate-pulse" />
                    </div>
                    <p className="text-white font-bold tracking-[0.3em] text-xl animate-pulse text-glow-cyan">{t.loading || 'SYSTEM INITIALIZING...'}</p>
                    <div className="mt-4 text-xs text-cyan-500/60 font-mono">LOADING MODULES...</div>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
             <div className="min-h-screen bg-[#030014] relative flex items-center justify-center p-4">
                <AnimatedBackground />
                <TiltCard className="text-center bg-red-500/10 border border-red-500/20 p-12 rounded-[2rem] max-w-lg z-10 backdrop-blur-3xl shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                    <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-slow relative">
                         <div className="absolute inset-0 rounded-full border border-red-500/40 animate-ping"></div>
                        <AlertTriangle className="w-12 h-12 text-red-400" />
                    </div>
                    <h2 className="text-4xl font-black text-white mb-4">{t.errorTitle || 'System Error'}</h2>
                    <p className="text-red-300/80 mb-10 text-lg leading-relaxed">{error || 'Product configuration not found.'}</p>
                    <Link to="/" className="inline-flex items-center space-x-3 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-xl transition-all border border-white/10 hover:border-white/30 group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold tracking-wide">{t.goBack || 'Return to Base'}</span>
                    </Link>
                </TiltCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030014] relative text-white py-12 overflow-hidden font-sans perspective-1000" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <AnimatedBackground />
            
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
            
            {/* Scanning Overlay */}
            {isScanning && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center">
                    <div className="relative w-full max-w-2xl h-64 border-y border-cyan-500/30 bg-cyan-500/5 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(6,182,212,0.1)_50%,transparent_100%)] animate-scan h-full w-full"></div>
                        <div className="text-center z-10">
                            <ScanLine className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-pulse" />
                            <h2 className="text-3xl font-black text-white tracking-widest animate-pulse">SCANNING HARDWARE</h2>
                            <p className="text-cyan-400 mt-2 font-mono text-sm">ANALYZING COMPATIBILITY MATRICES...</p>
                        </div>
                        
                        {/* Random Data Stream Effect */}
                        <div className="absolute left-4 top-4 text-xs font-mono text-cyan-500/40 hidden md:block">
                            <div>CPU_ARCH: DETECTED</div>
                            <div>GPU_VRAM: ANALYZING</div>
                            <div>DRIVERS: CHECKING</div>
                        </div>
                         <div className="absolute right-4 bottom-4 text-xs font-mono text-cyan-500/40 hidden md:block text-right">
                            <div>INTEGRITY: 100%</div>
                            <div>SECURE_BOOT: ENABLED</div>
                            <div>TPM_2.0: VERIFIED</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative z-10 container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    
                    {/* Header Nav */}
                    <div className="flex justify-between items-center mb-12 animate-fade-in-up">
                        <Link to="/" className="group flex items-center space-x-3 rtl:space-x-reverse text-gray-400 hover:text-white transition-colors">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:border-cyan-500/50 group-hover:bg-cyan-500/10 transition-all">
                                <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                            </div>
                            <span className="text-sm font-bold tracking-wider opacity-80 group-hover:opacity-100 uppercase">{t.backToProducts || 'Back to Store'}</span>
                        </Link>
                        <div className="flex gap-2 bg-[#0a0a0c]/80 p-1.5 rounded-xl backdrop-blur-md border border-white/10 shadow-lg">
                            <LangButton targetLang="en" iso="us">EN</LangButton>
                            <LangButton targetLang="ar" iso="ae">AR</LangButton>
                            <LangButton targetLang="tr" iso="tr">TR</LangButton>
                        </div>
                    </div>

                    {/* Main Interface Card */}
                    <div className="bg-[#0a0a0c]/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden relative transition-all duration-500">
                        {/* Dynamic Border Gradient */}
                        <div className="absolute inset-0 border border-white/5 rounded-[2.5rem] pointer-events-none"></div>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50 shadow-[0_0_20px_rgba(6,182,212,0.5)]"></div>

                        <div className="p-8 md:p-14 relative z-10">
                            
                            {/* Title Section */}
                            <div className="text-center mb-12 animate-fade-in-up">
                                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-[0.15em] mb-6 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                                    <ShieldCheck className="w-4 h-4" /> System Compatibility Check
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-lg">
                                    {t.compatibilityTitle || 'Hardware Scan'}
                                </h1>
                                <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
                                    {t.checkingFor || 'Analyzing compatibility requirements for'} <span className="text-white font-bold text-cyan-300 drop-shadow-md text-glow-cyan">{product.title}</span>
                                </p>
                            </div>

                            {checkResult === 'pending' ? (
                                <>
                                    <ProgressBar />
                                    
                                    <div className="min-h-[400px] transition-all duration-500 mt-8 relative">
                                        {/* Step 1: CPU */}
                                        <div className={cn("absolute inset-0 transition-all duration-500 transform", 
                                            step === 1 ? "opacity-100 translate-x-0 relative" : "opacity-0 -translate-x-full absolute pointer-events-none"
                                        )}>
                                            <h3 className="text-2xl font-bold text-white mb-8 text-center flex items-center justify-center gap-2">
                                                <Cpu className="w-6 h-6 text-cyan-500" />
                                                {t.cpuLabel || 'Select Processor Type'}
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <SelectionCard 
                                                    label={t.cpuIntel || 'Intel'} 
                                                    value="intel" 
                                                    selectedValue={cpuType} 
                                                    onSelect={(v) => { setCpuType(v as any); setStep(2); }}
                                                    customIcon={<IntelIcon className="w-16 h-16" />}
                                                />
                                                <SelectionCard 
                                                    label={t.cpuAmd || 'AMD'} 
                                                    value="amd" 
                                                    selectedValue={cpuType} 
                                                    onSelect={(v) => { setCpuType(v as any); setStep(2); }}
                                                    customIcon={<AmdIcon className="w-16 h-16" />}
                                                />
                                            </div>
                                        </div>

                                        {/* Step 2: GPU */}
                                        <div className={cn("absolute inset-0 transition-all duration-500 transform", 
                                            step === 2 ? "opacity-100 translate-x-0 relative" : step < 2 ? "opacity-0 translate-x-full absolute pointer-events-none" : "opacity-0 -translate-x-full absolute pointer-events-none"
                                        )}>
                                            <div className="flex items-center justify-between mb-8">
                                                <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-white flex items-center gap-2 group px-4 py-2 rounded-lg hover:bg-white/5 transition-all">
                                                    <ArrowLeft className="w-4 h-4 rtl:rotate-180 group-hover:-translate-x-1 transition-transform" /> 
                                                    <span>Back</span>
                                                </button>
                                                <h3 className="text-2xl font-bold text-white text-center absolute left-0 right-0 pointer-events-none flex items-center justify-center gap-2">
                                                    <Monitor className="w-6 h-6 text-cyan-500" />
                                                    {t.gpuLabel || 'Select Graphics Card'}
                                                </h3>
                                                <div className="w-16"></div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                                <SelectionCard 
                                                    label={t.gpuNvidia || 'NVIDIA'} 
                                                    value="nvidia" 
                                                    selectedValue={gpuType} 
                                                    onSelect={(v) => { setGpuType(v as any); setStep(3); }}
                                                    customIcon={<NvidiaIcon className="w-14 h-14" />}
                                                />
                                                <SelectionCard 
                                                    label={t.gpuAmd || 'AMD'} 
                                                    value="amd" 
                                                    selectedValue={gpuType} 
                                                    onSelect={(v) => { setGpuType(v as any); setStep(3); }}
                                                    customIcon={<AmdIcon className="w-14 h-14" />}
                                                />
                                                <SelectionCard 
                                                    label={t.gpuIntel || 'Intel'} 
                                                    value="intel" 
                                                    selectedValue={gpuType} 
                                                    onSelect={(v) => { setGpuType(v as any); setStep(3); }}
                                                    customIcon={<IntelIcon className="w-14 h-14" />}
                                                />
                                            </div>
                                        </div>

                                        {/* Step 3: iGPU */}
                                        <div className={cn("absolute inset-0 transition-all duration-500 transform", 
                                            step === 3 ? "opacity-100 translate-x-0 relative" : "opacity-0 translate-x-full absolute pointer-events-none"
                                        )}>
                                            <div className="flex items-center justify-between mb-8">
                                                <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-white flex items-center gap-2 group px-4 py-2 rounded-lg hover:bg-white/5 transition-all">
                                                    <ArrowLeft className="w-4 h-4 rtl:rotate-180 group-hover:-translate-x-1 transition-transform" /> 
                                                    <span>Back</span>
                                                </button>
                                                <h3 className="text-2xl font-bold text-white text-center absolute left-0 right-0 pointer-events-none flex items-center justify-center gap-2">
                                                    <Zap className="w-6 h-6 text-cyan-500" />
                                                    {t.igpuLabel || 'Intel Integrated Graphics'}
                                                </h3>
                                                <div className="w-16"></div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <SelectionCard 
                                                    label={t.igpuYes || 'Yes, I have it'} 
                                                    value="yes" 
                                                    selectedValue={hasIntelIGPU} 
                                                    onSelect={(v) => setHasIntelIGPU(v as any)}
                                                    icon={CheckCircle}
                                                />
                                                <SelectionCard 
                                                    label={t.igpuNo || 'No, I don\'t'} 
                                                    value="no" 
                                                    selectedValue={hasIntelIGPU} 
                                                    onSelect={(v) => setHasIntelIGPU(v as any)}
                                                    icon={X}
                                                />
                                            </div>
                                            
                                            {hasIntelIGPU && (
                                                <div className="mt-10 animate-fade-in-up flex justify-center">
                                                    <button 
                                                        onClick={handleCheckCompatibility}
                                                        className="w-full max-w-md py-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xl rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-4 relative overflow-hidden group"
                                                    >
                                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 skew-y-12"></div>
                                                        <Zap className="w-6 h-6 fill-current animate-pulse" />
                                                        <span className="relative z-10">{t.checkButton || 'RUN COMPATIBILITY CHECK'}</span>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <ArrowRight className="w-6 h-6 rtl:rotate-180" />
                                                        </div>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="animate-scale-in">
                                    {checkResult === 'compatible' && (
                                        <div className="text-center py-8">
                                            <TiltCard className="inline-block">
                                                <div className="w-32 h-32 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/30 shadow-[0_0_60px_rgba(34,197,94,0.2)] relative">
                                                    <div className="absolute inset-0 rounded-full border border-green-500/30 animate-ping opacity-20"></div>
                                                    <div className="absolute inset-0 rounded-full border-t-2 border-green-500 animate-spin-slow opacity-50"></div>
                                                    <CheckCircle className="w-16 h-16 text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                                                </div>
                                            </TiltCard>
                                            <h2 className="text-4xl font-black text-white mb-4 tracking-tight text-glow-cyan">{t.compatibleTitle || 'SYSTEM COMPATIBLE'}</h2>
                                            <p className="text-green-400/80 mb-10 text-xl font-medium">{t.compatibleMessage || 'Your hardware configuration meets all requirements.'}</p>
                                            
                                            <div className="bg-white/5 rounded-2xl p-8 border border-white/10 mb-10 text-left rtl:text-right shadow-inner relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 blur-2xl rounded-full pointer-events-none"></div>
                                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-2">Verified Specifications</h4>
                                                <div className="grid grid-cols-3 gap-6">
                                                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-center group hover:border-green-500/30 transition-colors">
                                                        <Cpu className="w-6 h-6 text-gray-600 group-hover:text-green-400 mx-auto mb-2 transition-colors" />
                                                        <span className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">CPU</span>
                                                        <span className="font-bold text-white uppercase text-lg">{cpuType}</span>
                                                    </div>
                                                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-center group hover:border-green-500/30 transition-colors">
                                                        <Monitor className="w-6 h-6 text-gray-600 group-hover:text-green-400 mx-auto mb-2 transition-colors" />
                                                        <span className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">GPU</span>
                                                        <span className="font-bold text-white uppercase text-lg">{gpuType}</span>
                                                    </div>
                                                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-center group hover:border-green-500/30 transition-colors">
                                                        <Zap className="w-6 h-6 text-gray-600 group-hover:text-green-400 mx-auto mb-2 transition-colors" />
                                                        <span className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">iGPU</span>
                                                        <span className="font-bold text-white uppercase text-lg">{hasIntelIGPU}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button onClick={handleProceed} className="w-full py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-xl rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-4 group overflow-hidden relative">
                                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                                                <span className="relative z-10">{t.proceedButton || 'Proceed to Purchase'}</span>
                                                <ArrowRight className="w-6 h-6 rtl:rotate-180 group-hover:translate-x-1 transition-transform relative z-10" />
                                            </button>
                                        </div>
                                    )}

                                    {checkResult === 'incompatible' && (
                                        <div className="text-center py-8">
                                            <TiltCard className="inline-block">
                                                <div className="w-32 h-32 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/30 shadow-[0_0_60px_rgba(239,68,68,0.2)] relative">
                                                    <div className="absolute inset-0 rounded-full border border-red-500/30 animate-ping opacity-20"></div>
                                                    <AlertTriangle className="w-16 h-16 text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]" />
                                                </div>
                                            </TiltCard>
                                            <h2 className="text-4xl font-black text-white mb-4 tracking-tight">{t.incompatibleTitle || 'NOT COMPATIBLE'}</h2>
                                            <p className="text-red-400/80 mb-10 text-xl font-medium">{t.incompatibleMessageGeneral || 'This product does not support your current hardware.'}</p>
                                            
                                            <div className="border-t border-white/10 pt-10 mt-6">
                                                {suggestedProducts.length > 0 ? (
                                                    <>
                                                        <h3 className="text-lg font-bold text-cyan-400 mb-8 flex items-center justify-center gap-3 uppercase tracking-wider">
                                                            <ShoppingCart className="w-5 h-5" /> {t.suggestionsTitle || 'Recommended Alternatives'}
                                                        </h3>
                                                        <div className="grid gap-4">
                                                            {suggestedProducts.map((p, idx) => (
                                                                <Link 
                                                                    key={p.id} 
                                                                    to={`/check-compatibility/${p.id}`} 
                                                                    className="group flex items-center justify-between p-5 bg-slate-800/40 hover:bg-slate-800/80 border border-white/10 hover:border-cyan-500/50 rounded-2xl transition-all shadow-lg hover:shadow-cyan-500/10 transform hover:-translate-y-1"
                                                                    style={{ animationDelay: `${idx * 100}ms` }}
                                                                >
                                                                    <div className="flex items-center gap-6">
                                                                        <div className="w-16 h-16 bg-black/40 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-cyan-500/30 transition-colors">
                                                                            {p.image ? <img src={p.image} alt={p.title} className="w-10 h-10 object-contain" /> : <Zap className="w-8 h-8 text-gray-600" />}
                                                                        </div>
                                                                        <div className="text-left rtl:text-right">
                                                                            <span className="block font-bold text-xl text-white group-hover:text-cyan-400 transition-colors mb-1">{p.title}</span>
                                                                            <span className="text-sm font-medium text-cyan-500/80 bg-cyan-900/20 px-2 py-1 rounded">{p.price}$</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-black transition-all transform group-hover:scale-110">
                                                                        <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                                                                    </div>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-2xl backdrop-blur-sm">
                                                        <p className="text-yellow-400 text-lg font-medium">{t.noSuggestions || 'No suitable alternatives found in our store.'}</p>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <button onClick={() => { setCheckResult('pending'); setStep(1); setCpuType(''); setGpuType(''); setHasIntelIGPU(''); }} className="mt-10 flex items-center gap-2 mx-auto text-gray-500 hover:text-white transition-colors group">
                                                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                                                <span className="underline underline-offset-4">{t.checkAgain || 'Start New Scan'}</span>
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
