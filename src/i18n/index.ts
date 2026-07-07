import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './translations/en';
import ta from './translations/ta';

export const supportedLanguages = ['en', 'ta'] as const;
export type AppLanguage = (typeof supportedLanguages)[number];

export const resources = {
  en: { translation: en },
  ta: { translation: ta },
} as const;

let initialized = false;

/**
 * Initialise i18next once, or switch language if already initialised.
 * Safe to call repeatedly.
 */
export function initI18n(language: AppLanguage): typeof i18n {
  if (!initialized) {
    void i18n.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: 'en',
      supportedLngs: supportedLanguages as unknown as string[],
      interpolation: { escapeValue: false },
      returnNull: false,
      // Suspense off: RN/Expo Go does not need React Suspense for translations.
      react: { useSuspense: false },
    });
    initialized = true;
  } else if (i18n.language !== language) {
    void i18n.changeLanguage(language);
  }
  return i18n;
}

export function isSupportedLanguage(value: unknown): value is AppLanguage {
  return (
    typeof value === 'string' &&
    (supportedLanguages as readonly string[]).includes(value)
  );
}

export default i18n;
