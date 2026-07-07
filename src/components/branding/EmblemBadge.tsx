import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import { brandAssets } from '@/constants/brand';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { theme } from '@/theme';

export interface EmblemBadgeProps {
  size?: number;
  ring?: boolean;
  glow?: boolean;
  style?: ViewStyle;
}

/**
 * The Phoenix Neumed emblem, presented as a polished brass-ringed coin.
 * It is the app's compact brand mark and lives in the BrandedHeader by default.
 */
export function EmblemBadge({
  size = 44,
  ring = true,
  glow = true,
  style,
}: EmblemBadgeProps) {
  const { t } = useAppTranslation();
  const radius = size / 2;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('brand.studio')}
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: theme.palette.white,
        },
        styles.center,
        ring && {
          borderWidth: Math.max(1.5, size * 0.05),
          borderColor: theme.colors.primary,
        },
        glow && theme.shadows.gold,
        style,
      ]}
    >
      <Image
        source={brandAssets.emblem}
        style={{ width: size * 0.9, height: size * 0.9 }}
        resizeMode="contain"
        fadeDuration={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
