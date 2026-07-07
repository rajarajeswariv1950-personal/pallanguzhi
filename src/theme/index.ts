import { colors, gradients, palette } from './colors';
import { spacing, layout } from './spacing';
import { radii } from './radii';
import { shadows } from './shadows';
import { typography, fontSizes, fontWeights, lineHeights } from './typography';

export * from './colors';
export * from './spacing';
export * from './radii';
export * from './shadows';
export * from './typography';

/** Single source of truth for all design tokens. */
export const theme = {
  colors,
  gradients,
  palette,
  spacing,
  layout,
  radii,
  shadows,
  typography,
  fontSizes,
  fontWeights,
  lineHeights,
} as const;

export type Theme = typeof theme;

/**
 * The theme is static today; the hook indirection lets us introduce
 * light/seasonal variants later without touching call sites.
 */
export function useTheme(): Theme {
  return theme;
}
