import { View, StyleSheet } from 'react-native';
import { BrandedScreen, OptionCard, Badge, FadeSlideIn } from '@/components';
import { PremiumLockCard } from '@/features/premium/PremiumLockCard';
import { PREMIUM_PRICING } from '@/features/premium/entitlements';
import { useEntitlementStore } from '@/store/entitlementStore';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import type { Difficulty } from '@/features/game/types';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

export function SinglePlayerDifficultyScreen({
  navigation,
}: RootStackScreenProps<'SinglePlayerDifficulty'>) {
  const { t } = useAppTranslation();
  // Premium gate — Basic (Easy) is always free; the next levels (Medium/Hard)
  // unlock via the entitlement store. SAFE FOUNDATION: no live payments —
  // see src/features/premium/entitlements.ts for the production path.
  const premium = useEntitlementStore((s) => s.premium);

  const start = (difficulty: Difficulty) => {
    navigation.navigate('Gameplay', { mode: 'single', difficulty });
  };

  // Free vs Premium clarity: Basic/Easy is always free (labelled "Free");
  // Medium/Hard carry a lock + "Premium" badge and show the one-time price.
  // Only these advanced levels are gated — the rest of the game stays free.
  const lockedBadge = (
    <View style={styles.badgeCol}>
      <Badge label={t('premium.lockedBadge')} tone="gold" />
      <Badge label={t('premium.locked')} tone="neutral" />
    </View>
  );
  const priceHint = t('premium.unlockHint', PREMIUM_PRICING);

  return (
    <BrandedScreen title={t('difficulty.title')}>
      <View style={styles.container}>
        <FadeSlideIn delay={0}>
          <OptionCard
            icon="leaf"
            title={t('difficulty.easy')}
            subtitle={t('difficulty.easyDesc')}
            onPress={() => start('easy')}
            rightSlot={<Badge label={t('premium.freeBadge')} tone="success" />}
          />
        </FadeSlideIn>
        <FadeSlideIn delay={70}>
          <OptionCard
            icon="flame"
            title={t('difficulty.medium')}
            subtitle={premium ? t('difficulty.mediumDesc') : `${t('difficulty.mediumDesc')} · ${priceHint}`}
            onPress={premium ? () => start('medium') : undefined}
            disabled={!premium}
            rightSlot={premium ? undefined : lockedBadge}
          />
        </FadeSlideIn>
        <FadeSlideIn delay={140}>
          <OptionCard
            icon="skull"
            title={t('difficulty.hard')}
            subtitle={premium ? t('difficulty.hardDesc') : `${t('difficulty.hardDesc')} · ${priceHint}`}
            onPress={premium ? () => start('hard') : undefined}
            disabled={!premium}
            rightSlot={premium ? undefined : lockedBadge}
          />
        </FadeSlideIn>

        {!premium ? (
          <FadeSlideIn delay={210}>
            <PremiumLockCard />
          </FadeSlideIn>
        ) : null}
      </View>
    </BrandedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  badgeCol: {
    alignItems: 'flex-end',
    gap: theme.spacing.xxs,
  },
});
