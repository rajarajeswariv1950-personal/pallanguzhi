import { TextStyle } from 'react-native';

/**
 * Typography scale.
 * NOTE: fontFamily is intentionally left unset so each platform uses a system
 * font that includes Tamil glyphs (iOS: Tamil Sangam MN, Android: Noto Sans
 * Tamil, web: system Tamil fallback). Custom display fonts arrive in Phase 2.
 */

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
  display: 46,
} as const;

export const lineHeights = {
  tight: 1.15,
  normal: 1.4,
  relaxed: 1.6,
} as const;

export const typography = {
  // Explicit lineHeights (~1.35×) reserve room for Tamil conjunct stacks:
  // Android's default line box is tighter than iOS's and crops ascenders/
  // descenders (எ்…, கு…) without them. Values are ≥ both platforms'
  // defaults, so Latin/iOS rendering is visually unchanged.
  display: { fontSize: fontSizes.display, lineHeight: 62, fontWeight: '800', letterSpacing: 0.5 },
  h1: { fontSize: fontSizes.xxxl, lineHeight: 49, fontWeight: '800', letterSpacing: 0.4 },
  h2: { fontSize: fontSizes.xxl, lineHeight: 38, fontWeight: '700', letterSpacing: 0.3 },
  h3: { fontSize: fontSizes.xl, lineHeight: 30, fontWeight: '700' },
  title: { fontSize: fontSizes.lg, lineHeight: 25, fontWeight: '600' },
  body: { fontSize: fontSizes.md, lineHeight: 23, fontWeight: '400' },
  bodyStrong: { fontSize: fontSizes.md, lineHeight: 23, fontWeight: '600' },
  caption: { fontSize: fontSizes.sm, lineHeight: 20, fontWeight: '400' },
  small: { fontSize: fontSizes.xs, lineHeight: 17, fontWeight: '500', letterSpacing: 0.5 },
  button: { fontSize: fontSizes.lg, lineHeight: 25, fontWeight: '700', letterSpacing: 0.5 },
  overline: { fontSize: fontSizes.xs, lineHeight: 17, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;

export type TypographyToken = keyof typeof typography;
