import React from 'react';
import { useLanguage, Lang } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const PolicyLanguageSwitcher = () => {
  const { lang, setLang } = useLanguage();

  const languages: { code: Lang; label: string; flag: string }[] = [
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 mr-2">
        <Globe className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Language</span>
      </div>
      {languages.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300",
            lang === l.code
              ? "bg-cyan-500/20 border-cyan-500/50 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20"
          )}
        >
          <span className="text-lg">{l.flag}</span>
          <span className="text-sm font-medium">{l.label}</span>
        </button>
      ))}
    </div>
  );
};

export default PolicyLanguageSwitcher;
