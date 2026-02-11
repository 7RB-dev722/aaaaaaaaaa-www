import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService, purchaseImagesService, Product, PurchaseImage } from '../lib/supabase';
import { useSettings } from '../contexts/SettingsContext';
import { AnimatedBackground } from './AnimatedBackground';
import { Home, AlertTriangle, Camera, Send, X, Info, CheckCircle, ArrowRight, Eye, ScanLine } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import PurchaseDetailsModal from './PurchaseDetailsModal';
import { Translations } from '../translations/en';
import { cn } from '@/lib/utils';

type Lang = 'en' | 'ar' | 'tr';

const ImagePaymentPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [purchaseImage, setPurchaseImage] = useState<PurchaseImage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { settings, loading: settingsLoading } = useSettings();
    const { lang, setLang, t } = useLanguage();
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (productId) {
            const fetchPaymentDetails = async () => {
                try {
                    setLoading(true);
                    const productData = await productService.getProductById(productId);
                    setProduct(productData);

                    if (!productData.purchase_image_id) {
                        setError("Image-based payment is not available for this product.");
                    } else {
                        const imageData = await purchaseImagesService.getById(productData.purchase_image_id);
                        setPurchaseImage(imageData);
                    }
                } catch (err: any) {
                    setError(err.message || 'Failed to load payment details.');
                } finally {
                    setLoading(false);
                }
            };
            fetchPaymentDetails();
        }
    }, [productId]);
    
    const instructions = useMemo(() => {
        return Array.from({ length: 5 }, (_, i) => {
            const step = i + 1;
            const settingKey = `payment_instruction_step_${step}_${lang}`;
            const textKey = `payment_instruction_step_${step}` as keyof Translations;
            const altKey = `payment_instruction_alt_${step}` as keyof Translations;
            
            const text = settings.hasOwnProperty(settingKey)
                ? settings[settingKey]
                : t[textKey] || '';
            
            return {
                text: text,
                imageKey: `payment_instruction_image_${step}`,
                alt: t[altKey] || `Alt text for step ${step}`
            };
        }).filter(item => item.text && item.text.trim() !== '');
    }, [settings, lang, t]);

    const openLightbox = (imageUrl: string) => {
        setLightboxImage(imageUrl);
    };

    const closeLightbox = () => {
        setLightboxImage(null);
    };

    const handleDetailsSubmit = (details: { email: string; phone: string; }) => {
        const contactUrl = settings.telegram_purchase_url || settings.telegram_url;
        if (!product || !contactUrl) return;
        
        const message = `
        New Purchase Confirmation: ${product.title}
        Price: ${product.price}$
        ---
        Email: ${details.email}
        Phone: ${details.phone || 'Not provided'}
        `;
        
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(contactUrl)}&text=${encodeURIComponent(message)}`;
        window.open(telegramUrl, '_blank');
        
        setIsModalOpen(false);
    };

    const handleIHavePaid = () => {
        if (settings.i_have_paid_link) {
            window.open(settings.i_have_paid_link, '_blank');
        } else {
            setIsModalOpen(true);
        }
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

    if (loading || settingsLoading) {
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

    if (error || !purchaseImage || !product) {
        return (
            <div className="min-h-screen bg-[#030014] relative flex items-center justify-center p-4">
                <AnimatedBackground />
                <div className="text-center bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-lg z-10 backdrop-blur-md">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">{t.errorTitle}</h2>
                    <p className="text-red-300 mb-6">{error || t.errorLoadingImage}</p>
                    <Link to="/" className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-colors border border-white/5">
                        <Home className="w-5 h-5" />
                        <span>{t.backToHome}</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030014] relative text-white font-sans selection:bg-cyan-500/30 overflow-x-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <AnimatedBackground />
            
            {/* Decorative background blobs */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12 max-w-6xl">
                {/* Header / Navigation */}
                <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                     <Link to="/" className="group flex items-center space-x-3 rtl:space-x-reverse text-gray-400 hover:text-white transition-colors">
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:border-cyan-500/50 group-hover:bg-cyan-500/10 transition-all">
                            <Home className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold tracking-wide">{t.backToHome}</span>
                    </Link>
                    
                    <div className="flex gap-1 bg-[#0a0a0c]/80 p-1.5 rounded-xl backdrop-blur-md border border-white/10">
                        <LangButton targetLang="en">EN</LangButton>
                        <LangButton targetLang="ar">AR</LangButton>
                        <LangButton targetLang="tr">TR</LangButton>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: QR Code & Product Info */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Product Summary Card */}
                        <div className="bg-[#0a0a0c]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h1 className="text-sm text-cyan-400 font-bold tracking-wider uppercase mb-1">{t.payFor}</h1>
                                        <h2 className="text-2xl font-black text-white">{product.title}</h2>
                                    </div>
                                    <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 text-xl font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                                        {product.price}$
                                    </div>
                                </div>
                                <div className="h-[1px] w-full bg-white/5 mb-4" />
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <Info className="w-4 h-4 text-gray-500" />
                                    <span>Scan the QR code below to complete your payment.</span>
                                </div>
                            </div>
                        </div>

                        {/* QR Code Card */}
                        <div className="bg-[#0a0a0c]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col items-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 opacity-50" />
                            
                            <div className="relative group cursor-pointer" onClick={() => openLightbox(purchaseImage.image_url)}>
                                {/* Scanning effect overlay */}
                                <div className="absolute inset-0 border-[3px] border-cyan-500/30 rounded-2xl z-10 pointer-events-none transition-colors group-hover:border-cyan-500/60" />
                                <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.6)] z-20 animate-scan pointer-events-none" />
                                
                                {/* Corner markers */}
                                <div className="absolute -top-[2px] -left-[2px] w-6 h-6 border-t-[3px] border-l-[3px] border-cyan-500 z-20 rounded-tl-lg" />
                                <div className="absolute -top-[2px] -right-[2px] w-6 h-6 border-t-[3px] border-r-[3px] border-cyan-500 z-20 rounded-tr-lg" />
                                <div className="absolute -bottom-[2px] -left-[2px] w-6 h-6 border-b-[3px] border-l-[3px] border-cyan-500 z-20 rounded-bl-lg" />
                                <div className="absolute -bottom-[2px] -right-[2px] w-6 h-6 border-b-[3px] border-r-[3px] border-cyan-500 z-20 rounded-br-lg" />

                                <div className="bg-white p-4 rounded-xl">
                                    <img 
                                        src={purchaseImage.image_url} 
                                        alt="Payment QR Code" 
                                        className="max-w-[220px] w-full h-auto block"
                                    />
                                </div>
                                
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl backdrop-blur-[2px]">
                                    <span className="text-white font-bold flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full border border-white/20">
                                        <ScanLine className="w-5 h-5 text-cyan-400" /> Expand
                                    </span>
                                </div>
                            </div>
                            <div className="mt-6 flex items-center gap-2 text-sm text-gray-400 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                                <Camera className="w-4 h-4 text-cyan-400" />
                                <span>Scan with your banking app</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Instructions */}
                    <div className="lg:col-span-7 h-full">
                        <div className="bg-[#0a0a0c]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 h-full flex flex-col relative overflow-hidden">
                            {/* Background Glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />

                            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3 relative z-10">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10">
                                    <Info className="w-5 h-5" />
                                </div>
                                {t.instructionsTitle}
                            </h3>

                            <div className="space-y-8 flex-1 relative z-10">
                                {instructions.map((item, i) => (
                                    <div key={i} className="relative pl-10 rtl:pl-0 rtl:pr-10 group">
                                        {/* Timeline Line */}
                                        {i !== instructions.length - 1 && (
                                            <div className="absolute left-[14px] rtl:right-[14px] rtl:left-auto top-10 bottom-[-32px] w-[2px] bg-white/5 group-hover:bg-cyan-500/20 transition-colors" />
                                        )}
                                        
                                        {/* Number Bubble */}
                                        <div className="absolute left-0 rtl:right-0 rtl:left-auto top-0 w-7 h-7 rounded-full bg-[#0a0a0c] border border-white/10 text-xs font-bold flex items-center justify-center text-gray-500 group-hover:border-cyan-500 group-hover:text-cyan-400 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                            {i + 1}
                                        </div>

                                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.04] hover:border-white/10 transition-all group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                                            <p className="text-gray-300 text-sm leading-relaxed font-medium">{item.text}</p>
                                            {item.imageKey && settings[item.imageKey] && (
                                                <div className="mt-4 relative rounded-xl overflow-hidden border border-white/10 group/img cursor-pointer shadow-lg" onClick={() => openLightbox(settings[item.imageKey] as string)}>
                                                    <img 
                                                        src={settings[item.imageKey] as string} 
                                                        alt={item.alt} 
                                                        className="w-full h-40 object-cover opacity-80 group-hover/img:opacity-100 transition-opacity transition-transform duration-500 group-hover/img:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-4">
                                                        <span className="text-xs font-bold text-white flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10">
                                                            <Eye className="w-3 h-3 text-cyan-400" /> View Image
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Action Button */}
                            {!settingsLoading && settings.show_i_have_paid_button !== 'false' && (
                                <div className="mt-10 pt-8 border-t border-white/10 relative z-10">
                                    <div className="text-center mb-6">
                                        <h4 className="text-lg font-bold text-white mb-1">{t.deliveryTitle}</h4>
                                        <p className="text-xs text-gray-400">{t.deliverySubtitle}</p>
                                    </div>
                                    <button
                                        onClick={handleIHavePaid}
                                        className="w-full py-4 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:shadow-[0_0_50px_rgba(6,182,212,0.4)] transform hover:-translate-y-1 flex items-center justify-center gap-3 group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12" />
                                        <CheckCircle className="w-6 h-6 relative z-10" />
                                        <span className="text-lg relative z-10 tracking-wide">{t.iHavePaidButton}</span>
                                        <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {lightboxImage && (
                <div 
                    className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-fade-in-up"
                    onClick={closeLightbox}
                >
                    <button 
                        onClick={(e) => { e.stopPropagation(); closeLightbox(); }} 
                        className="absolute top-6 right-6 text-white hover:text-cyan-400 transition-colors p-3 z-[60] rounded-full bg-white/10 hover:bg-white/20 border border-white/10"
                    >
                        <X size={24} />
                    </button>
                    
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={lightboxImage} 
                            alt="Enlarged instruction"
                            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl shadow-cyan-500/20 border border-white/10"
                        />
                    </div>
                </div>
            )}

            {product && (
                <PurchaseDetailsModal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  onSubmit={handleDetailsSubmit}
                  translations={t}
                />
            )}
        </div>
    );
};

export default ImagePaymentPage;
