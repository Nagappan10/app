/**
 * Colour system — "warm metal".
 *
 * Deliberately not the cyan/violet palette every fitness app ships. The ground
 * is a warm near-black (a trace of red and yellow rather than the usual blue
 * cast), which makes the two accents read as materials rather than as UI
 * colours: aged copper for walking, oxidised jade for practice. Warm metal is
 * also what makes the skeuomorphic bevels convincing — a bevel catching light
 * needs a surface that could plausibly be metal or stone.
 *
 * The bevel tokens below are the whole basis of the tactile look: every raised
 * surface gets a light hairline along its top edge and a dark one along its
 * bottom, which is how physical relief reads. Pressed states swap them.
 */

export interface Palette {
  scheme: 'dark' | 'light';

  background: string;
  backgroundElevated: string;

  /** Body fill of a raised surface. */
  surface: string;
  surfaceRaised: string;
  /** Recessed wells: inputs, tracks, unfilled cells. */
  surfaceSunken: string;

  /** Top bevel — the lit edge of a raised surface. */
  bevelLight: string;
  /** Bottom bevel — the shaded edge. */
  bevelDark: string;
  /** Hairline that holds a shape without a harsh outline. */
  border: string;

  /** Legacy glass tokens, retained so existing components keep compiling. */
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

  /** Ambient background wash. */
  mesh: [string, string, string];

  blurTint: 'dark' | 'light';
  shadow: string;
}

export const darkPalette: Palette = {
  scheme: 'dark',

  background: '#131110',
  backgroundElevated: '#1C1917',

  surface: 'rgba(255,247,237,0.055)',
  surfaceRaised: 'rgba(255,247,237,0.085)',
  surfaceSunken: 'rgba(0,0,0,0.28)',

  bevelLight: 'rgba(255,240,220,0.16)',
  bevelDark: 'rgba(0,0,0,0.55)',
  border: 'rgba(255,240,220,0.09)',

  glass: 'rgba(255,247,237,0.055)',
  glassStrong: 'rgba(255,247,237,0.09)',
  glassHighlight: 'rgba(255,240,220,0.16)',
  glassBorder: 'rgba(255,240,220,0.09)',

  text: '#F7F2EA',
  textSecondary: 'rgba(247,242,234,0.62)',
  textTertiary: 'rgba(247,242,234,0.34)',

  separator: 'rgba(255,240,220,0.08)',

  // Copper — walking.
  walkFrom: '#F0B357',
  walkTo: '#C4632E',
  // Jade — practice.
  practiceFrom: '#5CC4AA',
  practiceTo: '#2C7F6D',

  success: '#5FBF87',
  danger: '#E2594C',
  warning: '#E9A23B',
  flame: '#E07A3F',

  mesh: ['#7A3F1E', '#1F5C50', '#3C2A16'],

  blurTint: 'dark',
  shadow: '#000000',
};

export const lightPalette: Palette = {
  scheme: 'light',

  background: '#F2EBE0',
  backgroundElevated: '#FDFAF5',

  surface: 'rgba(255,255,255,0.78)',
  surfaceRaised: 'rgba(255,255,255,0.95)',
  surfaceSunken: 'rgba(90,70,50,0.08)',

  bevelLight: 'rgba(255,255,255,0.95)',
  bevelDark: 'rgba(90,66,40,0.16)',
  border: 'rgba(90,66,40,0.14)',

  glass: 'rgba(255,255,255,0.78)',
  glassStrong: 'rgba(255,255,255,0.95)',
  glassHighlight: 'rgba(255,255,255,0.95)',
  glassBorder: 'rgba(90,66,40,0.14)',

  text: '#1B1611',
  textSecondary: 'rgba(27,22,17,0.62)',
  textTertiary: 'rgba(27,22,17,0.36)',

  separator: 'rgba(90,66,40,0.14)',

  walkFrom: '#D98A2B',
  walkTo: '#A84E22',
  practiceFrom: '#3FA890',
  practiceTo: '#226B5A',

  success: '#2E9E5B',
  danger: '#C8412F',
  warning: '#C97F1E',
  flame: '#C4622C',

  mesh: ['#E8C9A0', '#A8D6C9', '#EBD9BE'],

  blurTint: 'light',
  shadow: '#4A3520',
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

/** Preset swatches offered when creating a practice activity. */
export const ACTIVITY_COLORS = [
  '#5CC4AA',
  '#F0B357',
  '#C4632E',
  '#D97757',
  '#E0B44A',
  '#7FB069',
  '#4A9CB5',
  '#8C7AE6',
  '#D96A9A',
  '#A8886B',
] as const;
