import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BrandedScreen, OptionCard, Card, Input, AppText } from '@/components';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useProfileStore } from '@/store/profileStore';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

export function OnlineLobbyScreen({ navigation }: RootStackScreenProps<'OnlineLobby'>) {
  const { t } = useAppTranslation();
  const profileName = useProfileStore((s) => s.name);
  const [name, setName] = useState(profileName);
  const displayName = name.trim();

  return (
    <BrandedScreen title={t('online.title')}>
      <View style={styles.container}>
        {/* Name entry — carried into the room so the opponent sees your name. */}
        <Card>
          <Input
            label={t('online.yourName')}
            value={name}
            onChangeText={setName}
            placeholder={t('online.namePlaceholder')}
            maxLength={20}
            returnKeyType="done"
          />
        </Card>

        <OptionCard
          icon="add-circle"
          title={t('online.create')}
          subtitle={t('online.createDesc')}
          onPress={() => navigation.navigate('CreateRoom', { name: displayName })}
        />
        <OptionCard
          icon="enter"
          title={t('online.join')}
          subtitle={t('online.joinDesc')}
          onPress={() => navigation.navigate('JoinRoom', { name: displayName })}
        />
        <OptionCard
          icon="flash"
          title={t('online.quickMatch')}
          subtitle={t('online.quickMatchDesc')}
          onPress={() => navigation.navigate('CreateRoom', { name: displayName, quick: true })}
        />

        <AppText variant="caption" muted align="center" style={styles.note}>
          {t('online.twoPlayerNote')}
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
  note: { marginTop: theme.spacing.xs },
});
