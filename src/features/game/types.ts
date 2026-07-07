/**
 * Core game types shared across UI, navigation, and (later) the rules engine.
 * The deterministic engine itself lands in Phase 3; these primitives are the
 * stable contract everything else builds on.
 */

export type GameMode = 'single' | 'sameDevice' | 'online';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Outcome = 'win' | 'lose' | 'draw';

/** A standard Pallanguzhi board: 2 rows of 7 pits. */
export const BOARD_ROWS = 2 as const;
export const PITS_PER_ROW = 7 as const;
export const TOTAL_PITS = BOARD_ROWS * PITS_PER_ROW;

export type PlayerId = 0 | 1;
