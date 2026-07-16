import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';
import type { MoveFrame, Player } from '@/features/game/engine';
import type { PitCenterRegistry } from '@/features/game/components/usePitCenters';
import { seedLayout } from '@/features/game/components/PitVisual';
import { MOVE_SPEED_MS, useSettingsStore } from '@/store/settingsStore';

/**
 * Kill-switch for the sowing-hand overlay. With this false, GameBoard
 * renders no overlay at all — zero mount cost, zero runtime risk.
 */
export const SOWING_HAND_ENABLED = true;

/**
 * Sowing-hand overlay v3 — articulated realistic hand.
 *
 * Realism approach (within Expo/react-native-svg, no raster assets):
 *  - EACH FINGER IS ITS OWN ANIMATED ELEMENT. Fingers fold with staggered
 *    timing — pinky leads, index trails on a close; reverse on an open —
 *    which is how a real hand closes. The fold is a knuckle-anchored
 *    scale + counter-rotation, and a curled-knuckle layer fades in as the
 *    fingers disappear into the fist.
 *  - NO CARTOON OUTLINES. All shapes are gradient-shaded (light radial
 *    top-left → shaded ulnar edge) with at most a whisper-thin deep-skin
 *    edge; the wrist fades out through an alpha gradient instead of
 *    ending in a cut line.
 *  - ORGANIC TRAVEL. The hand leans a few degrees into its direction of
 *    motion and rides slightly higher mid-glide.
 *  - The shells still held (`frame.hand`) sit on the back of the fist as
 *    mini cowrie images (same sunflower packing as the pits) and shrink
 *    shell-by-shell as sowing progresses; one ivory shell slips out of
 *    the fingers into each pit per drop.
 *
 * Motion architecture (unchanged):
 *  - Owns NO clock — reacts to the controller's `frame` prop only.
 *  - HARD disappearance: renders null with no frame / no acting pit / no
 *    measured center. Structural, never fade-dependent.
 *  - Fresh state per move; capture = open sweep; bank = unmount.
 */
export function SowingHandOverlay({
  frame,
  registry,
  player = 0,
}: {
  frame: MoveFrame | null;
  registry: PitCenterRegistry;
  /** Mover: player 1's hand reaches in from the top of the board. */
  player?: Player;
}) {
  const center = frame && frame.pit !== undefined ? registry.get(frame.pit) : undefined;
  const active = center !== undefined;
  const heldCount = active ? Math.min(frame?.hand ?? 0, MAX_HELD_SHELLS) : 0;

  // Hooks run unconditionally (Rules of Hooks); rendering is gated below.
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const lift = useSharedValue(1);
  const appear = useSharedValue(0);
  const lean = useSharedValue(0);
  /** Master pose 0 = open, 1 = fist (drives knuckle layer + held shells). */
  const curl = useSharedValue(0);
  /** Per-finger fold, index → pinky. Staggered around the master pose. */
  const foldIndex = useSharedValue(0);
  const foldMiddle = useSharedValue(0);
  const foldRing = useSharedValue(0);
  const foldPinky = useSharedValue(0);
  const foldThumb = useSharedValue(0);
  /** Falling-shell progress: 0 = leaving the hand, 1 = landed (gone). */
  const release = useSharedValue(1);
  const engaged = useSharedValue(false);

  useEffect(() => {
    if (!active || !center || !frame) {
      engaged.value = false;
      return;
    }
    const speed = MOVE_SPEED_MS[useSettingsStore.getState().moveSpeed];
    const travel = Math.min(speed * 0.7, 300);
    // Natural close: pinky → ring → middle → index; open reverses.
    const folds = [foldIndex, foldMiddle, foldRing, foldPinky];
    const gap = Math.min(speed * 0.08, 34);
    const ease = Easing.out(Easing.cubic);

    const closeHand = (duration: number) => {
      curl.value = withTiming(1, { duration, easing: ease });
      folds.forEach((sv, i) => {
        sv.value = withDelay((3 - i) * gap, withTiming(1, { duration, easing: ease }));
      });
      foldThumb.value = withDelay(2 * gap, withTiming(1, { duration, easing: ease }));
    };
    const openHand = (target: number, duration: number) => {
      curl.value = withTiming(target, { duration, easing: ease });
      folds.forEach((sv, i) => {
        sv.value = withDelay(i * gap, withTiming(target, { duration, easing: ease }));
      });
      foldThumb.value = withTiming(target, { duration, easing: ease });
    };

    if (!engaged.value) {
      // First frame of a move: the open hand appears over the pit and
      // closes finger-by-finger over the shells while lifting off.
      engaged.value = true;
      x.value = center.x;
      y.value = center.y;
      lean.value = 0;
      release.value = 1;
      appear.value = 0;
      appear.value = withTiming(1, { duration: Math.min(speed * 0.5, 180) });
      curl.value = 0;
      folds.forEach((sv) => (sv.value = 0));
      foldThumb.value = 0;
      closeHand(Math.min(speed * 0.7, 300));
      lift.value = withSequence(
        withTiming(1.22, { duration: Math.min(speed * 0.4, 180), easing: Easing.out(Easing.quad) }),
        withTiming(1.06, { duration: Math.min(speed * 0.4, 180), easing: Easing.out(Easing.quad) }),
      );
      return;
    }

    // Lean into the direction of travel, then settle upright.
    const dx = center.x - x.value;
    const tilt = Math.max(-7, Math.min(7, dx * 0.08));
    lean.value = withSequence(
      withTiming(tilt, { duration: travel * 0.4, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: travel * 0.6, easing: Easing.out(Easing.quad) }),
    );
    x.value = withTiming(center.x, { duration: travel, easing: Easing.inOut(Easing.quad) });
    y.value = withTiming(center.y, { duration: travel, easing: Easing.inOut(Easing.quad) });

    if (frame.kind === 'drop') {
      // Fingers relax halfway to let one shell slip out, then re-close.
      const half = travel * 0.5;
      curl.value = withSequence(
        withTiming(0.5, { duration: half, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: half, easing: ease }),
      );
      folds.forEach((sv, i) => {
        sv.value = withDelay(
          i * (gap * 0.5),
          withSequence(
            withTiming(0.45, { duration: half, easing: Easing.out(Easing.quad) }),
            withTiming(1, { duration: half, easing: ease }),
          ),
        );
      });
      foldThumb.value = withSequence(
        withTiming(0.6, { duration: half, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: half, easing: ease }),
      );
      release.value = 0;
      release.value = withTiming(1, { duration: travel, easing: Easing.in(Easing.quad) });
      lift.value = withSequence(
        withTiming(0.97, { duration: travel * 0.55, easing: Easing.out(Easing.quad) }),
        withTiming(1.06, { duration: travel * 0.45, easing: Easing.out(Easing.quad) }),
      );
    } else if (frame.kind === 'scoop') {
      // New lap: open on approach, grab finger-by-finger.
      openHand(0.08, travel * 0.5);
      curl.value = withDelay(travel * 0.5, withTiming(1, { duration: travel * 0.5, easing: ease }));
      folds.forEach((sv, i) => {
        sv.value = withDelay(
          travel * 0.5 + (3 - i) * gap,
          withTiming(1, { duration: travel * 0.5, easing: ease }),
        );
      });
      foldThumb.value = withDelay(
        travel * 0.5,
        withTiming(1, { duration: travel * 0.5, easing: ease }),
      );
      lift.value = withSequence(
        withTiming(1.2, { duration: travel * 0.55, easing: Easing.out(Easing.quad) }),
        withTiming(1.06, { duration: travel * 0.45, easing: Easing.out(Easing.quad) }),
      );
    } else {
      // Capture: sweep fully open over the claimed pit.
      openHand(0.02, travel * 0.8);
      lift.value = withSequence(
        withTiming(1.16, { duration: travel * 0.55, easing: Easing.out(Easing.quad) }),
        withTiming(1.04, { duration: travel * 0.45, easing: Easing.out(Easing.quad) }),
      );
    }
  }, [
    frame, center, active, engaged, x, y, appear, lift, lean, curl,
    foldIndex, foldMiddle, foldRing, foldPinky, foldThumb, release,
  ]);

  const handStyle = useAnimatedStyle(() => ({
    opacity: appear.value,
    transform: [
      { translateX: x.value - HAND_W / 2 },
      // Anchor the knuckle area (not the geometric center) over the pit.
      { translateY: y.value - HAND_H * 0.4 },
      { scale: lift.value },
      { rotate: `${(player === 1 ? 180 : 0) + lean.value}deg` },
    ],
  }));

  // Contact shadow: softer and wider as the hand lifts higher.
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: appear.value * 0.15,
    transform: [
      { translateX: x.value - HAND_W * 0.36 },
      { translateY: y.value - HAND_H * 0.08 },
      { scaleX: lift.value * 1.05 },
      { scaleY: lift.value * 0.45 },
    ],
  }));

  // The flat back of the hand is common to both poses; the curled-knuckle
  // ridge fades in over it as the fingers fold away.
  const knuckleStyle = useAnimatedStyle(() => ({
    opacity: Math.pow(curl.value, 1.3),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: foldThumb.value * 10 },
      { translateY: foldThumb.value * 6 },
      { rotate: `${foldThumb.value * 42}deg` },
      { scaleY: 1 - foldThumb.value * 0.25 },
    ],
  }));

  // One ivory shell slips from the fingers toward the pit on each drop.
  const fallingShellStyle = useAnimatedStyle(() => ({
    opacity: release.value >= 1 ? 0 : 1 - release.value * 0.5,
    transform: [
      { translateY: release.value * 24 },
      { scale: 1 - release.value * 0.3 },
    ],
  }));

  // Shells riding on the back of the fist appear only while carrying.
  const heldShellsStyle = useAnimatedStyle(() => ({
    opacity: Math.pow(curl.value, 1.4) * appear.value,
  }));

  const heldShells = useMemo(() => seedLayout(heldCount, HELD_CLUSTER), [heldCount]);

  // Structural gate: unmounted whenever there is nothing valid to show.
  if (!active) return null;

  return (
    <>
      <Animated.View pointerEvents="none" style={[styles.shadow, shadowStyle]} />
      <Animated.View pointerEvents="none" style={[styles.hand, handStyle]}>
        {/* Falling shell — under the hand so it emerges from the fingers. */}
        <Animated.View style={[styles.fallingShell, fallingShellStyle]}>
          <View style={styles.fallingShellHighlight} />
        </Animated.View>

        {/* Fingers — each articulated independently (index → pinky). */}
        <Finger fold={foldIndex} left={14} height={26} width={10.5} />
        <Finger fold={foldMiddle} left={25.5} height={30} width={11} tallest />
        <Finger fold={foldRing} left={37} height={27.5} width={10.5} />
        <Finger fold={foldPinky} left={48} height={22} width={9} />

        {/* Back of the hand + fading wrist (shared by both poses). */}
        <Svg width={HAND_W} height={HAND_H} viewBox="0 0 64 84" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="backSkin" x1="0.25" y1="0.1" x2="0.85" y2="0.95">
              <Stop offset="0" stopColor={SKIN_LIGHT} />
              <Stop offset="0.55" stopColor={SKIN_MID} />
              <Stop offset="1" stopColor={SKIN_DARK} />
            </LinearGradient>
            <LinearGradient id="wristFade" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0" stopColor={SKIN_MID} stopOpacity="1" />
              <Stop offset="1" stopColor={SKIN_MID} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          {/* Hand back: soft trapezoid, no outline — edges shaded by gradient. */}
          <Path
            d="M13,34
               C13,30 15,27 19,26
               L51,26
               C55,27 57,30 57,34
               C58,44 57,54 55,62
               C53,70 48,74 41,75
               L28,75
               C21,74 16,70 15,62
               C13,54 12,44 13,34 Z"
            fill="url(#backSkin)"
          />
          {/* Ulnar-edge core shadow (rounds the form, replaces outlines). */}
          <Path
            d="M53,30 C55,42 54,56 51,66 C50,70 48,72 46,73 C50,70 52,64 53,56 C54,48 54,38 53,30 Z"
            fill={SKIN_DEEP}
            opacity="0.35"
          />
          {/* Radial sheen on the top of the hand back. */}
          <Ellipse cx="30" cy="38" rx="14" ry="8" fill="#FFE9CF" opacity="0.16" />
          {/* Tendon hints — barely-there. */}
          <Path d="M24,32 C25,44 25,56 25,66" stroke={SKIN_DEEP} strokeWidth="0.8" opacity="0.12" fill="none" />
          <Path d="M32,30 C33,44 33,58 32,68" stroke={SKIN_DEEP} strokeWidth="0.8" opacity="0.12" fill="none" />
          <Path d="M41,32 C41,44 40,56 39,66" stroke={SKIN_DEEP} strokeWidth="0.8" opacity="0.12" fill="none" />
          {/* Wrist fading out — the hand reads as entering the frame. */}
          <Path d="M20,73 L44,73 C44,80 42,84 32,84 C22,84 20,80 20,73 Z" fill="url(#wristFade)" />
        </Svg>

        {/* Curled-knuckle ridge — fades in as the fingers fold away. */}
        <Animated.View style={[StyleSheet.absoluteFill, knuckleStyle]}>
          <Svg width={HAND_W} height={HAND_H} viewBox="0 0 64 84">
            <Defs>
              <LinearGradient id="knuckleSkin" x1="0.5" y1="0" x2="0.5" y2="1">
                <Stop offset="0" stopColor={SKIN_LIGHT} />
                <Stop offset="1" stopColor={SKIN_MID} />
              </LinearGradient>
            </Defs>
            {/* Four knuckle mounds along the top of the fist. */}
            <Path
              d="M14,33
                 C15,27 19,24 22,26
                 C24,22 29,21 31,25
                 C33,21 38,21 40,25
                 C43,22 47,24 48,29
                 C50,31 51,33 51,35
                 L14,36 Z"
              fill="url(#knuckleSkin)"
            />
            <Ellipse cx="21" cy="29" rx="3.4" ry="2.2" fill="#FFE9CF" opacity="0.3" />
            <Ellipse cx="30.5" cy="27" rx="3.4" ry="2.2" fill="#FFE9CF" opacity="0.3" />
            <Ellipse cx="39.5" cy="27.5" rx="3.2" ry="2.1" fill="#FFE9CF" opacity="0.3" />
            <Ellipse cx="47" cy="30.5" rx="2.6" ry="1.8" fill="#FFE9CF" opacity="0.25" />
            {/* Curled-finger separations under the knuckles. */}
            <Path d="M26,27 C26,31 26,34 26,36" stroke={SKIN_DEEP} strokeWidth="0.9" opacity="0.3" fill="none" />
            <Path d="M35,26 C35,30 35,33 35,36" stroke={SKIN_DEEP} strokeWidth="0.9" opacity="0.3" fill="none" />
            <Path d="M43,27 C43,31 43,34 43,36" stroke={SKIN_DEEP} strokeWidth="0.9" opacity="0.3" fill="none" />
          </Svg>
        </Animated.View>

        {/* Thumb — folds across the palm as the hand closes. */}
        <Animated.View style={[styles.thumb, thumbStyle]}>
          <Svg width={16} height={30} viewBox="0 0 16 30">
            <Defs>
              <LinearGradient id="thumbSkin" x1="0.2" y1="0" x2="0.9" y2="1">
                <Stop offset="0" stopColor={SKIN_LIGHT} />
                <Stop offset="1" stopColor={SKIN_DARK} />
              </LinearGradient>
            </Defs>
            <Path
              d="M9,1 C13,1 15,4 14,9 L12,22 C11,27 8,29 5,28 C2,27 1,24 2,20 L4,7 C5,3 6,1 9,1 Z"
              fill="url(#thumbSkin)"
            />
            <Ellipse cx="9.5" cy="5" rx="2.6" ry="3" fill={NAIL} opacity="0.8" />
          </Svg>
        </Animated.View>

        {/* Shells remaining in the hand, on the back of the fist. */}
        <Animated.View pointerEvents="none" style={[styles.heldCluster, heldShellsStyle]}>
          {heldShells.map((s, i) => (
            <View
              key={`${heldCount}-${i}`}
              style={{
                position: 'absolute',
                left: s.x,
                top: s.y,
                width: s.oval ? s.d * 0.82 : s.d,
                height: s.d,
                borderRadius: s.d / 2,
                backgroundColor: s.color,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: 'rgba(60,30,10,0.45)',
                transform: [{ rotate: `${s.rotate}deg` }],
              }}
            />
          ))}
        </Animated.View>
      </Animated.View>
    </>
  );
}

/**
 * One articulated finger. The fold is anchored at the knuckle (bottom edge):
 * scaleY shrinks toward it with a translateY compensation, plus a slight
 * counter-rotation, so the finger reads as curling under the hand rather
 * than shrinking in place.
 */
function Finger({
  fold,
  left,
  height,
  width,
  tallest = false,
}: {
  fold: SharedValue<number>;
  left: number;
  height: number;
  width: number;
  tallest?: boolean;
}) {
  const style = useAnimatedStyle(() => {
    const s = 1 - fold.value * 0.85;
    return {
      transform: [
        { translateY: ((1 - s) * height) / 2 },
        { scaleY: s },
        { rotate: `${fold.value * -4}deg` },
      ],
      opacity: 1 - fold.value * 0.25,
    };
  });
  // Top of the hand back sits at y=26 in the 64×84 viewBox → px ≈ 26.
  const top = HAND_H * (26 / 84) - height + (tallest ? 0 : 1.5);
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left, top, width, height }, style]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id={`fingerSkin${left}`} x1="0.15" y1="0" x2="0.95" y2="0.2">
            <Stop offset="0" stopColor={SKIN_LIGHT} />
            <Stop offset="1" stopColor={SKIN_DARK} />
          </LinearGradient>
        </Defs>
        {/* Softly tapered finger, rounded tip, no outline. */}
        <Path
          d={`M${width * 0.5},1
              C${width * 0.85},1 ${width * 0.95},${height * 0.14} ${width * 0.92},${height * 0.3}
              L${width * 0.95},${height * 0.92}
              C${width * 0.95},${height} ${width * 0.05},${height} ${width * 0.05},${height * 0.92}
              L${width * 0.08},${height * 0.3}
              C${width * 0.05},${height * 0.14} ${width * 0.15},1 ${width * 0.5},1 Z`}
          fill={`url(#fingerSkin${left})`}
        />
        {/* Nail */}
        <Ellipse
          cx={width * 0.5}
          cy={height * 0.14}
          rx={width * 0.26}
          ry={height * 0.1}
          fill={NAIL}
          opacity="0.85"
        />
        {/* Joint creases */}
        <Path
          d={`M${width * 0.15},${height * 0.45} C${width * 0.4},${height * 0.42} ${width * 0.6},${height * 0.42} ${width * 0.85},${height * 0.45}`}
          stroke={SKIN_DEEP}
          strokeWidth="0.8"
          opacity="0.22"
          fill="none"
        />
        <Path
          d={`M${width * 0.15},${height * 0.72} C${width * 0.4},${height * 0.69} ${width * 0.6},${height * 0.69} ${width * 0.85},${height * 0.72}`}
          stroke={SKIN_DEEP}
          strokeWidth="0.8"
          opacity="0.22"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}

/* Warm brown skin — gradient-shaded, matched to the board's palette. */
const SKIN_LIGHT = '#D2A075';
const SKIN_MID = '#B98457';
const SKIN_DARK = '#96683F';
const SKIN_DEEP = '#6B4526';
const NAIL = '#EBD0B0';

const HAND_W = 64;
const HAND_H = 84;
const MAX_HELD_SHELLS = 12;
/** Side of the square cluster the held shells are packed into. */
const HELD_CLUSTER = 30;

const styles = StyleSheet.create({
  hand: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: HAND_W,
    height: HAND_H,
  },
  shadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: HAND_W * 0.72,
    height: HAND_H * 0.26,
    borderRadius: 999,
    backgroundColor: '#1A0E05',
  },
  thumb: {
    position: 'absolute',
    left: 2,
    top: HAND_H * 0.38,
    width: 16,
    height: 30,
  },
  heldCluster: {
    position: 'absolute',
    // Centered on the back of the fist, below the knuckle ridge.
    left: HAND_W * 0.5 - HELD_CLUSTER / 2 + 1,
    top: HAND_H * 0.56 - HELD_CLUSTER / 2,
    width: HELD_CLUSTER,
    height: HELD_CLUSTER,
  },
  fallingShell: {
    position: 'absolute',
    top: HAND_H * 0.4 - 5,
    left: HAND_W / 2 - 5,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#F5E9CE',
    borderWidth: 1,
    borderColor: '#C79256',
  },
  fallingShellHighlight: {
    position: 'absolute',
    top: 1,
    left: 2,
    width: 4,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});
