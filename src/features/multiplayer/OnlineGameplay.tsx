import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { BrandedScreen, Button, AppText, Badge, StateMessage } from '@/components';
import { GameBoard } from '@/features/game/components/GameBoard';
import { Scoreboard } from '@/features/game/components/Scoreboard';
import { MusicControlBar } from '@/features/game/components/MusicControlBar';
import { legalMoves } from '@/features/game/engine';
import { useMultiplayerStore } from './store';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useProfileStore } from '@/store/profileStore';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

export function OnlineGameplay({ navigation, route }: RootStackScreenProps<'Gameplay'>) {
  const { t } = useAppTranslation();
  const profileName = useProfileStore((s) => s.name);
  const presence = useMultiplayerStore((s) => s.presence);

  const gameState = useMultiplayerStore((s) => s.gameState);
  const you = useMultiplayerStore((s) => s.you);
  const status = useMultiplayerStore((s) => s.status);
  const phase = useMultiplayerStore((s) => s.phase);
  const errorKey = useMultiplayerStore((s) => s.errorKey);
  const opponentConnected = useMultiplayerStore((s) => s.opponentConnected);
  const sendMove = useMultiplayerStore((s) => s.sendMove);
  const leave = useMultiplayerStore((s) => s.leave);

  // Prefer live presence names, then names passed from the waiting room, then
  // sensible fallbacks — so both real names show even after a reconnect.
  const hostName = presence?.host.name || '';
  const guestName = presence?.guest?.name || '';
  const youName =
    (you === 0 ? hostName : guestName) || route.params.player1Name || profileName || t('common.you');
  const oppName =
    (you === 0 ? guestName : hostName) || route.params.player2Name || t('net.opponent');

  const keepAlive = useRef(false);
  const navigated = useRef(false);

  // Game over -> Results. Keep the session alive so rematch can resume.
  useEffect(() => {
    if (gameState?.status === 'gameOver' && you !== null && !navigated.current) {
      navigated.current = true;
      keepAlive.current = true;
      const [s0, s1] = gameState.stores;
      const youScore = you === 0 ? s0 : s1;
      const oppScore = you === 0 ? s1 : s0;
      const outcome = s0 === s1 ? 'draw' : gameState.winner === you ? 'win' : 'lose';
      navigation.replace('Results', {
        mode: 'online',
        outcome,
        roomCode: route.params.roomCode,
        player1Name: youName,
        player2Name: oppName,
        player1Score: youScore,
        player2Score: oppScore,
      });
    }
  }, [gameState, you, navigation, route.params.roomCode, youName, oppName]);

  // Leaving the match screen (other than to Results) ends the online session.
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', () => {
      if (!keepAlive.current) leave();
    });
    return unsub;
  }, [navigation, leave]);

  const goHomeLeave = () => {
    leave();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const openPause = () => navigation.navigate('PauseModal', { online: true });

  if (!gameState || you === null) {
    return (
      <BrandedScreen
        title={t('online.title')}
        scroll={false}
        onBack={() => {
          leave();
          navigation.goBack();
        }}
      >
        <StateMessage
          variant="loading"
          title={status === 'reconnecting' ? t('net.reconnecting') : t('net.connecting')}
        />
      </BrandedScreen>
    );
  }

  if ((status === 'disconnected' || phase === 'idle') && gameState.status !== 'gameOver') {
    return (
      <BrandedScreen title={t('online.title')} scroll={false} onBack={goHomeLeave}>
        <StateMessage
          variant="error"
          title={t(errorKey ?? 'net.roomClosed')}
          actionLabel={t('results.home')}
          onAction={goHomeLeave}
        />
      </BrandedScreen>
    );
  }

  const myTurn =
    gameState.current === you &&
    gameState.status === 'playing' &&
    status === 'connected' &&
    opponentConnected;
  const legal = myTurn ? legalMoves(gameState) : [];
  const turnLabel = gameState.current === you ? t('gameplay.yourTurn') : t('gameplay.opponentTurn');
  const oppStoreValue = gameState.stores[you === 0 ? 1 : 0];

  return (
    <BrandedScreen
      title={t('gameplay.round', { number: gameState.round })}
      onBack={openPause}
      scroll={false}
      footer={
        <View style={styles.footer}>
          <MusicControlBar />
          <Button label={t('gameplay.pause')} variant="secondary" icon="pause" onPress={openPause} />
        </View>
      }
    >
      <View style={styles.container}>
        <View style={styles.turnRow}>
          <Badge label={turnLabel} tone="gold" />
          {status === 'reconnecting' ? <Badge label={t('net.reconnecting')} tone="warning" /> : null}
          {status !== 'reconnecting' && !opponentConnected ? (
            <Badge label={t('errors.opponentLeft')} tone="danger" />
          ) : null}
        </View>

        <Scoreboard
          leftName={youName}
          leftScore={gameState.stores[you]}
          rightName={oppName}
          rightScore={oppStoreValue}
          activeSide={gameState.current === you ? 0 : 1}
        />

        <GameBoard
          pits={gameState.pits}
          stores={gameState.stores}
          current={gameState.current}
          legalPits={legal}
          interactive={myTurn}
          onPressPit={sendMove}
        />

        <AppText variant="caption" muted align="center" style={styles.hint}>
          {myTurn
            ? t('gameplay.selectPit')
            : opponentConnected
              ? t('gameplay.opponentTurn')
              : t('errors.opponentLeft')}
        </AppText>
      </View>
    </BrandedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    justifyContent: 'center',
  },
  turnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  },
  hint: { marginTop: theme.spacing.xs },
  footer: { gap: theme.spacing.sm },
});
