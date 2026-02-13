import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import Header from './Header';
import Footer from './Footer';
import { AnimatedBackground } from './AnimatedBackground';
import { Shield, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicyPage = () => {
  const { settings } = useSettings();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#030014] relative overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10">
        <Header />
        
        <main className="container mx-auto px-6 py-32 max-w-4xl">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-8 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>

          <div className="bg-white/5 rounded-3xl border border-white/10 p-8 md:p-12 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Privacy Policy</h1>
            </div>

            <div className="prose prose-invert max-w-none">
              {settings.privacy_policy ? (
                <div className="text-slate-300 leading-relaxed whitespace-pre-wrap space-y-4">
                  {settings.privacy_policy}
                </div>
              ) : (
                <div className="text-slate-500 italic py-10 text-center">
                  Privacy Policy content is currently being updated. Please check back soon.
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

export default PrivacyPolicyPage;
