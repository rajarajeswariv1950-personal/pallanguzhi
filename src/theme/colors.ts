/**
 * Color tokens — a LIGHT, premium, modern royal palette.
 *
 * Direction: warm ivory / cream light surfaces, premium gold, rich saffron-orange
 * accents, elegant red, pleasant green, and a controlled blue — with warm dark
 * "ink" text for polished contrast. The realistic wooden Pallanguzhi board keeps
 * its warm wood/shell tones (see the `wood*` values + board gradients); only the
 * surrounding app UI is the light premium palette.
 *
 * `palette` holds raw values; `colors` holds the semantic roles used by
 * components. Every key name is stable so the whole app re-skins from here.
 */

export const palette = {
  // Warm ivory / cream — the light premium surfaces & backgrounds
  ivoryLightest: '#FFFDF8',
  ivory: '#FBF4E6',
  cream: '#F4E8D0',
  sand: '#E6D4B0',
  parchment: '#FFFBF2',

  // Premium gold
  goldDeep: '#9C6B12',
  gold: '#D4A32C',
  goldLight: '#E8C662',
  goldHighlight: '#F6E4A0',
  brass: '#C2A25E',

  // Saffron-orange (warm primary accent)
  saffronDeep: '#C56A16',
  saffron: '#E88C2A',
  saffronLight: '#F4B45C',

  // Elegant red / maroon accents
  maroonDark: '#7E241C',
  maroon: '#A83228',
  maroonLight: '#CA4636',
  redLight: '#DD6753',

  // Pleasant green
  greenDeep: '#2E7D3E',
  green: '#4CA05B',
  greenLight: '#79C187',

  // Controlled blue
  blueDeep: '#265F9E',
  blue: '#3A7FC0',
  blueLight: '#6AA4D6',

  // Ink — warm dark text on the light surfaces
  inkDarkest: '#2A1E12',
  ink: '#3E2E1C',
  inkMuted: '#856F52',

  // Wood / shell — the REALISTIC gameplay board (kept warm & tactile)
  woodDarkest: '#180D07',
  woodDark: '#241610',
  wood: '#3A2416',
  woodMid: '#4C301D',
  woodLight: '#6B4327',
  woodWarm: '#7D4E2C',

  // Phoenix Neumed emblem brand colours (unchanged — brand-locked)
  phoenixGreen: '#4FB81C',
  phoenixGreenDark: '#2E7D12',
  phoenixRed: '#E8421E',
  phoenixOrange: '#F47B20',

  // Feedback (aligned to the accent hues)
  success: '#4CA05B',
  warning: '#E88C2A',
  danger: '#CA4636',
  info: '#3A7FC0',

  // Neutrals
  black: '#000000',
  white: '#FFFFFF',
  overlay: 'rgba(42,30,18,0.55)', // warm dark scrim so modals read on a light app
  scrim: 'rgba(30,20,10,0.35)',
  transparent: 'transparent',
} as const;

export const colors = {
  // Backgrounds — warm ivory light shell
  bg: palette.ivory,
  bgDeep: palette.cream,
  surface: palette.ivoryLightest, // cards / logo letterbox — near-white warm
  surfaceRaised: palette.white,
  surfaceAlt: palette.cream,

  // Brand — premium gold primary + saffron accent
  primary: palette.gold,
  primaryDeep: palette.goldDeep,
  // Deep enough to read as accent TEXT on the light surfaces.
  primaryLight: '#B0801A',
  accent: palette.saffron,
  accentLight: palette.saffronLight,

  // Secondary controlled-blue accent
  secondary: palette.blue,
  secondaryLight: palette.blueLight,

  // Text — warm dark ink
  text: palette.ink,
  textMuted: palette.inkMuted,
  textInverse: palette.ivoryLightest, // light text for dark surfaces (wood board, colored buttons)
  textOnGold: palette.inkDarkest, // dark ink on gold buttons — crisp & premium

  // Lines / borders
  border: 'rgba(156,107,18,0.28)',
  borderStrong: palette.gold,
  divider: 'rgba(62,46,28,0.14)',

  // States
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  info: palette.info,

  // Misc
  overlay: palette.overlay,
  scrim: palette.scrim,
  transparent: 'transparent',
} as const;

export const gradients = {
  // App shell — light warm ivory.
  wood: ['#FEFBF3', '#FBF4E6', '#F3E7CE'] as [string, string, string],
  // Warm wood used by the illustrated mini-board (kept realistic).
  woodWarm: ['#4C301D', '#2A1810'] as [string, string],
  // Premium gold for primary CTAs.
  gold: ['#F6E4A0', '#E8C662', '#D4A32C'] as [string, string, string],
  goldSheen: ['#F6E4A0', '#E8C662'] as [string, string],
  // Elegant red for destructive CTAs.
  maroon: ['#CA4636', '#A83228', '#7E241C'] as [string, string, string],
  emblemGreen: ['#4FB81C', '#2E7D12'] as [string, string],
  // Splash — light warm, a gentle premium open.
  splash: ['#FFFDF8', '#FBF4E6', '#F3E7CE'] as [string, string, string],
  // Cards — bright warm panels.
  card: ['#FFFFFF', '#FFF7E7'] as [string, string],
  // Header / footer bands — soft ivory so the app is framed in warm light.
  header: ['rgba(255,250,240,0.98)', 'rgba(246,233,208,0.95)'] as [string, string],

  // ── Board materials (REALISTIC wood — deliberately kept dark & tactile) ──
  // Polished heirloom rosewood: warm lit edge falling into a deep oiled core.
  board: ['#6B4226', '#452A16', '#2B1A0E'] as [string, string, string],
  boardSheen: ['rgba(255,228,176,0.2)', 'transparent'] as [string, string],
  pit: ['rgba(0,0,0,0.60)', 'rgba(78,48,28,0.30)', 'rgba(120,74,42,0.34)'] as [
    string,
    string,
    string,
  ],
  // Saffron accent gradient.
  saffron: ['#F4B45C', '#E88C2A', '#C56A16'] as [string, string, string],
} as const;

export type ColorToken = keyof typeof colors;
export type GradientToken = keyof typeof gradients;
