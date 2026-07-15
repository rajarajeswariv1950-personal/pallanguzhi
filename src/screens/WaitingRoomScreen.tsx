import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { BrandedScreen, Card, Button, AppText, Badge, Divider, EmblemBadge } from '@/components';
import { useMultiplayerStore } from '@/features/multiplayer/store';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useProfileStore } from '@/store/profileStore';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

export function WaitingRoomScreen({ navigation, route }: RootStackScreenProps<'WaitingRoom'>) {
  const { t } = useAppTranslation();
  const profileName = useProfileStore((s) => s.name);

  const role = useMultiplayerStore((s) => s.role);
  const presence = useMultiplayerStore((s) => s.presence);
  const phase = useMultiplayerStore((s) => s.phase);
  const errorKey = useMultiplayerStore((s) => s.errorKey);
  const storeCode = useMultiplayerStore((s) => s.roomCode);
  const difficulty = useMultiplayerStore((s) => s.difficulty);
  const setReady = useMultiplayerStore((s) => s.setReady);
  const leave = useMultiplayerStore((s) => s.leave);

  const roomCode = storeCode ?? route.params.roomCode;
  const youAreHost = (role ?? (route.params.isHost ? 'host' : 'guest')) === 'host';
  const meName = profileName || t('common.you');

  const mySlot = youAreHost ? presence?.host : presence?.guest ?? null;
  const iAmReady = mySlot?.ready ?? false;

  // Server starts the match when both players are ready. Carry both real names
  // to the board so the scoreboard shows who is who.
  const hostRealName = presence?.host.name || (youAreHost ? meName : t('net.opponent'));
  const guestPresent = !!presence?.guest;
  const guestRealName =
    presence?.guest?.name || (!youAreHost ? meName : t('net.opponent'));
  const youName = youAreHost ? hostRealName : guestRealName;
  const oppName = youAreHost ? guestRealName : hostRealName;
  const playerCount = 1 + (guestPresent ? 1 : 0);

  useEffect(() => {
    if (phase === 'playing') {
      navigation.replace('Gameplay', {
        mode: 'online',
        // Host-chosen match level from the shared room document, so results
        // and the scoreboard can reflect it on both devices.
        difficulty: difficulty ?? 'medium',
        roomCode,
        player1Name: youName,
        player2Name: oppName,
      });
    }
  }, [phase, navigation, roomCode, youName, oppName, difficulty]);

  const back = () => {
    leave();
    // popTo (v7) UNWINDS the stack to the existing lobby entry. navigate()
    // would PUSH a second OnlineLobby on top of this screen, leaving the
    // stale WaitingRoom underneath — its back arrow then bounced users
    // straight back here in a loop.
    navigation.popTo('OnlineLobby');
  };

  const hostName = hostRealName;
  const guestName = guestPresent ? guestRealName : t('net.waitingForOpponent');

  return (
    <BrandedScreen
      title={t('waitingRoom.title')}
      onBack={back}
      footer={
        <View style={styles.footerCol}>
          {/* One-line answer to "what does this button do?" right above it. */}
          <AppText variant="caption" muted align="center">
            {iAmReady ? t('waitingRoom.readyHintOn') : t('waitingRoom.readyHintOff')}
          </AppText>
          <Button
            label={iAmReady ? t('waitingRoom.imReadyOn') : t('waitingRoom.imReadyOff')}
            variant={iAmReady ? 'primary' : 'secondary'}
            icon={iAmReady ? 'checkmark-circle' : 'ellipse-outline'}
            disabled={!!errorKey}
            onPress={() => setReady(!iAmReady)}
          />
        </View>
      }
    >
      <View style={styles.container}>
        <View style={styles.codeRow}>
          <AppText variant="caption" muted>
            {t('createRoom.roomCode')}
          </AppText>
          <AppText variant="h2" color={theme.colors.primaryLight} style={styles.code}>
            {roomCode}
          </AppText>
          <View style={styles.badgeCol}>
            {difficulty ? <Badge label={t(`difficulty.${difficulty}`)} tone="gold" /> : null}
            <Badge label={t('waitingRoom.players', { count: playerCount })} tone="neutral" />
          </View>
        </View>

        {/* Who created the room + how the match starts — no guessing. */}
        <Card>
          <AppText variant="overline" color={theme.colors.textMuted}>
            {t('waitingRoom.howItWorksTitle')}
          </AppText>
          <AppText variant="body" muted style={styles.howBody}>
            {t('waitingRoom.createdBy', { name: hostRealName })}
          </AppText>
          <AppText variant="body" muted style={styles.howBody}>
            {guestPresent ? t('waitingRoom.howToStart') : t('waitingRoom.shareToStart')}
          </AppText>
        </Card>

        <Card>
          <PlayerSlot
            label={
              youAreHost
                ? `${t('waitingRoom.host')} · ${t('waitingRoom.roomCreator')} · ${t('common.you')}`
                : `${t('waitingRoom.host')} · ${t('waitingRoom.roomCreator')}`
            }
            name={hostName}
            ready={presence?.host.ready ?? false}
            connected={presence?.host.connected ?? true}
          />
          <Divider style={styles.divider} ornament />
          <PlayerSlot
            label={!youAreHost ? `${t('waitingRoom.guest')} · ${t('common.you')}` : t('waitingRoom.guest')}
            name={guestName}
            ready={presence?.guest?.ready ?? false}
            connected={presence?.guest?.connected ?? false}
            waiting={!guestPresent}
          />
        </Card>

        <View style={styles.status}>
          <Badge
            label={
              errorKey
                ? t(errorKey)
                : !guestPresent
                  ? t('net.waitingForOpponent')
                  : iAmReady
                    ? t('waitingRoom.waitingForOther')
                    : t('net.tapReady')
            }
            tone={errorKey ? 'danger' : guestPresent ? 'gold' : 'neutral'}
          />
        </View>

        <Button
          label={t('waitingRoom.leave')}
          variant="ghost"
          icon="exit-outline"
          onPress={back}
        />
      </View>
    </BrandedScreen>
  );
}

function PlayerSlot({
  label,
  name,
  ready,
  connected,
  waiting,
}: {
  label: string;
  name: string;
  ready: boolean;
  connected: boolean;
  waiting?: boolean;
}) {
  const { t } = useAppTranslation();
  const tone = waiting || !connected ? 'neutral' : ready ? 'success' : 'warning';
  const badgeLabel = waiting
    ? t('waitingRoom.seatOpen')
    : !connected
      ? t('net.reconnecting')
      : ready
        ? t('waitingRoom.ready')
        : t('waitingRoom.notReady');
  return (
    <View style={styles.slot}>
      <EmblemBadge size={40} glow={false} />
      <View style={styles.slotText}>
        <AppText variant="caption" muted>
          {label}
        </AppText>
        <AppText variant="title" numberOfLines={1}>
          {name}
        </AppText>
      </View>
      <Badge label={badgeLabel} tone={tone} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  codeRow: { alignItems: 'center', gap: theme.spacing.xs },
  footerCol: { gap: theme.spacing.sm },
  howBody: { marginTop: theme.spacing.sm },
  badgeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  code: { letterSpacing: 6 },
  divider: { marginVertical: theme.spacing.lg },
  status: { alignItems: 'center' },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  slotText: { flex: 1 },
});
