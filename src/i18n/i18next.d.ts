import 'i18next';
import type { TranslationSchema } from './translations/en';

// Gives `t('...')` full key autocompletion and compile-time safety.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: TranslationSchema;
    };
  }
}
