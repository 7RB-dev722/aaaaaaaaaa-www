import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService, Product } from '../lib/supabase';
import { useSettings } from '../contexts/SettingsContext';
import { AnimatedBackground } from './AnimatedBackground';
import { Home, AlertTriangle, CheckCircle, ArrowRight, ExternalLink, Link as LinkIcon, CreditCard, Info, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import PurchaseDetailsModal from './PurchaseDetailsModal';
import { cn } from '@/lib/utils';

type Lang = 'en' | 'ar' | 'tr';

const LinkPaymentPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { settings, loading: settingsLoading } = useSettings();
    const { lang, setLang, t } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (productId) {
            const fetchProduct = async () => {
                try {
                    setLoading(true);
                    // Fetch product directly from database to ensure links are up-to-date
                    const productData = await productService.getProductById(productId);
                    setProduct(productData);
                } catch (err: any) {
                    setError(err.message || 'Failed to load product.');
                } finally {
                    setLoading(false);
                }
            };
            fetchProduct();
        }
    }, [productId]);

    const handleDetailsSubmit = (details: { email: string; phone: string; }) => {
        const contactUrl = settings.telegram_purchase_url || settings.telegram_url;
        if (!product || !contactUrl) return;
        
        const message = `
        New Purchase Confirmation (Link Payment): ${product.title}
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

    if (error || !product) {
        return (
            <div className="min-h-screen bg-[#030014] relative flex items-center justify-center p-4">
                <AnimatedBackground />
                <div className="text-center bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-lg z-10 backdrop-blur-md">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">{t.errorTitle}</h2>
                    <p className="text-red-300 mb-6">{error || 'Product not found.'}</p>
                    <Link to="/" className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-colors border border-white/5">
                        <Home className="w-5 h-5" />
                        <span>{t.backToHome}</span>
                    </Link>
                </div>
            </div>
        );
    }

    // Dynamic backup links from Database
    const backupLinks = [
        { url: product.buy_link_2, label: t.backupLink1 },
        { url: product.buy_link_3, label: t.backupLink2 },
        { url: product.buy_link_4, label: t.backupLink3 },
        { url: product.buy_link_5, label: t.backupLink4 },
    ].filter(link => link.url && link.url.trim() !== '');

    return (
        <div className="min-h-screen bg-[#030014] relative text-white font-sans selection:bg-cyan-500/30 overflow-x-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <AnimatedBackground />
            
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12 max-w-4xl">
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

                <div className="bg-[#0a0a0c]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h1 className="text-sm text-cyan-400 font-bold tracking-wider uppercase mb-1">{t.payFor}</h1>
                                <h2 className="text-3xl font-black text-white">{product.title}</h2>
                            </div>
                            <div className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 text-2xl font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                                {product.price}$
                            </div>
                        </div>

                        <div className="h-[1px] w-full bg-white/5 mb-8" />
                        
                        <div className="space-y-6">
                            {/* Primary Link */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    Recommended Method
                                </h3>
                                <a 
                                    href={product.buy_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-5 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transform hover:-translate-y-1 flex items-center justify-center gap-3 group/btn relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 skew-y-12" />
                                    <span className="relative z-10 text-lg">{t.proceedToPaymentLink}</span>
                                    <ExternalLink className="w-6 h-6 relative z-10" />
                                </a>
                            </div>

                            {/* Backup Links - Only shown if they exist in DB */}
                            {backupLinks.length > 0 && (
                                <div className="animate-fade-in-up">
                                    <div className="flex items-center gap-3 mb-4 mt-8">
                                        <div className="h-[1px] flex-1 bg-white/10"></div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-800/50 px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                                            <CreditCard className="w-3 h-3" /> Alternative Payment Links
                                        </span>
                                        <div className="h-[1px] flex-1 bg-white/10"></div>
                                    </div>

                                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 mb-4 flex items-start gap-3">
                                        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                        <p className="text-sm text-blue-200/80 leading-relaxed">
                                            {t.backupLinkNote}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {backupLinks.map((link, idx) => (
                                            <a 
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-white rounded-xl transition-all duration-300 group/link hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/10"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-slate-700 group-hover/link:bg-cyan-500/20 group-hover/link:text-cyan-400 transition-colors">
                                                        <CreditCard className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm">Visa / Mastercard</span>
                                                        <span className="text-[10px] text-gray-400 group-hover/link:text-gray-300">{link.label}</span>
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover/link:bg-cyan-500 group-hover/link:text-black transition-all">
                                                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 text-center">
                            <p className="text-xs text-gray-500 mb-6 flex items-center justify-center gap-2">
                                <ShieldCheck className="w-3 h-3" /> {t.redirectMessage}
                            </p>
                            
                            {!settingsLoading && settings.show_i_have_paid_button !== 'false' && (
                                <button
                                    onClick={handleIHavePaid}
                                    className="inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>{t.iHavePaidButton}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
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

export default LinkPaymentPage;
