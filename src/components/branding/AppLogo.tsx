import { Image, ImageResizeMode, StyleSheet, View, ViewStyle } from 'react-native';
import { brandAssets } from '@/constants/brand';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { theme } from '@/theme';

/**
 * Intrinsic aspect ratio of the primary logo — the full carved-board key art
 * (`assets/brand/pallanguzhi-logo.png`, 1920 x 1080). Every sized container
 * derives its shape from this exact ratio, so the full-bleed board photo fills
 * the frame edge-to-edge with no white letterbox bars and no crop.
 */
export const PRIMARY_LOGO_ASPECT = 1920 / 1080;

export interface AppLogoProps {
  width: number;
  height?: number;
  framed?: boolean;
  radius?: number;
  resizeMode?: ImageResizeMode;
  style?: ViewStyle;
}

/**
 * The primary Pallanguzhi hero logo. Pass only `width` to size it to the
 * logo's natural aspect ratio, or supply an explicit `height` for a chip.
 */
export function AppLogo({
  width,
  height,
  framed = true,
  radius = theme.radii.md,
  // Default to `contain` so the full carved-board key art is NEVER cropped,
  // even if a caller omits it. Sized containers use the logo's own aspect ratio.
  resizeMode = 'contain',
  style,
}: AppLogoProps) {
  const { t } = useAppTranslation();
  const resolvedHeight = height ?? Math.round(width / PRIMARY_LOGO_ASPECT);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('common.appName')}
      style={[
        {
          width,
          height: resolvedHeight,
          borderRadius: radius,
          overflow: 'hidden',
          backgroundColor: theme.colors.surface,
        },
        framed && styles.framed,
        framed && theme.shadows.md,
        style,
      ]}
    >
      <Image
        source={brandAssets.primaryLogo}
        style={StyleSheet.absoluteFill}
        resizeMode={resizeMode}
        fadeDuration={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  framed: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
});
