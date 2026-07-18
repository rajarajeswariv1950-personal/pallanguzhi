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
 * Background music — the owner-supplied gameplay playlist, in play order.
 * Track 1 (the calm "pure magic" relaxation piece) always opens the match;
 * when it ends, track 2 (the Indian classical instrumental fusion) follows;
 * after both finish the pair repeats, alternating forever. Music starts
 * automatically ONLY when a match begins (any mode/level; the gameplay
 * screen flips `setGameplayMusicActive(true)` on mount), plays at a low
 * volume via the single shared music pipeline in AudioService (never more
 * than one track audible), and stops when the player leaves the board.
 */
export const musicPlaylist: number[] = [
  require('../../../assets/audio/pure-magic-relaxation.mp3'),
  require('../../../assets/audio/classical-fusion-peace.mp3'),
];
