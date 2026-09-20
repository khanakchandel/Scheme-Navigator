import { useAppStore } from '../store/appStore';
import { getTranslation, translatePhrase } from '../i18n/translations';

export const useTranslation = () => {
  const { selectedLanguage, setSelectedLanguage } = useAppStore();
  const langCode = selectedLanguage?.code || 'en-IN';

  const t = (key: string, params?: Record<string, any>, fallback?: string): string => {
    const translated = getTranslation(key, langCode, params);
    if (translated === key && fallback) {
      return fallback;
    }
    return translated;
  };

  const tp = (phrase: string): string => {
    return translatePhrase(phrase, langCode);
  };

  const tCategory = (cat: string): string => {
    return translatePhrase(cat, langCode);
  };

  const tState = (state: string): string => {
    return translatePhrase(state, langCode);
  };

  const tOccupation = (occ: string): string => {
    return translatePhrase(occ, langCode);
  };

  const tStatus = (status: string): string => {
    return translatePhrase(status, langCode);
  };

  return {
    t,
    tp,
    tCategory,
    tState,
    tOccupation,
    tStatus,
    currentLanguage: selectedLanguage,
    langCode,
    setLanguage: setSelectedLanguage,
  };
};

