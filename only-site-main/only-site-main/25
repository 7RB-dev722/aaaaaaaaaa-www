import React from 'react';
import { Shield, Zap, Target } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const Hero = () => {
  const { settings } = useSettings();

  return (
    <section className="relative text-white py-20 overflow-hidden">
      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-fade-in-up">
            {settings.hero_title || 'Dominate the Game'}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {settings.hero_subtitle || 'Professional gaming tools for PUBG Mobile & Call of Duty Mobile. Safe, reliable, and designed for competitive players.'}
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="flex flex-col items-center space-y-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center animate-spin-slow">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold">{settings.feature_1_title || '100% Safe'}</h3>
              <p className="text-gray-400 text-sm">{settings.feature_1_desc || 'Protected from bans'}</p>
            </div>
            
            <div className="flex flex-col items-center space-y-3 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-reverse-spin">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold">{settings.feature_2_title || 'Precision Tools'}</h3>
              <p className="text-gray-400 text-sm">{settings.feature_2_desc || 'Advanced aimbot & ESP'}</p>
            </div>
            
            <div className="flex flex-col items-center space-y-3 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center animate-spin-slow">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold">{settings.feature_3_title || 'Instant Access'}</h3>
              <p className="text-gray-400 text-sm">{settings.feature_3_desc || 'Download immediately'}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
