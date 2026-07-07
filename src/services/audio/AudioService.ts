import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useSettingsStore } from '@/store/settingsStore';
import { ambientSource, sfxSources, type SfxName } from './sounds';

type Player = ReturnType<typeof createAudioPlayer>;

const players: Partial<Record<SfxName, Player>> = {};
let musicPlayer: Player | null = null;
let initialized = false;
let unsubscribe: (() => void) | null = null;

function getPlayer(name: SfxName): Player | null {
  try {
    let p = players[name];
    if (!p) {
      p = createAudioPlayer(sfxSources[name]);
      p.volume = 0.9;
      players[name] = p;
    }
    return p;
  } catch {
    return null;
  }
}

/** Play a one-shot sound effect, honouring the sound toggle. Never throws. */
export function playSfx(name: SfxName): void {
  try {
    if (!useSettingsStore.getState().sound) return;
    const p = getPlayer(name);
    if (!p) return;
    // restart so rapid repeats retrigger cleanly
    void p.seekTo(0);
    p.play();
  } catch {
    // audio unavailable — silently ignore
  }
}

function ensureMusic(): Player | null {
  try {
    if (!musicPlayer) {
      musicPlayer = createAudioPlayer(ambientSource);
      musicPlayer.loop = true;
      musicPlayer.volume = useSettingsStore.getState().musicVolume;
    }
    return musicPlayer;
  } catch {
    return null;
  }
}

/** Push the current music level to the live player (called on volume changes). */
export function applyMusicVolume(): void {
  try {
    if (musicPlayer) musicPlayer.volume = useSettingsStore.getState().musicVolume;
  } catch {
    // ignore
  }
}

/** Start/stop the ambient loop to match the music toggle, and apply the level. */
export function syncMusic(): void {
  try {
    const { music, musicVolume } = useSettingsStore.getState();
    const p = ensureMusic();
    if (!p) return;
    p.volume = musicVolume;
    if (music) p.play();
    else p.pause();
  } catch {
    // ignore (e.g. web autoplay restrictions before first gesture)
  }
}

export function stopMusic(): void {
  try {
    musicPlayer?.pause();
  } catch {
    // ignore
  }
}

/** One-time audio init: configure the audio mode and react to music toggles. */
export async function initAudio(): Promise<void> {
  if (initialized) return;
  initialized = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: false,
    });
  } catch {
    // not supported on this platform — ignore
  }
  unsubscribe = useSettingsStore.subscribe((state, prev) => {
    if (state.music !== prev.music) syncMusic();
    else if (state.musicVolume !== prev.musicVolume) applyMusicVolume();
  });
  syncMusic();
}

/** For completeness (hot-reload / teardown). */
export function disposeAudio(): void {
  try {
    unsubscribe?.();
    unsubscribe = null;
    Object.values(players).forEach((p) => p?.remove());
    musicPlayer?.remove();
    musicPlayer = null;
    initialized = false;
  } catch {
    // ignore
  }
}
