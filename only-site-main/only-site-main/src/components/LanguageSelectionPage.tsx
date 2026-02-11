import React from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { AnimatedBackground } from './AnimatedBackground';
import { Globe, ArrowRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const LanguageSelectionPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setLang } = useLanguage();
    
    const nextStep = searchParams.get('next') || `/pre-purchase/${productId}`;

    const handleLanguageSelect = (lang: 'en' | 'ar' | 'tr') => {
        setLang(lang);
        navigate(nextStep);
    };

    return (
        <div className="min-h-screen bg-[#030014] relative flex items-center justify-center p-4 overflow-hidden">
            <AnimatedBackground />
            
            {/* Decorative Elements */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none animate-pulse-slow" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-[#0a0a0c]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 relative overflow-hidden group">
                    
                    {/* Top Glow */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />

                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                            <Globe className="w-8 h-8 text-cyan-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Select Language</h1>
                        <p className="text-gray-400 text-sm">Choose your preferred language to continue</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => handleLanguageSelect('ar')}
                            className="group w-full relative flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">🇦🇪</span>
                                <div className="text-left">
                                    <span className="block text-white font-bold">العربية</span>
                                    <span className="text-xs text-gray-500">Arabic</span>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transform group-hover:translate-x-1 transition-all" />
                        </button>

                        <button
                            onClick={() => handleLanguageSelect('en')}
                            className="group w-full relative flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">🇺🇸</span>
                                <div className="text-left">
                                    <span className="block text-white font-bold">English</span>
                                    <span className="text-xs text-gray-500">English</span>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transform group-hover:translate-x-1 transition-all" />
                        </button>

                        <button
                            onClick={() => handleLanguageSelect('tr')}
                            className="group w-full relative flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-red-500/30 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">🇹🇷</span>
                                <div className="text-left">
                                    <span className="block text-white font-bold">Türkçe</span>
                                    <span className="text-xs text-gray-500">Turkish</span>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-red-400 transform group-hover:translate-x-1 transition-all" />
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <Link to="/" className="inline-flex items-center text-xs font-medium text-gray-500 hover:text-white transition-colors gap-2">
                            <Home className="w-3 h-3" />
                            <span>Cancel & Return Home</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LanguageSelectionPage;
