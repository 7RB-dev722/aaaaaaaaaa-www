import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { productService, localPaymentService, Product, LocalPaymentMethod } from '../lib/supabase';
import { AnimatedBackground } from './AnimatedBackground';
import { Home, AlertTriangle, CheckCircle, ArrowRight, Copy, CreditCard, User, Hash, Banknote, Bitcoin, Network, AlertOctagon, Wallet } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import PurchaseDetailsModal from './PurchaseDetailsModal';
import { useSettings } from '../contexts/SettingsContext';

const LocalPaymentPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const [searchParams] = useSearchParams();
    const methodId = searchParams.get('method');
    
    const [product, setProduct] = useState<Product | null>(null);
    const [method, setMethod] = useState<LocalPaymentMethod | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    
    const { t, lang } = useLanguage();
    const { settings } = useSettings();

    useEffect(() => {
        const fetchData = async () => {
            if (!productId || !methodId) {
                setError("Invalid payment link.");
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const [productData, methodData] = await Promise.all([
                    productService.getProductById(productId),
                    localPaymentService.getById(methodId)
                ]);
                setProduct(productData);
                setMethod(methodData);
            } catch (err: any) {
                setError(err.message || 'Failed to load payment details.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [productId, methodId]);

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Determine the price to display
    const getDisplayPrice = () => {
        if (!product || !method) return '';
        
        let priceValue = '';
        
        // Check for product-specific override
        if (method.product_prices && method.product_prices[product.id]) {
            priceValue = method.product_prices[product.id];
        } else {
            // Fallback to general custom price or product price
            priceValue = method.custom_price || `${product.price}`;
        }

        // If the price value already contains non-numeric characters (like currency symbols), return as is
        // Otherwise, append the currency symbol if available
        const hasCurrency = /[^\d.,\s]/.test(priceValue);
        
        if (!hasCurrency && method.currency_symbol) {
            // Check if it's USD to put symbol before, otherwise after
            if (method.currency_symbol === '$' || method.currency_symbol === 'USD') {
                return `${method.currency_symbol} ${priceValue}`;
            }
            return `${priceValue} ${method.currency_symbol}`;
        }
        
        // If no currency symbol defined but price is just a number, default to $
        if (!hasCurrency && !method.currency_symbol) {
             return `${priceValue}$`;
        }

        return priceValue;
    };

    const displayPrice = getDisplayPrice();

    const handleDetailsSubmit = (details: { email: string; phone: string; }) => {
        const contactUrl = settings.telegram_purchase_url || settings.telegram_url;
        if (!product || !contactUrl) return;
        
        const message = `
        New Purchase Confirmation (${method?.is_crypto ? 'Crypto/Binance' : 'Local'} Payment): ${product.title}
        Method: ${method?.method_name} (${method?.country})
        Price: ${displayPrice}
        ${method?.is_crypto ? `Network: ${method.crypto_network}` : ''}
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

    if (error || !product || !method) {
        return (
            <div className="min-h-screen bg-[#030014] relative flex items-center justify-center p-4">
                <AnimatedBackground />
                <div className="text-center bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-lg z-10 backdrop-blur-md">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">{t.errorTitle}</h2>
                    <p className="text-red-300 mb-6">{error || 'Details not found.'}</p>
                    <Link to="/" className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-colors border border-white/5">
                        <Home className="w-5 h-5" />
                        <span>{t.backToHome}</span>
                    </Link>
                </div>
            </div>
        );
    }

    const isCrypto = method.is_crypto;
    const isBinance = method.method_name.toLowerCase().includes('binance') || method.crypto_network?.toLowerCase().includes('binance');

    // Theme colors based on type
    const themeColor = isBinance ? 'yellow' : isCrypto ? 'purple' : 'cyan';
    const gradient = isBinance 
        ? 'from-yellow-500 via-orange-500 to-yellow-500' 
        : isCrypto 
            ? 'from-purple-500 via-pink-500 to-purple-500' 
            : 'from-cyan-500 via-blue-500 to-cyan-500';

    return (
        <div className="min-h-screen bg-[#030014] relative text-white font-sans selection:bg-cyan-500/30 overflow-x-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <AnimatedBackground />
            
            <div className="relative z-10 container mx-auto px-4 py-12 max-w-2xl">
                <div className="bg-[#0a0a0c]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
                    
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">{t.payFor} {product.title}</h1>
                        <p className="text-gray-400">{t.via} {method.method_name} {isCrypto ? '' : `(${method.country})`}</p>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            {/* Removed "Payment Details" header as requested */}
                            
                            <div className="space-y-4">
                                {isCrypto ? (
                                    // Crypto & Binance Display
                                    <>
                                        {/* QR Code for Wallet (Generic generator) */}
                                        <div className="flex justify-center mb-6">
                                            <div className="bg-white p-3 rounded-xl shadow-lg shadow-black/20">
                                                <img 
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${method.account_number}`} 
                                                    alt="Wallet QR" 
                                                    className="w-32 h-32"
                                                />
                                            </div>
                                        </div>

                                        {/* Network Warning */}
                                        {method.crypto_network && !isBinance && (
                                            <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg flex items-start gap-3 mb-4">
                                                <AlertOctagon className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                                                <p className="text-sm text-yellow-200">
                                                    Please ensure you are sending funds via the <strong>{method.crypto_network}</strong> network.
                                                </p>
                                            </div>
                                        )}

                                        {method.crypto_network && (
                                            <div className="group relative">
                                                <label className="text-xs text-gray-500 uppercase tracking-wider font-bold">{t.network || 'Network'}</label>
                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="flex items-center gap-2 text-white font-mono text-lg">
                                                        <Network className="w-4 h-4 text-gray-400" />
                                                        <span className={`font-bold text-${themeColor}-400`}>{method.crypto_network}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="group relative pt-4 border-t border-white/5">
                                            <label className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                                                {isBinance ? (t.binanceId || 'Binance ID / Pay ID') : (t.walletAddress || 'Wallet Address')}
                                            </label>
                                            <div className="flex items-center justify-between mt-1 bg-black/20 p-3 rounded-lg border border-white/5">
                                                <div className="text-white font-mono text-sm break-all">
                                                    {method.account_number}
                                                </div>
                                                <button onClick={() => handleCopy(method.account_number!, 'wallet')} className="p-2 text-gray-400 hover:text-white transition-colors shrink-0 ml-2">
                                                    {copiedField === 'wallet' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    // Standard Local Payment Display
                                    <>
                                        {method.account_holder && (
                                            <div className="group relative">
                                                <label className="text-xs text-gray-500 uppercase tracking-wider font-bold">{t.accountHolder}</label>
                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="flex items-center gap-2 text-white font-mono text-lg">
                                                        <User className="w-4 h-4 text-gray-400" />
                                                        {method.account_holder}
                                                    </div>
                                                    <button onClick={() => handleCopy(method.account_holder!, 'holder')} className="p-2 text-gray-400 hover:text-white transition-colors">
                                                        {copiedField === 'holder' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {method.account_number && (
                                            <div className="group relative pt-4 border-t border-white/5">
                                                <label className="text-xs text-gray-500 uppercase tracking-wider font-bold">{t.accountNumber}</label>
                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="flex items-center gap-2 text-white font-mono text-lg tracking-wider">
                                                        <Hash className="w-4 h-4 text-gray-400" />
                                                        {method.account_number}
                                                    </div>
                                                    <button onClick={() => handleCopy(method.account_number!, 'number')} className="p-2 text-gray-400 hover:text-white transition-colors">
                                                        {copiedField === 'number' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {method.iban && (
                                            <div className="group relative pt-4 border-t border-white/5">
                                                <label className="text-xs text-gray-500 uppercase tracking-wider font-bold">{t.iban}</label>
                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="text-white font-mono text-sm break-all">
                                                        {method.iban}
                                                    </div>
                                                    <button onClick={() => handleCopy(method.iban!, 'iban')} className="p-2 text-gray-400 hover:text-white transition-colors shrink-0">
                                                        {copiedField === 'iban' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="pt-4 border-t border-white/5">
                                    <label className="text-xs text-gray-500 uppercase tracking-wider font-bold">{t.amountToPay}</label>
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex items-center gap-2">
                                            <Banknote className="w-5 h-5 text-green-400" />
                                            <span className="text-2xl font-bold text-white">{displayPrice}</span>
                                        </div>
                                        <button onClick={() => handleCopy(displayPrice, 'price')} className="p-2 text-gray-400 hover:text-white transition-colors">
                                            {copiedField === 'price' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`bg-${themeColor}-500/10 border border-${themeColor}-500/20 p-4 rounded-xl flex gap-3`}>
                            <AlertTriangle className={`w-5 h-5 text-${themeColor}-500 shrink-0`} />
                            <p className={`text-sm text-${themeColor}-200/80`}>
                                {t.transferNotice}
                            </p>
                        </div>

                        <button
                            onClick={handleIHavePaid}
                            className={`w-full py-4 px-6 bg-gradient-to-r text-white font-bold rounded-2xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-3 ${
                                isBinance 
                                    ? 'from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 shadow-lg shadow-yellow-500/20' 
                                    : isCrypto 
                                        ? 'from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/20'
                                        : 'from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/20'
                            }`}
                        >
                            <CheckCircle className="w-6 h-6" />
                            <span className="text-lg">{t.iHavePaidButton}</span>
                            <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                        </button>
                    </div>
                </div>
            </div>

            <PurchaseDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleDetailsSubmit}
                translations={t}
            />
        </div>
    );
};

export default LocalPaymentPage;
