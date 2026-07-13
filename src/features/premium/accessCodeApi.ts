import { ROOM_API_BASE } from '@/features/multiplayer/api';
import { storage, StorageKeys } from '@/utils/persist';
import { sha256Hex } from './sha256';
import { FRIEND_CODE_HASHES, OWNER_CODE_HASH } from './codeHashes';

/**
 * Premium access-code redemption — server-first with a hashed local fallback.
 *
 * Codes are generated ONLY by the owner (scripts/generate-premium-codes.mjs);
 * the app bundle contains NO plaintext codes. Redemption works in two layers:
 *
 *  1. SERVER (authoritative): POST /premium/redeem on the room API validates
 *     against the owner's premium-codes.json and enforces the manual
 *     unused / used / revoked statuses. An explicit 'used' / 'revoked'
 *     answer from the server is always final.
 *  2. LOCAL FALLBACK (resilience): if the server is unreachable, asleep
 *     (free-tier cold start), or is running a STALE DEPLOY that predates the
 *     current code batch (it then wrongly answers 'invalid'), the typed code
 *     is hashed (SHA-256 of its canonical form) and compared against the
 *     bundled hash manifest (codeHashes.ts). A match unlocks. Only hashes
 *     ship in the bundle, never codes, so codes cannot be read out of the
 *     app; regenerating codes rewrites the manifest and old codes die.
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

/** True when the canonical code hashes into the bundled manifest. */
export function matchesBundledCode(canonicalCode: string): boolean {
  const h = sha256Hex(canonicalCode);
  return h === OWNER_CODE_HASH || FRIEND_CODE_HASHES.includes(h);
}

/** POST /premium/redeem — the authoritative server round-trip. */
async function redeemViaServer(code: string): Promise<RedeemResult> {
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

/**
 * Redeem a typed access code. Server first; the bundled hash manifest
 * rescues genuinely-issued codes when the server is unreachable or stale.
 * A server-confirmed 'used' / 'revoked' is never overridden.
 */
export async function redeemAccessCode(raw: string): Promise<RedeemResult> {
  const code = normalizeAccessCode(raw);
  if (!code) return 'invalid';
  const server = await redeemViaServer(code);
  if (server === 'ok' || server === 'used' || server === 'revoked') return server;
  // 'invalid' (possibly a stale deploy that predates this code batch) or
  // 'network' (offline / cold start): fall back to the local hash manifest.
  if (matchesBundledCode(code)) return 'ok';
  return server;
}
