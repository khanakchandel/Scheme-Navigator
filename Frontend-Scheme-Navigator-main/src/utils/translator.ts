/**
 * Native Language Helper
 * Manages document language attributes, direction, and storage synchronization cleanly.
 * Fully independent of external translation services.
 */

export const getShortLangCode = (bcp47Code: string): string => {
  if (!bcp47Code) return 'en';
  return bcp47Code.split('-')[0].toLowerCase();
};

export const applySiteLanguage = (bcp47Code: string) => {
  if (typeof document === 'undefined') return;
  const shortCode = getShortLangCode(bcp47Code);
  document.documentElement.lang = shortCode;

  // The entire web app shell is designed for LTR orientation.
  // Lock document.documentElement.dir strictly to 'ltr' so language change never flips or distorts the UI.
  document.documentElement.dir = 'ltr';

  try {
    localStorage.setItem('scheme_navigator_language', bcp47Code);
  } catch {
    // ignore
  }
};

export const initStoredLanguage = () => {
  if (typeof window === 'undefined') return;
  try {
    const savedCode = localStorage.getItem('scheme_navigator_language');
    if (savedCode) {
      applySiteLanguage(savedCode);
    } else {
      applySiteLanguage('en-IN');
    }
  } catch {
    // ignore
  }
};

