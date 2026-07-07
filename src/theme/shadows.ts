import { Platform, ViewStyle } from 'react-native';

/**
 * Cross-platform elevation presets.
 * - iOS / web (react-native-web): shadow* props (web maps them to box-shadow).
 * - Android: elevation (+ shadowColor for tint on API 28+).
 */
function make(
  elevation: number,
  color: string,
  opacity: number,
  radius: number,
  offsetY: number,
): ViewStyle {
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: color,
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height: offsetY },
    },
    android: {
      elevation,
      shadowColor: color,
    },
    default: {
      shadowColor: color,
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height: offsetY },
    },
  }) as ViewStyle;
}

export const shadows = {
  none: {} as ViewStyle,
  // Soft, warm-brown shadows tuned for a LIGHT premium UI (never muddy/black-heavy).
  sm: make(2, '#8A6A38', 0.16, 5, 2),
  md: make(6, '#7A5A2E', 0.18, 12, 5),
  lg: make(12, '#6E4E28', 0.2, 22, 10),
  xl: make(20, '#5E4220', 0.24, 32, 16),
  /** Warm golden glow used for primary CTAs and the emblem badge. */
  gold: make(10, '#D4A32C', 0.42, 18, 6),
  /** Controlled-blue glow for secondary/selected accents. */
  teal: make(10, '#3A7FC0', 0.32, 18, 6),
  /** Elegant-red glow for destructive accents. */
  maroon: make(10, '#A83228', 0.34, 16, 6),
} as const;

export type ShadowToken = keyof typeof shadows;
