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
 * It carries all three mandatory brand elements as a proper lockup:
 *   1. the full carved-board app logo image (contain-fit — never cropped,
 *      stretched, or reduced to the emblem),
 *   2. the language-aware app name, and
 *   3. the Phoenix Neumed emblem as a secondary brass-coin mark.
 * The large hero treatment of the logo lives in the screen body (BrandHero);
 * here it is a crisp, legible compact lockup.
 *
 * Responsive:
 *  - phone portrait / tablet / web: brand strip (logo + name + emblem) + nav row
 *  - phone landscape: a single compact row to conserve vertical space
 */
export function BrandedHeader({ title, showBack = true, onBack }: BrandedHeaderProps) {
  const insets = useSafeAreaInsets();
  const { isTablet, isLandscape } = useResponsive();
  const singleRow = isLandscape && !isTablet;

  const logoHeight = singleRow ? 44 : isTablet ? 66 : 58;
  const logoWidth = Math.round(logoHeight * PRIMARY_LOGO_ASPECT);
  const emblemSize = singleRow ? 30 : isTablet ? 42 : 36;
  const showNavRow = showBack || !!title;

  return (
    <LinearGradient
      colors={theme.gradients.header}
      style={[styles.wrap, { paddingTop: insets.top + theme.spacing.sm }]}
    >
      <View style={styles.inner}>
        <View style={styles.brandRow}>
          {singleRow && showBack ? <BackButton onPress={onBack} /> : null}

          {/* Full app logo image — the primary brand mark (contain, framed). */}
          <AppLogo
            width={logoWidth}
            height={logoHeight}
            framed
            radius={theme.radii.sm}
            resizeMode="contain"
          />

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
                <AppText variant="h3" align="center" numberOfLines={1}>
                  {title}
                </AppText>
              ) : null}
            </View>
            <View style={styles.navSide} />
          </View>
        )}

        {singleRow && title ? (
          <AppText variant="caption" muted numberOfLines={1} style={styles.singleTitle}>
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
