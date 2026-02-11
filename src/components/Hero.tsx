import React from 'react';
import { Shield, Target, Rocket, ChevronRight } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
  </svg>
);

const Hero = () => {
  const { settings } = useSettings();

  return (
    <section className="relative pt-48 pb-32 overflow-hidden">
      <div className="container mx-auto px-6 relative z-10 text-center">
        
        {/* System Status Badge */}
        <div className="inline-flex items-center space-x-3 bg-black/40 border border-white/10 rounded-full px-5 py-2 mb-10 backdrop-blur-xl animate-fade-in-up hover:border-green-500/50 transition-colors cursor-default group">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </div>
          <span className="text-xs font-mono text-green-400 tracking-widest uppercase group-hover:text-green-300 transition-colors">
            SYSTEM STATUS: UNDETECTED
          </span>
        </div>

        {/* Main Title with Glitch Effect */}
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 tracking-tighter animate-fade-in-up leading-none select-none">
          <span className="block text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            {settings.hero_title?.split(' ')[0] || 'DOMINATE'}
          </span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient-x drop-shadow-[0_0_50px_rgba(6,182,212,0.3)]">
            {settings.hero_title?.split(' ').slice(1).join(' ') || 'THE GAME'}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed font-medium animate-fade-in-up delay-100">
          {settings.hero_subtitle || 'Professional gaming tools for PUBG Mobile & Call of Duty Mobile. Engineered for champions, secured by advanced encryption.'}
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up delay-200">
          {/* Primary Button: Join Discord */}
          <a 
            href={settings.discord_url} 
            target="_blank"
            rel="noopener noreferrer"
            className="group relative px-8 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-lg rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(88,101,242,0.4)] flex items-center justify-center gap-3"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <DiscordIcon className="w-6 h-6 relative z-10" />
            <span className="relative z-10 tracking-wide">JOIN DISCORD</span>
          </a>
          
          {/* Secondary Button: Browse Products */}
          <a 
            href="#products" 
            className="group px-8 py-4 bg-white/5 border border-white/10 text-white font-bold text-lg rounded-xl hover:bg-white/10 hover:border-white/30 transition-all hover:scale-105 backdrop-blur-md flex items-center justify-center gap-2"
          >
            <span>Browse Products</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Stats / Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 max-w-6xl mx-auto">
          {[
            {
              icon: Shield,
              title: settings.feature_1_title || '100% Safe',
              desc: settings.feature_1_desc || 'Protected from bans',
              color: 'text-green-400',
              borderColor: 'hover:border-green-500/30',
              glow: 'hover:shadow-[0_0_30px_rgba(74,222,128,0.1)]',
              bgGlow: 'bg-green-500/10'
            },
            {
              icon: Target,
              title: settings.feature_2_title || 'Precision Tools',
              desc: settings.feature_2_desc || 'Advanced aimbot & ESP',
              color: 'text-red-400',
              borderColor: 'hover:border-red-500/30',
              glow: 'hover:shadow-[0_0_30px_rgba(248,113,113,0.1)]',
              bgGlow: 'bg-red-500/10'
            },
            {
              icon: Rocket,
              title: settings.feature_3_title || 'Instant Access',
              desc: settings.feature_3_desc || 'Download immediately',
              color: 'text-yellow-400',
              borderColor: 'hover:border-yellow-500/30',
              glow: 'hover:shadow-[0_0_30px_rgba(250,204,21,0.1)]',
              bgGlow: 'bg-yellow-500/10'
            }
          ].map((feature, i) => (
            <div 
              key={i} 
              className={`p-8 rounded-2xl bg-[#0a0a0a] border border-white/5 transition-all duration-500 group ${feature.borderColor} ${feature.glow} hover:-translate-y-2`}
            >
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative overflow-hidden`}>
                  <div className={`absolute inset-0 ${feature.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  {/* Added fill-current and opacity to give a modern filled look */}
                  <feature.icon className={`w-8 h-8 ${feature.color} relative z-10 fill-current opacity-90`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;