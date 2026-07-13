/**
 * HTTP room API service — the single place the online backend URL lives.
 *
 * Backend contract (https://pallanguzhi-room-api.onrender.com):
 *   POST /room                    -> create a room, returns its room code
 *   POST /join                    -> join a room  { roomCode }
 *   POST /room/state              -> store state  { roomCode, state }
 *   GET  /room/:roomCode/state    -> fetch the latest stored state
 *
 * Responses are parsed tolerantly (roomCode/code/room fields, raw or wrapped
 * state) so minor backend shape differences don't break the client. No
 * localhost anywhere — production uses this URL exactly.
 */
export const ROOM_API_BASE = 'https://pallanguzhi-room-api.onrender.com';

export type JoinFailure = 'roomNotFound' | 'roomFull' | 'network';

const JSON_HEADERS = { 'content-type': 'application/json', accept: 'application/json' };

async function post(path: string, body: unknown): Promise<Response> {
  return fetch(`${ROOM_API_BASE}${path}`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    const data = (await res.json()) as unknown;
    return data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Extracts a room code from common response shapes. */
function pickCode(data: Record<string, unknown>): string | null {
  const direct = data.roomCode ?? data.code;
  if (typeof direct === 'string' && direct.length > 0) return direct.toUpperCase();
  const room = data.room;
  if (room && typeof room === 'object') {
    const nested = (room as Record<string, unknown>).roomCode ?? (room as Record<string, unknown>).code;
    if (typeof nested === 'string' && nested.length > 0) return nested.toUpperCase();
  }
  return null;
}

/** POST /room — creates a room; resolves to its shared uppercase room code. */
export async function apiCreateRoom(): Promise<string | null> {
  try {
    const res = await post('/room', {});
    if (!res.ok) return null;
    return pickCode(await readJson(res));
  } catch {
    return null;
  }
}

/** POST /join — joins with the shared code. Maps failures to stable reasons. */
export async function apiJoinRoom(roomCode: string): Promise<{ ok: true } | { ok: false; reason: JoinFailure }> {
  try {
    const res = await post('/join', { roomCode: roomCode.toUpperCase() });
    if (res.ok) return { ok: true };
    const data = await readJson(res);
    const text = JSON.stringify(data).toLowerCase();
    if (res.status === 404 || text.includes('not found') || text.includes('notfound')) {
      return { ok: false, reason: 'roomNotFound' };
    }
    if (res.status === 409 || res.status === 403 || text.includes('full')) {
      return { ok: false, reason: 'roomFull' };
    }
    return { ok: false, reason: 'roomNotFound' };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/** POST /room/state — pushes the latest shared room document. */
export async function apiPushState(roomCode: string, state: unknown): Promise<boolean> {
  try {
    const res = await post('/room/state', { roomCode: roomCode.toUpperCase(), state });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * GET /room/:roomCode/state — fetches the latest shared room document.
 * Returns the document, `null` when the room has no state yet, or
 * `'notFound'` when the room does not exist / has expired.
 */
export async function apiFetchState(roomCode: string): Promise<unknown | null | 'notFound' | 'network'> {
  try {
    const res = await fetch(`${ROOM_API_BASE}/room/${encodeURIComponent(roomCode.toUpperCase())}/state`, {
      headers: { accept: 'application/json' },
    });
    if (res.status === 404) return 'notFound';
    if (!res.ok) return 'network';
    const data = await readJson(res);
    // Accept { state: doc }, { room: { state: doc } }, or the doc itself.
    if ('state' in data) return data.state ?? null;
    const room = data.room;
    if (room && typeof room === 'object' && 'state' in (room as Record<string, unknown>)) {
      return (room as Record<string, unknown>).state ?? null;
    }
    return Object.keys(data).length > 0 ? data : null;
  } catch {
    return 'network';
  }
}
