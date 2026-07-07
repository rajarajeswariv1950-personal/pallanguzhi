import { useTranslation } from 'react-i18next';

/**
 * Single import site for translations. `t(...)` renders in the ONE currently
 * selected language — the app is single-language after the user picks a language
 * on the first screen. Key types are provided globally by src/i18n/i18next.d.ts,
 * so `t('home.play')` is fully type-checked.
 */
export function useAppTranslation() {
  const { t, i18n } = useTranslation();
  return { t, i18n, language: i18n.language };
}
