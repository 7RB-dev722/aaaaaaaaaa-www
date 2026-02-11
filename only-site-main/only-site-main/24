import React, { useState, useEffect } from 'react';
import { Shield, MessageCircle, Phone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';

const Header = () => {
  const [clickCount, setClickCount] = useState(0);
  const navigate = useNavigate();
  const { settings, loading } = useSettings();

  // This effect manages the timer to reset the click count.
  useEffect(() => {
    // Only set a timer if the count is between 1 and 3.
    if (clickCount > 0 && clickCount < 4) {
      const timerId = setTimeout(() => {
        setClickCount(0); // Reset after 3 seconds of inactivity.
      }, 3000);

      // The cleanup function is crucial. It runs before the effect runs again,
      // or when the component unmounts. This prevents multiple timers from running.
      return () => clearTimeout(timerId);
    }
  }, [clickCount]); // Re-run the effect whenever clickCount changes.

  const handleYearClick = () => {
    const newCount = clickCount + 1;
    
    if (newCount === 4) {
      // If we reach 4 clicks, navigate and reset the count immediately.
      navigate('/admin');
      setClickCount(0);
    } else {
      // Otherwise, just update the count. The useEffect will handle the timer.
      setClickCount(newCount);
    }
  };

  return (
    <header className="text-white relative z-20">
      <div className="container mx-auto px-6 py-4">
        {/* Contact Links Bar */}
        <div className="flex justify-center space-x-6 mb-4 pb-4 border-b border-slate-700/50">
          <a 
            href={loading ? '#' : settings.discord_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-gray-300 hover:text-purple-400 transition-colors duration-200 text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Discord Server</span>
          </a>
          <a 
            href={loading ? '#' : settings.whatsapp_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-gray-300 hover:text-green-400 transition-colors duration-200 text-sm"
          >
            <Phone className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>
          <a 
            href={loading ? '#' : settings.telegram_url}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 transition-colors duration-200 text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Telegram</span>
          </a>
        </div>

        {/* Main Header */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-4">
            <img 
              src={settings.site_logo_url || '/cheatloop copy.png'} 
              alt="Site Logo" 
              className="w-12 h-12 object-contain"
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              {settings.site_name || 'Cheatloop'}
            </h1>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-medium">Safe for Main Accounts</span>
            </div>
            <button 
              onClick={handleYearClick}
              className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 text-sm cursor-pointer"
            >
              2025
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
