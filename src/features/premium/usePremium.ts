import { useEntitlementStore } from '@/store/entitlementStore';
import type { EntitlementSource } from './entitlements';
import type { Difficulty, GameMode } from '@/features/game/types';

/**
 * Centralized premium gate — the ONE place components read paywall state.
 *
 * The flag is the locally persisted entitlement (AsyncStorage via
 * useEntitlementStore); it flips to true only through that store's
 * `redeemCode` / `unlock` actions — i.e. STRICTLY a one-time purchase or a
 * friend access code. No Redis, no Upstash, no server-side entitlement
 * lookups happen here. Components must use this hook (or the store's
 * actions) instead of reading the store's fields directly, so future gating
 * changes stay in one file.
 *
 * Gating policy:
 *  - Single player: Easy is free; Medium/Hard require premium.
 *  - Two players on one device (sameDevice): the ENTIRE mode requires
 *    premium — all three levels (easy/medium/hard) are locked until unlocked.
 *  - Online multiplayer: the ENTIRE mode requires premium — all three
 *    levels are locked until unlocked.
 */

/** Single-player difficulty levels that require premium. Easy stays free. */
export const PREMIUM_DIFFICULTIES: readonly Difficulty[] = ['medium', 'hard'];

/** Game modes that are premium-only IN THEIR ENTIRETY (every level locked). */
export const PREMIUM_MODES: readonly GameMode[] = ['sameDevice', 'online'];

export interface PremiumGate {
  /** True when the local entitlement grants premium. Single source of truth. */
  isPremium: boolean;
  /** False until the persisted entitlement has been loaded on app start. */
  hydrated: boolean;
  /** Where the unlock came from ('none' while locked). */
  source: EntitlementSource;
  /** True when this SINGLE-PLAYER difficulty is playable right now. */
  canPlayDifficulty: (difficulty: Difficulty) => boolean;
  /** True when this SINGLE-PLAYER difficulty needs (and lacks) a premium unlock. */
  isDifficultyLocked: (difficulty: Difficulty) => boolean;
  /** True when this whole mode needs (and lacks) a premium unlock. */
  isModeLocked: (mode: GameMode) => boolean;
  /**
   * Mode-aware level gate: in single player only Medium/Hard are premium; in
   * sameDevice/online EVERY level (easy included) is premium.
   */
  isDifficultyLockedFor: (mode: GameMode, difficulty: Difficulty) => boolean;
  /** True when two players on one device needs (and lacks) a premium unlock. */
  isTwoPlayerLocked: boolean;
  /** True when online multiplayer needs (and lacks) a premium unlock. */
  isOnlineLocked: boolean;
}

export function usePremium(): PremiumGate {
  const isPremium = useEntitlementStore((s) => s.premium);
  const hydrated = useEntitlementStore((s) => s.hydrated);
  const source = useEntitlementStore((s) => s.source);

  const isDifficultyLocked = (difficulty: Difficulty) =>
    !isPremium && PREMIUM_DIFFICULTIES.includes(difficulty);

  const isModeLocked = (mode: GameMode) => !isPremium && PREMIUM_MODES.includes(mode);

  return {
    isPremium,
    hydrated,
    source,
    canPlayDifficulty: (difficulty) => !isDifficultyLocked(difficulty),
    isDifficultyLocked,
    isModeLocked,
    isDifficultyLockedFor: (mode, difficulty) =>
      mode === 'single' ? isDifficultyLocked(difficulty) : isModeLocked(mode),
    // Two-player on one device is a premium feature in its entirety; the
    // decision is purely this local flag — unlocked only by one-time
    // purchase or a friend access code.
    isTwoPlayerLocked: !isPremium,
    // Online play with friends is a premium feature; the decision is purely
    // this local flag — no network/Redis lookups are ever involved.
    isOnlineLocked: !isPremium,
  };
}
