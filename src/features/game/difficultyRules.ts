import { DEFAULT_RULES, type RuleConfig } from './engine';
import type { Difficulty } from './types';

/**
 * Rule variants that give TWO-PLAYER matches (same device & online) three
 * distinct levels of play. There is no AI in two-player games, so difficulty
 * is expressed through the board rules instead:
 *
 *  - easy:   4 seeds per pit, kāsu (capture-on-four) OFF — shorter, simpler rounds.
 *  - medium: the classic 6-seed game with the kāsu rule (identical to DEFAULT_RULES).
 *  - hard:   7 seeds per pit with the kāsu rule — longer, deeper matches.
 *
 * Single-player difficulty stays AI-strength based (see ai.ts) on the classic
 * board; these variants apply only to sameDevice and online modes. The map is
 * deterministic, so both online clients derive the identical initial state
 * from the difficulty stored in the shared room document.
 */
export const TWO_PLAYER_RULES: Record<Difficulty, RuleConfig> = {
  easy: { ...DEFAULT_RULES, seedsPerPit: 4, captureOnFour: false },
  medium: { ...DEFAULT_RULES },
  hard: { ...DEFAULT_RULES, seedsPerPit: 7 },
};

/** Rules for a two-player match; unknown/missing difficulty falls back to classic. */
export function rulesForTwoPlayer(difficulty: Difficulty | undefined | null): RuleConfig {
  return TWO_PLAYER_RULES[difficulty ?? 'medium'] ?? TWO_PLAYER_RULES.medium;
}

/** Type guard used when reading difficulty out of an untrusted room document. */
export function isDifficulty(value: unknown): value is Difficulty {
  return value === 'easy' || value === 'medium' || value === 'hard';
}
