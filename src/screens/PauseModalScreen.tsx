import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Card,
  Button,
  AppText,
  AppWordmark,
  EmblemBadge,
  AppFooter,
  Divider,
} from '@/components';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

export function PauseModalScreen({ navigation, route }: RootStackScreenProps<'PauseModal'>) {
  const { t } = useAppTranslation();
  const online = route.params?.online ?? false;
  const [confirming, setConfirming] = useState(false);

  const resume = () => navigation.goBack();
  const quitToHome = () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] });

  return (
    <View style={styles.overlay}>
      <StatusBar style="light" />
      <Pressable
        style={StyleSheet.absoluteFill}
        accessibilityLabel={t('pause.resume')}
        onPress={resume}
      />
      <Card style={styles.card}>
        {/* Branded treatment — language-aware app name + emblem. The board key
            art is reserved for tall hero surfaces where ALL of it is visible;
            a 46px chip here would reduce it to an unreadable sliver. */}
        <View style={styles.brandRow}>
          <View style={styles.brandText}>
            <AppWordmark size="inline" align="left" numberOfLines={2} />
          </View>
          <EmblemBadge size={40} />
        </View>
        <Divider style={styles.divider} />

        <AppText variant="h2" align="center" style={styles.title}>
          {confirming ? t('pause.confirmExitTitle') : t('pause.title')}
        </AppText>

        {confirming ? (
          <View style={styles.actions}>
            <AppText variant="body" muted align="center" style={styles.confirmText}>
              {online ? t('pause.confirmExitOnline') : t('pause.confirmExit')}
            </AppText>
            <Button label={t('common.confirm')} variant="danger" icon="exit" onPress={quitToHome} />
            <Button label={t('common.cancel')} variant="ghost" onPress={() => setConfirming(false)} />
          </View>
        ) : (
          <View style={styles.actions}>
            <Button label={t('pause.resume')} icon="play" onPress={resume} />
            <Button
              label={t('pause.settings')}
              variant="secondary"
              icon="settings-sharp"
              onPress={() => navigation.navigate('Settings')}
            />
            <Button
              label={t('pause.quit')}
              variant="danger"
              icon="exit"
              onPress={() => setConfirming(true)}
            />
          </View>
        )}

        <AppFooter compact style={styles.footer} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  brandText: { flex: 1 },
  divider: { marginVertical: theme.spacing.md },
  title: { marginBottom: theme.spacing.lg },
  actions: { gap: theme.spacing.md },
  confirmText: { marginBottom: theme.spacing.sm },
  footer: { marginTop: theme.spacing.lg },
});
