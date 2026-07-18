import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '@/components/ui/Text';
import { Icon, IconName } from '@/components/ui/Icon';
import { SEED_COLORS } from '@/features/game/components/PitVisual';
import {
  DEMO_DEFAULT_SPEED,
  DEMO_SPEEDS,
  DemoTransport,
} from '@/features/tutorial/DemoControls';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { playSfx, tapFeedback, type SfxName } from '@/services/feedback';
import { theme } from '@/theme';

/**
 * "Start an Online Match" — a step-through demo of connecting two phones,
 * with the exact same transport (play / pause / step / speed) as the
 * Watch-a-Move lesson. Six steps mirror the REAL app flow: choose Online
 * Multiplayer → Create Room → share the code → friend joins → both ready →
 * the match begins. The sample code uses the app's real 5-character format.
 */

const DEMO_CODE = '4F7K2';

type PhoneScene =
  | 'modes' // mode list with Online highlighted
  | 'create' // Create Room button + code appears
  | 'share' // code chip travelling to the friend
  | 'join' // code typed into Join Room
  | 'ready' // both players ready in the waiting room
  | 'play' // the board opens
  | 'idle'; // dimmed, nothing yet

interface Step {
  captionKey: 'tutorial.od1' | 'tutorial.od2' | 'tutorial.od3' | 'tutorial.od4' | 'tutorial.od5' | 'tutorial.od6';
  you: PhoneScene;
  friend: PhoneScene;
  /** Show the flying code chip between the two phones. */
  sharing?: boolean;
  sound?: SfxName;
}

const STEPS: Step[] = [
  { captionKey: 'tutorial.od1', you: 'modes', friend: 'idle', sound: 'tap' },
  { captionKey: 'tutorial.od2', you: 'create', friend: 'idle', sound: 'tap' },
  { captionKey: 'tutorial.od3', you: 'create', friend: 'idle', sharing: true, sound: 'seed' },
  { captionKey: 'tutorial.od4', you: 'create', friend: 'join', sound: 'tap' },
  { captionKey: 'tutorial.od5', you: 'ready', friend: 'ready', sound: 'seed' },
  { captionKey: 'tutorial.od6', you: 'play', friend: 'play', sound: 'capture' },
];

const BASE_STEP_MS = 2400;

export function OnlineConnectDemo() {
  const { t } = useAppTranslation();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(DEMO_DEFAULT_SPEED);
  const step = STEPS[index];
  const atEnd = index >= STEPS.length - 1;
  const atStart = index <= 0;

  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      const next = index + 1;
      const sound = STEPS[next].sound;
      if (sound) playSfx(sound);
      setIndex(next);
    }, BASE_STEP_MS * DEMO_SPEEDS[speed].mult);
    return () => clearTimeout(timer);
  }, [playing, index, atEnd, speed]);

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(STEPS.length - 1, next));
    const sound = STEPS[clamped].sound;
    if (sound) playSfx(sound);
    setIndex(clamped);
  };

  const onPlayPause = () => {
    tapFeedback();
    if (playing) {
      setPlaying(false);
      return;
    }
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
    setSpeed((s) => Math.min(DEMO_SPEEDS.length - 1, s + 1));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.stage}>
        <Phone label={t('tutorial.odYou')} scene={step.you} you />
        <ShareLane active={!!step.sharing} />
        <Phone label={t('tutorial.odFriend')} scene={step.friend} />
      </View>

      <Caption text={t(step.captionKey)} stepKey={`${index}`} />

      <DemoTransport
        playing={playing}
        atStart={atStart}
        atEnd={atEnd}
        speed={speed}
        stepCurrent={index + 1}
        stepTotal={STEPS.length}
        onPlayPause={onPlayPause}
        onRestart={onRestart}
        onRewind={onRewind}
        onForward={onForward}
        onSlower={onSlower}
        onFaster={onFaster}
      />

      <AppText variant="small" muted align="center" style={styles.hint}>
        {t('tutorial.controlsHint')}
      </AppText>
    </View>
  );
}

/** A stylised phone with a per-step miniature of the real app screens. */
function Phone({ label, scene, you = false }: { label: string; scene: PhoneScene; you?: boolean }) {
  const dim = scene === 'idle';
  return (
    <View style={styles.phoneCol}>
      <View style={[styles.phone, dim && styles.phoneDim]}>
        <View style={styles.notch} />
        <View style={styles.screen}>
          <PhoneScreen scene={scene} you={you} />
        </View>
      </View>
      <AppText variant="small" muted align="center" numberOfLines={2}>
        {label}
      </AppText>
    </View>
  );
}

function PhoneScreen({ scene, you }: { scene: PhoneScene; you: boolean }) {
  const { t } = useAppTranslation();
  switch (scene) {
    case 'modes':
      return (
        <View style={styles.screenBody}>
          <MockRow icon="person" muted />
          <MockRow icon="people" muted />
          <MockRow icon="globe" active label={t('mode.online')} />
        </View>
      );
    case 'create':
      return (
        <View style={styles.screenBody}>
          <MockRow icon="add-circle" active label={t('online.create')} />
          <CodeChip />
        </View>
      );
    case 'join':
      return (
        <View style={styles.screenBody}>
          <MockRow icon="enter" active label={t('online.join')} />
          <CodeChip />
        </View>
      );
    case 'ready':
      return (
        <View style={styles.screenBody}>
          <MockRow icon="checkmark-circle" active label={you ? t('tutorial.odYou') : t('tutorial.odFriend')} />
          <MockRow icon="checkmark-circle" active label={you ? t('tutorial.odFriend') : t('tutorial.odYou')} />
        </View>
      );
    case 'play':
      return (
        <View style={styles.screenBody}>
          <MiniBoardGlyph />
        </View>
      );
    default:
      return (
        <View style={[styles.screenBody, styles.screenIdle]}>
          <Icon name="phone-portrait" size={18} color={theme.colors.textMuted} />
        </View>
      );
  }
}

function MockRow({
  icon,
  label,
  active = false,
  muted = false,
}: {
  icon: IconName;
  label?: string;
  active?: boolean;
  muted?: boolean;
}) {
  return (
    <View style={[styles.mockRow, active && styles.mockRowActive, muted && styles.mockRowMuted]}>
      <Icon
        name={icon}
        size={13}
        color={active ? theme.colors.primaryLight : theme.colors.textMuted}
      />
      {label ? (
        <AppText
          variant="small"
          color={active ? theme.colors.primaryLight : theme.colors.textMuted}
          numberOfLines={2}
          style={styles.mockRowText}
        >
          {label}
        </AppText>
      ) : (
        <View style={styles.mockRowLine} />
      )}
    </View>
  );
}

function CodeChip() {
  return (
    <View style={styles.codeChip}>
      <Icon name="key" size={12} color={theme.colors.textOnGold} />
      <AppText variant="small" color={theme.colors.textOnGold} style={styles.codeText}>
        {DEMO_CODE}
      </AppText>
    </View>
  );
}

/** The room code sliding from your phone to your friend's while sharing. */
function ShareLane({ active }: { active: boolean }) {
  const slide = useSharedValue(0);
  useEffect(() => {
    if (active) {
      slide.value = 0;
      slide.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1100 }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
      );
    } else {
      slide.value = withTiming(0, { duration: 150 });
    }
  }, [active, slide]);
  const chipStyle = useAnimatedStyle(() => ({
    opacity: active ? 0.35 + slide.value * 0.65 : 0,
    transform: [{ translateX: (slide.value - 0.5) * 26 }],
  }));
  return (
    <View style={styles.shareLane}>
      <Icon
        name="arrow-forward"
        size={16}
        color={active ? theme.colors.primaryLight : theme.colors.border}
      />
      <Animated.View style={chipStyle}>
        <CodeChip />
      </Animated.View>
    </View>
  );
}

/**
 * The opened match, in miniature: the real board at its starting position —
 * rosewood slab, gold inlay, a store at each end, and both players' seven
 * pits filled with cowrie shells, ready for the first move.
 */
function MiniBoardGlyph() {
  return (
    <View style={styles.miniBoardWrap}>
      <View style={styles.miniStore} />
      <View style={styles.miniBoard}>
        <LinearGradient
          colors={theme.gradients.board}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.miniInlay} pointerEvents="none" />
        {[0, 1].map((row) => (
          <View key={row} style={styles.miniBoardRow}>
            {Array.from({ length: 7 }, (_, i) => (
              <View key={i} style={styles.miniPit}>
                {[0, 1, 2].map((s) => (
                  <View
                    key={s}
                    style={[
                      styles.miniSeed,
                      { backgroundColor: SEED_COLORS[(row * 7 + i + s) % SEED_COLORS.length] },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        ))}
      </View>
      <View style={styles.miniStore} />
    </View>
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
  stage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  phoneCol: { flex: 1, alignItems: 'stretch', gap: theme.spacing.xs },
  phone: {
    alignSelf: 'stretch',
    minHeight: 128,
    borderRadius: theme.radii.lg,
    borderWidth: 2,
    borderColor: 'rgba(212,163,44,0.55)',
    backgroundColor: '#160D06',
    padding: 6,
    gap: 5,
    ...theme.shadows.md,
  },
  phoneDim: { opacity: 0.45 },
  notch: {
    alignSelf: 'center',
    width: 30,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(228,193,115,0.35)',
  },
  screen: {
    flex: 1,
    borderRadius: theme.radii.md,
    backgroundColor: 'rgba(200,155,60,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(228,193,115,0.2)',
    padding: 6,
  },
  screenBody: { flex: 1, gap: 5, justifyContent: 'center' },
  screenIdle: { alignItems: 'center' },
  mockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  mockRowActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(212,163,44,0.14)',
  },
  mockRowMuted: { opacity: 0.5 },
  mockRowText: { flex: 1, fontSize: 10, lineHeight: 15, includeFontPadding: false },
  mockRowLine: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(228,193,115,0.3)',
  },
  codeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 4,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  codeText: { fontWeight: '800', letterSpacing: 1 },
  shareLane: {
    width: 54,
    alignItems: 'center',
    gap: 4,
  },
  miniBoardWrap: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  miniStore: {
    width: 7,
    alignSelf: 'stretch',
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: '#1B110A',
    borderWidth: 1,
    borderColor: 'rgba(212,163,44,0.5)',
  },
  miniBoard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(212,163,44,0.7)',
    overflow: 'hidden',
    paddingVertical: 5,
    paddingHorizontal: 5,
    gap: 5,
  },
  miniInlay: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(228,193,115,0.45)',
  },
  miniBoardRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' },
  miniPit: {
    // Fixed square: flex+aspectRatio distorts on Android's Yoga rounding
    // (pits render oval and the seed dots spill), while iOS happened to
    // resolve it square. Deterministic size renders identically on both.
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: '#1B110A',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(228,193,115,0.55)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 1.5,
    gap: 1,
    overflow: 'hidden',
  },
  miniSeed: {
    width: 3.5,
    height: 3.5,
    borderRadius: 999,
  },
  caption: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  hint: { marginTop: theme.spacing.xxs },
});
