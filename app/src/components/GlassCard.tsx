import { LinearGradient } from 'expo-linear-gradient';
import { memo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { radius as radii, shadow, spacing, usePalette, withAlpha } from '@/theme';

/**
 * The soft-UI surface everything is built from.
 *
 * A neumorphic control is the same colour as its background — it is not a
 * filled box, it is the ground itself pushed up or pressed in. The whole
 * effect therefore lives in the edges:
 *
 *     top + left   light   (facing the light source)
 *     bottom + right dark  (falling away from it)
 *
 * Invert that pair and the identical element reads as pressed into the
 * surface, which is how `sunken` renders inputs, tracks and unfilled cells.
 *
 * Why edges rather than shadows: real neumorphism uses two offset shadows, one
 * light and one dark. React Native allows a single shadow per view, and
 * Android's `elevation` shadow is always dark and cannot be tinted or offset
 * diagonally — so two-sided shadows are simply not available. Per-side border
 * colours give the eye the same cue, work identically on both platforms, and
 * cost nothing to composite. A faint diagonal gradient across the face adds
 * the curvature that sells it.
 *
 * The component keeps its original name and props so all existing callers
 * compile untouched; `Surface` is the preferred name for new code.
 */

export type GlassIntensity = 'light' | 'regular' | 'strong';

export interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  borderRadius?: number;
  intensity?: GlassIntensity;
  elevation?: 'sm' | 'md' | 'lg' | 'xl';
  /** Small accent wash — used sparingly, per the minimalist half of the brief. */
  tint?: string;
  animatedStyle?: StyleProp<ViewStyle>;
  /** Pressed into the surface rather than raised out of it. */
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

  const face = sunken
    ? palette.surfaceSunken
    : intensity === 'strong'
      ? palette.surfaceRaised
      : palette.surface;

  // Raised: lit from the top-left. Sunken: the lighting flips.
  const topLeft = sunken ? palette.edgeDark : palette.edgeLight;
  const bottomRight = sunken ? palette.edgeLight : palette.edgeDark;

  return (
    <Animated.View
      style={[sunken ? null : shadow(palette, elevation), { borderRadius }, animatedStyle, style]}
    >
      <View
        style={[
          styles.clip,
          {
            borderRadius,
            backgroundColor: face,
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderBottomWidth: 1,
            borderRightWidth: 1,
            borderTopColor: topLeft,
            borderLeftColor: topLeft,
            borderBottomColor: bottomRight,
            borderRightColor: bottomRight,
          },
        ]}
      >
        {/* Curvature: brighter at the top-left, falling away to the bottom-right. */}
        <LinearGradient
          colors={[
            withAlpha(isDark ? '#FFFFFF' : '#FFFFFF', sunken ? 0 : isDark ? 0.035 : 0.5),
            'transparent',
            withAlpha('#000000', sunken ? (isDark ? 0.18 : 0.05) : isDark ? 0.1 : 0.035),
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {tint ? (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: withAlpha(tint, isDark ? 0.1 : 0.09) },
            ]}
          />
        ) : null}

        <View style={{ padding }}>{children}</View>
      </View>
    </Animated.View>
  );
}

export const GlassCard = memo(GlassCardInner);

/** Preferred name for new code. */
export const Surface = GlassCard;

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
});
