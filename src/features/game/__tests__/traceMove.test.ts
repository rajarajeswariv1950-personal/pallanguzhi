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

/**
 * The `pit` field must be internally consistent frame-by-frame: it names the
 * pit each step acted on (scoop empties it, drop adds one seed, capture clears
 * it into the mover's store), and only 'bank' frames omit it. An overlay (the
 * sowing hand) relies on this to know where to travel.
 */
function expectPitFieldConsistent(state: GameState, move: number) {
  const frames = traceMove(state, move);
  const N = state.pits.length;
  let prevPits = state.pits;
  let prevStores: [number, number] = state.stores;
  let prevDropPit = -1;
  // Seeds the mover should be holding after each step (for the hand overlay).
  let expectedHand = 0;

  for (const f of frames) {
    if (f.kind === 'bank') {
      expect(f.pit).toBeUndefined();
      expect(f.hand).toBeUndefined();
    } else {
      expect(f.pit).toBeDefined();
      const pit = f.pit as number;
      expect(pit).toBeGreaterThanOrEqual(0);
      expect(pit).toBeLessThan(N);
      if (f.kind === 'scoop') {
        // Scoop empties a previously non-empty pit; stores untouched.
        expect(prevPits[pit]).toBeGreaterThan(0);
        expect(f.pits[pit]).toBe(0);
        expect(f.stores).toEqual(prevStores);
        // The mover now holds everything that was in the scooped pit.
        expectedHand = prevPits[pit];
        expect(f.hand).toBe(expectedHand);
        // Sowing (re)starts one step anti-clockwise from the scooped pit.
        prevDropPit = pit;
      } else if (f.kind === 'drop') {
        // Drop adds exactly one seed, one step anti-clockwise from the
        // previous drop (or from the scooped pit at the start of a lap).
        expect(f.pits[pit]).toBe(prevPits[pit] + 1);
        expect(pit).toBe((prevDropPit + 1) % N);
        // One seed left the hand.
        expectedHand -= 1;
        expect(f.hand).toBe(expectedHand);
        prevDropPit = pit;
      } else {
        // Capture clears the pit and banks its seeds for the mover; the
        // hand is untouched by a capture.
        expect(f.pits[pit]).toBe(0);
        expect(f.stores[state.current]).toBe(prevStores[state.current] + prevPits[pit]);
        expect(f.hand).toBe(expectedHand);
      }
    }
    prevPits = f.pits;
    prevStores = f.stores;
  }

  // The very first frame is the scoop of the chosen pit.
  expect(frames[0].kind).toBe('scoop');
  expect(frames[0].pit).toBe(move);
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
    expect(frames[0].pit).toBe(0);
    expect(frames[0].pits[0]).toBe(0);
    expect(frames.filter((f) => f.kind === 'drop').length).toBeGreaterThanOrEqual(6);
    // The six sown seeds land anti-clockwise in pits 1..6.
    expect(frames.slice(1, 7).map((f) => f.pit)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('pit field stays consistent for every legal move across a deterministic walk', () => {
    let state = createInitialState();
    let steps = 0;
    let seed = 424242;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    while (state.status === 'playing' && steps < 300) {
      const legal = legalMoves(state);
      for (const m of legal) expectPitFieldConsistent(state, m);
      state = applyMove(state, legal[Math.floor(rnd() * legal.length)]).state;
      steps += 1;
    }
    expect(steps).toBeGreaterThan(5);
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
