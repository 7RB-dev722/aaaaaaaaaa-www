import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Home, Mail, ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react';
import { AnimatedBackground } from './AnimatedBackground';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';

const PaymentSuccessPage: React.FC = () => {
    const { t } = useLanguage();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [discordUrl, setDiscordUrl] = useState('https://discord.gg/sY5EcUVjeA');

    useEffect(() => {
        console.log('Payment successful for session:', sessionId);
        window.scrollTo(0, 0);

        // Fetch discord URL from site_settings dynamically
        const fetchSettings = async () => {
            const { data } = await supabase
                .from('site_settings')
                .select('key, value')
                .eq('key', 'discord_url')
                .single();
            
            if (data?.value) {
                setDiscordUrl(data.value);
            }
        };
        fetchSettings();
    }, [sessionId]);

    return (
        <div className="min-h-screen bg-[#030014] relative text-white py-12 flex items-center justify-center overflow-hidden" dir="ltr">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <AnimatedBackground />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
            </div>
            
            <div className="relative z-10 container mx-auto px-4 max-w-2xl">
                <div className="bg-[#0a0a0c]/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                    {/* Premium Header Decoration */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="mb-10 flex flex-col items-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-2xl animate-ping opacity-50" />
                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center relative">
                                <CheckCircle className="w-12 h-12 text-cyan-400 animate-in zoom-in duration-500" />
                            </div>
                        </div>
                        
                        <div className="mt-6 space-y-2 text-center">
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-white to-emerald-400">
                                    Payment Successful!
                                </span>
                            </h1>
                            <p className="text-cyan-400/80 font-bold tracking-widest text-sm uppercase">
                                YOUR ORDER HAS BEEN CONFIRMED
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-10 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/50" />
                        <p className="text-gray-300 text-lg leading-relaxed font-medium">
                            Check your email inbox now; we have sent your product key and invoice details.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 transition-all hover:border-cyan-500/30 group/item">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-bold text-white">Check Inbox</div>
                                    <div className="text-xs text-gray-500">Including Spam folder</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 transition-all hover:border-purple-500/30 group/item">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-bold text-white">24/7 Support</div>
                                    <div className="text-xs text-gray-500">Always here to help you</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Link 
                            to="/" 
                            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white px-8 py-5 rounded-2xl transition-all shadow-[0_10px_20px_rgba(6,182,212,0.2)] font-black text-lg group"
                        >
                            <Home className="w-6 h-6" />
                            <span>Return to Shop</span>
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                        
                        <a 
                            href={discordUrl} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl transition-all border border-white/10 font-bold"
                        >
                            <MessageCircle className="w-5 h-5 text-[#5865F2]" />
                            <span>Join our Discord Community</span>
                        </a>
                    </div>

                    {sessionId && (
                        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col items-center gap-2">
                            <div className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">Transaction Reference</div>
                            <div className="text-[10px] text-cyan-500/50 font-mono break-all px-4 py-1 bg-white/[0.02] rounded-full border border-white/5">
                                {sessionId}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Copyright */}
                <div className="mt-8 text-center text-gray-500 text-xs font-medium">
                    © {new Date().getFullYear()} Cheatloop Team. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;
