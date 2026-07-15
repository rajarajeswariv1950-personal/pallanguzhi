import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BrandedScreen, Button, AppText, Badge, StateMessage } from '@/components';
import { GameBoard } from '@/features/game/components/GameBoard';
import { Scoreboard } from '@/features/game/components/Scoreboard';
import { MusicControlBar } from '@/features/game/components/MusicControlBar';
import { legalMoves, traceMove, type GameState, type MoveFrame } from '@/features/game/engine';
import { useMultiplayerStore } from './store';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useProfileStore } from '@/store/profileStore';
import { feedback, playSfx } from '@/services/feedback';
import { MOVE_SPEED_MS, useSettingsStore } from '@/store/settingsStore';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

/**
 * Paced seed-by-seed replay of each online move at the user's chosen speed
 * (Settings → Move speed) — BOTH the local player's move and the opponent's
 * polled move animate from the previous board via the deterministic
 * traceMove, always landing exactly on the authoritative server state.
 */
function useMoveReplay(gameState: GameState | null, lastMove: number) {
  const [frame, setFrame] = useState<MoveFrame | null>(null);
  const prevRef = useRef<GameState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = gameState;
    if (!gameState || !prev) return undefined;
    const sameBoard =
      prev.pits.join(',') === gameState.pits.join(',') &&
      prev.stores[0] === gameState.stores[0] &&
      prev.stores[1] === gameState.stores[1];
    if (sameBoard) return undefined; // presence/ready churn — nothing to replay
    // New round (rematch) or unknown move: snap without animating.
    const frames = prev.status === 'playing' && lastMove >= 0 ? traceMove(prev, lastMove) : [];
    const last = frames[frames.length - 1];
    const landsCorrectly =
      !!last &&
      last.pits.join(',') === gameState.pits.join(',') &&
      last.stores[0] === gameState.stores[0] &&
      last.stores[1] === gameState.stores[1];
    if (!landsCorrectly) {
      setFrame(null);
      return undefined;
    }
    if (timer.current) clearTimeout(timer.current);
    let i = 0;
    const step = () => {
      if (i >= frames.length) {
        setFrame(null);
        return;
      }
      const f = frames[i];
      i += 1;
      setFrame(f);
      if (f.kind === 'capture') feedback('capture', 'medium');
      else if (f.kind === 'drop') playSfx('seed');
      timer.current = setTimeout(step, MOVE_SPEED_MS[useSettingsStore.getState().moveSpeed]);
    };
    step();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [gameState, lastMove]);

  // Screen unmount: stop stepping.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return frame;
}

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
  const lastMove = useMultiplayerStore((s) => s.lastMove);
  const sendMove = useMultiplayerStore((s) => s.sendMove);
  const leave = useMultiplayerStore((s) => s.leave);

  // Paced replay frame (null when the board is settled).
  const frame = useMoveReplay(gameState, lastMove);

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

  // Game over -> Results (after the final move's replay finishes so the
  // last capture is visible). Keep the session alive so rematch can resume.
  useEffect(() => {
    if (gameState?.status === 'gameOver' && you !== null && frame === null && !navigated.current) {
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
  }, [gameState, you, frame, navigation, route.params.roomCode, youName, oppName]);

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

  const animating = frame !== null;
  const myTurn =
    gameState.current === you &&
    gameState.status === 'playing' &&
    status === 'connected' &&
    opponentConnected &&
    !animating;
  const legal = myTurn ? legalMoves(gameState) : [];
  const turnLabel = gameState.current === you ? t('gameplay.yourTurn') : t('gameplay.opponentTurn');
  const displayPits = frame ? frame.pits : gameState.pits;
  const displayStores = frame ? frame.stores : gameState.stores;
  const oppStoreValue = displayStores[you === 0 ? 1 : 0];

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
          leftScore={displayStores[you]}
          rightName={oppName}
          rightScore={oppStoreValue}
          activeSide={gameState.current === you ? 0 : 1}
        />

        <GameBoard
          pits={displayPits}
          stores={displayStores}
          current={gameState.current}
          legalPits={legal}
          interactive={myTurn}
          onPressPit={sendMove}
        />

        <AppText variant="caption" muted align="center" style={styles.hint}>
          {animating
            ? t('gameplay.sowing')
            : myTurn
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
