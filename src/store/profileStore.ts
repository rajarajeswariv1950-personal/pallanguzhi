import { create } from 'zustand';
import { storage, StorageKeys } from '@/utils/persist';

interface ProfileState {
  name: string;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setName: (name: string) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  name: '',
  hydrated: false,
  hydrate: async () => {
    const name = (await storage.getString(StorageKeys.profileName)) ?? '';
    set({ name, hydrated: true });
  },
  setName: async (name) => {
    const trimmed = name.trim();
    set({ name: trimmed });
    await storage.setString(StorageKeys.profileName, trimmed);
  },
}));
