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
 * Invisible pre-warm layer. The overlay unmounts between moves (a safety
 * guarantee we keep), which would otherwise defer image decode to the
 * moment a move STARTS — the first drops would play out while the decode
 * is in flight and the hand would appear mid-move. Mounting both poses
 * once when the BOARD mounts moves fetch+decode to board load. The images
 * render AT THE OVERLAY'S DISPLAY SIZE (not 1×1): Android's pipeline
 * caches the decoded bitmap per target size, so a 1×1 warm-up would not
 * warm the size the overlay actually draws. The assets themselves are
 * kept small (320px, ~60 KB each) so even a cold decode is a few ms.
 * Render it (once) alongside the board, NOT inside the overlay.
 */
export function SowingHandPrewarm() {
  return (
    <View pointerEvents="none" style={prewarmStyles.box} accessibilityElementsHidden>
      <Image source={HAND_OPEN_SRC} style={prewarmStyles.img} fadeDuration={0} />
      <Image source={HAND_FIST_SRC} style={prewarmStyles.img} fadeDuration={0} />
    </View>
  );
}

const prewarmStyles = StyleSheet.create({
  box: { position: 'absolute', top: 0, left: 0, width: 96, height: 96, opacity: 0 },
  img: { position: 'absolute', width: 96, height: 96 },
});

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
  /** Vertical arc offset: the hand rises into a parabolic hop between pits. */
  const hop = useSharedValue(0);
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
      // First frame of a move: the open hand appears INSTANTLY over the
      // scooped pit (assets are tiny and pre-decoded by SowingHandPrewarm),
      // reaches down into the hollow, and closes into the carrying fist
      // while lifting off the board. The controller holds scoop frames a
      // little longer, so this grab fully reads before the first drop.
      engaged.value = true;
      const grab = Math.min(speed * 1.2, 480);
      x.value = center.x;
      y.value = center.y - 30;
      lean.value = 0;
      hop.value = 0;
      release.value = 1;
      appear.value = 0;
      appear.value = withTiming(1, { duration: 60 });
      // Reach in: descend onto the pit while slightly oversized (near the
      // camera), dipping INTO the hollow as the fingers close around the
      // shells, then rise out with the load.
      y.value = withTiming(center.y, { duration: grab * 0.42, easing: Easing.out(Easing.quad) });
      curl.value = 0;
      curl.value = withSequence(
        withTiming(0.06, { duration: grab * 0.4, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: grab * 0.45, easing: ease }),
      );
      lift.value = 1.55;
      lift.value = withSequence(
        withTiming(0.94, { duration: grab * 0.42, easing: Easing.in(Easing.quad) }),
        withTiming(1.42, { duration: grab * 0.33, easing: Easing.out(Easing.quad) }),
        withTiming(1.16, { duration: grab * 0.25, easing: Easing.out(Easing.quad) }),
      );
      return;
    }

    // Glide to the next pit on a parabolic arc, leaning into the direction
    // of travel like a real sowing hand, then settle upright.
    const dx = center.x - x.value;
    const tilt = Math.max(-14, Math.min(14, dx * 0.16));
    lean.value = withSequence(
      withTiming(tilt, { duration: travel * 0.4, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: travel * 0.6, easing: Easing.out(Easing.quad) }),
    );
    hop.value = withSequence(
      withTiming(-16, { duration: travel * 0.45, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: travel * 0.55, easing: Easing.in(Easing.quad) }),
    );
    x.value = withTiming(center.x, { duration: travel, easing: Easing.inOut(Easing.quad) });
    y.value = withTiming(center.y, { duration: travel, easing: Easing.inOut(Easing.quad) });

    if (frame.kind === 'drop') {
      // The fist relaxes toward open to let one shell slip out over the
      // pit, then closes again; the hand rises into the hop and dips
      // decisively into the release — an arced, wrist-like rhythm.
      curl.value = withSequence(
        withTiming(0.34, { duration: travel * 0.5, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: travel * 0.5, easing: ease }),
      );
      release.value = 0;
      release.value = withTiming(1, { duration: travel, easing: Easing.in(Easing.quad) });
      lift.value = withSequence(
        withTiming(1.3, { duration: travel * 0.4, easing: Easing.out(Easing.quad) }),
        withTiming(0.9, { duration: travel * 0.3, easing: Easing.in(Easing.quad) }),
        withTiming(1.16, { duration: travel * 0.3, easing: Easing.out(Easing.quad) }),
      );
    } else if (frame.kind === 'scoop') {
      // New lap: the hand opens on approach, dips into the hollow to grab
      // the pit's shells, and surges up with the fresh load.
      curl.value = withSequence(
        withTiming(0.05, { duration: travel * 0.5, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: travel * 0.5, easing: ease }),
      );
      lift.value = withSequence(
        withTiming(0.92, { duration: travel * 0.45, easing: Easing.out(Easing.quad) }),
        withTiming(1.44, { duration: travel * 0.3, easing: Easing.out(Easing.quad) }),
        withTiming(1.16, { duration: travel * 0.25, easing: Easing.out(Easing.quad) }),
      );
    } else {
      // Capture: the hand sweeps fully open over the claimed pit with a
      // proud flourish.
      curl.value = withTiming(0.02, { duration: travel * 0.8, easing: ease });
      lift.value = withSequence(
        withTiming(1.42, { duration: travel * 0.55, easing: Easing.out(Easing.quad) }),
        withTiming(1.12, { duration: travel * 0.45, easing: Easing.out(Easing.quad) }),
      );
    }
  }, [frame, center, active, engaged, x, y, appear, lift, lean, hop, curl, release]);

  const handStyle = useAnimatedStyle(() => ({
    opacity: appear.value,
    transform: [
      { translateX: x.value - HAND_W / 2 },
      // Anchor the grip area (knuckles/palm heart) over the pit; `hop`
      // arcs the hand upward while travelling between pits.
      { translateY: y.value + hop.value - HAND_H * 0.44 },
      { scale: lift.value },
      { rotate: `${(player === 1 ? 180 : 0) + lean.value}deg` },
    ],
  }));

  // Contact shadow: softer and wider as the hand lifts higher; stays on the
  // board surface (no hop offset) so the arc reads as height, not slide.
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: appear.value * (0.2 - Math.min(0.1, -hop.value * 0.004)),
    transform: [
      { translateX: x.value - HAND_W * 0.33 },
      { translateY: y.value - HAND_H * 0.06 },
      { scaleX: lift.value * (1.05 - hop.value * 0.006) },
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

  // One ivory cowrie slips from the fingers toward the pit on each drop,
  // tumbling slightly as it falls.
  const fallingShellStyle = useAnimatedStyle(() => ({
    opacity: release.value >= 1 ? 0 : 1 - release.value * 0.45,
    transform: [
      { translateY: release.value * 34 },
      { rotate: `${release.value * 50 - 12}deg` },
      { scale: 1 - release.value * 0.28 },
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
        {/* Falling cowrie — under the hand so it emerges from the fingers. */}
        <Animated.View style={[styles.fallingShell, fallingShellStyle]}>
          <View style={styles.fallingShellSlit} />
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

const HAND_W = 96;
const HAND_H = 96;
const MAX_HELD_SHELLS = 12;
/** Side of the square cluster the held shells are packed into. */
const HELD_CLUSTER = 36;

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
    top: HAND_H * 0.42 - 6,
    left: HAND_W / 2 - 6,
    width: 12,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F5E9CE',
    borderWidth: 1,
    borderColor: '#C79256',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallingShellHighlight: {
    position: 'absolute',
    top: 1,
    left: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  // The cowrie's characteristic aperture slit.
  fallingShellSlit: {
    width: 1.6,
    height: 8,
    borderRadius: 1,
    backgroundColor: 'rgba(122,84,48,0.6)',
  },
});
