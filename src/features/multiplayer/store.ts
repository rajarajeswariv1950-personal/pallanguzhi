import { create } from 'zustand';
import type { GameState, Player } from '@/features/game/engine';
import { feedback, haptic, playSfx } from '@/services/feedback';
import { serverUrl } from './config';
import type { ClientMessage, PresenceInfo, ServerMessage } from './protocol';

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
  rematchYou: boolean;
  rematchOpponent: boolean;
  errorKey: MpErrorKey | null;
  // actions
  createRoom: (name?: string) => void;
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
  rematchYou: false,
  rematchOpponent: false,
  errorKey: null,
};

const WS_OPEN = 1;
let socket: WebSocket | null = null;
let reconnectAttempts = 0;

function send(msg: ClientMessage) {
  if (socket && socket.readyState === WS_OPEN) {
    socket.send(JSON.stringify(msg));
  }
}

function closeSocket() {
  if (socket) {
    try {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close();
    } catch {
      // ignore
    }
    socket = null;
  }
}

function connect(onOpen: () => void) {
  closeSocket();
  useMultiplayerStore.setState({ status: 'connecting', errorKey: null });
  let ws: WebSocket;
  try {
    ws = new WebSocket(serverUrl());
  } catch {
    useMultiplayerStore.setState({ status: 'error', errorKey: 'net.connectionFailed' });
    return;
  }
  socket = ws;
  ws.onopen = () => {
    useMultiplayerStore.setState({ status: 'connected' });
    onOpen();
  };
  ws.onmessage = (event: MessageEvent) => {
    try {
      const data = typeof event.data === 'string' ? event.data : '';
      if (data) handleMessage(JSON.parse(data) as ServerMessage);
    } catch {
      // ignore malformed
    }
  };
  ws.onerror = () => {
    useMultiplayerStore.setState({ status: 'error', errorKey: 'net.connectionFailed' });
  };
  ws.onclose = () => {
    socket = null;
    handleClose();
  };
}

function handleClose() {
  const s = useMultiplayerStore.getState();
  if ((s.phase === 'playing' || s.phase === 'waiting') && s.roomCode && s.token && reconnectAttempts < 3) {
    reconnectAttempts += 1;
    useMultiplayerStore.setState({ status: 'reconnecting' });
    const code = s.roomCode;
    const token = s.token;
    setTimeout(() => connect(() => send({ type: 'reconnect', code, token })), 700);
  } else {
    useMultiplayerStore.setState({ status: 'disconnected' });
  }
}

function handleMessage(msg: ServerMessage) {
  const set = useMultiplayerStore.setState;
  const get = useMultiplayerStore.getState;
  switch (msg.type) {
    case 'roomCreated':
      set({ roomCode: msg.code, role: 'host', you: msg.you, token: msg.token, phase: 'waiting', errorKey: null });
      break;
    case 'joinedRoom':
      set({ roomCode: msg.code, role: 'guest', you: msg.you, token: msg.token, phase: 'waiting', errorKey: null });
      break;
    case 'roomNotFound':
      set({ errorKey: 'errors.roomNotFound' });
      break;
    case 'roomFull':
      set({ errorKey: 'errors.roomFull' });
      break;
    case 'presence': {
      const you = get().you;
      const opponentConnected =
        you === 0 ? !!msg.presence.guest?.connected : msg.presence.host.connected;
      set({ presence: msg.presence, opponentConnected });
      break;
    }
    case 'gameStarted':
      reconnectAttempts = 0;
      set({
        gameState: msg.state,
        phase: 'playing',
        status: 'connected',
        opponentConnected: true,
        rematchYou: false,
        rematchOpponent: false,
        errorKey: null,
      });
      break;
    case 'state': {
      reconnectAttempts = 0;
      const prev = get().gameState;
      const next = msg.state;
      if (next.status === 'gameOver') feedback('win', 'success');
      else if (prev && (next.stores[0] > prev.stores[0] || next.stores[1] > prev.stores[1]))
        feedback('capture', 'medium');
      else playSfx('seed');
      set({ gameState: next, phase: next.status === 'gameOver' ? 'gameOver' : 'playing' });
      break;
    }
    case 'invalidMove':
      haptic('warning');
      break;
    case 'opponentDisconnected':
      set({ opponentConnected: false, errorKey: 'errors.opponentLeft' });
      break;
    case 'opponentReconnected':
      set({ opponentConnected: true, errorKey: null });
      break;
    case 'rematchRequested': {
      if (msg.by !== get().you) set({ rematchOpponent: true });
      break;
    }
    case 'rematchAccepted':
      set({ rematchYou: false, rematchOpponent: false });
      break;
    case 'roomClosed':
      closeSocket();
      set({
        phase: 'idle',
        status: 'disconnected',
        errorKey: msg.reason === 'opponentLeft' ? 'errors.opponentLeft' : 'net.roomClosed',
      });
      break;
    case 'error':
      break;
    default:
      break;
  }
}

export const useMultiplayerStore = create<MpState>((set) => ({
  ...INITIAL,
  createRoom: (name?: string) => {
    reconnectAttempts = 0;
    set({ ...INITIAL, status: 'connecting' });
    connect(() => send({ type: 'createRoom', name }));
  },
  joinRoom: (code: string, name?: string) => {
    reconnectAttempts = 0;
    set({ ...INITIAL, status: 'connecting' });
    connect(() => send({ type: 'joinRoom', code: code.toUpperCase(), name }));
  },
  setReady: (ready: boolean) => send({ type: 'ready', ready }),
  sendMove: (pit: number) => send({ type: 'move', pit }),
  requestRematch: () => {
    set({ rematchYou: true });
    send({ type: 'rematch' });
  },
  leave: () => {
    send({ type: 'leave' });
    closeSocket();
    reconnectAttempts = 0;
    set({ ...INITIAL });
  },
  clearError: () => set({ errorKey: null }),
}));
