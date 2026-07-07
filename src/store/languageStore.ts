import { create } from 'zustand';
import * as Localization from 'expo-localization';
import { storage, StorageKeys } from '@/utils/persist';
import i18n, { initI18n, isSupportedLanguage, type AppLanguage } from '@/i18n';

function detectDeviceLanguage(): AppLanguage {
  try {
    const locales = Localization.getLocales();
    const code = locales?.[0]?.languageCode?.toLowerCase();
    if (code === 'ta') return 'ta';
  } catch {
    // ignore — fall back to English
  }
  return 'en';
}

interface LanguageState {
  /** Null until the user has explicitly chosen a language. Drives the language-gate. */
  language: AppLanguage | null;
  /** The language i18n is actually rendering (device default before a choice). */
  resolvedLanguage: AppLanguage;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setLanguage: (lang: AppLanguage) => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: null,
  resolvedLanguage: 'en',
  hydrated: false,
  hydrate: async () => {
    // The language-selection screen must appear on EVERY app open. We therefore
    // intentionally do NOT restore a previously saved language as a *completed*
    // choice (which would auto-skip the gate). The saved/device language is used
    // only as the initial render language and as the pre-highlighted default on
    // the picker — the user still explicitly chooses every launch.
    const saved = await storage.getString(StorageKeys.language);
    const initial = isSupportedLanguage(saved) ? saved : detectDeviceLanguage();
    initI18n(initial);
    set({ language: null, resolvedLanguage: initial, hydrated: true });
  },
  setLanguage: async (lang) => {
    initI18n(lang);
    await i18n.changeLanguage(lang);
    await storage.setString(StorageKeys.language, lang);
    set({ language: lang, resolvedLanguage: lang });
  },
}));
