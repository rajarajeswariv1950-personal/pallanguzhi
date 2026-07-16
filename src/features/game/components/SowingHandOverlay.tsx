import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
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
 * Sowing-hand overlay — realistic SVG hand with articulated poses.
 *
 * Two anatomical silhouettes of the back of a hand (drawn as smooth bezier
 * paths with a warm skin gradient, nails and knuckle creases) are
 * cross-faded to animate the gesture:
 *   OPEN  — fingers extended: scooping into a pit / releasing shells.
 *   FIST  — loose carrying fist with the thumb wrapped across.
 * The shells still in the hand (`frame.hand` from the engine trace) sit on
 * the back of the fist as tiny cowrie images in the same sunflower packing
 * the pits use, so the player can read exactly how many seeds remain. One
 * ivory shell slips from the hand into each pit on every drop.
 *
 * Motion architecture (unchanged from the stabilized version):
 *  - Owns NO clock: reacts to the controller's `frame` prop; the frame
 *    timer remains the single timing authority.
 *  - HARD disappearance: renders null when there is no frame, no acting
 *    pit, or no measured center — structural, never fade-dependent.
 *  - Fresh state per move: re-seeds position on each move's first frame.
 *
 * v1 simplifications (documented):
 *  - 'capture' frames: the hand sweeps open over the captured pit; seeds
 *    do not fly to the store (the store's bump animation signals the gain).
 *  - 'bank' frames: whole-side sweep → no acting pit → hand unmounts.
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
  /** 0 = open hand, 1 = closed carrying fist. */
  const curl = useSharedValue(0);
  /** Falling-shell progress: 0 = leaving the hand, 1 = landed (gone). */
  const release = useSharedValue(1);
  // Whether the hand was active on the previous frame (glide vs materialize).
  const engaged = useSharedValue(false);

  useEffect(() => {
    if (!active || !center || !frame) {
      engaged.value = false;
      return;
    }
    const speed = MOVE_SPEED_MS[useSettingsStore.getState().moveSpeed];
    const travel = Math.min(speed * 0.7, 300);

    if (!engaged.value) {
      // First frame of a move: the open hand appears over the pit and
      // closes into a carrying fist while lifting off the board.
      engaged.value = true;
      x.value = center.x;
      y.value = center.y;
      release.value = 1;
      appear.value = 0;
      appear.value = withTiming(1, { duration: Math.min(speed * 0.5, 180) });
      curl.value = 0;
      curl.value = withTiming(1, {
        duration: Math.min(speed * 0.7, 300),
        easing: Easing.out(Easing.cubic),
      });
      lift.value = withSequence(
        withTiming(1.22, { duration: Math.min(speed * 0.4, 180), easing: Easing.out(Easing.quad) }),
        // Stays slightly lifted while carrying — reads as "above the board".
        withTiming(1.06, { duration: Math.min(speed * 0.4, 180), easing: Easing.out(Easing.quad) }),
      );
      return;
    }

    // Glide to the acted-on pit.
    x.value = withTiming(center.x, { duration: travel, easing: Easing.inOut(Easing.quad) });
    y.value = withTiming(center.y, { duration: travel, easing: Easing.inOut(Easing.quad) });

    if (frame.kind === 'drop') {
      // The fist relaxes toward open just enough to let one shell slip
      // out over the pit, then closes again; the hand dips with the release.
      curl.value = withSequence(
        withTiming(0.45, { duration: travel * 0.5, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: travel * 0.5, easing: Easing.out(Easing.quad) }),
      );
      release.value = 0;
      release.value = withTiming(1, { duration: travel, easing: Easing.in(Easing.quad) });
      lift.value = withSequence(
        withTiming(0.97, { duration: travel * 0.55, easing: Easing.out(Easing.quad) }),
        withTiming(1.06, { duration: travel * 0.45, easing: Easing.out(Easing.quad) }),
      );
    } else if (frame.kind === 'scoop') {
      // New lap: the hand opens on approach and grabs the pit's shells.
      curl.value = withSequence(
        withTiming(0.1, { duration: travel * 0.5, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: travel * 0.5, easing: Easing.out(Easing.cubic) }),
      );
      lift.value = withSequence(
        withTiming(1.2, { duration: travel * 0.55, easing: Easing.out(Easing.quad) }),
        withTiming(1.06, { duration: travel * 0.45, easing: Easing.out(Easing.quad) }),
      );
    } else {
      // Capture: the hand sweeps fully open over the claimed pit.
      curl.value = withTiming(0.05, { duration: travel * 0.7, easing: Easing.out(Easing.cubic) });
      lift.value = withSequence(
        withTiming(1.16, { duration: travel * 0.55, easing: Easing.out(Easing.quad) }),
        withTiming(1.04, { duration: travel * 0.45, easing: Easing.out(Easing.quad) }),
      );
    }
  }, [frame, center, active, engaged, x, y, appear, lift, curl, release]);

  const handStyle = useAnimatedStyle(() => ({
    opacity: appear.value,
    transform: [
      { translateX: x.value - HAND_W / 2 },
      // Anchor the knuckle area (not the geometric center) over the pit.
      { translateY: y.value - HAND_H * 0.42 },
      { scale: lift.value },
      // Player 1 reaches in from the top row: mirror the whole hand.
      { rotate: player === 1 ? '180deg' : '0deg' },
    ],
  }));

  // Contact shadow: grows softer/larger as the hand lifts higher.
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: appear.value * 0.16,
    transform: [
      { translateX: x.value - HAND_W * 0.38 },
      { translateY: y.value - HAND_H * 0.1 },
      { scaleX: lift.value * 1.05 },
      { scaleY: lift.value * 0.5 },
    ],
  }));

  // Steepened cross-fade so mid-blend never looks like two ghost hands.
  const openStyle = useAnimatedStyle(() => ({
    opacity: Math.pow(1 - curl.value, 1.6),
  }));
  const fistStyle = useAnimatedStyle(() => ({
    opacity: Math.pow(curl.value, 1.6),
  }));

  // One ivory shell slips from the fist toward the pit on each drop.
  const fallingShellStyle = useAnimatedStyle(() => ({
    opacity: release.value >= 1 ? 0 : 1 - release.value * 0.5,
    transform: [
      { translateY: release.value * 22 },
      { scale: 1 - release.value * 0.3 },
    ],
  }));

  // Shells riding on the back of the fist appear only while carrying.
  const heldShellsStyle = useAnimatedStyle(() => ({
    opacity: Math.pow(curl.value, 1.4) * appear.value,
  }));

  // Sunflower-packed mini cowries — same layout algorithm as the pits, so
  // the hand's cargo visually matches the board's seeds.
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

        {/* OPEN pose — extended fingers, nails, base creases. */}
        <Animated.View style={[StyleSheet.absoluteFill, openStyle]}>
          <HandOpen />
        </Animated.View>

        {/* FIST pose — loose carrying fist, thumb wrapped across. */}
        <Animated.View style={[StyleSheet.absoluteFill, fistStyle]}>
          <HandFist />
        </Animated.View>

        {/* Shells remaining in the hand, shown on the back of the fist. */}
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

/* ------------------------------------------------------------------ */
/* Hand artwork — smooth silhouettes, warm skin gradient, subtle depth. */
/* Right hand seen from the back, fingers pointing up.                  */
/* ------------------------------------------------------------------ */

const SKIN_LIGHT = '#C89468';
const SKIN_DARK = '#9C6A40';
const SKIN_EDGE = '#7A4E2C';
const NAIL = '#E8CBAA';

function SkinDefs({ id }: { id: string }) {
  return (
    <Defs>
      <LinearGradient id={id} x1="0.3" y1="0" x2="0.7" y2="1">
        <Stop offset="0" stopColor={SKIN_LIGHT} />
        <Stop offset="1" stopColor={SKIN_DARK} />
      </LinearGradient>
    </Defs>
  );
}

/** Open hand: relaxed extended fingers, slight natural spread. */
function HandOpen() {
  return (
    <Svg width={HAND_W} height={HAND_H} viewBox="0 0 100 130">
      <SkinDefs id="skinOpen" />
      {/* Silhouette: wrist → thumb → index…pinky → palm edge. */}
      <Path
        d="M35,127
           C31,113 29,99 30,86
           C27,82 20,76 14,68
           C10,62 9,55 13,52
           C17,49 22,53 26,59
           C29,64 31,69 32,73
           C31,60 31,47 32,36
           C32,29 34,25 37,25
           C40,25 42,29 42,35
           L42,52
           C43,50 44,48 45,47
           L45,22
           C45,15 47,11 50,11
           C53,11 55,15 55,22
           L55,46
           C56,47 57,49 58,50
           L58,26
           C58,20 60,16 63,16
           C66,16 68,20 68,26
           L68,52
           C69,53 70,55 71,57
           L71,38
           C71,33 73,30 75,30
           C78,30 79,33 79,38
           L79,62
           C79,76 77,94 73,108
           C71,117 69,123 67,127
           Z"
        fill="url(#skinOpen)"
        stroke={SKIN_EDGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Nails */}
      <Ellipse cx="37.5" cy="30" rx="3" ry="3.6" fill={NAIL} opacity="0.85" />
      <Ellipse cx="50" cy="16.5" rx="3.2" ry="3.8" fill={NAIL} opacity="0.85" />
      <Ellipse cx="63" cy="21.5" rx="3" ry="3.6" fill={NAIL} opacity="0.85" />
      <Ellipse cx="75" cy="34.5" rx="2.6" ry="3.2" fill={NAIL} opacity="0.85" />
      <Ellipse cx="14.5" cy="56" rx="2.6" ry="3.2" fill={NAIL} opacity="0.8" />
      {/* Finger-base creases */}
      <Path d="M33,58 C36,56 40,56 42,58" stroke={SKIN_EDGE} strokeWidth="1" opacity="0.3" fill="none" />
      <Path d="M45,53 C48,51 52,51 55,53" stroke={SKIN_EDGE} strokeWidth="1" opacity="0.3" fill="none" />
      <Path d="M58,56 C61,54 65,54 68,56" stroke={SKIN_EDGE} strokeWidth="1" opacity="0.3" fill="none" />
      <Path d="M70,62 C73,60 76,60 79,62" stroke={SKIN_EDGE} strokeWidth="1" opacity="0.3" fill="none" />
      {/* Tendon hints on the back of the hand */}
      <Path d="M42,66 C44,80 45,94 45,106" stroke={SKIN_EDGE} strokeWidth="0.9" opacity="0.18" fill="none" />
      <Path d="M54,62 C55,78 55,94 54,108" stroke={SKIN_EDGE} strokeWidth="0.9" opacity="0.18" fill="none" />
      <Path d="M65,64 C65,80 64,94 62,106" stroke={SKIN_EDGE} strokeWidth="0.9" opacity="0.18" fill="none" />
    </Svg>
  );
}

/** Carrying fist: fingers curled under, thumb wrapped across the side. */
function HandFist() {
  return (
    <Svg width={HAND_W} height={HAND_H} viewBox="0 0 100 130">
      <SkinDefs id="skinFist" />
      {/* Fist body with four knuckle bumps along the top. */}
      <Path
        d="M34,122
           C29,110 27,96 28,83
           C29,71 33,62 40,57
           C41,51 45,49 49,52
           C51,47 57,46 60,50
           C63,46 69,46 71,51
           C74,48 79,50 80,55
           C84,62 85,73 84,85
           C83,99 80,111 74,122
           Z"
        fill="url(#skinFist)"
        stroke={SKIN_EDGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Curled-finger separations below the knuckles */}
      <Path d="M50,53 C49,63 49,73 50,82" stroke={SKIN_EDGE} strokeWidth="1.1" opacity="0.4" fill="none" />
      <Path d="M61,51 C60,61 60,71 61,80" stroke={SKIN_EDGE} strokeWidth="1.1" opacity="0.4" fill="none" />
      <Path d="M71,53 C70,62 70,71 71,79" stroke={SKIN_EDGE} strokeWidth="1.1" opacity="0.4" fill="none" />
      {/* Knuckle highlights */}
      <Ellipse cx="45" cy="56" rx="3.4" ry="2.4" fill={SKIN_LIGHT} opacity="0.5" />
      <Ellipse cx="55.5" cy="53" rx="3.4" ry="2.4" fill={SKIN_LIGHT} opacity="0.5" />
      <Ellipse cx="66" cy="53" rx="3.2" ry="2.3" fill={SKIN_LIGHT} opacity="0.5" />
      <Ellipse cx="75.5" cy="56" rx="2.8" ry="2.1" fill={SKIN_LIGHT} opacity="0.5" />
      {/* Thumb wrapped across the lower-left of the fist */}
      <Path
        d="M31,80
           C25,84 22,92 26,100
           C30,108 39,111 46,107
           C42,101 38,93 36,85
           C35,81 33,79 31,80
           Z"
        fill="url(#skinFist)"
        stroke={SKIN_EDGE}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <Ellipse cx="42" cy="103" rx="2.8" ry="2.2" fill={NAIL} opacity="0.75" />
    </Svg>
  );
}

const HAND_W = 62;
const HAND_H = 80;
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
    width: HAND_W * 0.76,
    height: HAND_H * 0.3,
    borderRadius: 999,
    backgroundColor: '#1A0E05',
  },
  heldCluster: {
    position: 'absolute',
    // Centered on the back of the fist.
    left: HAND_W * 0.5 - HELD_CLUSTER / 2 + 4,
    top: HAND_H * 0.52 - HELD_CLUSTER / 2,
    width: HELD_CLUSTER,
    height: HELD_CLUSTER,
  },
  fallingShell: {
    position: 'absolute',
    top: HAND_H * 0.42 - 5,
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
