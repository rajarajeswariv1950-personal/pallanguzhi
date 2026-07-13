import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BrandedScreen, Card, Input, OptionCard, Badge, AppText, Divider, FadeSlideIn } from '@/components';
import { PremiumLockCard } from '@/features/premium/PremiumLockCard';
import { usePremium } from '@/features/premium/usePremium';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useProfileStore } from '@/store/profileStore';
import type { Difficulty } from '@/features/game/types';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

export function SameDeviceSetupScreen({
  navigation,
}: RootStackScreenProps<'SameDeviceSetup'>) {
  const { t } = useAppTranslation();
  // STRICT premium gate — two players on one device is a premium feature in
  // its entirety: all three levels (easy/medium/hard) stay locked until the
  // one-time purchase or a friend access code unlocks them. The decision is
  // the locally persisted entitlement via usePremium; ModeSelect shows the
  // lock too, but this screen is the enforcement point.
  const { isTwoPlayerLocked } = usePremium();
  const profileName = useProfileStore((s) => s.name);

  const [player1, setPlayer1] = useState(profileName || t('sameDevice.player1'));
  const [player2, setPlayer2] = useState(t('sameDevice.player2'));

  if (isTwoPlayerLocked) {
    return (
      <BrandedScreen title={t('sameDevice.title')}>
        <View style={styles.container}>
          <AppText variant="caption" muted align="center" style={styles.note}>
            {t('premium.twoPlayerLockedBody')}
          </AppText>
          {/* Same purchase/friend-code redemption card used everywhere else. */}
          <PremiumLockCard />
        </View>
      </BrandedScreen>
    );
  }

  // Tapping a level starts the match at that level. All three are premium
  // (the whole mode is), so an unlocked user sees all three available.
  const start = (difficulty: Difficulty) => {
    navigation.navigate('Gameplay', {
      mode: 'sameDevice',
      difficulty,
      player1Name: player1.trim() || t('sameDevice.player1'),
      player2Name: player2.trim() || t('sameDevice.player2'),
    });
  };

  const premiumBadge = <Badge label={t('premium.lockedBadge')} tone="gold" />;

  return (
    <BrandedScreen title={t('sameDevice.title')}>
      <View style={styles.container}>
        <Card>
          <Input
            label={t('sameDevice.player1')}
            value={player1}
            onChangeText={setPlayer1}
            placeholder={t('sameDevice.player1Placeholder')}
            maxLength={20}
          />
          <Divider style={styles.divider} ornament />
          <Input
            label={t('sameDevice.player2')}
            value={player2}
            onChangeText={setPlayer2}
            placeholder={t('sameDevice.player2Placeholder')}
            maxLength={20}
          />
        </Card>

        <AppText variant="overline" color={theme.colors.textMuted}>
          {t('sameDevice.chooseLevel')}
        </AppText>

        <FadeSlideIn delay={0}>
          <OptionCard
            icon="leaf"
            title={t('difficulty.easy')}
            subtitle={t('difficulty.twoPlayerEasyDesc')}
            onPress={() => start('easy')}
            rightSlot={premiumBadge}
          />
        </FadeSlideIn>
        <FadeSlideIn delay={70}>
          <OptionCard
            icon="flame"
            title={t('difficulty.medium')}
            subtitle={t('difficulty.twoPlayerMediumDesc')}
            onPress={() => start('medium')}
            rightSlot={premiumBadge}
          />
        </FadeSlideIn>
        <FadeSlideIn delay={140}>
          <OptionCard
            icon="skull"
            title={t('difficulty.hard')}
            subtitle={t('difficulty.twoPlayerHardDesc')}
            onPress={() => start('hard')}
            rightSlot={premiumBadge}
          />
        </FadeSlideIn>

        <AppText variant="caption" muted align="center">
          {t('sameDevice.handoffHint')}
        </AppText>
      </View>
    </BrandedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  divider: {
    marginVertical: theme.spacing.lg,
  },
  note: { marginTop: theme.spacing.xs },
});
