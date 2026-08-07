import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { PressableScale } from './PressableScale';
import { haptics } from '@/services/haptics';
import { useSettingsStore } from '@/store/useSettingsStore';
import { radius, useTheme } from '@/theme';
import { spring, timing } from '@/theme/motion';

/**
 * Sun / moon toggle, styled as a physical switch.
 *
 * A soft-UI toggle is a recessed track with a raised knob sliding inside it —
 * the track is pressed into the surface (dark edge on top), the knob is
 * extruded out of it (light edge on top). That opposition is what makes the
 * two parts read as separate objects rather than as one flat pill.
 *
 * Tapping sets an explicit light or dark preference. The store still supports
 * following the system, which stays available in Settings; this control is for
 * the moment you just want to flip it.
 */
export function ThemeToggle() {
  const { palette, isDark } = useTheme();
  const setThemePreference = useSettingsStore((s) => s.setThemePreference);

  const position = useSharedValue(isDark ? 1 : 0);

  useEffect(() => {
    position.value = withSpring(isDark ? 1 : 0, spring.standard);
  }, [isDark, position]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value * 26 }],
  }));

  const sunStyle = useAnimatedStyle(() => ({ opacity: withTiming(isDark ? 0.32 : 1, timing.fast) }));
  const moonStyle = useAnimatedStyle(() => ({ opacity: withTiming(isDark ? 1 : 0.32, timing.fast) }));

  return (
    <PressableScale
      haptic="tap"
      hitSlop={10}
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onPress={() => {
        haptics.tick();
        setThemePreference(isDark ? 'light' : 'dark');
      }}
    >
      {/* Recessed track. */}
      <View
        style={[
          styles.track,
          {
            backgroundColor: palette.surfaceSunken,
            borderTopColor: palette.edgeDark,
            borderLeftColor: palette.edgeDark,
            borderBottomColor: palette.edgeLight,
            borderRightColor: palette.edgeLight,
          },
        ]}
      >
        <View style={styles.icons} pointerEvents="none">
          <Animated.View style={sunStyle}>
            <Ionicons name="sunny" size={13} color={palette.warning} />
          </Animated.View>
          <Animated.View style={moonStyle}>
            <Ionicons name="moon" size={12} color={palette.textSecondary} />
          </Animated.View>
        </View>

        {/* Raised knob. */}
        <Animated.View
          style={[
            styles.knob,
            {
              backgroundColor: palette.surfaceRaised,
              borderTopColor: palette.edgeLight,
              borderLeftColor: palette.edgeLight,
              borderBottomColor: palette.edgeDark,
              borderRightColor: palette.edgeDark,
            },
            knobStyle,
          ]}
        />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 56,
    height: 30,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
  icons: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 7,
  },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 2,
  },
});
