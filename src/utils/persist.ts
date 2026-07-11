import AsyncStorage from '@react-native-async-storage/async-storage';

/** Namespaced storage keys. */
export const StorageKeys = {
  language: 'pnp.language',
  settings: 'pnp.settings',
  profileName: 'pnp.profile.name',
  entitlement: 'pnp.entitlement',
  musicHintDismissed: 'pnp.musicHintDismissed',
} as const;

/**
 * Thin, failure-tolerant wrapper over AsyncStorage.
 * Works on web (localStorage), iOS, and Android.
 */
export const storage = {
  async getString(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setString(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // non-fatal
    }
  },
  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  async setJSON(key: string, value: unknown): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // non-fatal
    }
  },
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // non-fatal
    }
  },
};
