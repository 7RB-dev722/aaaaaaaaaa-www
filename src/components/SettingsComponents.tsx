import React from 'react';
import { LucideIcon } from 'lucide-react';

export const SectionWrapper: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 shadow-lg animate-fade-in-up">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-3">
            <Icon className="w-6 h-6 text-cyan-400" />
            <span>{title}</span>
        </h3>
        <div className="space-y-6">{children}</div>
    </div>
);

export const InputField: React.FC<{ label: string; value: string; onChange: (val: string) => void; placeholder?: string; type?: string }> = ({ label, value, onChange, placeholder, type = "text" }) => (
    <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</label>
        <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-all hover:bg-white/5"
        />
    </div>
);

export const TextAreaField: React.FC<{ label: string; value: string; onChange: (val: string) => void; placeholder?: string; rows?: number }> = ({ label, value, onChange, placeholder, rows = 3 }) => (
    <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</label>
        <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full p-3 bg-black border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-all hover:bg-white/5"
        />
    </div>
);

export const ToggleSwitch: React.FC<{ label: string; enabled: boolean; onChange: (enabled: boolean) => void }> = ({ label, enabled, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/10">
        <span className="text-gray-300 font-medium text-sm">{label}</span>
        <button 
            onClick={() => onChange(!enabled)} 
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-black ${enabled ? 'bg-cyan-600' : 'bg-white/20'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);
