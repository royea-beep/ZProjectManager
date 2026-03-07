import { useState, useEffect, createContext, useContext } from 'react';

type Language = 'en' | 'he';

interface LanguageContextType {
  lang: Language;
  dir: 'ltr' | 'rtl';
  setLang: (l: Language) => void;
  t: (en: string, he: string) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  dir: 'ltr',
  setLang: () => {},
  t: (en) => en,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useLanguageProvider(): LanguageContextType {
  const [lang, setLangState] = useState<Language>(
    () => (localStorage.getItem('zpm_lang') as Language) || 'en'
  );

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('zpm_lang', l);
    document.documentElement.dir = l === 'he' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  }, []);

  return {
    lang,
    dir: lang === 'he' ? 'rtl' : 'ltr',
    setLang,
    t: (en: string, he: string) => (lang === 'he' ? he : en),
  };
}

export function detectDir(text: string): 'rtl' | 'ltr' {
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text.charAt(0)) ? 'rtl' : 'ltr';
}
