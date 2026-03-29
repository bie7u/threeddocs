import { createContext, useContext, useState, ReactNode } from 'react';
import { Locale, getStoredLocale, setStoredLocale, translate } from './index';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'pl',
  setLocale: () => {},
  t: (key) => key,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale);

  const setLocale = (newLocale: Locale) => {
    setStoredLocale(newLocale);
    setLocaleState(newLocale);
  };

  const t = (key: string, params?: Record<string, string | number>) => translate(key, locale, params);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
