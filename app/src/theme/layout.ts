import type { ViewStyle } from 'react-native';
import type { Palette } from './colors';

/** 4pt base grid. Everything in the app snaps to these. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 44,
  screen: 20,
} as const;

/** Generous corner radii — 24-28pt on cards is the whole aesthetic. */
export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  card: 26,
  xl: 32,
  pill: 999,
} as const;

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

/**
 * Depth comes from *layered* shadows rather than one heavy drop shadow: a
 * tight contact shadow for the edge, plus a wide ambient one for lift. iOS
 * renders both; Android collapses them to `elevation`, so we pick the level
 * that best matches the ambient layer.
 */
export function shadow(palette: Palette, level: 'sm' | 'md' | 'lg' | 'xl'): ViewStyle {
  const isDark = palette.scheme === 'dark';

  // Soft-UI shadows are wide, faint and offset down-right, complementing the
  // light top-left border rather than competing with it. They are a supporting
  // cue here: the per-side edges do the real work, so these stay subtle.
  const opacity = { sm: 0.10, md: 0.16, lg: 0.22, xl: 0.28 }[level];
  const radiusFor = { sm: 6, md: 12, lg: 20, xl: 28 }[level];
  const offset = { sm: 2, md: 4, lg: 8, xl: 12 }[level];

  // Android renders `elevation` as a per-view shadow pass, costly on rounded
  // clipped surfaces and applied dozens of times per screen. Kept minimal.
  const elevation = { sm: 0, md: 1, lg: 2, xl: 4 }[level];

  return {
    shadowColor: palette.shadow,
    shadowOpacity: isDark ? opacity * 1.5 : opacity,
    shadowRadius: radiusFor,
    shadowOffset: { width: offset * 0.5, height: offset },
    elevation,
  };
}

/** Tab bar geometry, shared by the bar itself and every screen's bottom pad. */
export const TAB_BAR_HEIGHT = 64;
export const TAB_BAR_MARGIN = 16;
export const SCROLL_BOTTOM_PAD = TAB_BAR_HEIGHT + TAB_BAR_MARGIN + 28;
