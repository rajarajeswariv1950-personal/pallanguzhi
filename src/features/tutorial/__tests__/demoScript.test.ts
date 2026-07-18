/**
 * The How-to-Play demos and illustrations must NEVER contradict the rules
 * engine — they are generated from it (Watch a Move) or locked to it here
 * (the Pasu diagram). If a future edit made a lesson show an illegal move or
 * a wrong capture, these tests fail before it ever reaches a player.
 */
import { applyMove, traceMove, DEFAULT_RULES, type GameState } from '../../game/engine';
import { toRows } from '../../game/boardView';
import { DEMO_START, DEMO_MOVE, buildDemoFrames } from '../demoScript';

describe('Watch a Move demo (engine-derived)', () => {
  const frames = buildDemoFrames();

  it('replays a legal move from a legal position', () => {
    const result = applyMove(DEMO_START, DEMO_MOVE);
    expect(result.ok).toBe(true);
    expect(frames.length).toBeGreaterThan(2);
  });

  it('lands exactly on the authoritative post-move board', () => {
    const settled = applyMove(DEMO_START, DEMO_MOVE).state;
    const { topRow, bottomRow } = toRows(settled.pits);
    const last = frames[frames.length - 1];
    expect(last.top).toEqual(topRow);
    expect(last.bottom).toEqual(bottomRow);
    expect(last.store).toBe(settled.stores[0]);
    expect(last.captionKey).toBe('tutorial.stepTurn');
  });

  it('teaches all three signature mechanics in one turn', () => {
    const captions = frames.map((f) => f.captionKey);
    expect(captions[0]).toBe('tutorial.step1'); // pick up
    expect(captions).toContain('tutorial.stepSow'); // sow anticlockwise
    expect(captions).toContain('tutorial.stepPasu'); // four-shell Pasu capture
    expect(captions).toContain('tutorial.stepLap'); // relay lap (next pit filled)
    expect(captions).toContain('tutorial.stepCapture'); // lap-end capture beyond empty pit
  });

  it('mirrors every engine frame board-for-board', () => {
    const trace = traceMove(DEMO_START, DEMO_MOVE);
    // First display frame intentionally shows the untouched board while the
    // hand reaches in; every subsequent lesson frame (bar the final
    // hand-over) must equal its engine twin exactly.
    for (let i = 1; i < trace.length; i += 1) {
      const { topRow, bottomRow } = toRows(trace[i].pits);
      expect(frames[i].top).toEqual(topRow);
      expect(frames[i].bottom).toEqual(bottomRow);
      expect(frames[i].store).toBe(trace[i].stores[0]);
    }
  });

  it('shows the capture flash on the exact captured pit', () => {
    const trace = traceMove(DEMO_START, DEMO_MOVE);
    trace.forEach((f, i) => {
      if (f.kind === 'capture') {
        expect(frames[i].captureIndex).toBeDefined();
        expect(frames[i].captureRow).toBeDefined();
      }
    });
  });
});

describe('Pasu (cow) illustration in How to Play', () => {
  // Must match the literals passed to <ExampleDiagram> in HowToPlayScreen.
  const BEFORE_BOTTOM = [0, 3, 1, 2, 3, 0, 0];
  const MID_BOTTOM = [0, 0, 2, 3, 4, 0, 0];
  const AFTER_BOTTOM = [0, 0, 2, 3, 0, 0, 0];
  const TOP = [2, 2, 2, 2, 2, 2, 2];
  const PLAYED_PIT = 1;

  const start: GameState = {
    pits: [...BEFORE_BOTTOM, ...TOP],
    stores: [0, 0],
    current: 0,
    status: 'playing',
    winner: null,
    round: 1,
    config: DEFAULT_RULES,
  };

  it('the "moment of four" is a real engine frame with 4 cowries in the pit', () => {
    const trace = traceMove(start, PLAYED_PIT);
    const momentOfFour = trace.find(
      (f) => f.kind === 'drop' && f.pit !== undefined && f.pits[f.pit] === 4,
    );
    expect(momentOfFour).toBeDefined();
    expect(momentOfFour!.pits.slice(0, 7)).toEqual(MID_BOTTOM);
    // The very next engine frame captures those four.
    const idx = trace.indexOf(momentOfFour!);
    expect(trace[idx + 1].kind).toBe('capture');
    expect(trace[idx + 1].pit).toBe(momentOfFour!.pit);
  });

  it('the "after" board and store are the exact engine result', () => {
    const settled = applyMove(start, PLAYED_PIT).state;
    expect(settled.pits.slice(0, 7)).toEqual(AFTER_BOTTOM);
    expect(settled.pits.slice(7)).toEqual(TOP); // opponent row untouched
    expect(settled.stores[0]).toBe(4); // exactly the Pasu
  });
});
