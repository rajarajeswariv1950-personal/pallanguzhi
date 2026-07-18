import { RefObject, memo, useCallback, useEffect, useRef, useState } from 'react';
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
import { SOWING_HAND_ENABLED, SowingHandOverlay, SowingHandPrewarm } from '@/features/game/components/SowingHandOverlay';
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
  /**
   * The player whose hand performs the replayed move. Local modes commit
   * state only after the animation, so `current` IS the mover and this can
   * be omitted; online replays receive the post-move state (where `current`
   * is already the NEXT player) and must pass the true mover explicitly so
   * the hand reaches in from the correct side of the board.
   */
  handPlayer?: Player;
}

export function GameBoard({
  pits,
  stores,
  current,
  legalPits,
  interactive,
  onPressPit,
  frame = null,
  handPlayer,
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
      {/* Layered rosewood: warm diagonal base + top sheen for a polished, carved look. */}
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
      {/* Hand-planed wood grain: long, faint streaks that follow the plank. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {GRAIN_STREAKS.map((g, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: g.top,
              left: g.left,
              right: g.right,
              height: g.height,
              borderRadius: 999,
              backgroundColor: g.light
                ? `rgba(224,178,120,${g.opacity})`
                : `rgba(12,5,2,${g.opacity})`,
            }}
          />
        ))}
      </View>
      {/* Edge vignette so the slab reads thick and hand-oiled. */}
      <LinearGradient
        colors={['rgba(16,8,3,0.45)', 'rgba(16,8,3,0)', 'rgba(16,8,3,0)', 'rgba(16,8,3,0.45)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(16,8,3,0.32)', 'rgba(16,8,3,0)', 'rgba(16,8,3,0)', 'rgba(16,8,3,0.38)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Double gold inlay + brass corner accents for a royal, carved look. */}
      <View pointerEvents="none" style={styles.innerFrame} />
      <View pointerEvents="none" style={styles.inlayFrame} />
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
        {/* Carved center groove: shadowed cut + catch-light below it. */}
        <View style={styles.midSeamWrap} pointerEvents="none">
          <View style={styles.midSeamDark} />
          <View style={styles.midSeamLight} />
        </View>
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
      {/* Sowing-hand overlay (gated). The prewarm layer decodes the photo
          poses at board load so the hand shows from a move's FIRST frame. */}
      {SOWING_HAND_ENABLED ? (
        <>
          <SowingHandPrewarm />
          <SowingHandOverlay frame={frame} registry={pitCenters} player={handPlayer ?? current} />
        </>
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
            onPressPit={onPressPit}
            boardRef={boardRef}
            registry={registry}
            layoutVersion={layoutVersion}
          />
        );
      })}
    </View>
  );
}

/**
 * Memoized so a mid-move animation frame re-renders only the pits whose
 * count/legality actually changed — the rest of the board skips work and the
 * hand animation never competes with needless reconciliation for JS time.
 * `onPressPit` must be referentially stable (it is: controller callbacks and
 * the multiplayer store action are both stable across renders).
 */
const Pit = memo(function Pit({
  boardIndex,
  count,
  legal,
  pressable,
  onPressPit,
  boardRef,
  registry,
  layoutVersion,
}: {
  boardIndex: number;
  count: number;
  legal: boolean;
  pressable: boolean;
  onPressPit: (boardIndex: number) => void;
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
      onPress={pressable ? () => onPressPit(boardIndex) : undefined}
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
});

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
      {/* Decorative cowrie pile hinting at the captured collection. */}
      <View pointerEvents="none" style={styles.storePile}>
        {Array.from({ length: Math.max(1, pileCount) }, (_, i) => (
          <View
            key={i}
            style={[
              styles.pileSeed,
              i % 3 !== 0 && styles.pileSeedOval,
              {
                backgroundColor: SEED_COLORS[i % SEED_COLORS.length],
                opacity: value > 0 ? 1 : 0.22,
                transform: [{ rotate: `${((i * 53) % 60) - 30}deg` }],
              },
            ]}
          >
            {i % 2 === 0 ? <View style={styles.pileSeedSlit} /> : null}
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

/**
 * Deterministic hand-planed grain streaks (percent-positioned so they scale
 * with the board). Alternating faint dark cuts and warm catch-lights.
 */
const GRAIN_STREAKS = [
  { top: '9%', left: '4%', right: '18%', height: 1.5, opacity: 0.22, light: false },
  { top: '16%', left: '12%', right: '5%', height: 1, opacity: 0.1, light: true },
  { top: '27%', left: '2%', right: '30%', height: 2, opacity: 0.18, light: false },
  { top: '38%', left: '22%', right: '3%', height: 1, opacity: 0.12, light: true },
  { top: '47%', left: '6%', right: '10%', height: 1.5, opacity: 0.2, light: false },
  { top: '58%', left: '15%', right: '20%', height: 1, opacity: 0.1, light: true },
  { top: '68%', left: '3%', right: '26%', height: 2, opacity: 0.17, light: false },
  { top: '78%', left: '28%', right: '4%', height: 1, opacity: 0.11, light: true },
  { top: '88%', left: '8%', right: '14%', height: 1.5, opacity: 0.2, light: false },
] as const;

const styles = StyleSheet.create({
  board: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.xl,
    borderWidth: 2.5,
    borderColor: 'rgba(212,163,44,0.7)',
    overflow: 'hidden',
    ...theme.shadows.xl,
  },
  innerFrame: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderRadius: theme.radii.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(228,193,115,0.38)',
  },
  // Second, finer inlay line — the double-gold border of royal heirloom boards.
  inlayFrame: {
    position: 'absolute',
    top: 9,
    left: 9,
    right: 9,
    bottom: 9,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(246,228,160,0.3)',
  },
  corner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: theme.colors.primary,
  },
  cornerTL: { top: 8, left: 8, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 7 },
  cornerTR: { top: 8, right: 8, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 7 },
  cornerBL: { bottom: 8, left: 8, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 7 },
  cornerBR: { bottom: 8, right: 8, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 7 },
  grid: { flex: 1, gap: theme.spacing.sm, justifyContent: 'center' },
  midSeamWrap: {
    marginHorizontal: theme.spacing.xs,
  },
  midSeamDark: {
    height: 1.5,
    borderRadius: 999,
    backgroundColor: 'rgba(10,4,1,0.5)',
  },
  midSeamLight: {
    height: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(228,193,115,0.22)',
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
    borderColor: 'rgba(212,163,44,0.4)',
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
    borderColor: 'rgba(228,193,115,0.3)',
  },
  storePile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 24,
    justifyContent: 'center',
    gap: 2,
  },
  pileSeed: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(139,104,60,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pileSeedOval: {
    width: 6,
    height: 7.5,
  },
  pileSeedSlit: {
    width: 1,
    height: 4,
    borderRadius: 0.5,
    backgroundColor: 'rgba(122,84,48,0.55)',
  },
});
