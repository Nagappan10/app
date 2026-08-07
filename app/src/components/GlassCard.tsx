import { LinearGradient } from 'expo-linear-gradient';
import { memo, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { radius as radii, spacing, usePalette, withAlpha } from '@/theme';

/**
 * The soft-UI surface everything is built from.
 *
 * A neumorphic control is the same colour as its background — not a filled
 * box, but the ground itself pushed up or pressed in. All of its shape comes
 * from light, and real soft UI needs light from BOTH sides:
 *
 *     a white shadow cast up-and-left    (the lit face)
 *     a dark shadow cast down-and-right  (the side in shade)
 *
 * React Native allows only one shadow per view, so this stacks two: an outer
 * view carrying the dark shadow and an inner view carrying the light one. That
 * is what produces genuine extrusion rather than the flat outline an earlier
 * version settled for.
 *
 * Android cannot participate in that trick at all — `elevation` is its only
 * shadow, it is always dark, and it cannot be tinted or offset diagonally. So
 * Android gets the effect built from what it *can* render: a thicker two-tone
 * border (light on the top-left arc, dark on the bottom-right) over a diagonal
 * face gradient. Same read, no shadow machinery.
 *
 * `sunken` swaps the light and dark sides, which is what makes an input or a
 * track look pressed into the surface instead of standing out of it.
 */

export type GlassIntensity = 'light' | 'regular' | 'strong';

export interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  borderRadius?: number;
  intensity?: GlassIntensity;
  elevation?: 'sm' | 'md' | 'lg' | 'xl';
  tint?: string;
  animatedStyle?: StyleProp<ViewStyle>;
  /** Pressed into the surface rather than raised out of it. */
  sunken?: boolean;
}

const DEPTH: Record<NonNullable<GlassCardProps['elevation']>, { offset: number; blur: number }> = {
  sm: { offset: 3, blur: 6 },
  md: { offset: 6, blur: 12 },
  lg: { offset: 9, blur: 18 },
  xl: { offset: 12, blur: 24 },
};

const IS_IOS = Platform.OS === 'ios';

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
  const depth = DEPTH[elevation];

  const face = sunken
    ? palette.surfaceSunken
    : intensity === 'strong'
      ? palette.surfaceRaised
      : palette.surface;

  const lit = sunken ? palette.edgeDark : palette.edgeLight;
  const shaded = sunken ? palette.edgeLight : palette.edgeDark;

  const body = (
    <View
      style={[
        styles.clip,
        {
          borderRadius,
          backgroundColor: face,
          // Android carries the whole effect here, so its edges are thicker.
          borderWidth: IS_IOS ? 1 : 1.5,
          borderTopColor: lit,
          borderLeftColor: lit,
          borderBottomColor: shaded,
          borderRightColor: shaded,
        },
      ]}
    >
      {/* Curvature across the face: bright at the lit corner, falling away. */}
      <LinearGradient
        colors={[
          withAlpha('#FFFFFF', sunken ? 0 : isDark ? 0.06 : 0.75),
          'transparent',
          withAlpha('#000000', sunken ? (isDark ? 0.28 : 0.09) : isDark ? 0.16 : 0.06),
        ]}
        locations={[0, 0.48, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {tint ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha(tint, isDark ? 0.12 : 0.1) }]}
        />
      ) : null}

      <View style={{ padding }}>{children}</View>
    </View>
  );

  // Recessed surfaces cast no shadow — they sit below the ground, not above it.
  if (sunken || !IS_IOS) {
    return (
      <Animated.View style={[{ borderRadius }, animatedStyle, style]}>{body}</Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        {
          borderRadius,
          // Dark shadow, cast away from the light.
          shadowColor: palette.shadow,
          shadowOffset: { width: depth.offset, height: depth.offset },
          shadowRadius: depth.blur,
          shadowOpacity: isDark ? 0.55 : 0.22,
        },
        animatedStyle,
        style,
      ]}
    >
      <View
        style={{
          borderRadius,
          // Light shadow, thrown back toward the light source. The pair is
          // what makes the surface read as physically raised.
          shadowColor: palette.edgeLight,
          shadowOffset: { width: -depth.offset, height: -depth.offset },
          shadowRadius: depth.blur,
          shadowOpacity: isDark ? 0.28 : 0.95,
        }}
      >
        {body}
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
