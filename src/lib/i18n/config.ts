import { ka } from './translations/ka';
import { en } from './translations/en';

export type Language = 'ka' | 'en';

export const languages: Record<Language, { name: string; nativeName: string }> = {
  ka: { name: 'Georgian', nativeName: 'ქართული' },
  en: { name: 'English', nativeName: 'English' },
};

export const translations = {
  ka,
  en,
};

export const defaultLanguage: Language = 'ka';

export type Translations = typeof ka;

export function getTranslations(language: Language = defaultLanguage): Translations {
  return translations[language] || translations[defaultLanguage];
}

// Helper to get nested translation key
export function t(
  translations: Translations,
  key: string,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Return key if not found
    }
  }
  
  if (typeof value !== 'string') {
    return key;
  }
  
  // Replace parameters
  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, p) => String(params[p] ?? `{${p}}`));
  }
  
  return value;
}

export default translations;
