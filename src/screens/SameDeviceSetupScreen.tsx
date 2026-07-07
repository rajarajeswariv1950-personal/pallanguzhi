import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BrandedScreen, Card, Input, Button, AppText, Divider } from '@/components';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useProfileStore } from '@/store/profileStore';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

export function SameDeviceSetupScreen({
  navigation,
}: RootStackScreenProps<'SameDeviceSetup'>) {
  const { t } = useAppTranslation();
  const profileName = useProfileStore((s) => s.name);

  const [player1, setPlayer1] = useState(profileName || t('sameDevice.player1'));
  const [player2, setPlayer2] = useState(t('sameDevice.player2'));

  const start = () => {
    navigation.navigate('Gameplay', {
      mode: 'sameDevice',
      player1Name: player1.trim() || t('sameDevice.player1'),
      player2Name: player2.trim() || t('sameDevice.player2'),
    });
  };

  return (
    <BrandedScreen
      title={t('sameDevice.title')}
      footer={<Button label={t('sameDevice.start')} icon="play" onPress={start} />}
    >
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
});
