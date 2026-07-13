import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, Share, View, StyleSheet } from 'react-native';
import { BrandedScreen, Card, Button, AppText, Badge, Divider } from '@/components';
import { useMultiplayerStore } from '@/features/multiplayer/store';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useProfileStore } from '@/store/profileStore';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

export function CreateRoomScreen({ navigation, route }: RootStackScreenProps<'CreateRoom'>) {
  const { t } = useAppTranslation();
  const profileName = useProfileStore((s) => s.name);
  const createRoom = useMultiplayerStore((s) => s.createRoom);
  const leave = useMultiplayerStore((s) => s.leave);
  const roomCode = useMultiplayerStore((s) => s.roomCode);
  const presence = useMultiplayerStore((s) => s.presence);
  const errorKey = useMultiplayerStore((s) => s.errorKey);

  const isQuick = route.params?.quick ?? false;
  const displayName = (route.params?.name ?? profileName ?? '').trim();
  const nameRef = useRef(displayName);
  // Host-chosen match level (from the lobby selector); written into the
  // shared room document so the guest starts with the identical rules.
  const level = route.params?.difficulty ?? 'medium';
  const levelRef = useRef(level);

  useEffect(() => {
    createRoom(nameRef.current || undefined, levelRef.current);
  }, [createRoom]);

  // Real native share sheet — invites a friend with the room code. Wrapped so a
  // dismissed sheet or an unsupported platform (web) never throws.
  const shareCode = useCallback(
    async (code: string) => {
      try {
        await Share.share({ message: t('createRoom.shareMessage', { code }) });
      } catch {
        // user dismissed / share unavailable — no-op
      }
    },
    [t],
  );

  // Quick Match: as soon as the room exists, offer to share it once (native).
  const autoShared = useRef(false);
  useEffect(() => {
    if (isQuick && roomCode && !autoShared.current && Platform.OS !== 'web') {
      autoShared.current = true;
      void shareCode(roomCode);
    }
  }, [isQuick, roomCode, shareCode]);

  const playerCount = 1 + (presence?.guest ? 1 : 0);

  const back = () => {
    leave();
    navigation.goBack();
  };

  return (
    <BrandedScreen
      title={isQuick ? t('online.quickMatch') : t('createRoom.title')}
      onBack={back}
      footer={
        <Button
          label={t('common.continue')}
          icon="arrow-forward"
          disabled={!roomCode}
          onPress={() => roomCode && navigation.navigate('WaitingRoom', { roomCode, isHost: true })}
        />
      }
    >
      <View style={styles.container}>
        <View style={styles.topRow}>
          {displayName ? (
            <Badge label={displayName} tone="gold" />
          ) : (
            <View />
          )}
          <Badge label={t(`difficulty.${level}`)} tone="gold" />
          <Badge label={t('waitingRoom.players', { count: playerCount })} tone="neutral" />
        </View>

        <Card>
          <AppText variant="caption" muted align="center">
            {t('createRoom.roomCode')}
          </AppText>
          {roomCode ? (
            <AppText variant="display" align="center" color={theme.colors.primaryLight} style={styles.code}>
              {roomCode}
            </AppText>
          ) : (
            <View style={styles.loading}>
              <ActivityIndicator color={theme.colors.primaryLight} />
              <AppText variant="caption" muted style={styles.loadingText}>
                {t('net.connecting')}
              </AppText>
            </View>
          )}
          <Divider ornament style={styles.divider} />
          <AppText variant="body" muted align="center">
            {t('createRoom.share')}
          </AppText>
          <AppText variant="small" muted align="center" style={styles.note}>
            {t('createRoom.twoPlayerNote')}
          </AppText>
          <View style={styles.actions}>
            <Button
              label={t('createRoom.invite')}
              variant="secondary"
              icon="share-social"
              onPress={() => roomCode && shareCode(roomCode)}
              fullWidth={false}
              disabled={!roomCode}
            />
          </View>
        </Card>

        <View style={styles.waiting}>
          <Badge
            label={errorKey ? t(errorKey) : t('net.waitingForOpponent')}
            tone={errorKey ? 'danger' : 'gold'}
          />
        </View>
      </View>
    </BrandedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  code: {
    letterSpacing: 8,
    marginTop: theme.spacing.xs,
  },
  loading: { alignItems: 'center', paddingVertical: theme.spacing.lg, gap: theme.spacing.sm },
  loadingText: { marginTop: theme.spacing.xs },
  divider: { marginVertical: theme.spacing.lg },
  note: { marginTop: theme.spacing.xs },
  actions: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  waiting: { alignItems: 'center' },
});
