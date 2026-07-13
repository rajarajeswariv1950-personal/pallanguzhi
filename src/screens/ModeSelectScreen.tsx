import { View, StyleSheet } from 'react-native';
import { BrandedScreen, OptionCard, Badge } from '@/components';
import { usePremium } from '@/features/premium/usePremium';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

export function ModeSelectScreen({ navigation }: RootStackScreenProps<'ModeSelect'>) {
  const { t } = useAppTranslation();
  // Two players on one device AND online multiplayer are premium-only (every
  // level of both). The decision comes exclusively from the locally persisted
  // entitlement via usePremium — no network involved.
  const { isOnlineLocked, isTwoPlayerLocked } = usePremium();

  const lockedBadge = (
    <View style={styles.badgeCol}>
      <Badge label={t('premium.lockedBadge')} tone="gold" />
      <Badge label={t('premium.locked')} tone="neutral" />
    </View>
  );

  return (
    <BrandedScreen title={t('mode.title')}>
      <View style={styles.container}>
        <OptionCard
          icon="hardware-chip"
          title={t('mode.single')}
          subtitle={t('mode.singleDesc')}
          onPress={() => navigation.navigate('SinglePlayerDifficulty')}
        />
        <OptionCard
          icon="people"
          title={t('mode.sameDevice')}
          subtitle={
            isTwoPlayerLocked
              ? `${t('mode.sameDeviceDesc')} · ${t('premium.twoPlayerLockedHint')}`
              : t('mode.sameDeviceDesc')
          }
          // CTA, not a dead end: a locked tap still opens the setup screen,
          // which shows the premium note + purchase/friend-code card.
          onPress={() => navigation.navigate('SameDeviceSetup')}
          rightSlot={isTwoPlayerLocked ? lockedBadge : undefined}
        />
        <OptionCard
          icon="globe"
          title={t('mode.online')}
          subtitle={
            isOnlineLocked ? `${t('mode.onlineDesc')} · ${t('premium.onlineLockedHint')}` : t('mode.onlineDesc')
          }
          // CTA, not a dead end: a locked tap still opens the online screen,
          // which shows the premium note + friend-code redemption card.
          onPress={() => navigation.navigate('OnlineLobby')}
          rightSlot={isOnlineLocked ? lockedBadge : undefined}
        />
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
