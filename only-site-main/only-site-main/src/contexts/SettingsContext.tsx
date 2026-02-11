import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { settingsService } from '../lib/supabase';
import { retry } from '../lib/utils';

interface Settings {
  [key: string]: string;
}

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  error: string | null;
}

const defaultSettings = {
  discord_url: 'https://discord.gg/sY5EcUVjeA',
  whatsapp_url: 'https://api.whatsapp.com/send?phone=9647832941204',
  telegram_url: 'https://t.me/+UbDn_RQ7pBw4MjRi',
  telegram_purchase_url: '',
  i_have_paid_link: '', // New setting for direct payment confirmation link
  site_name: 'Cheatloop',
  site_logo_url: '/cheatloop copy.png',
  site_favicon_url: '/vite.svg',
  hero_title: 'Dominate the Game',
  hero_subtitle: 'Professional gaming tools for PUBG Mobile & Call of Duty Mobile. Safe, reliable, and designed for competitive players.',
  feature_1_title: '100% Safe',
  feature_1_desc: 'Protected from bans',
  feature_2_title: 'Precision Tools',
  feature_2_desc: 'Advanced aimbot & ESP',
  feature_3_title: 'Instant Access',
  feature_3_desc: 'Download immediately',
  footer_copyright: '© 2025 Cheatloop. All rights reserved. Use responsibly and at your own risk.',
  show_whatsapp_button: 'true',
  show_telegram_button: 'true',
  product_card_note: 'After purchase, contact us to get your key and product',
  show_all_whatsapp_buttons: 'true',
  show_product_card_note: 'true',
  product_card_size: 'default',
  show_i_have_paid_button: 'true',
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  error: null,
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        // Retry fetching settings up to 3 times to handle cold starts or network blips
        const fetchedSettings = await retry(() => settingsService.getSettings(), 3, 1000);
        
        setSettings(prev => ({ ...defaultSettings, ...fetchedSettings }));
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch settings after retries:", err);
        setError("Could not load site settings. Using default values.");
        // We keep the default settings in case of error
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Effect to update the favicon dynamically
  useEffect(() => {
    if (settings.site_favicon_url) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = settings.site_favicon_url;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [settings.site_favicon_url]);

  return (
    <SettingsContext.Provider value={{ settings, loading, error }}>
      {children}
    </SettingsContext.Provider>
  );
};
