import React from 'react';
import { Shield, Zap, Mail, MessageCircle, Phone } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const Footer = () => {
  const { settings, loading } = useSettings();

  return (
    <footer className="text-white py-12 relative z-20">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Zap className="w-8 h-8 text-cyan-400" />
              <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {settings.site_name || 'Cheatloop'}
              </h3>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Professional gaming tools designed for competitive players. 
              Safe, reliable, and constantly updated.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-bold mb-4 text-cyan-400">Safety Guarantee</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">Safe for Main Accounts</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">Anti-Detection Technology</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">Regular Updates</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-bold mb-4 text-cyan-400">Support</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">24/7 Customer Support</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">Live Chat Available</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4 text-cyan-400">Contact Us</h4>
            <div className="space-y-3">
              <a 
                href={loading ? '#' : settings.discord_url}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-300 hover:text-purple-400 transition-colors duration-200"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">Discord Server</span>
              </a>
              <a 
                href={loading ? '#' : settings.whatsapp_url}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-300 hover:text-green-400 transition-colors duration-200"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm">WhatsApp</span>
              </a>
              <a 
                href={loading ? '#' : settings.telegram_url}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 transition-colors duration-200"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">Telegram</span>
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-700/50 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            {settings.footer_copyright || '© 2025 Cheatloop. All rights reserved. Use responsibly and at your own risk.'}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
