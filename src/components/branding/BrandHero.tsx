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
 * Pass `emblem` to crown the hero with the Phoenix emblem crest (used on the
 * Language, Home, and About heroes). It defaults off for lighter surfaces; the
 * studio credit still lives once in the animated footer.
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
  // The hero board art spans the FULL available content width so the whole
  // 1408x768 scene reads clearly — never a small chip or a zoomed strip.
  // AppLogo derives its height from the artwork's own aspect ratio and
  // renders with `contain`, so the entire board is always visible. Caps only
  // stop it becoming outsized on tablets/web; phone landscape is capped so
  // the hero (plus wordmark) still fits above the fold.
  const cap =
    logoMaxWidth ??
    (isLandscape && !isTablet
      ? compact
        ? 340
        : 400
      : isTablet
        ? compact
          ? 520
          : 640
        : 720);
  const logoWidth = Math.min(contentWidth - horizontalPadding, cap);

  return (
    <View style={styles.wrap}>
      {emblem ? <EmblemBadge size={compact ? 44 : 56} /> : null}

      {/* Main board key art with a soft royal-gold glow (hero treatment only).
          The cream mat matches the corner radius so the rounded frame clips
          only the mat — the FULL artwork, corners included, is always shown. */}
      <AppLogo
        width={logoWidth}
        framed
        radius={theme.radii.lg}
        mat={theme.radii.lg}
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
