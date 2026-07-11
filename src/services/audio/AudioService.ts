import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { create } from 'zustand';
import { useSettingsStore } from '@/store/settingsStore';
import { ambientSource, sfxSources, type SfxName } from './sounds';

/**
 * Live playback state of the shared gameplay music player, for UI such as the
 * in-game music control bar. Read-only outside this service — it is updated by
 * `syncMusic()` every time playback is (re)evaluated.
 */
export const useMusicPlayback = create<{ playing: boolean }>(() => ({ playing: false }));

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

/**
 * Whether a match is currently on screen. The background melody plays only
 * during gameplay (all modes), so menus stay quiet and navigation never
 * spawns overlapping copies — there is exactly one shared music player.
 */
let gameplayActive = false;

/**
 * Session pause requested from the in-game music control bar. Unlike the
 * Settings music toggle this is NOT persisted — it clears when a new match
 * starts, so gameplay always begins with the melody as designed.
 */
let userPaused = false;

/** Called by the gameplay screen on mount/unmount (covers every mode). */
export function setGameplayMusicActive(active: boolean): void {
  gameplayActive = active;
  if (active) userPaused = false; // each match starts with music on
  syncMusic();
}

/** In-game control bar: pause the shared gameplay loop (same single player). */
export function pauseGameplayMusic(): void {
  userPaused = true;
  syncMusic();
}

/** In-game control bar: resume the shared gameplay loop (same single player). */
export function resumeGameplayMusic(): void {
  userPaused = false;
  syncMusic();
}

/** Start/stop the gameplay loop to match the music toggle, and apply the level. */
export function syncMusic(): void {
  try {
    const { music, musicVolume } = useSettingsStore.getState();
    const p = ensureMusic();
    const shouldPlay = !!p && music && gameplayActive && !userPaused;
    if (p) {
      p.volume = musicVolume;
      if (shouldPlay) p.play();
      else p.pause();
    }
    useMusicPlayback.setState({ playing: shouldPlay });
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
