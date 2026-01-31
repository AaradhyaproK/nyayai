'use client';

import { createContext, useState, ReactNode, useEffect } from 'react';
import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import mr from '@/locales/mr.json';

const translations: Record<string, any> = { en, hi, mr };

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string, options?: Record<string, string>) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState('en');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const storedLang = localStorage.getItem('language');
    if (storedLang && translations[storedLang]) {
      setLanguage(storedLang);
    }
    setLoaded(true);
  }, []);

  const handleSetLanguage = (lang: string) => {
    if (translations[lang]) {
      setLanguage(lang);
      localStorage.setItem('language', lang);
    }
  };

  const t = (key: string, options?: Record<string, string>): string => {
    const keys = key.split('.');
    let result = translations[language];
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        // Fallback to English if translation not found
        let fallbackResult = translations['en'];
        for (const fk of keys) {
            fallbackResult = fallbackResult?.[fk];
        }
        if (fallbackResult === undefined) {
            return key;
        }
        result = fallbackResult;
        break;
      }
    }
    
    let strResult = String(result);

    if (options) {
        Object.keys(options).forEach(optKey => {
            strResult = strResult.replace(`{{${optKey}}}`, options[optKey]);
        });
    }

    return strResult;
  };

  if (!loaded) {
    return null; // or a loading spinner
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
