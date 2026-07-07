import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyMove,
  createInitialState,
  legalMoves,
  type GameState,
  type MoveResult,
  type Player,
} from './engine';
import { chooseMove } from './ai';
import type { Difficulty, GameMode } from './types';
import { feedback, haptic, playSfx } from '@/services/feedback';

export interface GameController {
  state: GameState;
  legalPits: number[];
  thinking: boolean;
  isHumanTurn: boolean;
  play: (boardIndex: number) => void;
  restart: () => void;
}

interface UseGameControllerArgs {
  mode: GameMode;
  difficulty?: Difficulty;
  onGameOver: (state: GameState) => void;
}

/** In single-player the AI controls player 1 (top row). */
const AI_PLAYER: Player = 1;

function reactToEvents(result: MoveResult) {
  const hasCapture = result.events.some((e) => e.type === 'capture');
  const hasGameOver = result.events.some((e) => e.type === 'gameOver');
  const hasTurn = result.events.some((e) => e.type === 'turn');
  if (hasCapture) feedback('capture', 'medium');
  else playSfx('seed');
  if (hasTurn && !hasGameOver) playSfx('turn');
}

/**
 * Bridges the pure engine to React: holds state, plays moves with sound/haptic
 * feedback, schedules AI moves via a timer (so the UI never blocks), and fires
 * `onGameOver` once when the game ends.
 */
export function useGameController({
  mode,
  difficulty,
  onGameOver,
}: UseGameControllerArgs): GameController {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [thinking, setThinking] = useState(false);
  const stateRef = useRef(state);
  const gameOverHandled = useRef(false);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const commit = useCallback((result: MoveResult) => {
    reactToEvents(result);
    stateRef.current = result.state;
    setState(result.state);
  }, []);

  const play = useCallback(
    (boardIndex: number) => {
      const s = stateRef.current;
      if (s.status !== 'playing') return;
      if (mode === 'single' && s.current === AI_PLAYER) return; // ignore taps on AI's turn
      const result = applyMove(s, boardIndex);
      if (!result.ok) {
        haptic('warning');
        return;
      }
      commit(result);
    },
    [mode, commit],
  );

  const restart = useCallback(() => {
    if (aiTimer.current) clearTimeout(aiTimer.current);
    gameOverHandled.current = false;
    setThinking(false);
    const fresh = createInitialState();
    stateRef.current = fresh;
    setState(fresh);
  }, []);

  // Schedule AI moves in single-player. The compute is fast; the delay just
  // makes the opponent feel deliberate and keeps interactions smooth.
  useEffect(() => {
    if (mode !== 'single' || state.status !== 'playing' || state.current !== AI_PLAYER) {
      return undefined;
    }
    setThinking(true);
    const delay = 600 + Math.floor(Math.random() * 500);
    aiTimer.current = setTimeout(() => {
      const s = stateRef.current;
      if (s.status === 'playing' && s.current === AI_PLAYER) {
        const move = chooseMove(s, difficulty ?? 'easy');
        if (move >= 0) {
          const result = applyMove(s, move);
          if (result.ok) commit(result);
        }
      }
      setThinking(false);
    }, delay);
    return () => {
      if (aiTimer.current) clearTimeout(aiTimer.current);
    };
  }, [mode, difficulty, state, commit]);

  // Game over: celebrate once, then notify the screen.
  useEffect(() => {
    if (state.status === 'gameOver' && !gameOverHandled.current) {
      gameOverHandled.current = true;
      feedback('win', 'success');
      const timer = setTimeout(() => onGameOver(stateRef.current), 950);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [state.status, onGameOver]);

  const isHumanTurn =
    state.status === 'playing' && !(mode === 'single' && state.current === AI_PLAYER);

  return {
    state,
    legalPits: legalMoves(state),
    thinking,
    isHumanTurn,
    play,
    restart,
  };
}
