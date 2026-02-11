import React, { useState, useEffect } from 'react';
import { MessageCircle, Menu, X, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';

const Header = () => {
  const [clickCount, setClickCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { settings } = useSettings();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (clickCount > 0 && clickCount < 7) {
      const timerId = setTimeout(() => setClickCount(0), 3000);
      return () => clearTimeout(timerId);
    }
  }, [clickCount]);

  const handleLogoClick = (e: React.MouseEvent) => {
    // Secret admin access: Click logo 7 times
    const newCount = clickCount + 1;
    if (newCount === 7) {
      navigate('/admin');
      setClickCount(0);
    } else {
      setClickCount(newCount);
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
        scrolled ? 'py-4' : 'py-6'
      }`}
    >
      <div className="container mx-auto px-6">
        <div className={`
          relative flex items-center justify-between px-6 py-3 rounded-2xl transition-all duration-500
          ${scrolled 
            ? 'bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]' 
            : 'bg-transparent border border-transparent'}
        `}>
          {/* Logo */}
          <div onClick={handleLogoClick} className="cursor-pointer select-none">
            <Link to="/" className="flex items-center space-x-3 group" onClick={(e) => clickCount > 0 && e.preventDefault()}>
              <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl border border-white/10 group-hover:border-cyan-500/50 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <img 
                  src={settings.site_logo_url || '/cheatloop copy.png'} 
                  alt="Logo" 
                  className="w-6 h-6 object-contain relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-white tracking-wider group-hover:text-cyan-400 transition-colors">
                  {settings.site_name || 'CHEATLOOP'}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav - Enhanced Buttons */}
          <nav className="hidden md:flex items-center space-x-4 rtl:space-x-reverse">
            {[
              { name: 'HOME', url: '/' },
              { name: 'PRODUCTS', url: '/#products' }, // Changed to absolute path for hash link
              { name: 'GALLERY', url: '/winning-photos' },
              { name: 'VIDEOS', url: '/video-studio' },
            ].map((link) => (
              <a 
                key={link.name}
                href={link.url}
                className="relative px-6 py-2 rounded-lg border border-white/10 bg-white/5 overflow-hidden group transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 text-xs font-bold text-gray-300 group-hover:text-white tracking-widest transition-colors">
                  {link.name}
                </span>
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-6 rtl:space-x-reverse">
            <div className="hidden md:flex items-center space-x-4">
              <a href={settings.discord_url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-[#5865F2] transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 mt-4 p-6 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-fade-in-up">
            <nav className="flex flex-col space-y-4">
              {[
                { name: 'HOME', url: '/' },
                { name: 'PRODUCTS', url: '/#products' },
                { name: 'GALLERY', url: '/winning-photos' },
                { name: 'VIDEOS', url: '/video-studio' },
              ].map((link) => (
                <a 
                  key={link.name}
                  href={link.url}
                  className="flex items-center space-x-4 p-4 rounded-xl hover:bg-white/5 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-sm font-bold text-white tracking-widest">{link.name}</span>
                </a>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
