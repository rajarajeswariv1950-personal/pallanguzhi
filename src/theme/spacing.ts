/** Spacing scale (4-based) and layout constants. */

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
  huge: 56,
  giant: 72,
} as const;

export const layout = {
  /** Content is centred and capped on wide screens (tablet / web). */
  maxContentWidth: 760,
  /** Breakpoints (logical px). */
  phoneMax: 599,
  tabletBreakpoint: 600,
  largeBreakpoint: 1024,
  /** Branded header sizing. */
  headerHeightCompact: 64,
  headerHeightRegular: 84,
  screenPaddingH: 20,
  screenPaddingV: 16,
  hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
} as const;

export type SpacingToken = keyof typeof spacing;
