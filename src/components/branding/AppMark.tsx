import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import { brandAssets } from '@/constants/brand';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { theme } from '@/theme';

export interface AppMarkProps {
  size?: number;
  glow?: boolean;
  style?: ViewStyle;
}

/**
 * The square Pallanguzhi app-logo mark — a stylized top-down carved board
 * (gold-ringed pits on royal wood) purpose-built to stay legible at small
 * header/corner sizes. The full carved-board key art photo is NOT used here:
 * at ~40px the wide photo collapses into an unreadable smudge, so the photo
 * is reserved for the large BrandHero showcase and the splash, while this
 * glyph carries the brand in compact placements.
 */
export function AppMark({ size = 40, glow = true, style }: AppMarkProps) {
  const { t } = useAppTranslation();
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('common.appName')}
      style={[
        { width: size, height: size, borderRadius: Math.round(size * 0.22) },
        styles.wrap,
        glow && theme.shadows.gold,
        style,
      ]}
    >
      <Image
        source={brandAssets.appMark}
        style={{ width: size, height: size }}
        resizeMode="contain"
        fadeDuration={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
});
