import { enTranslations } from './locales/en';
import { hiTranslations } from './locales/hi';
import { bnTranslations } from './locales/bn';
import { teTranslations } from './locales/te';
import { mrTranslations } from './locales/mr';
import { taTranslations } from './locales/ta';
import { guTranslations } from './locales/gu';
import { knTranslations } from './locales/kn';
import { orTranslations } from './locales/or';
import { mlTranslations } from './locales/ml';
import { paTranslations } from './locales/pa';
import { urTranslations } from './locales/ur';
import { translateGlossaryPhrase } from './glossary';

export type LanguageKey =
  | 'en-IN'
  | 'hi-IN'
  | 'bn-IN'
  | 'te-IN'
  | 'mr-IN'
  | 'ta-IN'
  | 'gu-IN'
  | 'ur-IN'
  | 'kn-IN'
  | 'or-IN'
  | 'ml-IN'
  | 'pa-IN';

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  'en-IN': enTranslations,
  'hi-IN': hiTranslations,
  'bn-IN': bnTranslations,
  'te-IN': teTranslations,
  'mr-IN': mrTranslations,
  'ta-IN': taTranslations,
  'gu-IN': guTranslations,
  'kn-IN': knTranslations,
  'or-IN': orTranslations,
  'ml-IN': mlTranslations,
  'pa-IN': paTranslations,
  'ur-IN': urTranslations,
};

/**
 * Retrieves a translated string for a given key, language code, and interpolation parameters.
 * Falls back gracefully to English if the translation is missing.
 */
export const getTranslation = (
  key: string,
  langCode: string = 'en-IN',
  params?: Record<string, any>,
  fallback?: string
): string => {
  const code = langCode || 'en-IN';
  const langDict = TRANSLATIONS[code] || TRANSLATIONS['en-IN'];
  let text = langDict[key] || TRANSLATIONS['en-IN']?.[key] || fallback || key;

  if (params) {
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
    });
  }

  return text;
};

/**
 * Translates an arbitrary phrase, category, state, occupation, or status dynamically.
 */
export const translatePhrase = (phrase: string, langCode: string = 'en-IN'): string => {
  return translateGlossaryPhrase(phrase, langCode);
};
