import { create } from 'zustand';
import {
  applyMove,
  createInitialState,
  isLegalMove,
  type GameState,
  type Player,
} from '@/features/game/engine';
import { feedback, haptic, playSfx } from '@/services/feedback';
import { isDifficulty, rulesForTwoPlayer } from '@/features/game/difficultyRules';
import type { Difficulty } from '@/features/game/types';
import { apiCreateRoom, apiFetchState, apiJoinRoom, apiPushState } from './api';
import type { PresenceInfo } from './protocol';

export type MpStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';
export type MpPhase = 'idle' | 'waiting' | 'playing' | 'gameOver';

export type MpErrorKey =
  | 'errors.roomNotFound'
  | 'errors.roomFull'
  | 'errors.opponentLeft'
  | 'net.connectionFailed'
  | 'net.roomClosed';

interface MpState {
  status: MpStatus;
  phase: MpPhase;
  roomCode: string | null;
  role: 'host' | 'guest' | null;
  you: Player | null;
  token: string | null;
  presence: PresenceInfo | null;
  opponentConnected: boolean;
  gameState: GameState | null;
  /** Host-chosen match level, mirrored from the shared room document. */
  difficulty: Difficulty | null;
  /** Pit index of the most recent move (-1 = none), for paced replay. */
  lastMove: number;
  rematchYou: boolean;
  rematchOpponent: boolean;
  errorKey: MpErrorKey | null;
  // actions
  createRoom: (name?: string, difficulty?: Difficulty) => void;
  joinRoom: (code: string, name?: string) => void;
  setReady: (ready: boolean) => void;
  sendMove: (pit: number) => void;
  requestRematch: () => void;
  leave: () => void;
  clearError: () => void;
}

const INITIAL = {
  status: 'idle' as MpStatus,
  phase: 'idle' as MpPhase,
  roomCode: null,
  role: null,
  you: null,
  token: null,
  presence: null,
  opponentConnected: false,
  gameState: null,
  difficulty: null as Difficulty | null,
  lastMove: -1,
  rematchYou: false,
  rematchOpponent: false,
  errorKey: null,
};

/**
 * The shared room document exchanged through the HTTP room API. The backend
 * stores it verbatim (POST /room/state) and returns it on GET, so presence,
 * readiness, the authoritative board/turn state, rematch votes, and
 * leave/disconnect status all travel inside it. `v` is a monotonically
 * increasing revision: pollers only adopt documents at least as new as theirs.
 */
interface RoomDoc {
  v: number;
  hostName: string;
  guestName: string;
  guestJoined: boolean;
  hostReady: boolean;
  guestReady: boolean;
  /**
   * Host-chosen match level. All three levels are premium (the whole online
   * mode is); the value only selects the two-player rule variant both
   * clients start the deterministic game with. Older documents without the
   * field fall back to 'medium' (the classic rules).
   */
  difficulty: Difficulty;
  phase: 'waiting' | 'playing' | 'gameOver';
  game: GameState | null;
  /**
   * Pit index of the most recent move (-1 = none yet). Lets BOTH clients
   * replay the move as a paced seed-by-seed animation from their previous
   * board (engine traceMove is deterministic, so the animation always lands
   * exactly on `game`). Older documents without the field simply skip it.
   */
  lastMove: number;
  rematch: [boolean, boolean];
  /** -1 = nobody left; 0/1 = that player left the room. */
  leftBy: -1 | 0 | 1;
}

function isRoomDoc(value: unknown): value is RoomDoc {
  if (!value || typeof value !== 'object') return false;
  const doc = value as Record<string, unknown>;
  // `difficulty` is intentionally NOT required — older/foreign documents
  // without it are normalized by `docDifficulty` below.
  return (
    typeof doc.v === 'number' &&
    typeof doc.phase === 'string' &&
    typeof doc.guestJoined === 'boolean' &&
    Array.isArray(doc.rematch)
  );
}

/** Normalized match level of a document (classic rules when absent/invalid). */
function docDifficulty(d: RoomDoc): Difficulty {
  return isDifficulty(d.difficulty) ? d.difficulty : 'medium';
}

const POLL_MS = 2500;
/** Transient fetch failures tolerated before surfacing 'reconnecting'. */
const RECONNECTING_AFTER = 2;
/** Consecutive failures after which the session is declared disconnected. */
const DISCONNECT_AFTER = 8;

let poller: ReturnType<typeof setInterval> | null = null;
let doc: RoomDoc | null = null;
let seenRemoteDoc = false;
let failStreak = 0;
let pollBusy = false;

function stopPolling() {
  if (poller) {
    clearInterval(poller);
    poller = null;
  }
  doc = null;
  seenRemoteDoc = false;
  failStreak = 0;
  pollBusy = false;
}

function newDoc(hostName: string, difficulty: Difficulty = 'medium'): RoomDoc {
  return {
    v: 1,
    hostName,
    guestName: '',
    guestJoined: false,
    hostReady: false,
    guestReady: false,
    difficulty,
    phase: 'waiting',
    game: null,
    lastMove: -1,
    rematch: [false, false],
    leftBy: -1,
  };
}

function presenceOf(d: RoomDoc): PresenceInfo {
  return {
    host: { connected: true, ready: d.hostReady, name: d.hostName },
    guest: d.guestJoined
      ? { connected: true, ready: d.guestReady, name: d.guestName }
      : null,
  };
}

/** Applies the current document to the zustand store (single source of truth). */
function applyDocToStore() {
  if (!doc) return;
  const set = useMultiplayerStore.setState;
  const get = useMultiplayerStore.getState;
  const you = get().you;
  if (you === null) return;

  // Opponent left -> mirror the previous "roomClosed(opponentLeft)" behaviour.
  if (doc.leftBy !== -1 && doc.leftBy !== you) {
    stopPolling();
    set({ phase: 'idle', status: 'disconnected', errorKey: 'errors.opponentLeft' });
    return;
  }

  const prev = get().gameState;
  const next = doc.game;
  // Same audio/haptic cues as before when a new board state arrives.
  // (The seed-by-seed sounds during the paced replay come from the gameplay
  //  screen's animator; this only cues game-over.)
  if (next && prev && next.status === 'gameOver' && prev.status !== 'gameOver') {
    feedback('win', 'success');
  }

  set({
    presence: presenceOf(doc),
    opponentConnected: you === 0 ? doc.guestJoined : true,
    gameState: next,
    difficulty: docDifficulty(doc),
    lastMove: typeof doc.lastMove === 'number' ? doc.lastMove : -1,
    phase: doc.phase,
    status: 'connected',
    rematchYou: doc.rematch[you],
    rematchOpponent: doc.rematch[you === 0 ? 1 : 0],
  });
}

/** Bumps the revision, updates the store, and pushes the document. */
function pushDoc() {
  const code = useMultiplayerStore.getState().roomCode;
  if (!doc || !code) return;
  doc = { ...doc, v: doc.v + 1 };
  applyDocToStore();
  void apiPushState(code, doc);
}

/**
 * Merges my own intent back into a freshly fetched remote document, healing
 * lost write races (both sides POST the whole doc; last write wins).
 */
function assertSelf(remote: RoomDoc): { merged: RoomDoc; changed: boolean } {
  const s = useMultiplayerStore.getState();
  const you = s.you;
  const mine = doc;
  if (you === null || !mine) return { merged: remote, changed: false };
  const merged: RoomDoc = { ...remote };
  let changed = false;
  if (you === 1 && mine.guestJoined && !merged.guestJoined) {
    merged.guestJoined = true;
    merged.guestName = mine.guestName;
    changed = true;
  }
  if (you === 0 && merged.hostReady !== mine.hostReady && merged.phase === 'waiting') {
    merged.hostReady = mine.hostReady;
    changed = true;
  }
  if (you === 1 && merged.guestReady !== mine.guestReady && merged.phase === 'waiting') {
    merged.guestReady = mine.guestReady;
    changed = true;
  }
  if (mine.rematch[you] && !merged.rematch[you]) {
    merged.rematch = you === 0 ? [true, merged.rematch[1]] : [merged.rematch[0], true];
    changed = true;
  }
  return { merged, changed };
}

/**
 * When both players are ready (or both voted rematch) the game starts. Either
 * side may write the start: createInitialState() with the document's
 * difficulty rules is deterministic, so simultaneous writers produce
 * identical documents and last-write-wins is safe.
 */
function maybeStart(d: RoomDoc): boolean {
  if (d.phase === 'waiting' && d.guestJoined && d.hostReady && d.guestReady) {
    d.phase = 'playing';
    d.game = createInitialState(rulesForTwoPlayer(docDifficulty(d)));
    d.lastMove = -1;
    return true;
  }
  if (d.phase === 'gameOver' && d.rematch[0] && d.rematch[1]) {
    d.phase = 'playing';
    d.game = createInitialState(rulesForTwoPlayer(docDifficulty(d)));
    d.lastMove = -1;
    d.rematch = [false, false];
    return true;
  }
  return false;
}

async function pollOnce() {
  const s = useMultiplayerStore.getState();
  const code = s.roomCode;
  if (!code || pollBusy) return;
  pollBusy = true;
  try {
    const remote = await apiFetchState(code);
    if (remote === 'network') {
      failStreak += 1;
      if (failStreak >= DISCONNECT_AFTER) {
        stopPolling();
        useMultiplayerStore.setState({ status: 'disconnected', errorKey: 'net.connectionFailed' });
      } else if (failStreak >= RECONNECTING_AFTER) {
        useMultiplayerStore.setState({ status: 'reconnecting' });
      }
      return;
    }
    failStreak = 0;
    if (remote === 'notFound') {
      // Once the room has been seen, a 404 means it expired / was closed.
      if (seenRemoteDoc) {
        stopPolling();
        useMultiplayerStore.setState({
          phase: 'idle',
          status: 'disconnected',
          errorKey: 'net.roomClosed',
        });
      }
      return;
    }
    if (remote === null || !isRoomDoc(remote)) {
      // Room exists but holds no document yet (fresh room) — keep ours.
      if (doc && useMultiplayerStore.getState().status === 'reconnecting') {
        useMultiplayerStore.setState({ status: 'connected' });
      }
      return;
    }
    seenRemoteDoc = true;
    if (!doc || remote.v >= doc.v) {
      const { merged, changed } = assertSelf(remote);
      doc = merged;
      const started = maybeStart(doc);
      if (changed || started) pushDoc();
      else applyDocToStore();
    }
  } finally {
    pollBusy = false;
  }
}

function startPolling() {
  if (poller) clearInterval(poller);
  failStreak = 0;
  poller = setInterval(() => void pollOnce(), POLL_MS);
}

export const useMultiplayerStore = create<MpState>((set, get) => ({
  ...INITIAL,
  createRoom: (name?: string, difficulty?: Difficulty) => {
    stopPolling();
    set({ ...INITIAL, status: 'connecting' });
    void (async () => {
      const code = await apiCreateRoom();
      if (!code) {
        set({ status: 'error', errorKey: 'net.connectionFailed' });
        return;
      }
      doc = newDoc((name ?? '').trim().slice(0, 20), difficulty ?? 'medium');
      set({
        roomCode: code,
        role: 'host',
        you: 0,
        phase: 'waiting',
        status: 'connected',
        errorKey: null,
        presence: presenceOf(doc),
        difficulty: docDifficulty(doc),
      });
      void apiPushState(code, doc);
      startPolling();
    })();
  },
  joinRoom: (rawCode: string, name?: string) => {
    stopPolling();
    const code = rawCode.trim().toUpperCase();
    set({ ...INITIAL, status: 'connecting' });
    void (async () => {
      const joined = await apiJoinRoom(code);
      if (!joined.ok) {
        set({
          status: joined.reason === 'network' ? 'error' : 'connected',
          errorKey:
            joined.reason === 'network' ? 'net.connectionFailed' : `errors.${joined.reason}`,
        });
        return;
      }
      // Fetch the host's document; enforce the two-player cap client-side too.
      const remote = await apiFetchState(code);
      if (remote === 'notFound') {
        set({ errorKey: 'errors.roomNotFound', status: 'connected' });
        return;
      }
      const base = isRoomDoc(remote) ? remote : newDoc('');
      if (base.guestJoined) {
        set({ errorKey: 'errors.roomFull', status: 'connected' });
        return;
      }
      doc = {
        ...base,
        guestJoined: true,
        guestName: (name ?? '').trim().slice(0, 20),
        leftBy: -1,
      };
      seenRemoteDoc = isRoomDoc(remote);
      set({
        roomCode: code,
        role: 'guest',
        you: 1,
        phase: 'waiting',
        status: 'connected',
        errorKey: null,
      });
      pushDoc();
      startPolling();
    })();
  },
  setReady: (ready: boolean) => {
    const you = get().you;
    if (!doc || you === null) return;
    doc = { ...doc, [you === 0 ? 'hostReady' : 'guestReady']: ready };
    maybeStart(doc);
    pushDoc();
  },
  sendMove: (pit: number) => {
    const you = get().you;
    if (!doc || you === null || doc.phase !== 'playing' || !doc.game) return;
    if (doc.game.current !== you || !isLegalMove(doc.game, pit)) {
      haptic('warning');
      return;
    }
    const result = applyMove(doc.game, pit);
    if (!result.ok) {
      haptic('warning');
      return;
    }
    const next = result.state;
    doc = {
      ...doc,
      game: next,
      lastMove: pit,
      phase: next.status === 'gameOver' ? 'gameOver' : 'playing',
    };
    pushDoc();
  },
  requestRematch: () => {
    const you = get().you;
    if (!doc || you === null) return;
    const rematch: [boolean, boolean] =
      you === 0 ? [true, doc.rematch[1]] : [doc.rematch[0], true];
    doc = { ...doc, rematch };
    set({ rematchYou: true });
    maybeStart(doc);
    pushDoc();
  },
  leave: () => {
    const you = get().you;
    const code = get().roomCode;
    if (doc && you !== null && code) {
      // Tell the opponent we left, then drop the session.
      const parting: RoomDoc = { ...doc, v: doc.v + 1, leftBy: you };
      void apiPushState(code, parting);
    }
    stopPolling();
    set({ ...INITIAL });
  },
  clearError: () => set({ errorKey: null }),
}));
