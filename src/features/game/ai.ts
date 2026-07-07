import {
  applyMove,
  legalMoves,
  otherPlayer,
  seedsOnSide,
  type GameState,
  type Player,
} from './engine';
import type { Difficulty } from './types';

/** Search depth per difficulty (Easy plays randomly and ignores depth). */
const DEPTH: Record<Difficulty, number> = { easy: 0, medium: 2, hard: 5 };

const WIN_SCORE = 100000;

/** Static evaluation from `me`'s perspective. */
export function evaluate(state: GameState, me: Player): number {
  const opp = otherPlayer(me);
  const storeDiff = state.stores[me] - state.stores[opp];
  if (state.status === 'gameOver') {
    if (state.winner === me) return WIN_SCORE + storeDiff;
    if (state.winner === opp) return -WIN_SCORE + storeDiff;
    return 0;
  }
  const sideDiff = seedsOnSide(state, me) - seedsOnSide(state, opp);
  return storeDiff + sideDiff * 0.12;
}

function search(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  me: Player,
): number {
  if (depth <= 0 || state.status === 'gameOver') return evaluate(state, me);
  const moves = legalMoves(state);
  if (moves.length === 0) return evaluate(state, me);

  if (state.current === me) {
    let best = -Infinity;
    for (const m of moves) {
      const child = applyMove(state, m).state;
      best = Math.max(best, search(child, depth - 1, alpha, beta, me));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = Infinity;
  for (const m of moves) {
    const child = applyMove(state, m).state;
    best = Math.min(best, search(child, depth - 1, alpha, beta, me));
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

/**
 * Choose a legal pit index for the current player. Returns -1 if no move is
 * available. Easy is random; Medium/Hard pick the best evaluated move with a
 * random tie-break for variety.
 */
export function chooseMove(state: GameState, difficulty: Difficulty): number {
  const moves = legalMoves(state);
  if (moves.length === 0) return -1;

  if (difficulty === 'easy') {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const me = state.current;
  const depth = DEPTH[difficulty];
  let bestScore = -Infinity;
  const bestMoves: number[] = [];

  for (const m of moves) {
    const child = applyMove(state, m).state;
    const score = search(child, depth - 1, -Infinity, Infinity, me);
    if (score > bestScore + 1e-9) {
      bestScore = score;
      bestMoves.length = 0;
      bestMoves.push(m);
    } else if (Math.abs(score - bestScore) <= 1e-9) {
      bestMoves.push(m);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}
