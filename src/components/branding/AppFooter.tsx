import { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { theme } from '@/theme';

export interface AppFooterProps {
  /** Extra style for the outer wrapper (e.g. margins on custom screens). */
  style?: ViewStyle;
  /** Slightly tighter vertical padding for dense screens. */
  compact?: boolean;
  /**
   * Bilingual credit (English + Tamil) — used ONLY on the first language-selection
   * screen. Everywhere else the footer is single-language (the chosen language).
   */
  bilingual?: boolean;
}

/**
 * The mandatory production credit, shown on every screen and localized to the
 * selected language. Its text is centralized in `brand.footerCredit`:
 *   - English:  "© A Phoenix Neumed (a RR Group) Production"
 *   - Tamil:    "© இது ஒரு ஃபீனிக்ஸ் நியூமெட் (ஆர்.ஆர். குழுமம்) தயாரிப்பு"
 * In Tamil mode only the Tamil credit shows; in English mode only the English
 * one — never mixed. The brand name follows the same transliteration as
 * `brand.studio`.
 *
 * Rendered as an elegant, animated golden line: a soft pulsing halo behind the
 * credit plus a shimmering gold hairline — a tasteful glow that reads clearly
 * without competing with content.
 */
export function AppFooter({ style, compact = false, bilingual = false }: AppFooterProps) {
  const { t, i18n } = useAppTranslation();
  const glow = useSharedValue(0);

  useEffect(() => {
    // Slow, gentle breathing loop — luminous but never distracting.
    glow.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [glow]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.22, 0.6]),
    transform: [
      { scaleX: interpolate(glow.value, [0, 1], [0.86, 1.05]) },
      { scaleY: interpolate(glow.value, [0, 1], [0.9, 1.15]) },
    ],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.85, 1]),
  }));
  const lineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.4, 0.95]),
    transform: [{ scaleX: interpolate(glow.value, [0, 1], [0.8, 1]) }],
  }));

  // Single-language by default; bilingual only on the language-selection screen.
  const credit = bilingual
    ? `${i18n.getFixedT('en')('brand.footerCredit')}\n${i18n.getFixedT('ta')('brand.footerCredit')}`
    : t('brand.footerCredit');

  return (
    <View
      style={[styles.wrap, compact && styles.wrapCompact, style]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={credit}
      pointerEvents="none"
    >
      {/* Shimmering golden hairline seats the credit against content above. */}
      <Animated.View style={[styles.hairlineWrap, lineStyle]}>
        <LinearGradient
          colors={['transparent', theme.palette.gold, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.hairline}
        />
      </Animated.View>

      <View style={styles.creditWrap}>
        {/* Soft golden halo that breathes behind the text. */}
        <Animated.View pointerEvents="none" style={[styles.halo, haloStyle]} />
        <Animated.Text
          style={[styles.text, textStyle]}
          numberOfLines={bilingual ? 2 : 1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          allowFontScaling={false}
        >
          {credit}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  wrapCompact: {
    paddingTop: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  hairlineWrap: {
    width: 140,
    alignItems: 'center',
  },
  hairline: {
    width: '100%',
    height: 2,
    borderRadius: 2,
  },
  creditWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  halo: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -3,
    bottom: -3,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(212,163,44,0.16)',
  },
  text: {
    fontSize: theme.fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 0.6,
    textAlign: 'center',
    color: theme.palette.goldDeep,
    textShadowColor: 'rgba(212,163,44,0.30)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});
