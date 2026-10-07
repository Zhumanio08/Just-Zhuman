import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { enUS, ru as ruLocale } from 'date-fns/locale';
import { en } from '../i18n/en';
import { ru } from '../i18n/ru';

const dictionaries = { en, ru };
const LanguageContext = createContext();

/**
 * Language Context
 * Lightweight i18n (EN/RU) without external dependencies.
 * - t('key') with {placeholder} interpolation and English fallback
 * - lang persisted to localStorage, mirrored to <html lang>
 * - dateLocale: date-fns locale for localized date formatting
 */
export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('app_language');
      if (saved === 'en' || saved === 'ru') return saved;
    } catch {
      // ignore storage errors
    }
    return (navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'en';
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_language', lang);
    } catch {
      // ignore storage errors
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next) => {
    if (next === 'en' || next === 'ru') setLangState(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === 'ru' ? 'en' : 'ru'));
  }, []);

  const t = useCallback(
    (key, vars) => {
      let text = dictionaries[lang]?.[key] ?? dictionaries.en[key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([name, value]) => {
          text = text.split(`{${name}}`).join(String(value));
        });
      }
      return text;
    },
    [lang]
  );

  const dateLocale = lang === 'ru' ? ruLocale : enUS;

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, t, dateLocale }),
    [lang, setLang, toggleLang, t, dateLocale]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
