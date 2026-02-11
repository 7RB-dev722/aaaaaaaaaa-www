import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';
import { translations } from '../translations';
import { Translations } from '../translations/en';

type Lang = 'en' | 'ar' | 'tr';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>('ar');

  const value = useMemo(() => ({
    lang,
    setLang,
    t: translations[lang],
  }), [lang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
