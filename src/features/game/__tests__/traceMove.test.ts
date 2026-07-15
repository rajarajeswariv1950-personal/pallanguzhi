/**
 * traceMove is the paced-animation twin of applyMove: it must land EXACTLY
 * on the applyMove result for every legal move in every reachable position,
 * or the animated board would drift from the authoritative game state
 * (locally and, worse, across the two online clients).
 */
import {
  applyMove,
  createInitialState,
  legalMoves,
  traceMove,
  type GameState,
} from '../engine';
import { chooseMove } from '../ai';
import { TWO_PLAYER_RULES } from '../difficultyRules';

function expectTraceLandsOnApply(state: GameState, move: number) {
  const frames = traceMove(state, move);
  const result = applyMove(state, move);
  expect(result.ok).toBe(true);
  expect(frames.length).toBeGreaterThan(0);
  const last = frames[frames.length - 1];
  expect(last.pits).toEqual(result.state.pits);
  expect(last.stores).toEqual(result.state.stores);
}

describe('traceMove', () => {
  it('returns [] for illegal moves', () => {
    const s = createInitialState();
    expect(traceMove(s, 13)).toEqual([]); // opponent's pit
    expect(traceMove(s, -1)).toEqual([]);
  });

  it('first frame is the scoop (chosen pit emptied), then one frame per event', () => {
    const s = createInitialState();
    const frames = traceMove(s, 0);
    expect(frames[0].kind).toBe('scoop');
    expect(frames[0].pits[0]).toBe(0);
    expect(frames.filter((f) => f.kind === 'drop').length).toBeGreaterThanOrEqual(6);
  });

  it('lands exactly on applyMove throughout AI games under every rule variant', () => {
    // Termination speed varies with the AI's random tie-breaks (and the easy
    // no-kāsu variant can run long); what MUST hold is that every single
    // animated move lands on the authoritative applyMove state.
    for (const rules of Object.values(TWO_PLAYER_RULES)) {
      let state = createInitialState(rules);
      let steps = 0;
      while (state.status === 'playing' && steps < 500) {
        const move = chooseMove(state, 'medium');
        expectTraceLandsOnApply(state, move);
        state = applyMove(state, move).state;
        steps += 1;
      }
    }
  });

  it('lands exactly on applyMove for EVERY legal move across a deterministic walk', () => {
    let state = createInitialState();
    let steps = 0;
    // Deterministic pseudo-random walk (no Math.random in tests).
    let seed = 12345;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    while (state.status === 'playing' && steps < 300) {
      const legal = legalMoves(state);
      for (const m of legal) expectTraceLandsOnApply(state, m);
      state = applyMove(state, legal[Math.floor(rnd() * legal.length)]).state;
      steps += 1;
    }
    // The walk must have exercised a meaningful chunk of game, and every
    // frame sequence above landed on the authoritative state.
    expect(steps).toBeGreaterThan(5);
  });
});
