import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '@/components/ui/Text';
import { Icon, IconName } from '@/components/ui/Icon';
import { PressableScale } from '@/components/anim/PressableScale';
import { PitFace, SEED_COLORS } from '@/features/game/components/PitVisual';
import { PITS_PER_ROW } from '@/features/game/types';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { playSfx, tapFeedback, type SfxName } from '@/services/feedback';
import { theme } from '@/theme';

type Frame = {
  top: number[];
  bottom: number[];
  store: number;
  captionKey:
    | 'tutorial.step1'
    | 'tutorial.step2'
    | 'tutorial.step3'
    | 'tutorial.step4'
    | 'tutorial.step5'
    | 'tutorial.step6';
  activeRow: 'top' | 'bottom';
  activeIndex?: number;
  captureIndex?: number;
  sound?: SfxName;
};

// Scripted, deterministic illustration of a single turn: pick up, sow, capture, hand over.
const FRAMES: Frame[] = [
  { bottom: [2, 4, 2, 2, 2, 2, 2], top: [2, 2, 2, 2, 2, 2, 2], store: 0, activeRow: 'bottom', activeIndex: 1, captionKey: 'tutorial.step1', sound: 'tap' },
  { bottom: [2, 0, 3, 2, 2, 2, 2], top: [2, 2, 2, 2, 2, 2, 2], store: 0, activeRow: 'bottom', activeIndex: 2, captionKey: 'tutorial.step2', sound: 'seed' },
  { bottom: [2, 0, 3, 3, 2, 2, 2], top: [2, 2, 2, 2, 2, 2, 2], store: 0, activeRow: 'bottom', activeIndex: 3, captionKey: 'tutorial.step3', sound: 'seed' },
  { bottom: [2, 0, 3, 3, 3, 2, 2], top: [2, 2, 2, 2, 2, 2, 2], store: 0, activeRow: 'bottom', activeIndex: 4, captionKey: 'tutorial.step3', sound: 'seed' },
  { bottom: [2, 0, 3, 3, 3, 3, 2], top: [2, 2, 2, 2, 2, 2, 2], store: 0, activeRow: 'bottom', activeIndex: 5, captionKey: 'tutorial.step4', sound: 'seed' },
  { bottom: [2, 0, 3, 3, 3, 3, 0], top: [2, 2, 2, 2, 2, 2, 2], store: 2, activeRow: 'bottom', captureIndex: 6, captionKey: 'tutorial.step5', sound: 'capture' },
  { bottom: [2, 0, 3, 3, 3, 3, 0], top: [2, 2, 2, 2, 2, 2, 2], store: 2, activeRow: 'top', captionKey: 'tutorial.step6', sound: 'turn' },
];

const BASE_STEP_MS = 1200;
/** Speed multipliers applied to BASE_STEP_MS (lower = faster). */
const SPEEDS = [
  { label: '0.5×', mult: 2 },
  { label: '0.75×', mult: 1.4 },
  { label: '1×', mult: 1 },
  { label: '1.5×', mult: 0.66 },
  { label: '2×', mult: 0.5 },
];
const DEFAULT_SPEED = 1; // index of 0.75× — a gentle, beginner-friendly default pace

export function TutorialDemo() {
  const { t } = useAppTranslation();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const frame = FRAMES[index];
  const atEnd = index >= FRAMES.length - 1;
  const atStart = index <= 0;

  // Auto-advance while playing.
  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      const next = index + 1;
      const sound = FRAMES[next].sound;
      if (sound) playSfx(sound);
      setIndex(next);
    }, BASE_STEP_MS * SPEEDS[speed].mult);
    return () => clearTimeout(timer);
  }, [playing, index, atEnd, speed]);

  const goTo = (next: number, playSound = true) => {
    const clamped = Math.max(0, Math.min(FRAMES.length - 1, next));
    if (playSound && FRAMES[clamped].sound) playSfx(FRAMES[clamped].sound!);
    setIndex(clamped);
  };

  const onPlayPause = () => {
    tapFeedback();
    if (playing) {
      setPlaying(false);
      return;
    }
    // Play from the start again if we're sitting at the end.
    if (atEnd) setIndex(0);
    setPlaying(true);
  };
  const onRestart = () => {
    tapFeedback();
    setPlaying(false);
    setIndex(0);
  };
  const onRewind = () => {
    tapFeedback();
    setPlaying(false);
    goTo(index - 1);
  };
  const onForward = () => {
    tapFeedback();
    setPlaying(false);
    goTo(index + 1);
  };
  const onSlower = () => {
    tapFeedback();
    setSpeed((s) => Math.max(0, s - 1));
  };
  const onFaster = () => {
    tapFeedback();
    setSpeed((s) => Math.min(SPEEDS.length - 1, s + 1));
  };

  return (
    <View style={styles.wrap}>
      {/* Board — same carved frame + seed visuals as the real game board. */}
      <View style={styles.board}>
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
        <View pointerEvents="none" style={styles.innerFrame} />
        <DemoStore value={frame.store} active={frame.captureIndex !== undefined} />
        <View style={styles.grid}>
          <DemoRow
            values={frame.top}
            isActiveRow={frame.activeRow === 'top'}
            activeIndex={frame.activeRow === 'top' ? frame.activeIndex : undefined}
          />
          <View style={styles.midSeam} pointerEvents="none" />
          <DemoRow
            values={frame.bottom}
            isActiveRow={frame.activeRow === 'bottom'}
            activeIndex={frame.activeRow === 'bottom' ? frame.activeIndex : undefined}
            captureIndex={frame.captureIndex}
          />
        </View>
      </View>

      <Caption text={t(frame.captionKey)} stepKey={`${index}`} />

      {/* Transport controls */}
      <View style={styles.transport}>
        <CtrlButton icon="reload" label={t('tutorial.restart')} onPress={onRestart} disabled={atStart && !playing} />
        <CtrlButton icon="play-skip-back" label={t('tutorial.rewind')} onPress={onRewind} disabled={atStart} />
        <CtrlButton
          icon={playing ? 'pause' : 'play'}
          label={playing ? t('tutorial.pause') : t('tutorial.play')}
          onPress={onPlayPause}
          primary
        />
        <CtrlButton icon="play-skip-forward" label={t('tutorial.forward')} onPress={onForward} disabled={atEnd} />
      </View>

      {/* Speed controls + progress */}
      <View style={styles.speedRow}>
        <CtrlButton icon="remove" label={t('tutorial.slower')} onPress={onSlower} disabled={speed <= 0} compact />
        <View style={styles.speedReadout}>
          <AppText variant="small" color={theme.colors.primaryLight}>
            {t('tutorial.speed', { value: SPEEDS[speed].label })}
          </AppText>
          <AppText variant="small" muted>
            {t('tutorial.stepLabel', { current: index + 1, total: FRAMES.length })}
          </AppText>
        </View>
        <CtrlButton icon="add" label={t('tutorial.faster')} onPress={onFaster} disabled={speed >= SPEEDS.length - 1} compact />
      </View>

      <AppText variant="small" muted align="center" style={styles.hint}>
        {t('tutorial.controlsHint')}
      </AppText>
    </View>
  );
}

function CtrlButton({
  icon,
  label,
  onPress,
  disabled,
  primary,
  compact,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  compact?: boolean;
}) {
  return (
    <PressableScale
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={[
        styles.ctrl,
        compact && styles.ctrlCompact,
        primary && styles.ctrlPrimary,
        disabled && styles.ctrlDisabled,
      ]}
    >
      <Icon
        name={icon}
        size={primary ? 26 : 20}
        color={primary ? theme.colors.textOnGold : theme.colors.primaryLight}
      />
      <AppText
        variant="small"
        color={primary ? theme.colors.textOnGold : theme.colors.textMuted}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </PressableScale>
  );
}

function DemoRow({
  values,
  isActiveRow,
  activeIndex,
  captureIndex,
}: {
  values: number[];
  isActiveRow: boolean;
  activeIndex?: number;
  captureIndex?: number;
}) {
  const pits = Array.from({ length: PITS_PER_ROW }, (_, i) => values[i] ?? 0);
  return (
    <View style={styles.row}>
      {pits.map((count, i) => (
        <DemoPit
          key={i}
          count={count}
          active={isActiveRow && activeIndex === i}
          capture={captureIndex === i}
          dim={!isActiveRow}
        />
      ))}
    </View>
  );
}

function DemoPit({
  count,
  active,
  capture,
  dim,
}: {
  count: number;
  active: boolean;
  capture: boolean;
  dim: boolean;
}) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (active || capture) {
      scale.value = withSequence(
        withTiming(1.16, { duration: 150 }),
        withTiming(1, { duration: 240 }),
      );
    }
  }, [active, capture, scale]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <View style={styles.pitTap}>
      <Animated.View style={[styles.pitOuter, (active || capture) && theme.shadows.gold, animatedStyle]}>
        <PitFace count={count} highlight={active} capture={capture} dim={dim} />
      </Animated.View>
    </View>
  );
}

function DemoStore({ value, active }: { value: number; active: boolean }) {
  const scale = useSharedValue(1);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      scale.value = withSequence(
        withTiming(1.18, { duration: 160 }),
        withTiming(1, { duration: 260 }),
      );
      prev.current = value;
    }
  }, [value, scale]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.store, active && styles.storeActive, active && theme.shadows.gold, animatedStyle]}>
      <LinearGradient
        colors={theme.gradients.pit}
        style={StyleSheet.absoluteFill}
      />
      <AppText variant="title" color={theme.palette.goldLight}>
        {value}
      </AppText>
      <View pointerEvents="none" style={styles.storePile}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[styles.pileSeed, { backgroundColor: SEED_COLORS[i % SEED_COLORS.length], opacity: value > 0 ? 1 : 0.25 }]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

function Caption({ text, stepKey }: { text: string; stepKey: string }) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 320 });
  }, [stepKey, opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[styles.caption, animatedStyle]}>
      <AppText variant="bodyStrong" align="center">
        {text}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.spacing.md },
  board: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.xl,
    borderWidth: 2,
    borderColor: 'rgba(200,155,60,0.55)',
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  innerFrame: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(228,193,115,0.22)',
  },
  grid: { flex: 1, gap: theme.spacing.sm },
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
    width: 42,
    alignSelf: 'stretch',
    minHeight: 92,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    overflow: 'hidden',
    backgroundColor: '#1B110A',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  storeActive: { borderColor: theme.colors.primary, borderWidth: 2 },
  storePile: { flexDirection: 'row', gap: 2 },
  pileSeed: { width: 6, height: 6, borderRadius: 3 },
  caption: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  transport: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  ctrl: {
    flex: 1,
    minHeight: 58,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    backgroundColor: 'rgba(200,155,60,0.10)',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  ctrlCompact: { flex: 0, minWidth: 64 },
  ctrlPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryLight,
    ...(theme.shadows.gold as object),
  },
  ctrlDisabled: { opacity: 0.4 },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  speedReadout: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  hint: { marginTop: theme.spacing.xxs },
});
