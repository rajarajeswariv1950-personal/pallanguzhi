import { View, StyleSheet } from 'react-native';
import { BrandedScreen, OptionCard, Badge, FadeSlideIn } from '@/components';
import { PremiumLockCard } from '@/features/premium/PremiumLockCard';
import { usePremium } from '@/features/premium/usePremium';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import type { Difficulty } from '@/features/game/types';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

export function SinglePlayerDifficultyScreen({
  navigation,
}: RootStackScreenProps<'SinglePlayerDifficulty'>) {
  const { t } = useAppTranslation();
  // Premium gate — Basic (Easy) is always free; Medium/Hard unlock via the
  // locally persisted entitlement, read through the centralized usePremium
  // hook (never the raw store). Unlocking happens with a friend code in the
  // PremiumLockCard below.
  const { isPremium, isDifficultyLocked } = usePremium();

  const start = (difficulty: Difficulty) => {
    navigation.navigate('Gameplay', { mode: 'single', difficulty });
  };

  // Free vs Premium clarity: Basic/Easy is always free (labelled "Free");
  // locked levels carry a lock + "Premium" badge and explain that a friend
  // code (entered below) unlocks them. Only these advanced levels are gated.
  const lockedBadge = (
    <View style={styles.badgeCol}>
      <Badge label={t('premium.lockedBadge')} tone="gold" />
      <Badge label={t('premium.locked')} tone="neutral" />
    </View>
  );
  const subtitleFor = (difficulty: Difficulty, desc: string) =>
    isDifficultyLocked(difficulty) ? `${desc} · ${t('premium.friendCodeHint')}` : desc;

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
            subtitle={subtitleFor('medium', t('difficulty.mediumDesc'))}
            onPress={isDifficultyLocked('medium') ? undefined : () => start('medium')}
            disabled={isDifficultyLocked('medium')}
            rightSlot={isDifficultyLocked('medium') ? lockedBadge : undefined}
          />
        </FadeSlideIn>
        <FadeSlideIn delay={140}>
          <OptionCard
            icon="skull"
            title={t('difficulty.hard')}
            subtitle={subtitleFor('hard', t('difficulty.hardDesc'))}
            onPress={isDifficultyLocked('hard') ? undefined : () => start('hard')}
            disabled={isDifficultyLocked('hard')}
            rightSlot={isDifficultyLocked('hard') ? lockedBadge : undefined}
          />
        </FadeSlideIn>

        {!isPremium ? (
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
