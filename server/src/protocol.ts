import { z } from 'zod';
import type { GameState, Player } from './engine';

/** Messages the client may send to the server (validated with zod). */
export const clientMessageSchema = z.union([
  z.object({ type: z.literal('createRoom'), name: z.string().max(20).optional() }),
  z.object({ type: z.literal('joinRoom'), code: z.string().min(3).max(8), name: z.string().max(20).optional() }),
  z.object({ type: z.literal('reconnect'), code: z.string().min(3).max(8), token: z.string().min(8) }),
  z.object({ type: z.literal('ready'), ready: z.boolean() }),
  z.object({ type: z.literal('move'), pit: z.number().int().min(0).max(13) }),
  z.object({ type: z.literal('rematch') }),
  z.object({ type: z.literal('leave') }),
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;

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

/** Messages the server sends to clients. */
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

export function parseClientMessage(
  raw: string,
): { ok: true; message: ClientMessage } | { ok: false } {
  try {
    const parsed = clientMessageSchema.safeParse(JSON.parse(raw));
    return parsed.success ? { ok: true, message: parsed.data } : { ok: false };
  } catch {
    return { ok: false };
  }
}
