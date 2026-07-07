import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BrandedScreen, Card, Input, Button, AppText, Divider } from '@/components';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useProfileStore } from '@/store/profileStore';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

export function ProfileScreen(_props: RootStackScreenProps<'Profile'>) {
  const { t } = useAppTranslation();
  const name = useProfileStore((s) => s.name);
  const setName = useProfileStore((s) => s.setName);

  const [value, setValue] = useState(name);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await setName(value);
    setSaved(true);
  };

  return (
    <BrandedScreen
      title={t('profile.title')}
      footer={
        <Button
          label={saved ? t('profile.saved') : t('profile.save')}
          icon={saved ? 'checkmark' : 'save'}
          onPress={save}
        />
      }
    >
      <View style={styles.container}>
        <Card>
          <Input
            label={t('profile.name')}
            value={value}
            onChangeText={(v) => {
              setValue(v);
              setSaved(false);
            }}
            placeholder={t('profile.namePlaceholder')}
            maxLength={20}
            returnKeyType="done"
            onSubmitEditing={save}
          />
        </Card>

        <AppText variant="overline" color={theme.colors.textMuted} style={styles.sectionLabel}>
          {t('profile.stats')}
        </AppText>
        <Card>
          <StatRow label={t('profile.gamesPlayed')} value={0} />
          <Divider style={styles.divider} />
          <StatRow label={t('profile.wins')} value={0} />
        </Card>
      </View>
    </BrandedScreen>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statRow}>
      <AppText variant="title">{label}</AppText>
      <AppText variant="h3" color={theme.colors.primaryLight}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  sectionLabel: {
    marginTop: theme.spacing.md,
    marginLeft: theme.spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: { marginVertical: theme.spacing.md },
});
