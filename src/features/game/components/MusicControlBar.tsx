import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card, Icon } from '@/components';
import {
  pauseGameplayMusic,
  resumeGameplayMusic,
  useMusicPlayback,
} from '@/services/feedback';
import { storage, StorageKeys } from '@/utils/persist';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { theme } from '@/theme';

/**
 * Premium in-game music control strip. Rendered on the gameplay screen for
 * every mode (single / same-device / online enter through GameplayScreen).
 * PLAY/STOP drive the ONE shared music player in AudioService
 * (resumeGameplayMusic / pauseGameplayMusic) — no second player instance.
 * The first-time hint is dismissible and persisted, so it never reappears.
 */
export function MusicControlBar() {
  const { t } = useAppTranslation();
  const playing = useMusicPlayback((s) => s.playing);
  const [hintVisible, setHintVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    void storage.getString(StorageKeys.musicHintDismissed).then((v) => {
      if (mounted && !v) setHintVisible(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const dismissHint = () => {
    setHintVisible(false);
    void storage.setString(StorageKeys.musicHintDismissed, '1');
  };

  return (
    <View style={styles.wrap}>
      {hintVisible ? (
        <Card style={styles.hintCard}>
          <View style={styles.hintRow}>
            <Icon name="musical-notes" size={18} color={theme.colors.primaryLight} />
            <AppText variant="small" muted style={styles.hintText}>
              {t('musicBar.hint')}
            </AppText>
          </View>
          <Button
            label={t('musicBar.hintDismiss')}
            variant="ghost"
            size="md"
            fullWidth={false}
            onPress={dismissHint}
            style={styles.hintDismiss}
          />
        </Card>
      ) : null}

      <View style={styles.bar}>
        <Button
          label={t('musicBar.play')}
          icon="play"
          size="md"
          fullWidth={false}
          // Gold (primary) background while playing, quiet otherwise.
          variant={playing ? 'primary' : 'secondary'}
          disabled={playing}
          onPress={resumeGameplayMusic}
        />
        <Button
          label={t('musicBar.stop')}
          icon="stop"
          size="md"
          fullWidth={false}
          variant="ghost"
          disabled={!playing}
          onPress={pauseGameplayMusic}
        />
        <AppText
          variant="caption"
          color={playing ? theme.colors.primaryLight : theme.colors.textMuted}
          style={styles.status}
        >
          {playing ? t('musicBar.playing') : t('musicBar.paused')}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.spacing.sm },
  hintCard: { paddingVertical: theme.spacing.md },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  hintText: { flex: 1 },
  hintDismiss: { alignSelf: 'flex-end', marginTop: theme.spacing.xs },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  status: { flex: 1, textAlign: 'right' },
});
