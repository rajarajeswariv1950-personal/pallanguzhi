/**
 * Premium entitlement model — SAFE FOUNDATION ONLY.
 *
 * There is intentionally NO live payment processing here. This file defines
 * the entitlement shape, the displayed pricing, and the owner/admin override
 * placeholder so the unlock flow can be completed later without touching
 * gameplay code.
 *
 * TODO(payments) — recommended production path (simplest first):
 *  1. Store builds (Google Play / App Store): digital unlocks MUST use native
 *     in-app purchase. Easiest route: RevenueCat (`react-native-purchases`)
 *     with a single one-time product (e.g. `premium_levels`), price tiers
 *     ₹499 / $4.99 / €4.99. RevenueCat also gives per-user entitlement
 *     lookups, so `useEntitlementStore.unlock('purchase')` is called from its
 *     listener and nothing else changes.
 *  2. India UPI/cards + payout to an Indian bank account is a web-checkout
 *     concern (Razorpay/Cashfree) and is only policy-compliant OUTSIDE the
 *     app stores (e.g. web build). Keep it out of store binaries.
 *  3. Owner-granted free access: replace OWNER_GRANT_FREE_ACCESS below with a
 *     remote flag (RevenueCat promotional entitlement, or a tiny allowlist
 *     endpoint) keyed by the player's profile. Until then the constant can be
 *     flipped in a private build to grant access manually.
 */

/** Where an unlock came from. */
export type EntitlementSource = 'none' | 'ownerGrant' | 'friendCode' | 'purchase';

export interface Entitlement {
  premium: boolean;
  source: EntitlementSource;
}

/**
 * Displayed one-time pricing. EUR is a placeholder tier — confirm the exact
 * EUR amount when the store products are created.
 */
export const PREMIUM_PRICING = {
  inr: '₹499',
  usd: '$4.99',
  eur: '€4.99',
} as const;

/**
 * OWNER/ADMIN OVERRIDE PLACEHOLDER.
 * Flip to `true` in a private/owner build to grant premium free of charge
 * (it is applied during hydration and persisted with source 'ownerGrant').
 * Replace with a real remote grant before public release.
 */
export const OWNER_GRANT_FREE_ACCESS = false;

/**
 * LOCAL-ONLY ACCESS CODES (placeholder for manual gifting).
 * Entered via the "Have an access code?" field under the difficulty list.
 * - OWNER_CODE: the owner's personal unlock (grants source 'ownerGrant').
 * - FRIEND_CODES: hand out individually to friends (source 'friendCode').
 * These are client-side placeholders — NOT security. Before public release,
 * move validation behind a tiny endpoint or a RevenueCat promotional
 * entitlement, and rotate anything that ever shipped in a binary.
 */
export const OWNER_CODE = 'PHOENIX-OWNER-2026';
export const FRIEND_CODES: readonly string[] = ['NEUMED-FRIEND-01', 'NEUMED-FRIEND-02'];

/**
 * Validate a manually-entered access code. Case/whitespace tolerant.
 * Returns the entitlement source it grants, or null if unrecognised.
 */
export function classifyAccessCode(raw: string): 'ownerGrant' | 'friendCode' | null {
  const code = raw.trim().toUpperCase();
  if (!code) return null;
  if (code === OWNER_CODE) return 'ownerGrant';
  if (FRIEND_CODES.includes(code)) return 'friendCode';
  return null;
}
