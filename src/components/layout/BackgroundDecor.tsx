import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { theme } from '@/theme';

/**
 * Faint, non-interactive decorative accents (concentric brass rings) that add
 * premium depth behind content without competing with it. Pure vector — no
 * image weight, scales crisply on web/iOS/Android.
 */
export function BackgroundDecor() {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <G opacity={0.06} stroke={theme.colors.primary} fill="none" strokeWidth={1.5}>
          <Circle cx={width - 28} cy={64} r={56} />
          <Circle cx={width - 28} cy={64} r={98} />
          <Circle cx={width - 28} cy={64} r={140} />
        </G>
        <G opacity={0.05} stroke={theme.colors.primaryLight} fill="none" strokeWidth={1.5}>
          <Circle cx={24} cy={height - 70} r={84} />
          <Circle cx={24} cy={height - 70} r={126} />
        </G>
      </Svg>
    </View>
  );
}
