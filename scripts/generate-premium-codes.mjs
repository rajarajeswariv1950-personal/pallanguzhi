#!/usr/bin/env node
/**
 * OWNER-ONLY premium code generator — manual, file-based system.
 * No external services of any kind are used or contacted.
 *
 * Usage:
 *   node scripts/generate-premium-codes.mjs             # regenerate everything
 *   node scripts/generate-premium-codes.mjs --sync-only # after hand-editing
 *       statuses in server/data/premium-codes.json, re-copy it to the backend
 *       repo folder (then commit/redeploy the backend).
 *
 * SINGLE SOURCE OF TRUTH: server/data/premium-codes.json
 *   {
 *     ownerCode: "PNP-XXXX-YYYY-ZZZZ",              // exactly one
 *     friendCodes: { "PNP-XXXX-YYYY": "unused" }    // exactly 200
 *   }
 * Friend-code statuses: "unused" | "used" | "revoked" — edited BY HAND.
 * A byte-identical copy is synced to
 * pallanguzhi-room-api/pallanguzhi-room-api/premium-codes.json for deploy.
 *
 * Format (mandatory):
 *   friend: PNP-XXXX-YYYY matching ^PNP-[A-Z0-9]{4}-[A-Z0-9]{4}$
 *   owner:  PNP-XXXX-YYYY-ZZZZ (three groups — deliberately longer)
 * Characters come from crypto.randomInt (CSPRNG) over the 31-symbol subset
 * of [A-Z0-9] that omits 0/O/1/I/L, so codes stay easy to read aloud while
 * matching the required regex. ~39.6 bits per friend code, ~59.4 bits for
 * the owner code. Regenerating OVERWRITES the file: every previously shared
 * code stops working once the backend copy is redeployed.
 */
import { randomInt } from 'node:crypto';
import { writeFileSync, readFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 31 unambiguous chars ⊂ [A-Z0-9]
const FRIEND_RE = /^PNP-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CODES_FILE = path.join(repoRoot, 'server', 'data', 'premium-codes.json');
const BACKEND_COPY = path.join(
  repoRoot,
  'pallanguzhi-room-api',
  'pallanguzhi-room-api',
  'premium-codes.json',
);

function group(len) {
  let s = '';
  for (let i = 0; i < len; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

function validateDoc(doc) {
  const friends = Object.keys(doc.friendCodes);
  if (friends.length !== 200) throw new Error(`expected 200 friend codes, got ${friends.length}`);
  if (new Set(friends).size !== 200) throw new Error('friend codes are not unique');
  for (const c of friends) {
    if (!FRIEND_RE.test(c)) throw new Error(`friend code ${c} violates PNP-XXXX-YYYY format`);
    if (!['unused', 'used', 'revoked'].includes(doc.friendCodes[c]))
      throw new Error(`friend code ${c} has invalid status "${doc.friendCodes[c]}"`);
  }
  if (!/^PNP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(doc.ownerCode))
    throw new Error('owner code violates PNP-XXXX-YYYY-ZZZZ format');
  if (doc.friendCodes[doc.ownerCode]) throw new Error('owner code collides with a friend code');
}

function sync() {
  copyFileSync(CODES_FILE, BACKEND_COPY);
  console.log(`Synced -> ${BACKEND_COPY}`);
}

if (process.argv.includes('--sync-only')) {
  validateDoc(JSON.parse(readFileSync(CODES_FILE, 'utf8'))); // refuse to ship a broken edit
  sync();
  process.exit(0);
}

const ownerCode = `PNP-${group(4)}-${group(4)}-${group(4)}`;
const friendCodes = {};
while (Object.keys(friendCodes).length < 200) {
  friendCodes[`PNP-${group(4)}-${group(4)}`] = 'unused';
}

const doc = {
  _note:
    'SINGLE SOURCE OF TRUTH for premium unlock codes. To retire a code, change its ' +
    "status to 'used' or 'revoked' BY HAND, then run " +
    "'node scripts/generate-premium-codes.mjs --sync-only' and redeploy the room API. " +
    'Never edit the code strings themselves; regenerate instead.',
  generatedAt: new Date().toISOString(),
  ownerCode,
  friendCodes,
};
validateDoc(doc);

mkdirSync(path.dirname(CODES_FILE), { recursive: true });
writeFileSync(CODES_FILE, JSON.stringify(doc, null, 2) + '\n');
console.log(`Wrote 1 owner code + 200 friend codes to ${CODES_FILE}`);
sync();
