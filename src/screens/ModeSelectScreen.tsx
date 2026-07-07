import { View, StyleSheet } from 'react-native';
import { BrandedScreen, OptionCard } from '@/components';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

export function ModeSelectScreen({ navigation }: RootStackScreenProps<'ModeSelect'>) {
  const { t } = useAppTranslation();

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
          subtitle={t('mode.sameDeviceDesc')}
          onPress={() => navigation.navigate('SameDeviceSetup')}
        />
        <OptionCard
          icon="globe"
          title={t('mode.online')}
          subtitle={t('mode.onlineDesc')}
          onPress={() => navigation.navigate('OnlineLobby')}
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
});
