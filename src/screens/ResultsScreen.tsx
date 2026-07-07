import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BrandedScreen, Card, Button, AppText, EmblemBadge, Icon, Divider, Badge } from '@/components';
import { useMultiplayerStore } from '@/features/multiplayer/store';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import type { Outcome } from '@/features/game/types';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

const OUTCOME_META: Record<
  Outcome,
  { key: 'win' | 'lose' | 'draw'; icon: 'trophy' | 'sad' | 'remove'; color: string }
> = {
  win: { key: 'win', icon: 'trophy', color: theme.colors.primaryLight },
  lose: { key: 'lose', icon: 'sad', color: theme.colors.textMuted },
  draw: { key: 'draw', icon: 'remove', color: theme.colors.secondary },
};

export function ResultsScreen({ navigation, route }: RootStackScreenProps<'Results'>) {
  const { t } = useAppTranslation();
  const {
    mode,
    outcome,
    difficulty,
    roomCode,
    winnerName,
    player1Name = t('common.you'),
    player2Name = t('common.player'),
    player1Score = 0,
    player2Score = 0,
  } = route.params;

  const meta = OUTCOME_META[outcome];
  const bigTitle =
    outcome === 'draw' ? t('results.draw') : outcome === 'win' ? t('results.win') : t('results.lose');
  const winnerLine =
    outcome === 'draw'
      ? null
      : winnerName
        ? t('results.winnerIs', { name: winnerName })
        : outcome === 'win'
          ? t('results.youWin')
          : t('results.youLose');

  const winnerSide: 'p1' | 'p2' | null =
    player1Score > player2Score ? 'p1' : player2Score > player1Score ? 'p2' : null;

  // Celebratory entrance for the emblem/trophy, with a soft glow loop on a win.
  const pop = useSharedValue(0);
  const glow = useSharedValue(0);
  useEffect(() => {
    pop.value = withSpring(1, { damping: 9, stiffness: 140 });
    if (outcome === 'win') {
      glow.value = withDelay(
        260,
        withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }), -1, true),
      );
    }
  }, [pop, glow, outcome]);

  const popStyle = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ scale: 0.6 + pop.value * 0.4 }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + glow.value * 0.6,
    transform: [{ scale: 1 + glow.value * 0.12 }],
  }));

  const isOnline = mode === 'online';
  const requestRematch = useMultiplayerStore((s) => s.requestRematch);
  const leaveOnline = useMultiplayerStore((s) => s.leave);
  const mpPhase = useMultiplayerStore((s) => s.phase);
  const mpStatus = useMultiplayerStore((s) => s.status);
  const rematchYou = useMultiplayerStore((s) => s.rematchYou);
  const rematchOpponent = useMultiplayerStore((s) => s.rematchOpponent);
  const mpError = useMultiplayerStore((s) => s.errorKey);

  // Online rematch: when the server restarts the match, return to the board.
  useEffect(() => {
    if (isOnline && mpPhase === 'playing') {
      navigation.replace('Gameplay', { mode: 'online', roomCode, player1Name, player2Name });
    }
  }, [isOnline, mpPhase, navigation, roomCode, player1Name, player2Name]);

  const rematch = () =>
    navigation.replace('Gameplay', { mode, difficulty, roomCode, player1Name, player2Name });
  const goHome = () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  const onlineRematch = () => requestRematch();
  const onlineHome = () => {
    leaveOnline();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };
  const rematchDisabled = rematchYou || !!mpError || mpStatus !== 'connected';

  return (
    <BrandedScreen
      title={t('results.title')}
      footer={
        isOnline ? (
          <View style={styles.footer}>
            {mpError ? (
              <Badge label={t(mpError)} tone="danger" />
            ) : rematchOpponent ? (
              <Badge label={t('net.opponentWantsRematch')} tone="gold" />
            ) : null}
            <Button
              label={rematchYou ? t('net.rematchWaiting') : t('results.rematch')}
              icon="refresh"
              loading={rematchYou && !mpError}
              disabled={rematchDisabled}
              onPress={onlineRematch}
            />
            <Button label={t('results.home')} variant="secondary" icon="home" onPress={onlineHome} />
          </View>
        ) : (
          <View style={styles.footer}>
            <Button label={t('results.rematch')} icon="refresh" onPress={rematch} />
            <Button label={t('results.home')} variant="secondary" icon="home" onPress={goHome} />
          </View>
        )
      }
    >
      <View style={styles.container}>
        <Animated.View style={[styles.banner, popStyle]}>
          <View style={styles.emblemWrap}>
            {outcome === 'win' ? (
              <Animated.View style={[styles.emblemHalo, glowStyle]} pointerEvents="none" />
            ) : null}
            <EmblemBadge size={72} />
          </View>
          <View style={[styles.iconBadge, { borderColor: meta.color }]}>
            <Icon name={meta.icon} size={28} color={meta.color} />
          </View>
          <AppText
            variant="display"
            align="center"
            color={meta.color}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={styles.bigTitle}
          >
            {bigTitle}
          </AppText>
          {winnerLine ? (
            <AppText variant="title" align="center" numberOfLines={2} style={styles.winnerLine}>
              {winnerLine}
            </AppText>
          ) : null}
        </Animated.View>

        <Card style={styles.scoreCard}>
          <AppText variant="overline" color={theme.colors.textMuted} align="center">
            {t('results.finalScore')}
          </AppText>
          <Divider ornament style={styles.divider} />
          <View style={styles.scoreRow}>
            <ScoreSide name={player1Name} score={player1Score} champion={winnerSide === 'p1'} />
            <View style={styles.vsWrap}>
              <AppText variant="h3" muted>
                {t('common.vs')}
              </AppText>
            </View>
            <ScoreSide name={player2Name} score={player2Score} champion={winnerSide === 'p2'} />
          </View>
        </Card>
      </View>
    </BrandedScreen>
  );
}

function ScoreSide({
  name,
  score,
  champion,
}: {
  name: string;
  score: number;
  champion: boolean;
}) {
  return (
    <View style={[styles.scoreSide, champion && styles.scoreSideWin]}>
      {champion ? (
        <View style={styles.crown}>
          <Icon name="trophy" size={16} color={theme.colors.primary} />
        </View>
      ) : (
        <View style={styles.crownSpacer} />
      )}
      <AppText
        variant="bodyStrong"
        align="center"
        numberOfLines={2}
        color={champion ? theme.colors.primaryLight : theme.colors.text}
        style={styles.scoreName}
      >
        {name}
      </AppText>
      <AppText variant="display" align="center" color={theme.colors.primaryLight}>
        {score}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    alignItems: 'center',
  },
  banner: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    alignSelf: 'stretch',
  },
  emblemWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemHalo: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(200,155,60,0.30)',
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    backgroundColor: 'rgba(212,163,44,0.14)',
    marginTop: theme.spacing.xs,
  },
  bigTitle: {
    marginTop: theme.spacing.xs,
    alignSelf: 'stretch',
  },
  winnerLine: {
    marginTop: theme.spacing.xxs,
  },
  scoreCard: {
    alignSelf: 'stretch',
  },
  divider: { marginVertical: theme.spacing.md },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  vsWrap: {
    paddingHorizontal: theme.spacing.xs,
    paddingTop: theme.spacing.xxl,
  },
  scoreSide: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.md,
  },
  scoreSideWin: {
    backgroundColor: 'rgba(200,155,60,0.14)',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  crown: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownSpacer: { height: 20 },
  scoreName: {
    minHeight: 40,
  },
  footer: { gap: theme.spacing.sm },
});
