/**
 * End-to-end simulation of the online dual-player flow against an in-memory
 * mock of the HTTP room API (same contract as
 * https://pallanguzhi-room-api.onrender.com): create → join → ready → moves →
 * leave, exercising the real store + real game engine.
 */
import { legalMoves } from '@/features/game/engine';

jest.mock('@/services/feedback', () => ({
  feedback: jest.fn(),
  haptic: jest.fn(),
  playSfx: jest.fn(),
}));

// In-memory backend honoring the room API contract.
const mockRooms = new Map<string, { state: unknown }>();
jest.mock('../api', () => ({
  ROOM_API_BASE: 'https://pallanguzhi-room-api.onrender.com',
  apiCreateRoom: jest.fn(async () => {
    const code = 'AB12CD';
    mockRooms.set(code, { state: null });
    return code;
  }),
  apiJoinRoom: jest.fn(async (roomCode: string) => {
    const room = mockRooms.get(roomCode.toUpperCase());
    if (!room) return { ok: false, reason: 'roomNotFound' };
    return { ok: true };
  }),
  apiPushState: jest.fn(async (roomCode: string, state: unknown) => {
    const room = mockRooms.get(roomCode.toUpperCase());
    if (!room) return false;
    room.state = state;
    return true;
  }),
  apiFetchState: jest.fn(async (roomCode: string) => {
    const room = mockRooms.get(roomCode.toUpperCase());
    if (!room) return 'notFound';
    return room.state;
  }),
}));

// The two "devices": each gets its own fresh copy of the store module.
type StoreModule = typeof import('../store');
let host: StoreModule['useMultiplayerStore'];
let guest: StoreModule['useMultiplayerStore'];

const flush = async () => {
  // Let queued promises resolve.
  for (let i = 0; i < 6; i += 1) await Promise.resolve();
};
const tick = async (ms = 2600) => {
  jest.advanceTimersByTime(ms);
  await flush();
};

beforeAll(async () => {
  jest.useFakeTimers();
  host = require('../store').useMultiplayerStore;
  guest = jest.isolateModules
    ? (() => {
        let mod: StoreModule | undefined;
        jest.isolateModules(() => {
          mod = require('../store');
        });
        return mod!.useMultiplayerStore;
      })()
    : require('../store').useMultiplayerStore;
});

afterAll(() => {
  jest.useRealTimers();
});

describe('online dual-player over the HTTP room API', () => {
  it('host creates a room and gets the shared code', async () => {
    host.getState().createRoom('Rama');
    await flush();
    const s = host.getState();
    expect(s.roomCode).toBe('AB12CD');
    expect(s.role).toBe('host');
    expect(s.status).toBe('connected');
    expect(s.phase).toBe('waiting');
  });

  it('join with a wrong code reports room not found', async () => {
    guest.getState().joinRoom('ZZZZZZ', 'Friend');
    await flush();
    expect(guest.getState().errorKey).toBe('errors.roomNotFound');
  });

  it('friend joins with the SAME shared code (lowercase normalized)', async () => {
    guest.getState().joinRoom('ab12cd', 'Friend');
    await flush();
    const s = guest.getState();
    expect(s.roomCode).toBe('AB12CD');
    expect(s.role).toBe('guest');
    expect(s.status).toBe('connected');
    expect(s.phase).toBe('waiting');
  });

  it('host learns via polling that the guest joined', async () => {
    await tick();
    const presence = host.getState().presence;
    expect(presence?.guest).not.toBeNull();
    expect(presence?.guest?.name).toBe('Friend');
  });

  it('both ready -> the game starts on both devices with identical state', async () => {
    host.getState().setReady(true);
    await flush();
    await tick(); // guest sees hostReady
    guest.getState().setReady(true);
    await flush();
    await tick(); // host polls: both ready -> playing
    await tick(); // settle both
    expect(host.getState().phase).toBe('playing');
    expect(guest.getState().phase).toBe('playing');
    expect(JSON.stringify(host.getState().gameState)).toBe(
      JSON.stringify(guest.getState().gameState),
    );
    expect(host.getState().gameState?.pits.every((p) => p === 6)).toBe(true);
  });

  it('a move by the current player syncs board + turn to the other device', async () => {
    const hs = host.getState();
    const current = hs.gameState!.current;
    const mover = current === 0 ? host : guest;
    const watcher = current === 0 ? guest : host;
    const pit = legalMoves(hs.gameState!)[0];
    const before = JSON.stringify(watcher.getState().gameState);
    mover.getState().sendMove(pit);
    await flush();
    await tick(); // watcher polls the new state
    const after = watcher.getState().gameState;
    expect(JSON.stringify(after)).not.toBe(before);
    expect(JSON.stringify(after)).toBe(JSON.stringify(mover.getState().gameState));
  });

  it('out-of-turn moves are rejected locally (no state change)', async () => {
    const current = host.getState().gameState!.current;
    const notMyTurn = current === 0 ? guest : host;
    const before = JSON.stringify(notMyTurn.getState().gameState);
    notMyTurn.getState().sendMove(current === 0 ? 7 : 0);
    await flush();
    expect(JSON.stringify(notMyTurn.getState().gameState)).toBe(before);
  });

  it('leaving tells the opponent the player left', async () => {
    guest.getState().leave();
    await flush();
    await tick(); // host polls the parting document
    const s = host.getState();
    expect(s.errorKey).toBe('errors.opponentLeft');
    expect(guest.getState().phase).toBe('idle');
  });
});
