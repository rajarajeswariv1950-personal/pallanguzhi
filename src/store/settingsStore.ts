import { create } from 'zustand';
import { storage, StorageKeys } from '@/utils/persist';

export interface Settings {
  music: boolean;
  sound: boolean;
  haptics: boolean;
  /** Background-music level, 0..1 (gentle by default). */
  musicVolume: number;
}

type BoolSetting = 'music' | 'sound' | 'haptics';

const DEFAULTS: Settings = { music: true, sound: true, haptics: true, musicVolume: 0.35 };

/** Volume is adjusted in fixed, user-friendly steps and clamped to [0, 1]. */
export const VOLUME_STEP = 0.1;
const clampVolume = (v: number) => Math.max(0, Math.min(1, Math.round(v * 100) / 100));

interface SettingsState extends Settings {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  toggle: (key: BoolSetting) => void;
  setValue: (key: BoolSetting, value: boolean) => void;
  setMusicVolume: (value: number) => void;
  adjustMusicVolume: (delta: number) => void;
}

function persist(state: Settings) {
  void storage.setJSON(StorageKeys.settings, {
    music: state.music,
    sound: state.sound,
    haptics: state.haptics,
    musicVolume: state.musicVolume,
  });
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,
  hydrate: async () => {
    const saved = await storage.getJSON<Partial<Settings>>(StorageKeys.settings);
    const merged = { ...DEFAULTS, ...(saved ?? {}) };
    merged.musicVolume = clampVolume(merged.musicVolume);
    set({ ...merged, hydrated: true });
  },
  toggle: (key) => {
    set({ [key]: !get()[key] } as Pick<Settings, BoolSetting>);
    persist(get());
  },
  setValue: (key, value) => {
    set({ [key]: value } as Pick<Settings, BoolSetting>);
    persist(get());
  },
  setMusicVolume: (value) => {
    set({ musicVolume: clampVolume(value) });
    persist(get());
  },
  adjustMusicVolume: (delta) => {
    set({ musicVolume: clampVolume(get().musicVolume + delta) });
    persist(get());
  },
}));
