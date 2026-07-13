import { createInitialState } from '../engine';
import { TWO_PLAYER_RULES, isDifficulty, rulesForTwoPlayer } from '../difficultyRules';

describe('two-player difficulty rule variants', () => {
  it('maps each level to a distinct, playable rule set', () => {
    expect(TWO_PLAYER_RULES.easy).toEqual({ seedsPerPit: 4, captureOnFour: false, pitsPerRow: 7 });
    expect(TWO_PLAYER_RULES.medium).toEqual({ seedsPerPit: 6, captureOnFour: true, pitsPerRow: 7 });
    expect(TWO_PLAYER_RULES.hard).toEqual({ seedsPerPit: 7, captureOnFour: true, pitsPerRow: 7 });
  });

  it('falls back to the classic (medium) rules for missing/unknown levels', () => {
    expect(rulesForTwoPlayer(undefined)).toEqual(TWO_PLAYER_RULES.medium);
    expect(rulesForTwoPlayer(null)).toEqual(TWO_PLAYER_RULES.medium);
  });

  it('produces deterministic initial states per level (online-safe)', () => {
    const a = createInitialState(rulesForTwoPlayer('hard'));
    const b = createInitialState(rulesForTwoPlayer('hard'));
    expect(a).toEqual(b);
    expect(a.pits.every((p) => p === 7)).toBe(true);
    const easy = createInitialState(rulesForTwoPlayer('easy'));
    expect(easy.pits.every((p) => p === 4)).toBe(true);
    expect(easy.config.captureOnFour).toBe(false);
  });

  it('guards untrusted difficulty values from the room document', () => {
    expect(isDifficulty('easy')).toBe(true);
    expect(isDifficulty('medium')).toBe(true);
    expect(isDifficulty('hard')).toBe(true);
    expect(isDifficulty('EASY')).toBe(false);
    expect(isDifficulty(undefined)).toBe(false);
    expect(isDifficulty(42)).toBe(false);
  });
});
