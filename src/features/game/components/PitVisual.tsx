import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '@/components/ui/Text';
import { theme } from '@/theme';

/**
 * Shared carved-pit + seed rendering used by BOTH the real game board and the
 * how-to-play demo, so the two look and animate identically. Warm, natural seed
 * colours — cowrie ivory, tamarind browns, a maroon bead, and a royal jade bead
 * that ties the seeds to the new teal palette — with soft highlights and shadows
 * for a tactile, slightly 3-D feel.
 */
export const SEED_COLORS = ['#F5E9CE', '#E1C596', '#C79256', '#7E4E2B', '#8B2A22', '#1E6B64'];
const DEFAULT_MAX_SEEDS = 14;
const GOLDEN_ANGLE = 2.399963229728653;

export interface SeedSpec {
  x: number;
  y: number;
  d: number;
  color: string;
  rotate: number;
  oval: boolean;
}

/** Sunflower (golden-angle) packing so seeds sit naturally and fill outward. */
export function seedLayout(n: number, size: number): SeedSpec[] {
  if (size <= 0 || n <= 0) return [];
  const d = Math.max(4, size * 0.17);
  const maxR = size / 2 - d / 2 - size * 0.05;
  const specs: SeedSpec[] = [];
  for (let i = 0; i < n; i += 1) {
    const r = maxR * Math.sqrt((i + 0.5) / n);
    const a = i * GOLDEN_ANGLE;
    specs.push({
      x: size / 2 + r * Math.cos(a) - d / 2,
      y: size / 2 + r * Math.sin(a) - d / 2,
      d,
      color: SEED_COLORS[i % SEED_COLORS.length],
      // Deterministic per-index variation (no random → stable across renders).
      rotate: ((i * 137) % 70) - 35,
      oval: i % 3 !== 0,
    });
  }
  return specs;
}

export function Seed({ spec, index, animate = true }: { spec: SeedSpec; index: number; animate?: boolean }) {
  const p = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    if (!animate) return;
    // New seeds drop in with a slight cascade + soft overshoot.
    p.value = withDelay(
      Math.min(index, 8) * 22,
      withTiming(1, { duration: 260, easing: Easing.out(Easing.back(1.4)) }),
    );
  }, [p, index, animate]);

  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value * 1.4),
    transform: [
      { translateY: (1 - p.value) * -spec.d * 1.6 },
      { scale: 0.4 + p.value * 0.6 },
      { rotate: `${spec.rotate}deg` },
    ],
  }));

  const w = spec.oval ? spec.d * 0.82 : spec.d;
  const h = spec.d;

  return (
    <Animated.View
      style={[
        styles.seed,
        {
          left: spec.x + (spec.d - w) / 2,
          top: spec.y,
          width: w,
          height: h,
          borderRadius: spec.d / 2,
          backgroundColor: spec.color,
        },
        style,
      ]}
    >
      {/* soft top highlight */}
      <View
        style={{
          position: 'absolute',
          left: w * 0.2,
          top: h * 0.12,
          width: w * 0.4,
          height: h * 0.34,
          borderRadius: spec.d * 0.2,
          backgroundColor: 'rgba(255,255,255,0.55)',
        }}
      />
      {/* base shadow for depth */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: h * 0.4,
          borderBottomLeftRadius: spec.d / 2,
          borderBottomRightRadius: spec.d / 2,
          backgroundColor: 'rgba(0,0,0,0.18)',
        }}
      />
    </Animated.View>
  );
}

export interface PitFaceProps {
  count: number;
  /** Active/legal highlight — draws a pulsing golden ring. */
  highlight?: boolean;
  /** Capture flash tint (maroon). */
  capture?: boolean;
  /** Dim non-active rows in the demo. */
  dim?: boolean;
  /** Show the seed-count chip (default true). */
  showCount?: boolean;
  /** Animate seed drop-in (default true). */
  animateSeeds?: boolean;
  maxSeeds?: number;
}

/**
 * The carved pit hollow with seeds, depth shading, count chip, and an optional
 * pulsing legal-move ring. Purely presentational — callers wrap it with the
 * press target / bounce animation.
 */
export function PitFace({
  count,
  highlight = false,
  capture = false,
  dim = false,
  showCount = true,
  animateSeeds = true,
  maxSeeds = DEFAULT_MAX_SEEDS,
}: PitFaceProps) {
  const [size, setSize] = useState(0);
  const pulse = useSharedValue(0);
  const seedKey = useRef(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && Math.abs(w - size) > 0.5) setSize(w);
  };

  useEffect(() => {
    if (highlight) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 950, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 220 });
    }
    return () => cancelAnimation(pulse);
  }, [highlight, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + pulse.value * 0.6,
    transform: [{ scale: 1 + pulse.value * 0.03 }],
  }));

  const seeds = useMemo(() => seedLayout(Math.min(count, maxSeeds), size), [count, size, maxSeeds]);

  return (
    <View style={styles.face}>
      <View style={[styles.hollow, dim && styles.hollowDim]} onLayout={onLayout}>
        {/* Carved hollow: dark at the rim, warmer toward the base. */}
        <LinearGradient
          colors={theme.gradients.pit}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Inner top shadow arc for depth */}
        <View pointerEvents="none" style={styles.topShade} />
        {/* Warm base glow */}
        <View pointerEvents="none" style={styles.baseGlow} />
        {/* Rim highlight */}
        <View pointerEvents="none" style={styles.rim} />
        {capture ? <View pointerEvents="none" style={styles.captureTint} /> : null}
        {seeds.map((s, i) => (
          <Seed key={`${seedKey.current}-${i}`} spec={s} index={i} animate={animateSeeds} />
        ))}
      </View>

      {highlight ? <Animated.View pointerEvents="none" style={[styles.glowRing, pulseStyle]} /> : null}

      {showCount && count > 0 ? (
        // Deterministic chip sizing: width follows digit count and the text
        // never scales with the system font, so the number always renders
        // whole — no wrapping (older Android bug) and no "…" truncation
        // (Android font-scaling bug). The seeds themselves remain the
        // primary count cue; this badge is the exact readout.
        <View
          pointerEvents="none"
          style={[styles.countChip, count > 9 ? styles.countChipWide : null]}
        >
          <AppText
            style={[styles.countText, count > 9 ? styles.countTextTwoDigit : null]}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {count}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  face: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hollow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#1B110A',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.6)',
  },
  hollowDim: { opacity: 0.7 },
  topShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  baseGlow: {
    position: 'absolute',
    left: '18%',
    right: '18%',
    bottom: '10%',
    height: '30%',
    borderRadius: 999,
    backgroundColor: 'rgba(200,155,60,0.12)',
  },
  rim: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(228,193,115,0.26)',
  },
  captureTint: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: 'rgba(139,42,34,0.34)',
    borderWidth: 1.5,
    borderColor: theme.colors.accentLight,
  },
  glowRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  seed: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.25)',
    ...(theme.shadows.sm as object),
  },
  countChip: {
    position: 'absolute',
    bottom: -3,
    alignSelf: 'center',
    width: 22,
    height: 17,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(8,26,24,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(228,193,115,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  // Two digits get a deterministically wider chip — no measurement, no
  // ellipsis, works identically on Android/iOS/web.
  countChipWide: {
    width: 30,
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 13,
    color: theme.palette.goldLight,
    textAlign: 'center',
    // Android adds asymmetric font padding inside tight chips.
    includeFontPadding: false,
  },
  countTextTwoDigit: {
    fontSize: 10,
    letterSpacing: -0.2,
  },
});
