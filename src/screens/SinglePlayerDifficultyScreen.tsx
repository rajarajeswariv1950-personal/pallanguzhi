import { View, StyleSheet } from 'react-native';
import { BrandedScreen, OptionCard } from '@/components';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import type { Difficulty } from '@/features/game/types';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

export function SinglePlayerDifficultyScreen({
  navigation,
}: RootStackScreenProps<'SinglePlayerDifficulty'>) {
  const { t } = useAppTranslation();

  const start = (difficulty: Difficulty) => {
    navigation.navigate('Gameplay', { mode: 'single', difficulty });
  };

  return (
    <BrandedScreen title={t('difficulty.title')}>
      <View style={styles.container}>
        <OptionCard
          icon="leaf"
          title={t('difficulty.easy')}
          subtitle={t('difficulty.easyDesc')}
          onPress={() => start('easy')}
        />
        <OptionCard
          icon="flame"
          title={t('difficulty.medium')}
          subtitle={t('difficulty.mediumDesc')}
          onPress={() => start('medium')}
        />
        <OptionCard
          icon="skull"
          title={t('difficulty.hard')}
          subtitle={t('difficulty.hardDesc')}
          onPress={() => start('hard')}
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
