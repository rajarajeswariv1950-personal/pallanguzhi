import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from '@/components/anim/PressableScale';
import { theme } from '@/theme';

export interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  padded?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function Card({ children, onPress, padded = true, style, accessibilityLabel }: CardProps) {
  const inner = (
    <>
      <LinearGradient
        colors={theme.gradients.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Soft top sheen so the card reads as a lit, premium material surface. */}
      <LinearGradient
        colors={['rgba(255,236,200,0.07)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={padded ? styles.padded : undefined}>{children}</View>
    </>
  );

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        scaleTo={0.985}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[styles.card, theme.shadows.md, style]}
      >
        {inner}
      </PressableScale>
    );
  }

  return <View style={[styles.card, theme.shadows.md, style]}>{inner}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  padded: { padding: theme.spacing.lg },
});
