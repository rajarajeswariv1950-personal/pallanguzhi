/**
 * The "Watch a Move" lesson, DERIVED FROM THE REAL RULES ENGINE.
 *
 * Instead of a hand-written (and therefore drift-prone) storyboard, the demo
 * replays an actual legal move through `traceMove` — the very function that
 * animates every real match. Each engine frame is translated into a display
 * frame (rows, captions, sounds, hand overlay), so what the lesson shows can
 * NEVER disagree with the rules in How to Play. Locked by unit tests.
 *
 * The chosen position teaches all three signature mechanics in one turn:
 *  1. a sown shell makes a pit exactly four → Pasu, captured on the spot,
 *  2. the lap ends beside a filled pit → scoop it and keep sowing (relay),
 *  3. the lap ends beside an EMPTY pit → capture the shells one pit beyond.
 */
import {
  applyMove,
  traceMove,
  DEFAULT_RULES,
  type GameState,
  type MoveFrame,
} from '@/features/game/engine';
import { toRows, BOTTOM_INDICES, TOP_INDICES } from '@/features/game/boardView';

export type DemoCaptionKey =
  | 'tutorial.step1'
  | 'tutorial.stepSow'
  | 'tutorial.stepPasu'
  | 'tutorial.stepLap'
  | 'tutorial.stepCapture'
  | 'tutorial.stepTurn';

export type DemoSound = 'tap' | 'seed' | 'capture' | 'turn';

export interface DemoFrame {
  /** Display rows in real-board orientation (top = engine 13..7, bottom = 0..6). */
  top: number[];
  bottom: number[];
  /** The demo player's (bottom side) store. */
  store: number;
  captionKey: DemoCaptionKey;
  /** Ring highlight on the pit the step acts on. */
  activeRow?: 'top' | 'bottom';
  activeIndex?: number;
  /** Maroon capture flash. */
  captureRow?: 'top' | 'bottom';
  captureIndex?: number;
  sound?: DemoSound;
  /** Drives the same photoreal sowing hand as real gameplay (engine pit index). */
  overlay?: { kind: MoveFrame['kind']; pit: number; hand: number };
}

/**
 * The lesson position (bottom row = the learner, engine pits 0..6).
 * Playing pit 0 (3 shells) produces, in order: a Pasu capture at pit 1,
 * a relay scoop at pit 4, and a lap-end capture of pit 7 across the board.
 */
export const DEMO_START: GameState = {
  pits: [3, 3, 2, 0, 1, 2, 0, 2, 2, 2, 2, 2, 2, 2],
  stores: [0, 0],
  current: 0,
  status: 'playing',
  winner: null,
  round: 1,
  config: DEFAULT_RULES,
};

export const DEMO_MOVE = 0;

/** Where an engine pit index sits on the two display rows. */
function displayPosition(pit: number): { row: 'top' | 'bottom'; index: number } {
  const bottomIdx = BOTTOM_INDICES.indexOf(pit as (typeof BOTTOM_INDICES)[number]);
  if (bottomIdx >= 0) return { row: 'bottom', index: bottomIdx };
  return { row: 'top', index: TOP_INDICES.indexOf(pit as (typeof TOP_INDICES)[number]) };
}

export function buildDemoFrames(): DemoFrame[] {
  const trace = traceMove(DEMO_START, DEMO_MOVE);
  const frames: DemoFrame[] = [];

  trace.forEach((f, i) => {
    if (f.pit === undefined) return; // 'bank' never occurs in this position
    const { topRow, bottomRow } = toRows(f.pits);
    const pos = displayPosition(f.pit);
    // A capture right after a drop into the same pit is the four-shell Pasu;
    // any other capture is the lap-end capture beyond an empty pit.
    const prev = trace[i - 1];
    const isPasu = f.kind === 'capture' && prev?.kind === 'drop' && prev.pit === f.pit;
    const captionKey: DemoCaptionKey =
      i === 0
        ? 'tutorial.step1'
        : f.kind === 'drop'
          ? 'tutorial.stepSow'
          : f.kind === 'scoop'
            ? 'tutorial.stepLap'
            : isPasu
              ? 'tutorial.stepPasu'
              : 'tutorial.stepCapture';
    frames.push({
      top: topRow,
      bottom: bottomRow,
      store: f.stores[0],
      captionKey,
      ...(f.kind === 'capture'
        ? { captureRow: pos.row, captureIndex: pos.index }
        : { activeRow: pos.row, activeIndex: pos.index }),
      sound: f.kind === 'capture' ? 'capture' : f.kind === 'drop' ? 'seed' : 'tap',
      overlay: { kind: f.kind, pit: f.pit, hand: f.hand ?? 0 },
    });
  });

  // The special first frame shows the untouched board with the chosen pit
  // ringed, while the hand reaches in — exactly how a real move begins.
  if (frames.length > 0) {
    const { topRow, bottomRow } = toRows(DEMO_START.pits);
    frames[0] = { ...frames[0], top: topRow, bottom: bottomRow };
  }

  // Hand-over frame: the settled board, focus moves to the other side.
  const settled = applyMove(DEMO_START, DEMO_MOVE).state;
  const { topRow, bottomRow } = toRows(settled.pits);
  frames.push({
    top: topRow,
    bottom: bottomRow,
    store: settled.stores[0],
    captionKey: 'tutorial.stepTurn',
    activeRow: 'top',
    sound: 'turn',
  });

  return frames;
}
