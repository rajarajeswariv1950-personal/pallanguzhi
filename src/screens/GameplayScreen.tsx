import { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { BrandedScreen, Button, AppText, Badge } from '@/components';
import { GameBoard } from '@/features/game/components/GameBoard';
import { Scoreboard } from '@/features/game/components/Scoreboard';
import { useGameController } from '@/features/game/useGameController';
import type { GameState, Player } from '@/features/game/engine';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useProfileStore } from '@/store/profileStore';
import type { RootStackScreenProps } from '@/navigation/types';
import { OnlineGameplay } from '@/features/multiplayer/OnlineGameplay';
import { theme } from '@/theme';

export function GameplayScreen(props: RootStackScreenProps<'Gameplay'>) {
  // Online mode is fully server-authoritative; offline (single / same-device)
  // keeps the local deterministic controller from Phase 3 untouched.
  if (props.route.params.mode === 'online') {
    return <OnlineGameplay {...props} />;
  }
  return <OfflineGameplay {...props} />;
}

function OfflineGameplay({ navigation, route }: RootStackScreenProps<'Gameplay'>) {
  const { t } = useAppTranslation();
  const { mode, difficulty, player1Name, player2Name } = route.params;
  const profileName = useProfileStore((s) => s.name);

  const p0Name = player1Name || profileName || t('common.you');
  const p1Name =
    mode === 'single'
      ? difficulty === 'hard'
        ? t('difficulty.hard')
        : difficulty === 'medium'
          ? t('difficulty.medium')
          : t('difficulty.easy')
      : player2Name || t('common.player');

  const handleGameOver = useCallback(
    (state: GameState) => {
      const [s0, s1] = state.stores;
      let outcome: 'win' | 'lose' | 'draw';
      let winnerName: string | undefined;
      if (s0 === s1) {
        outcome = 'draw';
      } else if (mode === 'single') {
        outcome = s0 > s1 ? 'win' : 'lose';
      } else {
        outcome = 'win';
        winnerName = s0 > s1 ? p0Name : p1Name;
      }
      navigation.replace('Results', {
        mode,
        difficulty,
        outcome,
        winnerName,
        player1Name: p0Name,
        player2Name: p1Name,
        player1Score: s0,
        player2Score: s1,
      });
    },
    [mode, difficulty, p0Name, p1Name, navigation],
  );

  const { state, legalPits, thinking, isHumanTurn, play } = useGameController({
    mode,
    difficulty,
    onGameOver: handleGameOver,
  });

  const openPause = () => navigation.navigate('PauseModal', { online: mode === 'online' });

  const turnLabel = (() => {
    if (mode === 'single') {
      if (state.current === 1) {
        return thinking ? t('difficulty.aiThinking') : t('gameplay.opponentTurn');
      }
      return t('gameplay.yourTurn');
    }
    const name = state.current === 0 ? p0Name : p1Name;
    return t('gameplay.playerTurn', { name });
  })();

  return (
    <BrandedScreen
      title={t('gameplay.round', { number: state.round })}
      onBack={openPause}
      scroll={false}
      footer={
        <Button label={t('gameplay.pause')} variant="secondary" icon="pause" onPress={openPause} />
      }
    >
      <View style={styles.container}>
        <View style={styles.turnRow}>
          <Badge label={turnLabel} tone="gold" />
          {thinking ? <ActivityIndicator color={theme.colors.primaryLight} /> : null}
        </View>

        <Scoreboard
          leftName={p0Name}
          leftScore={state.stores[0]}
          rightName={p1Name}
          rightScore={state.stores[1]}
          activeSide={state.current === 0 ? 0 : 1}
        />

        <GameBoard
          pits={state.pits}
          stores={state.stores}
          current={state.current as Player}
          legalPits={legalPits}
          interactive={isHumanTurn}
          onPressPit={play}
        />

        <AppText variant="caption" muted align="center" style={styles.hint}>
          {isHumanTurn ? t('gameplay.selectPit') : t('difficulty.aiThinking')}
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
  },
  hint: { marginTop: theme.spacing.xs },
});
