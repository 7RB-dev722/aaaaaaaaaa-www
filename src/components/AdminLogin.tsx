import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = useSettings();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!supabase) {
      setError('Supabase client is not available. Check console for details.');
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      // onAuthStateChange in AdminPanel will handle the redirect
    }
  };

  return (
    <div className="min-h-screen bg-[#0f071c] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#1a1229]/50 via-[#0f071c] to-[#05020a]"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -ml-20 -mb-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="bg-[#1a1229]/60 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md border border-purple-500/20 shadow-2xl shadow-black/50 animate-fade-in-up relative z-10">
        
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-[#1a1229] to-[#0f071c] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/30 shadow-lg shadow-purple-900/20 group hover:border-purple-400/50 transition-all duration-500">
            <img 
              src={settings.site_logo_url || '/cheatloop copy.png'} 
              alt="Cheatloop Logo" 
              className="w-16 h-16 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          
          <h2 className="text-lg font-bold text-purple-400 mb-6 tracking-widest uppercase font-mono">Cheatloop Admin</h2>

          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-purple-200/60 text-sm">Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-2 ml-1">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-purple-400/50 group-focus-within:text-purple-400 transition-colors" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-[#0f071c]/50 border border-purple-500/20 rounded-xl text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all duration-200 sm:text-sm"
                placeholder="admin@cheatloop.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-2 ml-1">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-purple-400/50 group-focus-within:text-purple-400 transition-colors" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-12 py-3 bg-[#0f071c]/50 border border-purple-500/20 rounded-xl text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all duration-200 sm:text-sm"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-purple-400/50 hover:text-purple-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3 animate-fade-in-up">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-[#0f071c] transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-purple-200/40 text-xs">
            © 2025 Cheatloop Admin Panel. Secure Access Only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
