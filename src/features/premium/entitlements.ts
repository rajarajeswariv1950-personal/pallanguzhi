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
 * ACCESS CODES — SERVER-VALIDATED. No codes live in the app bundle.
 * The owner generates 1 owner code + 200 friend codes locally with
 * `node scripts/generate-premium-codes.mjs`; the single source of truth is
 * server/data/premium-codes.json (statuses managed by hand — no Redis, no
 * Upstash, no external store). Redemption goes through
 * features/premium/accessCodeApi.ts → POST /premium/redeem on the room API,
 * which enforces unused / used / revoked from that file.
 */
