/**
 * Shared premium access-code validation — LOCAL FILE ONLY.
 *
 * Single source of truth: server/data/premium-codes.json
 * (1 owner code + 200 friend codes in PNP-XXXX-YYYY form, with manual
 * "unused" | "used" | "revoked" statuses). No Redis, no Upstash, no
 * external service of any kind is contacted — validation is a pure
 * in-memory lookup over the file, loaded once at startup.
 *
 * Import from API routes or WebSocket handlers alike:
 *   import { validateFriendCode } from './premiumCodes';
 *
 * SAFETY: never log raw code values; log only the result kind.
 */
import { readFileSync } from 'fs';
import * as path from 'path';

export type CodeValidation =
  | { kind: 'owner' }
  | { kind: 'friend'; code: string }
  | { kind: 'invalid' };

export type FriendCodeStatus = 'unused' | 'used' | 'revoked';

interface PremiumCodesDoc {
  ownerCode: string;
  friendCodes: Record<string, FriendCodeStatus>;
}

/** Strip everything outside [A-Z0-9] after uppercasing — tolerant of
 * missing/extra dashes, spaces, and lowercase typing. */
function canonical(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function loadDoc(): PremiumCodesDoc {
  // Works from both src/ (tsx dev) and dist/ (compiled) — data/ sits beside them.
  const file = path.resolve(__dirname, '..', 'data', 'premium-codes.json');
  return JSON.parse(readFileSync(file, 'utf8')) as PremiumCodesDoc;
}

const doc = loadDoc();
const ownerCanonical = canonical(doc.ownerCode);
/** canonical form -> code exactly as written in the file */
const friendByCanonical = new Map<string, string>(
  Object.keys(doc.friendCodes).map((code) => [canonical(code), code]),
);

/**
 * Classify a manually-entered unlock code.
 * Distinguishes the owner code, an issued friend code (returned in its
 * canonical dashed PNP-XXXX-YYYY form), or anything else as invalid.
 * Status ("used"/"revoked") is intentionally NOT judged here — this answers
 * "is this one of our codes?"; callers decide what a status means for them.
 */
export function validateFriendCode(
  code: string,
): { kind: 'owner' } | { kind: 'friend'; code: string } | { kind: 'invalid' } {
  const c = canonical(code);
  if (!c) return { kind: 'invalid' };
  if (c === ownerCanonical) return { kind: 'owner' };
  const friend = friendByCanonical.get(c);
  if (friend) return { kind: 'friend', code: friend };
  return { kind: 'invalid' };
}

/** Manual status of an issued friend code (from the source-of-truth file). */
export function friendCodeStatus(code: string): FriendCodeStatus | null {
  const v = validateFriendCode(code);
  if (v.kind !== 'friend') return null;
  return doc.friendCodes[v.code];
}
