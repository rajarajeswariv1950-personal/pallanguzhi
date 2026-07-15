import { create } from 'zustand';
import { storage, StorageKeys } from '@/utils/persist';

export interface Settings {
  music: boolean;
  sound: boolean;
  haptics: boolean;
  /** Background-music level, 0..1 (gentle by default). */
  musicVolume: number;
  /** How fast seeds visibly move on the board — user controlled, all modes. */
  moveSpeed: MoveSpeed;
}

export type MoveSpeed = 'relaxed' | 'normal' | 'fast';

/**
 * Milliseconds between animation frames (one seed drop / capture / scoop).
 * 'relaxed' is the default: every sown seed is easy to follow by eye.
 */
export const MOVE_SPEED_MS: Record<MoveSpeed, number> = {
  relaxed: 550,
  normal: 320,
  fast: 140,
};

type BoolSetting = 'music' | 'sound' | 'haptics';

const DEFAULTS: Settings = {
  music: true,
  sound: true,
  haptics: true,
  musicVolume: 0.35,
  moveSpeed: 'relaxed',
};

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
  setMoveSpeed: (value: MoveSpeed) => void;
}

function persist(state: Settings) {
  void storage.setJSON(StorageKeys.settings, {
    music: state.music,
    sound: state.sound,
    haptics: state.haptics,
    musicVolume: state.musicVolume,
    moveSpeed: state.moveSpeed,
  });
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,
  hydrate: async () => {
    const saved = await storage.getJSON<Partial<Settings>>(StorageKeys.settings);
    const merged = { ...DEFAULTS, ...(saved ?? {}) };
    merged.musicVolume = clampVolume(merged.musicVolume);
    if (!['relaxed', 'normal', 'fast'].includes(merged.moveSpeed)) merged.moveSpeed = 'relaxed';
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
  setMoveSpeed: (value) => {
    set({ moveSpeed: value });
    persist(get());
  },
}));
