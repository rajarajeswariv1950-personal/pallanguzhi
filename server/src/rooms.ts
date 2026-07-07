import { randomUUID } from 'node:crypto';
import { WebSocket } from 'ws';
import { applyMove, createInitialState, isLegalMove, type GameState, type Player } from './engine';
import type { ClientMessage, PresenceInfo, ServerMessage } from './protocol';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 5;
const DISCONNECT_GRACE_MS = 30_000;
const ROOM_TTL_MS = 2 * 60 * 60_000;

/** Pallanguzhi is strictly two-player; a room holds at most MAX_PLAYERS. */
const MAX_PLAYERS = 2;

interface Slot {
  player: Player;
  token: string;
  socket: WebSocket | null;
  connected: boolean;
  ready: boolean;
  wantsRematch: boolean;
  name: string;
}

interface Room {
  code: string;
  /** Exactly two seats: [host (player 0), guest (player 1)]. Never grows. */
  slots: [Slot, Slot | null];
  state: GameState | null;
  phase: 'waiting' | 'playing' | 'gameOver';
  graceTimers: Map<string, ReturnType<typeof setTimeout>>;
  lastActivity: number;
}

interface Binding {
  code: string;
  player: Player;
  token: string;
}

export class RoomManager {
  private rooms = new Map<string, Room>();
  private bindings = new Map<WebSocket, Binding>();

  constructor() {
    const timer = setInterval(() => this.sweep(), 60_000);
    if (typeof timer.unref === 'function') timer.unref();
  }

  size(): number {
    return this.rooms.size;
  }

  handle(socket: WebSocket, msg: ClientMessage): void {
    switch (msg.type) {
      case 'createRoom':
        return this.createRoom(socket, msg.name);
      case 'joinRoom':
        return this.joinRoom(socket, msg.code.toUpperCase(), msg.name);
      case 'reconnect':
        return this.reconnect(socket, msg.code.toUpperCase(), msg.token);
      case 'ready':
        return this.setReady(socket, msg.ready);
      case 'move':
        return this.move(socket, msg.pit);
      case 'rematch':
        return this.rematch(socket);
      case 'leave':
        return this.leave(socket);
      default:
        return undefined;
    }
  }

  handleSocketClose(socket: WebSocket): void {
    const ctx = this.getRoomSlot(socket);
    this.bindings.delete(socket);
    if (!ctx) return;
    const { room, slot } = ctx;
    slot.connected = false;
    slot.socket = null;
    this.broadcast(room, { type: 'presence', presence: this.presence(room) });
    const opponent = this.opponentOf(room, slot.player);
    if (opponent) this.send(opponent.socket, { type: 'opponentDisconnected' });
    const timer = setTimeout(() => {
      if (!slot.connected) this.closeRoom(room, 'opponentLeft');
    }, DISCONNECT_GRACE_MS);
    room.graceTimers.set(slot.token, timer);
  }

  // ----- lifecycle -------------------------------------------------------

  private createRoom(socket: WebSocket, name?: string): void {
    this.leave(socket);
    const code = this.generateCode();
    const token = randomUUID();
    const host: Slot = {
      player: 0,
      token,
      socket,
      connected: true,
      ready: false,
      wantsRematch: false,
      name: sanitizeName(name),
    };
    const room: Room = {
      code,
      slots: [host, null],
      state: null,
      phase: 'waiting',
      graceTimers: new Map(),
      lastActivity: Date.now(),
    };
    this.rooms.set(code, room);
    this.bindings.set(socket, { code, player: 0, token });
    this.send(socket, { type: 'roomCreated', code, role: 'host', you: 0, token });
    this.send(socket, { type: 'presence', presence: this.presence(room) });
  }

  private joinRoom(socket: WebSocket, code: string, name?: string): void {
    const room = this.rooms.get(code);
    if (!room) {
      this.send(socket, { type: 'roomNotFound' });
      return;
    }
    // Strict two-player cap: the single guest seat is the only opening.
    if (room.slots[1]) {
      this.send(socket, { type: 'roomFull' });
      return;
    }
    this.leave(socket);
    const token = randomUUID();
    const guest: Slot = {
      player: 1,
      token,
      socket,
      connected: true,
      ready: false,
      wantsRematch: false,
      name: sanitizeName(name),
    };
    room.slots[1] = guest;
    room.lastActivity = Date.now();
    this.bindings.set(socket, { code, player: 1, token });
    this.send(socket, { type: 'joinedRoom', code, role: 'guest', you: 1, token });
    this.broadcast(room, { type: 'presence', presence: this.presence(room) });
  }

  private reconnect(socket: WebSocket, code: string, token: string): void {
    const room = this.rooms.get(code);
    if (!room) {
      this.send(socket, { type: 'roomNotFound' });
      return;
    }
    const slot = room.slots.find((s): s is Slot => !!s && s.token === token);
    if (!slot) {
      this.send(socket, { type: 'roomNotFound' });
      return;
    }
    const timer = room.graceTimers.get(token);
    if (timer) {
      clearTimeout(timer);
      room.graceTimers.delete(token);
    }
    slot.socket = socket;
    slot.connected = true;
    room.lastActivity = Date.now();
    this.bindings.set(socket, { code, player: slot.player, token });
    if (room.state && room.phase !== 'waiting') {
      this.send(socket, { type: 'gameStarted', state: room.state });
    }
    this.send(socket, { type: 'presence', presence: this.presence(room) });
    const opponent = this.opponentOf(room, slot.player);
    if (opponent) this.send(opponent.socket, { type: 'opponentReconnected' });
  }

  private setReady(socket: WebSocket, ready: boolean): void {
    const ctx = this.getRoomSlot(socket);
    if (!ctx) return;
    ctx.slot.ready = ready;
    ctx.room.lastActivity = Date.now();
    this.broadcast(ctx.room, { type: 'presence', presence: this.presence(ctx.room) });
    this.maybeStart(ctx.room);
  }

  private maybeStart(room: Room): void {
    const host = room.slots[0];
    const guest = room.slots[1];
    if (
      room.phase === 'waiting' &&
      host.connected &&
      host.ready &&
      guest &&
      guest.connected &&
      guest.ready
    ) {
      this.startGame(room);
    }
  }

  private startGame(room: Room): void {
    room.state = createInitialState();
    room.phase = 'playing';
    room.lastActivity = Date.now();
    this.broadcast(room, { type: 'gameStarted', state: room.state });
  }

  // ----- gameplay --------------------------------------------------------

  private move(socket: WebSocket, pit: number): void {
    const ctx = this.getRoomSlot(socket);
    if (!ctx) return;
    const { room, slot } = ctx;
    if (room.phase !== 'playing' || !room.state) {
      this.send(socket, { type: 'invalidMove', reason: 'notPlaying' });
      return;
    }
    if (room.state.current !== slot.player) {
      this.send(socket, { type: 'invalidMove', reason: 'notYourTurn' });
      return;
    }
    if (!isLegalMove(room.state, pit)) {
      this.send(socket, { type: 'invalidMove', reason: 'illegal' });
      return;
    }
    const result = applyMove(room.state, pit);
    if (!result.ok) {
      this.send(socket, { type: 'invalidMove', reason: 'illegal' });
      return;
    }
    room.state = result.state;
    room.lastActivity = Date.now();
    if (room.state.status === 'gameOver') room.phase = 'gameOver';
    this.broadcast(room, { type: 'state', state: room.state });
  }

  private rematch(socket: WebSocket): void {
    const ctx = this.getRoomSlot(socket);
    if (!ctx) return;
    const { room, slot } = ctx;
    slot.wantsRematch = true;
    room.lastActivity = Date.now();
    this.broadcast(room, { type: 'rematchRequested', by: slot.player });
    const host = room.slots[0];
    const guest = room.slots[1];
    if (host.wantsRematch && guest && guest.wantsRematch) {
      host.wantsRematch = false;
      guest.wantsRematch = false;
      this.broadcast(room, { type: 'rematchAccepted' });
      this.startGame(room);
    }
  }

  private leave(socket: WebSocket): void {
    const binding = this.bindings.get(socket);
    this.bindings.delete(socket);
    if (!binding) return;
    const room = this.rooms.get(binding.code);
    if (!room) return;
    this.closeRoom(room, 'opponentLeft');
  }

  // ----- helpers ---------------------------------------------------------

  private getRoomSlot(socket: WebSocket): { room: Room; slot: Slot } | null {
    const binding = this.bindings.get(socket);
    if (!binding) return null;
    const room = this.rooms.get(binding.code);
    if (!room) return null;
    const slot = binding.player === 0 ? room.slots[0] : room.slots[1];
    if (!slot || slot.token !== binding.token) return null;
    return { room, slot };
  }

  private opponentOf(room: Room, player: Player): Slot | null {
    return (player === 0 ? room.slots[1] : room.slots[0]) ?? null;
  }

  private presence(room: Room): PresenceInfo {
    const host = room.slots[0];
    const guest = room.slots[1];
    return {
      host: { connected: host.connected, ready: host.ready, name: host.name },
      guest: guest
        ? { connected: guest.connected, ready: guest.ready, name: guest.name }
        : null,
    };
  }

  private generateCode(): string {
    let code = '';
    do {
      code = '';
      for (let i = 0; i < CODE_LENGTH; i += 1) {
        code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
      }
    } while (this.rooms.has(code));
    return code;
  }

  private send(socket: WebSocket | null, msg: ServerMessage): void {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(msg));
    }
  }

  private broadcast(room: Room, msg: ServerMessage): void {
    room.slots.forEach((slot) => slot && this.send(slot.socket, msg));
  }

  private closeRoom(room: Room, reason = 'closed'): void {
    if (!this.rooms.has(room.code)) return;
    room.graceTimers.forEach((timer) => clearTimeout(timer));
    room.graceTimers.clear();
    room.slots.forEach((slot) => {
      if (slot?.socket) {
        this.send(slot.socket, { type: 'roomClosed', reason });
        this.bindings.delete(slot.socket);
      }
    });
    this.rooms.delete(room.code);
  }

  private sweep(): void {
    const now = Date.now();
    for (const room of [...this.rooms.values()]) {
      const anyConnected = room.slots.some((slot) => slot && slot.connected);
      if (!anyConnected || now - room.lastActivity > ROOM_TTL_MS) {
        this.closeRoom(room, 'expired');
      }
    }
  }
}

/** Trim and clamp a player-supplied name to a safe, single-line 20 chars. */
function sanitizeName(name?: string): string {
  if (!name) return '';
  return name.replace(/\s+/g, ' ').trim().slice(0, 20);
}
