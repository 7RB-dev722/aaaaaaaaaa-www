import React from 'react';
import { AnimatedBackground } from './AnimatedBackground';
import { ShieldBan, Lock } from 'lucide-react';

export const AccessDeniedPage = ({ country, reason, message }: { country?: string; reason?: string; message?: string }) => {
  // Use the admin-provided message if available.
  // If not, use a generic, professional fallback that does NOT mention VPNs, location, or error codes.
  const displayMessage = message || "Access to this resource is currently restricted by the administrator.";

  return (
    <div className="min-h-screen bg-[#030014] relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background elements */}
      <AnimatedBackground />
      
      {/* Optional: Subtle background glow for atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-black/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 md:p-12 text-center shadow-2xl shadow-black/50 ring-1 ring-white/10">
          
          {/* Icon */}
          <div className="mb-8 relative inline-block">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse"></div>
            <div className="relative bg-white/5 p-6 rounded-2xl border border-white/10 ring-1 ring-white/5">
              <ShieldBan className="w-16 h-16 text-red-500" strokeWidth={1.5} />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
            Access Restricted
          </h1>

          {/* Divider */}
          <div className="w-16 h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent mx-auto mb-8 rounded-full"></div>

          {/* Message */}
          <div className="space-y-4">
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed font-light whitespace-pre-line">
              {displayMessage}
            </p>
            
            {/* Optional: Reference ID for support (without revealing error code) 
                We generate a random request ID looks professional but means nothing, 
                or just omit it as requested "no error code". 
                The user said "no error code", so we omit it. 
            */}
          </div>

          {/* Footer / Copyright or clean exit */}
          <div className="mt-12 pt-8 border-t border-white/5">
            <p className="text-sm text-gray-600 font-mono uppercase tracking-widest">
              Security Gateway
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
