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
 * `edgeLight` and `edgeDark` are the whole mechanism. React Native allows only
 * one shadow per view and Android's elevation shadow is always dark, so true
 * two-sided neumorphic shadows are impossible with shadows alone. Instead each
 * surface takes a light border along its top and left and a dark one along its
 * bottom and right — the same cue the eye reads, at a fraction of the cost.
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
  background: '#E9EBEF',
  backgroundElevated: '#E9EBEF',

  surface: '#E9EBEF',
  surfaceRaised: '#EDEFF3',
  surfaceSunken: '#DFE2E8',

  edgeLight: '#FFFFFF',
  edgeDark: '#C2C7D2',

  bevelLight: '#FFFFFF',
  bevelDark: '#C2C7D2',
  border: 'rgba(120,130,150,0.16)',
  glass: '#E9EBEF',
  glassStrong: '#EDEFF3',
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

  mesh: ['#E9EBEF', '#E9EBEF', '#E9EBEF'],

  blurTint: 'light',
  shadow: '#9AA2B4',
};

export const darkPalette: Palette = {
  scheme: 'dark',

  // Dark soft-UI needs a slate, not black: an unlit edge has to be darker than
  // the surface, and nothing is darker than black.
  background: '#24262C',
  backgroundElevated: '#24262C',

  surface: '#24262C',
  surfaceRaised: '#292C33',
  surfaceSunken: '#1D1F24',

  edgeLight: '#33363F',
  edgeDark: '#15171B',

  bevelLight: '#33363F',
  bevelDark: '#15171B',
  border: 'rgba(255,255,255,0.06)',
  glass: '#24262C',
  glassStrong: '#292C33',
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

  mesh: ['#24262C', '#24262C', '#24262C'],

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
