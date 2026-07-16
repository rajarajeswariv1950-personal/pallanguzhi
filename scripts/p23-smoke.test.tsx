/**
 * TEMPORARY P2.3 runtime smoke check (not part of the default jest run):
 * mounts the real GameBoard (with SowingHandOverlay) and steps genuine
 * traceMove frames through it, for both players, including a capture-heavy
 * walk. Proves: no crash on mount/frame-updates/unmount, and the overlay's
 * safe fallback when pit centers are unmeasured (test renderer never fires
 * onLayout, so the registry stays empty — exactly the fallback path).
 */
import React from 'react';
// react-test-renderer ships untyped here and this smoke file is temporary
// tooling (run explicitly, not part of the default jest testMatch) — no
// @types dependency added for it.
// @ts-ignore
import renderer, { act } from 'react-test-renderer';
import { GameBoard } from '../src/features/game/components/GameBoard';
import { SowingHandOverlay } from '../src/features/game/components/SowingHandOverlay';
import type { PitCenterRegistry } from '../src/features/game/components/usePitCenters';
import {
  applyMove,
  createInitialState,
  legalMoves,
  traceMove,
  type GameState,
  type Player,
} from '../src/features/game/engine';

jest.mock('../src/hooks/useAppTranslation', () => ({
  useAppTranslation: () => ({ t: (k: string) => k }),
}));

// Native storage isn't available under jest; the settings store only needs
// the mock to satisfy persistence wiring.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

function renderBoard(state: GameState, frame: ReturnType<typeof traceMove>[number] | null) {
  return (
    <GameBoard
      pits={frame ? frame.pits : state.pits}
      stores={frame ? frame.stores : state.stores}
      current={state.current as Player}
      legalPits={legalMoves(state)}
      interactive
      onPressPit={() => {}}
      frame={frame}
    />
  );
}

describe('P2.3 smoke: GameBoard + SowingHandOverlay over real move frames', () => {
  it('steps full games of frames through the board without crashing', () => {
    let state = createInitialState();
    let seed = 777;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(renderBoard(state, null));
    });

    let steps = 0;
    let framesPlayed = 0;
    while (state.status === 'playing' && steps < 40) {
      const legal = legalMoves(state);
      const move = legal[Math.floor(rnd() * legal.length)];
      const frames = traceMove(state, move);
      for (const f of frames) {
        act(() => tree.update(renderBoard(state, f)));
        framesPlayed += 1;
      }
      state = applyMove(state, move).state;
      act(() => tree.update(renderBoard(state, null)));
      steps += 1;
    }

    // Both players moved; scoop/drop/capture frames all rendered.
    expect(steps).toBeGreaterThan(4);
    expect(framesPlayed).toBeGreaterThan(50);
    act(() => tree.unmount());
  });
});

describe('P2.3 stabilization: overlay disappears structurally on odd cases', () => {
  const measured: PitCenterRegistry = {
    register: () => {},
    get: (i) => ({ x: 40 * i + 20, y: 30, size: 40 }),
    ready: () => true,
  };
  const unmeasured: PitCenterRegistry = {
    register: () => {},
    get: () => undefined,
    ready: () => false,
  };

  function overlayJson(frame: any, registry: PitCenterRegistry) {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<SowingHandOverlay frame={frame} registry={registry} />);
    });
    const json = tree.toJSON();
    act(() => tree.unmount());
    return json;
  }

  const state = createInitialState();
  const frames = traceMove(state, 0);

  it('renders the puck for a measured active frame', () => {
    expect(overlayJson(frames[0], measured)).not.toBeNull();
  });

  it('renders NULL (unmounted) when the move is settled', () => {
    expect(overlayJson(null, measured)).toBeNull();
  });

  it('renders NULL when the acting pit has no measured center', () => {
    expect(overlayJson(frames[0], unmeasured)).toBeNull();
  });

  it('renders NULL for a bank frame (no acting pit)', () => {
    const bankFrame = { pits: state.pits, stores: [0, 0], kind: 'bank' as const };
    expect(overlayJson(bankFrame, measured)).toBeNull();
  });

  it('disappears mid-move if the frame goes null (interrupt/restart path)', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<SowingHandOverlay frame={frames[0]} registry={measured} />);
    });
    expect(tree.toJSON()).not.toBeNull();
    act(() => tree.update(<SowingHandOverlay frame={frames[1]} registry={measured} />));
    expect(tree.toJSON()).not.toBeNull();
    act(() => tree.update(<SowingHandOverlay frame={null} registry={measured} />));
    expect(tree.toJSON()).toBeNull(); // gone immediately, not via fade
    act(() => tree.unmount());
  });
});
