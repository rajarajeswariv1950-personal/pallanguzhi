import { Image, ImageResizeMode, StyleSheet, View, ViewStyle } from 'react-native';
import { brandAssets } from '@/constants/brand';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { theme } from '@/theme';

/**
 * Intrinsic aspect ratio of the primary logo — the full carved-board key art
 * (`assets/brand/pallanguzhi-logo.png`, 1408 x 768). Every sized container
 * derives its shape from this exact ratio, so the full-bleed board photo fills
 * the frame edge-to-edge with no white letterbox bars and no crop.
 */
export const PRIMARY_LOGO_ASPECT = 1408 / 768;

export interface AppLogoProps {
  width: number;
  height?: number;
  framed?: boolean;
  radius?: number;
  resizeMode?: ImageResizeMode;
  /**
   * Inner cream mat (px). With a rounded frame + `overflow: hidden`, a
   * zero-mat image loses its extreme corners to the border radius; a mat
   * ≥ the radius guarantees the FULL artwork — corners included — stays
   * visible, with the rounding cutting only the mat.
   */
  mat?: number;
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
  mat = 0,
  style,
}: AppLogoProps) {
  const { t } = useAppTranslation();
  // The mat surrounds the artwork, so the image area shrinks by 2*mat while
  // keeping the artwork's exact aspect ratio (no distortion, no crop).
  const imageWidth = Math.max(1, width - mat * 2);
  const imageHeight = height ?? Math.round(imageWidth / PRIMARY_LOGO_ASPECT);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('common.appName')}
      style={[
        {
          width,
          height: imageHeight + mat * 2,
          padding: mat,
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
        style={{ width: imageWidth, height: imageHeight }}
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
