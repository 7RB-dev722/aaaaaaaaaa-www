import React, { useState, useEffect } from 'react';
import { Shield, Zap, Mail, MessageCircle, Phone, Heart } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const { settings, loading } = useSettings();
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    if (clickCount > 0) {
      const timer = setTimeout(() => setClickCount(0), 2000);
      return () => clearTimeout(timer);
    }
  }, [clickCount]);

  const handleSecretClick = () => {
    // Hidden admin access disabled as requested
    return;
  };

  return (
    <footer className="relative pt-20 pb-10 overflow-hidden border-t border-white/5 bg-slate-950">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {settings.site_name || 'Cheatloop'}
              </h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Elevating your gaming experience with premium, undetected tools. Built for champions, trusted by thousands.
            </p>
            <div className="flex space-x-4">
              <a href={settings.discord_url} className="p-2 rounded-lg bg-slate-900 border border-white/5 hover:bg-[#5865F2] hover:text-white text-slate-400 transition-all duration-300 hover:scale-110">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href={settings.telegram_url} className="p-2 rounded-lg bg-slate-900 border border-white/5 hover:bg-[#0088cc] hover:text-white text-slate-400 transition-all duration-300 hover:scale-110">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><a href="/" className="hover:text-cyan-400 transition-colors">Home</a></li>
              <li><a href="#products" className="hover:text-cyan-400 transition-colors">Products</a></li>
              <li><a href="/winning-photos" className="hover:text-cyan-400 transition-colors">Winning Gallery</a></li>
              <li><a href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-cyan-400 transition-colors">Terms & Conditions</a></li>
              <li><a href="/refund" className="hover:text-cyan-400 transition-colors">Refund Policy</a></li>
              <li><a href={settings.discord_url} className="hover:text-cyan-400 transition-colors">Support</a></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-white font-bold mb-6">Why Us?</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Undetected Security</span>
              </li>
              <li className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Instant Delivery</span>
              </li>
              <li className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>24/7 Support</span>
              </li>
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div>
            <h4 className="text-white font-bold mb-6">Stay Updated</h4>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
              <p className="text-xs text-slate-400 mb-4">Join our Discord for the latest updates and giveaways.</p>
              <a 
                href={settings.discord_url}
                className="block w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold text-center rounded-lg transition-all shadow-lg shadow-cyan-500/20"
              >
                Join Community
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p 
            className="text-slate-500 text-sm select-none"
            title="©"
          >
            {settings.footer_copyright || '© 2025 Cheatloop. All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
