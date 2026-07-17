import { useEffect, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
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
 * Photoreal hand poses (back view, fingers up, transparent PNG). Relative
 * requires — not path-aliased — for maximum reliability with the Metro
 * asset resolver across web, iOS and Android (same idiom as brand.ts).
 */
const HAND_OPEN_SRC = require('../../../../assets/hand/open-back.png');
const HAND_FIST_SRC = require('../../../../assets/hand/fist-back.png');

/**
 * Sowing-hand overlay v4 — photoreal hand.
 *
 * Two photographic poses of the back of a hand (open / closed fist, both
 * with transparent backgrounds) are cross-faded to animate the gesture:
 * the open hand closes into a carrying fist at the scoop, relaxes to let
 * one shell slip out over each pit, and sweeps open on captures. The
 * cross-fade uses steepened curves (opacity^1.6) so mid-blend never reads
 * as two ghost hands.
 *
 * The shells still held (`frame.hand` from the engine trace) ride on the
 * back of the fist as mini cowrie images in the same sunflower packing the
 * pits use, shrinking shell-by-shell as sowing progresses. A soft contact
 * shadow widens as the hand lifts, and the hand leans a few degrees into
 * its direction of travel.
 *
 * Motion architecture (unchanged since P2.3):
 *  - Owns NO clock — reacts to the controller's `frame` prop only; the
 *    frame timer remains the single timing authority.
 *  - HARD disappearance: renders null when there is no frame, no acting
 *    pit, or no measured center. Structural, never fade-dependent.
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
  /** Pose: 0 = open hand, 1 = closed carrying fist. */
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
    const ease = Easing.out(Easing.cubic);

    if (!engaged.value) {
      // First frame of a move: the open hand appears over the pit and
      // closes into the carrying fist while lifting off the board.
      engaged.value = true;
      x.value = center.x;
      y.value = center.y;
      lean.value = 0;
      release.value = 1;
      appear.value = 0;
      appear.value = withTiming(1, { duration: Math.min(speed * 0.5, 180) });
      curl.value = 0;
      curl.value = withTiming(1, { duration: Math.min(speed * 0.7, 300), easing: ease });
      lift.value = withSequence(
        withTiming(1.2, { duration: Math.min(speed * 0.4, 180), easing: Easing.out(Easing.quad) }),
        // Stays slightly lifted while carrying — reads as "above the board".
        withTiming(1.06, { duration: Math.min(speed * 0.4, 180), easing: Easing.out(Easing.quad) }),
      );
      return;
    }

    // Lean into the direction of travel, then settle upright.
    const dx = center.x - x.value;
    const tilt = Math.max(-6, Math.min(6, dx * 0.07));
    lean.value = withSequence(
      withTiming(tilt, { duration: travel * 0.4, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: travel * 0.6, easing: Easing.out(Easing.quad) }),
    );
    x.value = withTiming(center.x, { duration: travel, easing: Easing.inOut(Easing.quad) });
    y.value = withTiming(center.y, { duration: travel, easing: Easing.inOut(Easing.quad) });

    if (frame.kind === 'drop') {
      // The fist relaxes toward open just enough to let one shell slip
      // out over the pit, then closes again; the hand dips with the release.
      curl.value = withSequence(
        withTiming(0.45, { duration: travel * 0.5, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: travel * 0.5, easing: ease }),
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
        withTiming(0.05, { duration: travel * 0.5, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: travel * 0.5, easing: ease }),
      );
      lift.value = withSequence(
        withTiming(1.18, { duration: travel * 0.55, easing: Easing.out(Easing.quad) }),
        withTiming(1.06, { duration: travel * 0.45, easing: Easing.out(Easing.quad) }),
      );
    } else {
      // Capture: the hand sweeps fully open over the claimed pit.
      curl.value = withTiming(0.02, { duration: travel * 0.8, easing: ease });
      lift.value = withSequence(
        withTiming(1.14, { duration: travel * 0.55, easing: Easing.out(Easing.quad) }),
        withTiming(1.04, { duration: travel * 0.45, easing: Easing.out(Easing.quad) }),
      );
    }
  }, [frame, center, active, engaged, x, y, appear, lift, lean, curl, release]);

  const handStyle = useAnimatedStyle(() => ({
    opacity: appear.value,
    transform: [
      { translateX: x.value - HAND_W / 2 },
      // Anchor the grip area (knuckles/palm heart) over the pit.
      { translateY: y.value - HAND_H * 0.44 },
      { scale: lift.value },
      { rotate: `${(player === 1 ? 180 : 0) + lean.value}deg` },
    ],
  }));

  // Contact shadow: softer and wider as the hand lifts higher.
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: appear.value * 0.16,
    transform: [
      { translateX: x.value - HAND_W * 0.33 },
      { translateY: y.value - HAND_H * 0.06 },
      { scaleX: lift.value * 1.05 },
      { scaleY: lift.value * 0.45 },
    ],
  }));

  // Steepened cross-fade so mid-blend never looks like two ghost hands.
  const openPoseStyle = useAnimatedStyle(() => ({
    opacity: Math.pow(1 - curl.value, 1.6),
  }));
  const fistPoseStyle = useAnimatedStyle(() => ({
    opacity: Math.pow(curl.value, 1.6),
  }));

  // One ivory shell slips from the fingers toward the pit on each drop.
  const fallingShellStyle = useAnimatedStyle(() => ({
    opacity: release.value >= 1 ? 0 : 1 - release.value * 0.5,
    transform: [
      { translateY: release.value * 26 },
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

        {/* Photoreal poses, cross-faded. fadeDuration={0} disables the
            Android built-in image fade that would fight the pose blend. */}
        <Animated.View style={[StyleSheet.absoluteFill, openPoseStyle]}>
          <Image
            source={HAND_OPEN_SRC}
            style={styles.pose}
            resizeMode="contain"
            fadeDuration={0}
          />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, fistPoseStyle]}>
          <Image
            source={HAND_FIST_SRC}
            style={styles.pose}
            resizeMode="contain"
            fadeDuration={0}
          />
        </Animated.View>

        {/* Shells remaining in the hand, riding the back of the fist. */}
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

const HAND_W = 76;
const HAND_H = 76;
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
  pose: {
    width: HAND_W,
    height: HAND_H,
  },
  shadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: HAND_W * 0.66,
    height: HAND_H * 0.24,
    borderRadius: 999,
    backgroundColor: '#1A0E05',
  },
  heldCluster: {
    position: 'absolute',
    // Centered on the back of the fist (fist pose grip area).
    left: HAND_W * 0.5 - HELD_CLUSTER / 2,
    top: HAND_H * 0.46 - HELD_CLUSTER / 2,
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
