import type { GameState, Player } from '@/features/game/engine';

export interface SlotPresence {
  connected: boolean;
  ready: boolean;
  /** The player's chosen display name (may be empty if not provided). */
  name: string;
}

export interface PresenceInfo {
  host: SlotPresence;
  guest: SlotPresence | null;
}

export type ClientMessage =
  | { type: 'createRoom'; name?: string }
  | { type: 'joinRoom'; code: string; name?: string }
  | { type: 'reconnect'; code: string; token: string }
  | { type: 'ready'; ready: boolean }
  | { type: 'move'; pit: number }
  | { type: 'rematch' }
  | { type: 'leave' };

export type ServerMessage =
  | { type: 'roomCreated'; code: string; role: 'host'; you: Player; token: string }
  | { type: 'joinedRoom'; code: string; role: 'guest'; you: Player; token: string }
  | { type: 'roomNotFound' }
  | { type: 'roomFull' }
  | { type: 'presence'; presence: PresenceInfo }
  | { type: 'gameStarted'; state: GameState }
  | { type: 'state'; state: GameState }
  | { type: 'invalidMove'; reason?: string }
  | { type: 'opponentDisconnected' }
  | { type: 'opponentReconnected' }
  | { type: 'rematchRequested'; by: Player }
  | { type: 'rematchAccepted' }
  | { type: 'roomClosed'; reason: string }
  | { type: 'error'; message: string };
