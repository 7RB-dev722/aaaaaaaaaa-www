import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import Header from './Header';
import Footer from './Footer';
import { AnimatedBackground } from './AnimatedBackground';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PolicyLanguageSwitcher from './PolicyLanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';

const RefundPolicyPage = () => {
  const { settings } = useSettings();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  // Get content based on current language
  const getContent = () => {
    if (lang === 'ar') return settings.refund_policy_ar || settings.refund_policy;
    if (lang === 'tr') return settings.refund_policy_tr || settings.refund_policy;
    if (lang === 'ru') return settings.refund_policy_ru || settings.refund_policy;
    return settings.refund_policy_en || settings.refund_policy;
  };

  const content = getContent();

  return (
    <div className="min-h-screen bg-[#030014] relative overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10">
        <Header />
        
        <main className="container mx-auto px-6 py-32 max-w-4xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>{t.back}</span>
            </button>

            <PolicyLanguageSwitcher />
          </div>

          <div className="bg-white/5 rounded-3xl border border-white/10 p-8 md:p-12 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <RefreshCw className="w-6 h-6 text-rose-400" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                {t.refundTitle}
              </h1>
            </div>

            <div className="prose prose-invert max-w-none">
              {content ? (
                <div className="text-slate-300 leading-relaxed whitespace-pre-wrap space-y-4">
                  {content}
                </div>
              ) : (
                <div className="text-slate-500 italic py-10 text-center">
                  {t.refundPlaceholder}
                </div>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default RefundPolicyPage;
