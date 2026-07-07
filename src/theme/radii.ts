/** Border-radius tokens. */

export const radii = {
  none: 0,
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
  pill: 999,
  round: 9999,
} as const;

export type RadiusToken = keyof typeof radii;
