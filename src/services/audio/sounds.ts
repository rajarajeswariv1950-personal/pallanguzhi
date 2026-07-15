/** Registry of audio assets (relative requires for Metro reliability). */
export type SfxName = 'tap' | 'seed' | 'capture' | 'turn' | 'win';

export const sfxSources: Record<SfxName, number> = {
  tap: require('../../../assets/audio/tap.wav'),
  seed: require('../../../assets/audio/seed.wav'),
  capture: require('../../../assets/audio/capture.wav'),
  turn: require('../../../assets/audio/turn.wav'),
  win: require('../../../assets/audio/win.wav'),
};

/**
 * Background music — the owner-supplied Indian classical instrumental fusion
 * track. Starts automatically ONLY when a match begins (any mode/level; the
 * gameplay screen flips `setGameplayMusicActive(true)` on mount), loops at a
 * low volume via the single shared music player in AudioService (never more
 * than one instance), and stops when the player leaves the board.
 */
export const ambientSource: number = require('../../../assets/audio/classical-fusion-peace.mp3');
