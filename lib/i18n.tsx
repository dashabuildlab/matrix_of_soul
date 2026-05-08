import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import uk from '@/locales/uk';
import en from '@/locales/en';
import es from '@/locales/es';
import zh from '@/locales/zh';
import ar from '@/locales/ar';
import de from '@/locales/de';
import fr from '@/locales/fr';
import ptBR from '@/locales/pt-BR';
import type { Translations } from '@/locales/uk';

const LOCALES: Record<string, Translations> = {
  en,
  'en-GB': en,
  uk,
  es,
  zh,
  ar,
  de,
  fr,
  'pt-BR': ptBR,
};

const STORAGE_KEY = 'app_language';
const RTL_LOCALES = new Set(['ar']);

/** Apply RTL layout direction. React Native requires a full restart to take effect. */
function applyRTL(locale: string) {
  const shouldBeRTL = RTL_LOCALES.has(locale);
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.forceRTL(shouldBeRTL);
    // Note: app must restart for RTL to take effect. Expo Go: shake → reload.
    // Production: triggered by RCTReloadCommand via expo-updates or native restart.
  }
}

type I18nContextValue = {
  locale: string;
  t: Translations;
  setLocale: (lang: string) => void;
};

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  t: en,
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored && LOCALES[stored]) {
        setLocaleState(stored);
        applyRTL(stored);
      }
    });
  }, []);

  const setLocale = (lang: string) => {
    if (!LOCALES[lang]) return;
    setLocaleState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang);
    applyRTL(lang);
  };

  const t = LOCALES[locale] ?? en;

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
