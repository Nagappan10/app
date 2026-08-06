import { LinearGradient } from 'expo-linear-gradient';
import { memo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { radius as radii, shadow, spacing, usePalette, withAlpha } from '@/theme';

/**
 * The raised surface the whole app is built from.
 *
 * Skeuomorphic where it counts, minimal everywhere else. Depth comes from how
 * light actually falls on a raised object rather than from ornament:
 *
 *   1. a very slight vertical gradient — the sheen across a physical face
 *   2. a 1px light hairline along the TOP edge — the lit bevel
 *   3. a 1px dark hairline along the BOTTOM edge — the shaded underside
 *   4. a hairline border holding the silhouette
 *
 * Those two opposing hairlines are the entire trick. Relief reads as relief
 * because the eye expects light from above, so a bright top edge and a dark
 * bottom edge is enough — no drop shadows, no blur, no bevel textures.
 *
 * It is also dramatically cheaper than the frosted-glass version this replaces.
 * That build mounted a BlurView per card plus several full-bleed overlays;
 * with dozens of cards on a screen, Android spent its frame budget compositing
 * blur passes that it was not even rendering as blur. Here a card is a handful
 * of plain views and one small gradient, so the same visual weight costs a
 * fraction of the work — which is why the redesign and the smoothness fix are
 * the same change.
 *
 * The component keeps its original name and props so every existing caller
 * compiles untouched.
 */

export type GlassIntensity = 'light' | 'regular' | 'strong';

export interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Inner padding. Pass 0 for edge-to-edge content such as charts. */
  padding?: number;
  borderRadius?: number;
  intensity?: GlassIntensity;
  elevation?: 'sm' | 'md' | 'lg' | 'xl';
  /** Tints the whole surface toward an accent — used for active states. */
  tint?: string;
  animatedStyle?: StyleProp<ViewStyle>;
  /** Recessed rather than raised: bevels invert, as for a well or a track. */
  sunken?: boolean;
}

function GlassCardInner({
  children,
  style,
  padding = spacing.base,
  borderRadius = radii.card,
  intensity = 'regular',
  elevation = 'md',
  tint,
  animatedStyle,
  sunken = false,
}: GlassCardProps) {
  const palette = usePalette();
  const isDark = palette.scheme === 'dark';

  const fill =
    intensity === 'strong'
      ? palette.surfaceRaised
      : intensity === 'light'
        ? palette.surface
        : palette.surface;

  // Sunken surfaces are lit from the opposite side: dark along the top lip,
  // light along the bottom, which is what a recess looks like.
  const topBevel = sunken ? palette.bevelDark : palette.bevelLight;
  const bottomBevel = sunken ? palette.bevelLight : palette.bevelDark;

  return (
    <Animated.View style={[shadow(palette, elevation), { borderRadius }, animatedStyle, style]}>
      <View
        style={[
          styles.clip,
          {
            borderRadius,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: palette.border,
            backgroundColor: sunken ? palette.surfaceSunken : palette.backgroundElevated,
          },
        ]}
      >
        {/* Material sheen: brighter at the top, as if lit from above. */}
        <LinearGradient
          colors={[
            withAlpha('#FFFFFF', isDark ? 0.055 : 0.6),
            withAlpha('#FFFFFF', 0),
            withAlpha('#000000', isDark ? 0.1 : 0.03),
          ]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Body fill. */}
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: fill }]}
          pointerEvents="none"
        />

        {/* Accent wash for selected/active surfaces. */}
        {tint ? (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha(tint, isDark ? 0.12 : 0.1) }]}
          />
        ) : null}

        {/* The bevel pair. Two hairlines, and the whole effect rests on them. */}
        <View pointerEvents="none" style={[styles.bevelTop, { backgroundColor: topBevel }]} />
        <View pointerEvents="none" style={[styles.bevelBottom, { backgroundColor: bottomBevel }]} />

        <View style={{ padding }}>{children}</View>
      </View>
    </Animated.View>
  );
}

export const GlassCard = memo(GlassCardInner);

/** Explicit alias — new code should prefer this name. */
export const Surface = GlassCard;

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  bevelTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth * 2,
  },
  bevelBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth * 2,
  },
});
