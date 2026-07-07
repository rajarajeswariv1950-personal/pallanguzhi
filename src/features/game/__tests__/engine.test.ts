import {
  applyMove,
  createInitialState,
  isLegalMove,
  legalMoves,
  ownerOf,
  ownPitIndices,
  otherPlayer,
  totalSeedsInPlay,
  type GameState,
  type Player,
  type RuleConfig,
} from '../engine';
import { chooseMove } from '../ai';
import type { Difficulty } from '../types';

function makeState(pits: number[], current: Player, config: Partial<RuleConfig> = {}): GameState {
  const base = createInitialState(config);
  return { ...base, pits: pits.slice(), current };
}

describe('initial state', () => {
  it('has 14 pits of 6 seeds (84 total) and player 0 to move', () => {
    const s = createInitialState();
    expect(s.pits).toHaveLength(14);
    expect(s.pits.every((p) => p === 6)).toBe(true);
    expect(totalSeedsInPlay(s)).toBe(84);
    expect(s.current).toBe(0);
    expect(s.status).toBe('playing');
  });
});

describe('ownership & legality', () => {
  it('maps pit ownership correctly', () => {
    expect(ownerOf(0)).toBe(0);
    expect(ownerOf(6)).toBe(0);
    expect(ownerOf(7)).toBe(1);
    expect(ownerOf(13)).toBe(1);
    expect(ownPitIndices(0)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(ownPitIndices(1)).toEqual([7, 8, 9, 10, 11, 12, 13]);
  });

  it('only allows the current player to play their own non-empty pits', () => {
    const s = createInitialState();
    expect(legalMoves(s)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(isLegalMove(s, 0)).toBe(true);
    expect(isLegalMove(s, 7)).toBe(false); // opponent's pit
    const empty = makeState([0, 0, 0, 0, 0, 0, 0, 6, 6, 6, 6, 6, 6, 6], 0);
    expect(isLegalMove(empty, 0)).toBe(false); // empty pit
  });

  it('rejects illegal moves without mutating state', () => {
    const s = createInitialState();
    const r = applyMove(s, 7);
    expect(r.ok).toBe(false);
    expect(r.state).toBe(s);
  });
});

describe('sowing and turn passing', () => {
  it('sows one seed per pit and passes the turn', () => {
    const s = makeState([1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0], 0, { captureOnFour: false });
    const r = applyMove(s, 0);
    expect(r.ok).toBe(true);
    expect(r.state.pits[0]).toBe(0);
    expect(r.state.pits[1]).toBe(1);
    expect(r.state.current).toBe(1);
    expect(r.state.status).toBe('playing');
    expect(r.state.stores).toEqual([0, 0]);
  });
});

describe('lap-end capture', () => {
  it('captures the filled pit beyond an empty landing pit', () => {
    // pit5 has 1 seed; sowing ends at pit6, next pit7 is empty, pit8 (=3) is captured.
    const s = makeState([0, 0, 0, 0, 0, 1, 0, 0, 3, 0, 0, 0, 1, 0], 0, { captureOnFour: false });
    const r = applyMove(s, 5);
    expect(r.state.stores[0]).toBe(3);
    expect(r.state.pits[8]).toBe(0);
    expect(r.state.pits[6]).toBe(1);
    expect(r.capturedPits).toContain(8);
    expect(r.events.some((e) => e.type === 'capture' && e.reason === 'lapEnd')).toBe(true);
    expect(r.state.current).toBe(1); // player 1 still has pit12 -> game continues
    expect(r.state.status).toBe('playing');
  });
});

describe('four (kāsu) capture', () => {
  it('captures a pit the moment it reaches exactly four', () => {
    const s = makeState([0, 0, 1, 3, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], 0, { captureOnFour: true });
    const r = applyMove(s, 2); // drops into pit3 -> 4 -> captured by player 0
    expect(r.state.stores[0]).toBe(4);
    expect(r.state.pits[3]).toBe(0);
    expect(r.capturedPits).toContain(3);
    expect(r.events.some((e) => e.type === 'capture' && e.reason === 'four')).toBe(true);
  });
});

describe('purity, determinism and conservation', () => {
  it('does not mutate the input state', () => {
    const s = createInitialState();
    const before = s.pits.slice();
    applyMove(s, 2);
    expect(s.pits).toEqual(before);
    expect(s.stores).toEqual([0, 0]);
  });

  it('is deterministic for the same input', () => {
    const s = createInitialState();
    const a = applyMove(s, 2);
    const b = applyMove(s, 2);
    expect(a.state.pits).toEqual(b.state.pits);
    expect(a.state.stores).toEqual(b.state.stores);
    expect(a.state.current).toBe(b.state.current);
  });

  it('conserves the total number of seeds', () => {
    const s = createInitialState();
    const r = applyMove(s, 3);
    expect(totalSeedsInPlay(r.state)).toBe(84);
  });
});

describe('round end and winner', () => {
  it('ends the game and banks remaining seeds (player 0 wins)', () => {
    const s = makeState([0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], 0);
    const r = applyMove(s, 5); // player 1 has no seeds afterwards
    expect(r.state.status).toBe('gameOver');
    expect(r.state.winner).toBe(0);
    expect(r.state.stores[0]).toBe(1);
    expect(r.state.stores[1]).toBe(0);
    expect(r.events.some((e) => e.type === 'gameOver')).toBe(true);
  });

  it('determines player 1 as winner when appropriate', () => {
    const s = makeState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0], 1);
    const r = applyMove(s, 12);
    expect(r.state.status).toBe('gameOver');
    expect(r.state.winner).toBe(1);
    expect(r.state.stores[1]).toBe(1);
  });
});

describe('AI', () => {
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  it('always returns a legal move for every difficulty', () => {
    const s = createInitialState();
    for (const d of difficulties) {
      const m = chooseMove(s, d);
      expect(legalMoves(s)).toContain(m);
    }
  });

  it('plays a full game to completion that terminates and conserves seeds', () => {
    let state = createInitialState();
    let steps = 0;
    while (state.status === 'playing' && steps < 2000) {
      const move = chooseMove(state, 'medium');
      expect(move).toBeGreaterThanOrEqual(0);
      const result = applyMove(state, move);
      expect(result.ok).toBe(true);
      state = result.state;
      expect(totalSeedsInPlay(state)).toBe(84);
      steps += 1;
    }
    expect(state.status).toBe('gameOver');
    expect(state.winner === 0 || state.winner === 1 || state.winner === 'draw').toBe(true);
  });

  it('otherPlayer flips correctly', () => {
    expect(otherPlayer(0)).toBe(1);
    expect(otherPlayer(1)).toBe(0);
  });
});
