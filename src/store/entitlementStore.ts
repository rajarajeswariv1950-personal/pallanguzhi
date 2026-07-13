import { create } from 'zustand';
import { storage, StorageKeys } from '@/utils/persist';
import {
  OWNER_GRANT_FREE_ACCESS,
  type Entitlement,
  type EntitlementSource,
} from '@/features/premium/entitlements';
import { redeemAccessCode, type RedeemResult } from '@/features/premium/accessCodeApi';

/**
 * Premium entitlement state — safe foundation, no live payments.
 * `unlock` is the single integration point a future payment provider
 * (in-app purchase / owner grant) must call; nothing else needs to change.
 */
interface EntitlementState extends Entitlement {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  /**
   * The single unlock entry point. A future payment provider's success
   * callback (RevenueCat purchase listener or Razorpay webhook-confirmed
   * receipt) should call `unlock('purchase')` — nothing else changes.
   */
  unlock: (source: Exclude<EntitlementSource, 'none'>) => void;
  /**
   * Server-validated access-code redemption (see
   * features/premium/accessCodeApi.ts). Resolves 'ok' when the server
   * accepted the code and premium was unlocked; otherwise reports why.
   */
  redeemCode: (code: string) => Promise<RedeemResult>;
  /** Dev/testing helper — relock (does not touch any payment provider). */
  relock: () => void;
}

const DEFAULTS: Entitlement = { premium: false, source: 'none' };

function persist(state: Entitlement) {
  void storage.setJSON(StorageKeys.entitlement, {
    premium: state.premium,
    source: state.source,
  });
}

export const useEntitlementStore = create<EntitlementState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,
  hydrate: async () => {
    const saved = await storage.getJSON<Partial<Entitlement>>(StorageKeys.entitlement);
    let merged: Entitlement = { ...DEFAULTS, ...(saved ?? {}) };
    // Owner/admin override placeholder — see features/premium/entitlements.ts.
    if (!merged.premium && OWNER_GRANT_FREE_ACCESS) {
      merged = { premium: true, source: 'ownerGrant' };
      persist(merged);
    }
    set({ ...merged, hydrated: true });
  },
  unlock: (source) => {
    set({ premium: true, source });
    persist(get());
  },
  redeemCode: async (code) => {
    const result = await redeemAccessCode(code);
    if (result === 'ok') {
      set({ premium: true, source: 'friendCode' });
      persist(get());
    }
    return result;
  },
  relock: () => {
    set({ ...DEFAULTS });
    persist(get());
  },
}));
