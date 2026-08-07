/**
 * Colour system — "soft slate".
 *
 * Neumorphism crossed with editorial minimalism, per the reference images.
 * Two ideas drive every value here:
 *
 *   1. A control is the SAME colour as the surface it sits on. Nothing is
 *      filled or outlined; shape comes purely from how light catches its
 *      edges. That is what makes the calculator keys in the reference read as
 *      physically extruded rather than drawn.
 *
 *   2. Colour is almost absent. The interface is a near-monochrome slate, and
 *      saturation is spent only on the few things that carry meaning — the
 *      active toggle, the progress arc, a completed day. Restraint is the
 *      minimalist half of the brief.
 *
 * `edgeLight` and `edgeDark` drive everything. Soft UI needs light from two
 * sides — a white glow up-and-left, a dark one down-and-right. React Native
 * allows one shadow per view, so iOS stacks two views to cast both. Android's
 * `elevation` is its only shadow and is always dark, so there the same read is
 * built from a thicker two-tone border over a diagonal face gradient.
 *
 * The gap between these two values IS the sense of depth: too narrow and every
 * surface looks flat and printed on. They are deliberately far apart.
 */

export interface Palette {
  scheme: 'dark' | 'light';

  background: string;
  backgroundElevated: string;

  /** Surfaces match the ground; relief comes from the edges alone. */
  surface: string;
  surfaceRaised: string;
  /** Pressed or recessed: wells, inputs, unfilled tracks. */
  surfaceSunken: string;

  /** Top-left edge — catching the light. */
  edgeLight: string;
  /** Bottom-right edge — in shade. */
  edgeDark: string;

  /** Retained so existing components keep compiling. */
  bevelLight: string;
  bevelDark: string;
  border: string;
  glass: string;
  glassStrong: string;
  glassHighlight: string;
  glassBorder: string;

  text: string;
  textSecondary: string;
  textTertiary: string;

  separator: string;

  walkFrom: string;
  walkTo: string;
  practiceFrom: string;
  practiceTo: string;

  success: string;
  danger: string;
  warning: string;
  flame: string;

  mesh: [string, string, string];

  blurTint: 'dark' | 'light';
  shadow: string;
}

/* The small saturated pops. Identical in both themes so the accent never
   shifts identity when the user flips the toggle. */
const ACCENT = {
  amber: '#FF9F43',
  ember: '#F76B3C',
  mint: '#26D07C',
  jade: '#12A67B',
  sky: '#4A90E2',
  rose: '#FF5C5C',
} as const;

export const lightPalette: Palette = {
  scheme: 'light',

  // The classic soft-UI ground: light, very slightly cool, never pure white —
  // pure white leaves no room for a lighter edge to read against.
  background: '#E4E8EF',
  backgroundElevated: '#E4E8EF',

  surface: '#E4E8EF',
  surfaceRaised: '#EAEDF3',
  surfaceSunken: '#D6DAE3',

  edgeLight: '#FFFFFF',
  edgeDark: '#A9B2C4',

  bevelLight: '#FFFFFF',
  bevelDark: '#A9B2C4',
  border: 'rgba(120,130,150,0.16)',
  glass: '#E4E8EF',
  glassStrong: '#EAEDF3',
  glassHighlight: '#FFFFFF',
  glassBorder: 'rgba(120,130,150,0.16)',

  text: '#23262D',
  textSecondary: 'rgba(35,38,45,0.58)',
  textTertiary: 'rgba(35,38,45,0.34)',

  separator: 'rgba(120,130,150,0.18)',

  walkFrom: ACCENT.amber,
  walkTo: ACCENT.ember,
  practiceFrom: ACCENT.mint,
  practiceTo: ACCENT.jade,

  success: ACCENT.mint,
  danger: ACCENT.rose,
  warning: ACCENT.amber,
  flame: ACCENT.ember,

  mesh: ['#E4E8EF', '#E4E8EF', '#E4E8EF'],

  blurTint: 'light',
  shadow: '#8C97AD',
};

export const darkPalette: Palette = {
  scheme: 'dark',

  // Dark soft-UI needs a slate, not black: an unlit edge has to be darker than
  // the surface, and nothing is darker than black.
  background: '#262931',
  backgroundElevated: '#262931',

  surface: '#262931',
  surfaceRaised: '#2D313A',
  surfaceSunken: '#1B1D23',

  edgeLight: '#3C414D',
  edgeDark: '#101216',

  bevelLight: '#3C414D',
  bevelDark: '#101216',
  border: 'rgba(255,255,255,0.06)',
  glass: '#262931',
  glassStrong: '#2D313A',
  glassHighlight: '#33363F',
  glassBorder: 'rgba(255,255,255,0.06)',

  text: '#EDEFF3',
  textSecondary: 'rgba(237,239,243,0.60)',
  textTertiary: 'rgba(237,239,243,0.34)',

  separator: 'rgba(255,255,255,0.07)',

  walkFrom: ACCENT.amber,
  walkTo: ACCENT.ember,
  practiceFrom: ACCENT.mint,
  practiceTo: ACCENT.jade,

  success: ACCENT.mint,
  danger: ACCENT.rose,
  warning: ACCENT.amber,
  flame: ACCENT.ember,

  mesh: ['#262931', '#262931', '#262931'],

  blurTint: 'dark',
  shadow: '#000000',
};

export type AccentKey = 'walk' | 'practice';

export function accentGradient(palette: Palette, accent: AccentKey): [string, string] {
  return accent === 'walk'
    ? [palette.walkFrom, palette.walkTo]
    : [palette.practiceFrom, palette.practiceTo];
}

/** Adds an alpha channel to a `#RRGGBB` string. */
export function withAlpha(hex: string, alpha: number): string {
  if (hex.startsWith('rgba')) return hex;
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Activity swatches — the small pops of colour the reference allows. */
export const ACTIVITY_COLORS = [
  ACCENT.amber,
  ACCENT.ember,
  ACCENT.mint,
  ACCENT.jade,
  ACCENT.sky,
  ACCENT.rose,
  '#8E7CF0',
  '#F072B6',
  '#5BC8D8',
  '#8C93A8',
] as const;
