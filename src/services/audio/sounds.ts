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
 * Background music — "Wisdom Light in Leaves", the gameplay melody. Starts
 * when a match begins (any mode), loops at a low volume via the single shared
 * music player in AudioService (never more than one instance), and stops when
 * the player leaves the board.
 */
export const ambientSource: number = require('../../../assets/audio/wisdom-light-in-leaves.mp3');
