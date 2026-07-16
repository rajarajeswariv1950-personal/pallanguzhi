import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '@/components/ui/Text';
import { ownerOf, type MoveFrame, type Player } from '@/features/game/engine';
import { BOTTOM_INDICES, TOP_INDICES } from '@/features/game/boardView';
import { PitFace, SEED_COLORS } from '@/features/game/components/PitVisual';
import { SOWING_HAND_ENABLED, SowingHandOverlay } from '@/features/game/components/SowingHandOverlay';
import { usePitCenters, type PitCenterRegistry } from '@/features/game/components/usePitCenters';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { theme } from '@/theme';

export interface GameBoardProps {
  pits: number[];
  stores: [number, number];
  current: Player;
  legalPits: number[];
  interactive: boolean;
  onPressPit: (boardIndex: number) => void;
  /**
   * The move-animation frame currently displayed (from the controller's
   * pacing loop), used to drive the sowing-hand overlay. Optional: callers
   * that don't pass it keep today's board behavior exactly.
   */
  frame?: MoveFrame | null;
}

export function GameBoard({
  pits,
  stores,
  current,
  legalPits,
  interactive,
  onPressPit,
  frame = null,
}: GameBoardProps) {
  // Pit-center registry for board overlays (sowing hand). Each pit measures
  // itself relative to this container; `layoutVersion` bumps on any board
  // re-layout (rotation, resize) so pits re-measure even when their own
  // local frame didn't change. Observational only — no visual effect.
  const boardRef = useRef<View>(null);
  const pitCenters = usePitCenters();
  const [layoutVersion, setLayoutVersion] = useState(0);
  const onBoardLayout = useCallback(() => setLayoutVersion((v) => v + 1), []);

  return (
    <View ref={boardRef} onLayout={onBoardLayout} style={styles.board}>
      {/* Layered walnut: warm diagonal base + top sheen for a polished, carved look. */}
      <LinearGradient
        colors={theme.gradients.board}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={theme.gradients.boardSheen}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Carved inner frame + brass corner accents for a premium boarded look. */}
      <View pointerEvents="none" style={styles.innerFrame} />
      <View pointerEvents="none" style={[styles.corner, styles.cornerTL]} />
      <View pointerEvents="none" style={[styles.corner, styles.cornerTR]} />
      <View pointerEvents="none" style={[styles.corner, styles.cornerBL]} />
      <View pointerEvents="none" style={[styles.corner, styles.cornerBR]} />

      <Store value={stores[1]} active={current === 1} />
      <View style={styles.grid}>
        <PitRow
          indices={TOP_INDICES}
          pits={pits}
          current={current}
          legalPits={legalPits}
          interactive={interactive}
          onPressPit={onPressPit}
          boardRef={boardRef}
          registry={pitCenters}
          layoutVersion={layoutVersion}
        />
        <View style={styles.midSeam} pointerEvents="none" />
        <PitRow
          indices={BOTTOM_INDICES}
          pits={pits}
          current={current}
          legalPits={legalPits}
          interactive={interactive}
          onPressPit={onPressPit}
          boardRef={boardRef}
          registry={pitCenters}
          layoutVersion={layoutVersion}
        />
      </View>
      <Store value={stores[0]} active={current === 0} />

      {/* Sowing-hand overlay (temporary P2.3 proxy, gated OFF by default).
          When the flag is false nothing mounts — zero runtime impact. */}
      {SOWING_HAND_ENABLED ? (
        <SowingHandOverlay frame={frame} registry={pitCenters} player={current} />
      ) : null}
    </View>
  );
}

function PitRow({
  indices,
  pits,
  current,
  legalPits,
  interactive,
  onPressPit,
  boardRef,
  registry,
  layoutVersion,
}: {
  indices: readonly number[];
  pits: number[];
  current: Player;
  legalPits: number[];
  interactive: boolean;
  onPressPit: (boardIndex: number) => void;
  boardRef: RefObject<View | null>;
  registry: PitCenterRegistry;
  layoutVersion: number;
}) {
  return (
    <View style={styles.row}>
      {indices.map((boardIndex) => {
        const owned = ownerOf(boardIndex) === current;
        const legal = legalPits.includes(boardIndex);
        const pressable = interactive && owned;
        return (
          <Pit
            key={boardIndex}
            boardIndex={boardIndex}
            count={pits[boardIndex] ?? 0}
            legal={legal}
            pressable={pressable}
            onPress={() => onPressPit(boardIndex)}
            boardRef={boardRef}
            registry={registry}
            layoutVersion={layoutVersion}
          />
        );
      })}
    </View>
  );
}

function Pit({
  boardIndex,
  count,
  legal,
  pressable,
  onPress,
  boardRef,
  registry,
  layoutVersion,
}: {
  boardIndex: number;
  count: number;
  legal: boolean;
  pressable: boolean;
  onPress: () => void;
  boardRef: RefObject<View | null>;
  registry: PitCenterRegistry;
  layoutVersion: number;
}) {
  const { t } = useAppTranslation();
  const scale = useSharedValue(1);
  const prev = useRef(count);
  const tapRef = useRef<View>(null);

  // Report this pit's center in board coordinates for overlay animations.
  // Defensive by design: measureLayout is supported on iOS/Android (incl.
  // new arch) and react-native-web, but any failure — missing refs, a
  // platform quirk, a mid-unmount call — must never take the board down.
  // Unmeasured pits simply keep the overlay hidden.
  const measure = useCallback(() => {
    const board = boardRef.current;
    const node = tapRef.current;
    if (!board || !node || typeof node.measureLayout !== 'function') return;
    try {
      node.measureLayout(
        board,
        (x, y, w, h) =>
          registry.register(boardIndex, { x: x + w / 2, y: y + h / 2, size: Math.min(w, h) }),
        () => {},
      );
    } catch {
      // Swallow: measurement is an enhancement, never a requirement.
    }
  }, [boardRef, registry, boardIndex]);

  // Re-measure after any board-level re-layout (rotation/resize): ancestors
  // may move this pit without changing its own local frame, which would not
  // re-fire the pit's own onLayout.
  useEffect(() => {
    measure();
  }, [measure, layoutVersion]);

  // Springy settle whenever the pit's contents change (fill or empty).
  useEffect(() => {
    if (prev.current !== count) {
      scale.value = withSequence(
        withTiming(1.12, { duration: 120, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }),
      );
      prev.current = count;
    }
  }, [count, scale]);

  const bounceStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      ref={tapRef}
      onLayout={measure}
      disabled={!pressable}
      onPress={pressable ? onPress : undefined}
      accessibilityRole="button"
      accessibilityLabel={t('gameplay.pitLabel', { count })}
      accessibilityState={{ disabled: !pressable }}
      style={styles.pitTap}
    >
      <Animated.View style={[styles.pitOuter, legal && theme.shadows.gold, bounceStyle]}>
        <PitFace count={count} highlight={legal} />
      </Animated.View>
    </Pressable>
  );
}

function Store({ value, active }: { value: number; active: boolean }) {
  const { t } = useAppTranslation();
  const scale = useSharedValue(1);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      scale.value = withSequence(
        withTiming(1.16, { duration: 150, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 260, easing: Easing.out(Easing.quad) }),
      );
      prev.current = value;
    }
  }, [value, scale]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // A little pile that grows with the captured count.
  const pileCount = Math.min(8, Math.ceil(value / 4));

  return (
    <Animated.View
      accessible
      accessibilityLabel={t('gameplay.storeLabel', { count: value })}
      style={[styles.store, active && styles.storeActive, active && theme.shadows.gold, animatedStyle]}
    >
      <LinearGradient
        colors={theme.gradients.pit}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.storeTopShade} />
      <View pointerEvents="none" style={styles.storeRim} />
      <AppText variant="h3" color={theme.palette.goldLight}>
        {value}
      </AppText>
      {/* Decorative seed pile hinting at the captured collection. */}
      <View pointerEvents="none" style={styles.storePile}>
        {Array.from({ length: Math.max(1, pileCount) }, (_, i) => (
          <View
            key={i}
            style={[
              styles.pileSeed,
              {
                backgroundColor: SEED_COLORS[i % SEED_COLORS.length],
                opacity: value > 0 ? 1 : 0.22,
              },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  board: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.xl,
    borderWidth: 2,
    borderColor: 'rgba(200,155,60,0.55)',
    overflow: 'hidden',
    ...theme.shadows.xl,
  },
  innerFrame: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(228,193,115,0.24)',
  },
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: theme.colors.primary,
  },
  cornerTL: { top: 8, left: 8, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 6 },
  cornerTR: { top: 8, right: 8, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 6 },
  cornerBL: { bottom: 8, left: 8, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 8, right: 8, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 6 },
  grid: { flex: 1, gap: theme.spacing.sm, justifyContent: 'center' },
  midSeam: {
    height: 1,
    marginHorizontal: theme.spacing.xs,
    backgroundColor: 'rgba(228,193,115,0.18)',
  },
  row: { flexDirection: 'row', gap: theme.spacing.xs },
  pitTap: { flex: 1 },
  pitOuter: {
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  store: {
    width: 48,
    alignSelf: 'stretch',
    minHeight: 104,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    overflow: 'hidden',
    backgroundColor: '#1B110A',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  storeActive: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  storeTopShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  storeRim: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(228,193,115,0.24)',
  },
  storePile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 22,
    justifyContent: 'center',
    gap: 2,
  },
  pileSeed: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
