import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyMove,
  createInitialState,
  legalMoves,
  traceMove,
  type GameState,
  type MoveFrame,
  type MoveResult,
  type Player,
} from './engine';
import { chooseMove } from './ai';
import { rulesForTwoPlayer } from './difficultyRules';
import type { Difficulty, GameMode } from './types';
import { feedback, playSfx } from '@/services/feedback';
import { MOVE_SPEED_MS, useSettingsStore } from '@/store/settingsStore';

export interface GameController {
  state: GameState;
  /** Board to RENDER: mid-move animation frames, else the settled state. */
  displayPits: number[];
  displayStores: [number, number];
  /** The animation frame currently shown (for overlays), null when settled. */
  frame: MoveFrame | null;
  /** True while seeds are visibly moving (input is blocked). */
  animating: boolean;
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
  const hasGameOver = result.events.some((e) => e.type === 'gameOver');
  const hasTurn = result.events.some((e) => e.type === 'turn');
  if (hasTurn && !hasGameOver) playSfx('turn');
}

/**
 * Bridges the pure engine to React: holds state, plays each move as a paced,
 * user-controlled animation (Settings → Move speed; every seed drop is a
 * visible frame in EVERY mode and level), schedules AI moves via a timer, and
 * fires `onGameOver` once when the game ends. The engine state only commits
 * after the animation lands, so scores, turn labels and legal moves never run
 * ahead of what the player can see.
 */
export function useGameController({
  mode,
  difficulty,
  onGameOver,
}: UseGameControllerArgs): GameController {
  // Single player keeps the classic board (difficulty = AI strength); a
  // same-device two-player match expresses difficulty through rule variants.
  const newGame = useCallback(
    () => createInitialState(mode === 'sameDevice' ? rulesForTwoPlayer(difficulty) : {}),
    [mode, difficulty],
  );
  const [state, setState] = useState<GameState>(newGame);
  const [thinking, setThinking] = useState(false);
  const [frame, setFrame] = useState<MoveFrame | null>(null);
  const stateRef = useRef(state);
  const animatingRef = useRef(false);
  const gameOverHandled = useRef(false);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Clear any pending timers when the screen unmounts.
  useEffect(
    () => () => {
      if (aiTimer.current) clearTimeout(aiTimer.current);
      if (frameTimer.current) clearTimeout(frameTimer.current);
    },
    [],
  );

  const commit = useCallback((result: MoveResult) => {
    reactToEvents(result);
    stateRef.current = result.state;
    setState(result.state);
  }, []);

  /**
   * Step through the move's frames at the user's chosen speed, with a seed
   * tick per drop and a capture cue per capture, then commit the result.
   */
  const animateThenCommit = useCallback(
    (frames: MoveFrame[], result: MoveResult) => {
      if (frames.length === 0) {
        commit(result);
        return;
      }
      animatingRef.current = true;
      let i = 0;
      const step = () => {
        if (i >= frames.length) {
          animatingRef.current = false;
          setFrame(null);
          commit(result);
          return;
        }
        const f = frames[i];
        i += 1;
        setFrame(f);
        if (f.kind === 'capture') feedback('capture', 'medium');
        else if (f.kind === 'drop') playSfx('seed');
        // Scoop frames dwell a little longer than drops: the sowing hand
        // visibly reaches in and grabs the shells at the chosen pit BEFORE
        // the first drop plays. Presentation pacing only — the frame
        // sequence and rules are untouched.
        const speed = MOVE_SPEED_MS[useSettingsStore.getState().moveSpeed];
        frameTimer.current = setTimeout(
          step,
          f.kind === 'scoop' ? Math.round(speed * 1.65) : speed,
        );
      };
      step();
    },
    [commit],
  );

  const play = useCallback(
    (boardIndex: number) => {
      const s = stateRef.current;
      if (s.status !== 'playing' || animatingRef.current) return;
      if (mode === 'single' && s.current === AI_PLAYER) return;
      const result = applyMove(s, boardIndex);
      if (!result.ok) return;
      playSfx('tap');
      animateThenCommit(traceMove(s, boardIndex), result);
    },
    [mode, animateThenCommit],
  );

  const restart = useCallback(() => {
    if (aiTimer.current) clearTimeout(aiTimer.current);
    if (frameTimer.current) clearTimeout(frameTimer.current);
    animatingRef.current = false;
    setFrame(null);
    gameOverHandled.current = false;
    setThinking(false);
    const fresh = newGame();
    stateRef.current = fresh;
    setState(fresh);
  }, [newGame]);

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
      if (s.status === 'playing' && s.current === AI_PLAYER && !animatingRef.current) {
        const move = chooseMove(s, difficulty ?? 'easy');
        if (move >= 0) {
          const result = applyMove(s, move);
          if (result.ok) {
            setThinking(false);
            animateThenCommit(traceMove(s, move), result);
            return;
          }
        }
      }
      setThinking(false);
    }, delay);
    return () => {
      if (aiTimer.current) clearTimeout(aiTimer.current);
    };
  }, [mode, difficulty, state, animateThenCommit]);

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

  const animating = frame !== null;
  const isHumanTurn =
    state.status === 'playing' &&
    !animating &&
    !(mode === 'single' && state.current === AI_PLAYER);

  return {
    state,
    displayPits: frame ? frame.pits : state.pits,
    displayStores: frame ? frame.stores : state.stores,
    frame,
    animating,
    legalPits: animating ? [] : legalMoves(state),
    thinking,
    isHumanTurn,
    play,
    restart,
  };
}
