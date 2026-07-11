import { create } from 'zustand';
import { storage, StorageKeys } from '@/utils/persist';
import {
  OWNER_GRANT_FREE_ACCESS,
  classifyAccessCode,
  type Entitlement,
  type EntitlementSource,
} from '@/features/premium/entitlements';

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
   * Owner/friend access-code redemption (local placeholder — see
   * features/premium/entitlements.ts). Returns true when the code unlocked.
   */
  redeemCode: (code: string) => boolean;
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
  redeemCode: (code) => {
    const source = classifyAccessCode(code);
    if (!source) return false;
    set({ premium: true, source });
    persist(get());
    return true;
  },
  relock: () => {
    set({ ...DEFAULTS });
    persist(get());
  },
}));
