import { StyleSheet, View } from 'react-native';
import { AppLogo } from './AppLogo';
import { AppWordmark } from './AppWordmark';
import { EmblemBadge } from './EmblemBadge';
import { AppText } from '@/components/ui/Text';
import { useResponsive } from '@/hooks/useResponsive';
import { theme } from '@/theme';

export interface BrandHeroProps {
  tagline?: string;
  logoMaxWidth?: number;
  compact?: boolean;
  /** Show the Phoenix emblem crest above the logo (default true). */
  emblem?: boolean;
  /** Home-screen emphasis: renders the full logo noticeably larger than elsewhere. */
  emphasis?: boolean;
  /** Bilingual app name (English + Tamil) — first language-selection screen only. */
  bilingual?: boolean;
}

/**
 * The branded centerpiece used on hero screens (splash, home, language, about).
 * The showcase is the FULL carved-board key art itself — sized to its natural
 * aspect ratio so the whole scene (hand, board, shells, lamps, brand plate) is
 * always visible, never cropped or reduced to a fragment — with the language-aware
 * app name beneath it.
 *
 * The Phoenix emblem is intentionally NOT shown here (it would duplicate the small
 * secondary emblem already in the header); it defaults off. The studio credit
 * lives once in the animated footer, keeping the hero clean.
 */
export function BrandHero({
  tagline,
  logoMaxWidth,
  compact = false,
  emblem = false,
  emphasis = false,
  bilingual = false,
}: BrandHeroProps) {
  const { contentWidth, isTablet, isLandscape } = useResponsive();
  const horizontalPadding = theme.layout.screenPaddingH * 2;
  const cap =
    logoMaxWidth ??
    (compact
      ? isTablet
        ? 380
        : 280
      : emphasis
        ? isTablet
          ? 560
          : isLandscape
            ? 360
            : 420
        : isTablet
          ? 460
          : isLandscape
            ? 300
            : 340);
  const logoWidth = Math.min(contentWidth - horizontalPadding, cap);

  return (
    <View style={styles.wrap}>
      {emblem ? <EmblemBadge size={compact ? 44 : 56} /> : null}

      {/* Main board key art with a soft royal-gold glow (hero treatment only). */}
      <AppLogo
        width={logoWidth}
        framed
        radius={theme.radii.lg}
        resizeMode="contain"
        style={styles.logoGlow}
      />

      <AppWordmark
        size="hero"
        align="center"
        numberOfLines={2}
        bilingual={bilingual}
        style={compact ? styles.wordmarkCompact : undefined}
      />

      {tagline ? (
        <AppText variant="caption" muted align="center" style={styles.tagline}>
          {tagline}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  // Royal-gold halo around the hero board art (does not affect the small
  // header/pause logos, which render AppLogo without this style).
  logoGlow: theme.shadows.gold,
  wordmarkCompact: {
    fontSize: theme.fontSizes.xxl,
  },
  tagline: {
    marginTop: theme.spacing.xs,
  },
});
