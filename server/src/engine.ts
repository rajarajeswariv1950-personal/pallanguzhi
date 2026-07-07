/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 * Mirror of the app's deterministic rules engine
 * (src/features/game/engine.ts), copied by scripts/sync-engine.mjs so the
 * server validates moves with the identical ruleset. Edit the source engine,
 * then run `npm run sync`.
 */

/**
 * Deterministic Pallanguzhi rules engine — pure, UI-free, and unit-testable.
 *
 * PRIMARY RULESET (documented)
 * ----------------------------
 * Board: 2 rows of 7 pits (14 pits). Player 0 owns indices 0..6, player 1 owns
 * 7..13. Sowing is anti-clockwise along the fixed circular order 0→1→…→13→0.
 * Each pit starts with `seedsPerPit` seeds (default 6). Captured seeds go to a
 * player's store and leave the board.
 *
 * A turn:
 *  1. The current player lifts ALL seeds from one of their own non-empty pits.
 *  2. Seeds are sown one per pit, anti-clockwise, into every pit (both rows;
 *     stores are never sown into).
 *  3. Continuous sowing (laps): after the last seed lands, look at the next pit.
 *       • If it is non-empty, scoop it up and keep sowing (a new lap).
 *       • If it is empty, the lap ends; if the pit BEYOND the empty one has
 *         seeds, the current player captures them. The turn then ends.
 *  4. "Kāsu" (four) rule: whenever sowing makes a pit total exactly 4, the
 *     current player immediately captures those 4 seeds.
 *
 * Round/game end: when the player to move has no seeds on their side, the round
 * ends; each player banks the seeds remaining on their own side. The player with
 * the larger store wins (else a draw). The default game is a single round; the
 * shape supports multiple rounds for future variants.
 *
 * The engine is fully deterministic (no randomness) and never mutates inputs.
 */

export type Player = 0 | 1;

export interface RuleConfig {
  seedsPerPit: number;
  captureOnFour: boolean;
  pitsPerRow: number;
}

export const DEFAULT_RULES: RuleConfig = {
  seedsPerPit: 6,
  captureOnFour: true,
  pitsPerRow: 7,
};

export type GameStatus = 'playing' | 'gameOver';
export type Winner = Player | 'draw' | null;

export interface GameState {
  pits: number[];
  stores: [number, number];
  current: Player;
  status: GameStatus;
  winner: Winner;
  round: number;
  config: RuleConfig;
}

export type GameEvent =
  | { type: 'sow'; seeds: number; laps: number }
  | { type: 'capture'; player: Player; pit: number; count: number; reason: 'four' | 'lapEnd' }
  | { type: 'turn'; player: Player }
  | { type: 'gameOver'; winner: Winner };

export interface MoveResult {
  ok: boolean;
  state: GameState;
  events: GameEvent[];
  /** Pits whose value changed (for animation). */
  changedPits: number[];
  /** Pits emptied by a capture this move (for capture flashes). */
  capturedPits: number[];
}

/** Safety cap so a single move can never loop forever. */
const MAX_DROPS = 100000;

export function otherPlayer(p: Player): Player {
  return p === 0 ? 1 : 0;
}

export function ownerOf(index: number, pitsPerRow: number = DEFAULT_RULES.pitsPerRow): Player {
  return index < pitsPerRow ? 0 : 1;
}

export function ownPitIndices(
  player: Player,
  pitsPerRow: number = DEFAULT_RULES.pitsPerRow,
): number[] {
  const start = player === 0 ? 0 : pitsPerRow;
  return Array.from({ length: pitsPerRow }, (_, i) => start + i);
}

export function createInitialState(config: Partial<RuleConfig> = {}): GameState {
  const rules: RuleConfig = { ...DEFAULT_RULES, ...config };
  const total = rules.pitsPerRow * 2;
  return {
    pits: Array.from({ length: total }, () => rules.seedsPerPit),
    stores: [0, 0],
    current: 0,
    status: 'playing',
    winner: null,
    round: 1,
    config: rules,
  };
}

export function seedsOnSide(state: GameState, player: Player): number {
  return ownPitIndices(player, state.config.pitsPerRow).reduce((sum, i) => sum + state.pits[i], 0);
}

export function totalSeedsInPlay(state: GameState): number {
  return state.pits.reduce((a, b) => a + b, 0) + state.stores[0] + state.stores[1];
}

export function legalMoves(state: GameState): number[] {
  if (state.status !== 'playing') return [];
  return ownPitIndices(state.current, state.config.pitsPerRow).filter((i) => state.pits[i] > 0);
}

export function isLegalMove(state: GameState, index: number): boolean {
  return (
    state.status === 'playing' &&
    index >= 0 &&
    index < state.pits.length &&
    ownerOf(index, state.config.pitsPerRow) === state.current &&
    state.pits[index] > 0
  );
}

/**
 * Apply a move. Pure: returns a new state and the events that occurred. If the
 * move is illegal, returns `ok: false` with the state unchanged.
 */
export function applyMove(state: GameState, index: number): MoveResult {
  if (!isLegalMove(state, index)) {
    return { ok: false, state, events: [], changedPits: [], capturedPits: [] };
  }

  const N = state.pits.length;
  const pits = state.pits.slice();
  const stores: [number, number] = [state.stores[0], state.stores[1]];
  const player = state.current;
  const events: GameEvent[] = [];
  const changed = new Set<number>();
  const capturedPits: number[] = [];

  let hand = pits[index];
  const seedsMoved = hand;
  pits[index] = 0;
  changed.add(index);
  let pos = index;
  let laps = 1;
  let drops = 0;

  for (;;) {
    while (hand > 0) {
      pos = (pos + 1) % N;
      pits[pos] += 1;
      hand -= 1;
      changed.add(pos);
      drops += 1;
      if (state.config.captureOnFour && pits[pos] === 4) {
        stores[player] += 4;
        capturedPits.push(pos);
        events.push({ type: 'capture', player, pit: pos, count: 4, reason: 'four' });
        pits[pos] = 0;
      }
      if (drops > MAX_DROPS) {
        hand = 0;
        break;
      }
    }

    const next = (pos + 1) % N;
    if (pits[next] > 0 && drops <= MAX_DROPS) {
      // continuation lap: scoop the next pit and keep sowing
      hand = pits[next];
      pits[next] = 0;
      changed.add(next);
      pos = next;
      laps += 1;
    } else {
      // lap ends on an empty pit -> capture the pit beyond it, if filled
      const after = (next + 1) % N;
      if (pits[next] === 0 && pits[after] > 0) {
        stores[player] += pits[after];
        capturedPits.push(after);
        events.push({ type: 'capture', player, pit: after, count: pits[after], reason: 'lapEnd' });
        pits[after] = 0;
        changed.add(after);
      }
      break;
    }
  }

  events.unshift({ type: 'sow', seeds: seedsMoved, laps });

  let nextState: GameState = {
    ...state,
    pits,
    stores,
    current: otherPlayer(player),
  };

  if (legalMoves(nextState).length === 0) {
    nextState = finalizeRound(nextState);
    events.push({ type: 'gameOver', winner: nextState.winner });
  } else {
    events.push({ type: 'turn', player: nextState.current });
  }

  return { ok: true, state: nextState, events, changedPits: Array.from(changed), capturedPits };
}

/** Bank the seeds left on each player's side and decide the winner. */
function finalizeRound(state: GameState): GameState {
  const pits = state.pits.slice();
  const stores: [number, number] = [state.stores[0], state.stores[1]];
  ([0, 1] as Player[]).forEach((p) => {
    ownPitIndices(p, state.config.pitsPerRow).forEach((i) => {
      stores[p] += pits[i];
      pits[i] = 0;
    });
  });
  const winner: Winner = stores[0] > stores[1] ? 0 : stores[1] > stores[0] ? 1 : 'draw';
  return { ...state, pits, stores, status: 'gameOver', winner };
}
