import { ROOM_API_BASE } from '@/features/multiplayer/api';
import { storage, StorageKeys } from '@/utils/persist';

/**
 * Server-validated premium access-code redemption.
 *
 * Codes are generated ONLY by the owner (scripts/generate-premium-codes.mjs);
 * the app bundle contains no codes and no validation secrets. The room API
 * backend reads the owner's local premium-codes.json (no Redis/Upstash) and
 * enforces unused / used / revoked, so unlocking always requires a server
 * round-trip.
 */
export type RedeemResult = 'ok' | 'invalid' | 'used' | 'revoked' | 'network';

/**
 * Stable per-install id sent with redemptions so the SAME device can redeem
 * its code again after a reinstall, while other devices are refused once a
 * code is used. Not a secret — just an idempotency tag.
 */
async function getDeviceId(): Promise<string> {
  const existing = await storage.getString(StorageKeys.deviceId);
  if (existing) return existing;
  const bytes = new Uint8Array(16);
  const cryptoObj = (globalThis as { crypto?: Crypto }).crypto;
  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  await storage.setString(StorageKeys.deviceId, id);
  return id;
}

/** Canonical code form (matches the generator/server): A-Z0-9 only, uppercase. */
export function normalizeAccessCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * POST /premium/redeem — the single unlock path. Fails CLOSED: any error,
 * missing endpoint, or unreachable server refuses the unlock.
 */
export async function redeemAccessCode(raw: string): Promise<RedeemResult> {
  const code = normalizeAccessCode(raw);
  if (!code) return 'invalid';
  try {
    const res = await fetch(`${ROOM_API_BASE}/premium/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, deviceId: await getDeviceId() }),
    });
    const body: unknown = await res.json().catch(() => null);
    const data = (body ?? {}) as { ok?: boolean; error?: string };
    if (res.ok && data.ok) return 'ok';
    // Only trust the server's explicit JSON error field — a plain 404 (e.g.
    // an old deploy without the endpoint) must read as a network problem.
    const err = typeof data.error === 'string' ? data.error : '';
    if (err.includes('used')) return 'used';
    if (err.includes('revoked')) return 'revoked';
    if (err.includes('invalid')) return 'invalid';
    return 'network';
  } catch {
    return 'network';
  }
}
