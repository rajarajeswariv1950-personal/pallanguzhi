import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmblemBadge } from './EmblemBadge';
import { AppWordmark } from './AppWordmark';
import { AppLogo, PRIMARY_LOGO_ASPECT } from './AppLogo';
import { BackButton } from '@/components/ui/BackButton';
import { AppText } from '@/components/ui/Text';
import { useResponsive } from '@/hooks/useResponsive';
import { theme } from '@/theme';

export interface BrandedHeaderProps {
  /** Optional screen title shown beneath the brand strip. */
  title?: string;
  /** Show the back button (default true). Home passes false. */
  showBack?: boolean;
  /** Custom back handler (e.g. confirm-exit). */
  onBack?: () => void;
}

/**
 * The single global branded header, present on every screen from Home onward.
 * It is a compact lockup of the language-aware app name and the Phoenix
 * Neumed emblem (the secondary brand mark).
 *
 * The full carved-board app logo appears at the top-left as a compact framed
 * chip (rendered with `contain`, so the ENTIRE board is visible and never
 * cropped), followed by the language-aware app name, with the emblem at the
 * right. The larger showcase of the same board lives in BrandHero
 * (home/language/about) and the splash, where it can be shown big.
 *
 * Responsive:
 *  - phone portrait / tablet / web: brand strip (name + emblem) + nav row
 *  - phone landscape: a single compact row to conserve vertical space
 */
export function BrandedHeader({ title, showBack = true, onBack }: BrandedHeaderProps) {
  const insets = useSafeAreaInsets();
  const { isTablet, isLandscape } = useResponsive();
  const singleRow = isLandscape && !isTablet;

  const emblemSize = singleRow ? 30 : isTablet ? 42 : 36;
  const showNavRow = showBack || !!title;

  // Top-left app logo: the ACTUAL uploaded board artwork, shown whole. The
  // chip is sized to the artwork's own 1408:768 aspect ratio and rendered with
  // `contain`, and the cream mat equals the corner radius so the rounded frame
  // clips only the mat — the full artwork, corners included, is always visible.
  const logoImageHeight = singleRow ? 32 : isTablet ? 52 : 44;
  const logoMat = singleRow ? 4 : 5;
  const logoWidth = Math.round(logoImageHeight * PRIMARY_LOGO_ASPECT) + logoMat * 2;

  return (
    <LinearGradient
      colors={theme.gradients.header}
      style={[styles.wrap, { paddingTop: insets.top + theme.spacing.sm }]}
    >
      <View style={styles.inner}>
        <View style={styles.brandRow}>
          {singleRow && showBack ? <BackButton onPress={onBack} /> : null}

          {/* App logo — the full uploaded board artwork, never cropped */}
          <AppLogo width={logoWidth} mat={logoMat} radius={logoMat} framed />

          {/* Language-aware app name */}
          <View style={styles.wordmarkWrap}>
            <AppWordmark
              size="inline"
              align="left"
              numberOfLines={2}
              showDescriptor={!singleRow}
            />
          </View>

          {/* Phoenix Neumed emblem — secondary brand mark */}
          <EmblemBadge size={emblemSize} />
        </View>

        {!singleRow && showNavRow && (
          <View style={styles.navRow}>
            <View style={styles.navSide}>
              {showBack ? <BackButton onPress={onBack} /> : null}
            </View>
            <View style={styles.navCenter}>
              {title ? (
                // Two lines so long Tamil screen titles render whole at
                // full size instead of ellipsizing ("எப்படி விளையா…").
                <AppText variant="h3" align="center" numberOfLines={2}>
                  {title}
                </AppText>
              ) : null}
            </View>
            <View style={styles.navSide} />
          </View>
        )}

        {singleRow && title ? (
          <AppText variant="caption" muted numberOfLines={2} style={styles.singleTitle}>
            {title}
          </AppText>
        ) : null}
      </View>
      <View style={styles.hairline} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: theme.spacing.sm,
  },
  inner: {
    width: '100%',
    maxWidth: theme.layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: theme.layout.screenPaddingH,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  wordmarkWrap: {
    flex: 1,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  navSide: {
    width: 40,
    alignItems: 'flex-start',
  },
  navCenter: { flex: 1 },
  singleTitle: {
    marginTop: theme.spacing.xs,
    marginLeft: 52,
  },
  hairline: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginTop: theme.spacing.sm,
  },
});
