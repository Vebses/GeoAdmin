'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTranslations, t, defaultLanguage } from '@/lib/i18n/config';
import type { Language, Translations } from '@/lib/i18n/config';

const STORAGE_KEY = 'geoadmin_language';

export function useTranslations() {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [translations, setTranslations] = useState<Translations>(getTranslations(defaultLanguage));

  // Load language from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && (stored === 'ka' || stored === 'en')) {
      setLanguageState(stored);
      setTranslations(getTranslations(stored));
    }
  }, []);

  // Change language
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    setTranslations(getTranslations(lang));
    localStorage.setItem(STORAGE_KEY, lang);
    
    // Update document lang attribute
    document.documentElement.lang = lang;
  }, []);

  // Translate function
  const translate = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return t(translations, key, params);
    },
    [translations]
  );

  return {
    language,
    setLanguage,
    translations,
    t: translate,
  };
}

export default useTranslations;
