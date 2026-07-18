import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { create } from 'zustand';
import { useSettingsStore } from '@/store/settingsStore';
import { musicPlaylist, sfxSources, type SfxName } from './sounds';

/**
 * Live playback state of the shared gameplay music player, for UI such as the
 * in-game music control bar. Read-only outside this service — it is updated by
 * `syncMusic()` every time playback is (re)evaluated.
 */
export const useMusicPlayback = create<{ playing: boolean }>(() => ({ playing: false }));

type Player = ReturnType<typeof createAudioPlayer>;

const players: Partial<Record<SfxName, Player>> = {};
/**
 * One lazily created player per playlist track. Exactly one is ever audible;
 * the others stay paused. Kept as separate players (rather than swapping one
 * player's source) so the hand-off between tracks is instant and glitch-free.
 */
const musicPlayers: (Player | null)[] = musicPlaylist.map(() => null);
const musicListeners: (ReturnType<Player['addListener']> | null)[] = musicPlaylist.map(() => null);
/** Index into `musicPlaylist` of the track currently in rotation. */
let currentTrack = 0;
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

/**
 * Lazily create (and cache) the player for one playlist track. Tracks do NOT
 * loop individually — when one ends, the finish listener advances the
 * rotation to the next track, so the pair plays alternately forever:
 * track 1, then track 2, then track 1 again, and so on.
 */
function ensureTrack(index: number): Player | null {
  try {
    let p = musicPlayers[index];
    if (!p) {
      p = createAudioPlayer(musicPlaylist[index]);
      p.loop = false;
      p.volume = useSettingsStore.getState().musicVolume;
      musicPlayers[index] = p;
      musicListeners[index] = p.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) advanceTrack(index);
      });
    }
    return p;
  } catch {
    return null;
  }
}

/** The player for the track currently in rotation. */
function ensureMusic(): Player | null {
  return ensureTrack(currentTrack);
}

/**
 * A track finished: rewind it for its next appearance and hand the rotation
 * to the following track (wrapping), which starts immediately if music
 * should be audible right now.
 */
function advanceTrack(finished: number): void {
  try {
    if (finished !== currentTrack) return; // stale event from a paused player
    const p = musicPlayers[finished];
    if (p) void p.seekTo(0);
    currentTrack = (currentTrack + 1) % musicPlaylist.length;
    syncMusic();
  } catch {
    // ignore
  }
}

/** Push the current music level to every live player (called on volume changes). */
export function applyMusicVolume(): void {
  try {
    const volume = useSettingsStore.getState().musicVolume;
    musicPlayers.forEach((p) => {
      if (p) p.volume = volume;
    });
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
  if (active) {
    userPaused = false; // each match starts with music on
    // Every match opens with track 1 from its beginning, as designed.
    try {
      musicPlayers.forEach((p, i) => {
        if (p && i !== currentTrack) p.pause();
      });
      if (currentTrack !== 0) {
        musicPlayers[currentTrack]?.pause();
        currentTrack = 0;
      }
      void musicPlayers[0]?.seekTo(0);
    } catch {
      // ignore
    }
  }
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

/** Start/stop the gameplay playlist to match the music toggle, and apply the level. */
export function syncMusic(): void {
  try {
    const { music, musicVolume } = useSettingsStore.getState();
    const p = ensureMusic();
    const shouldPlay = !!p && music && gameplayActive && !userPaused;
    // Only the track in rotation may sound; all others stay paused.
    musicPlayers.forEach((other, i) => {
      if (other && i !== currentTrack) other.pause();
    });
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
    musicPlayers.forEach((p) => p?.pause());
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
    musicListeners.forEach((l, i) => {
      l?.remove();
      musicListeners[i] = null;
    });
    musicPlayers.forEach((p, i) => {
      p?.remove();
      musicPlayers[i] = null;
    });
    currentTrack = 0;
    initialized = false;
  } catch {
    // ignore
  }
}
