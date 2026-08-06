import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { usePalette, withAlpha } from '@/theme';
import { timing } from '@/theme/motion';
import { MESH, staticLayerProps } from '@/theme/perf';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/**
 * The animated mesh that lives behind every glass surface.
 *
 * React Native has no CSS `filter: blur`, so the mesh is built the physical
 * way: oversized gradient blobs drifting on long, offset sine loops. On iOS a
 * single blur pass melts them into a continuous field, giving the frosted cards
 * something with real colour variation to refract.
 *
 * Android takes a cheaper route. It gets fewer blobs, wider and fainter
 * gradients, slower drift, and no blur pass at all — `expo-blur` would not
 * produce a genuine backdrop blur there anyway, so the pass was pure cost. Each
 * blob is rasterised into a GPU texture, so the drift is a transform on a
 * cached layer rather than a per-frame gradient re-rasterisation.
 *
 * This whole component is mounted once at the app root, not per screen, so the
 * gradient never restarts during navigation.
 */

interface BlobConfig {
  size: number;
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  duration: number;
  colorIndex: 0 | 1 | 2;
}

const ALL_BLOBS: BlobConfig[] = [
  {
    size: SCREEN_W * 1.15,
    x: -SCREEN_W * 0.3,
    y: -SCREEN_H * 0.08,
    driftX: 60,
    driftY: 50,
    duration: 11000,
    colorIndex: 0,
  },
  {
    size: SCREEN_W * 1.0,
    x: SCREEN_W * 0.42,
    y: SCREEN_H * 0.18,
    driftX: -70,
    driftY: 70,
    duration: 14000,
    colorIndex: 1,
  },
  {
    size: SCREEN_W * 0.9,
    x: -SCREEN_W * 0.1,
    y: SCREEN_H * 0.55,
    driftX: 80,
    driftY: -60,
    duration: 17000,
    colorIndex: 2,
  },
];

const BLOBS = ALL_BLOBS.slice(0, MESH.blobCount);

function Blob({ config, progress }: { config: BlobConfig; progress: SharedValue<number> }) {
  const palette = usePalette();
  const color = palette.mesh[config.colorIndex];

  // Resolved on the JS thread: worklets may not call imported helpers.
  const from = withAlpha(color, palette.scheme === 'dark' ? MESH.opacity : MESH.opacity * 0.9);
  const to = withAlpha(color, 0);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * config.driftX },
      { translateY: progress.value * config.driftY },
      { scale: 1 + progress.value * 0.12 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      {...staticLayerProps}
      style={[
        {
          position: 'absolute',
          left: config.x,
          top: config.y,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={[from, to]}
        start={{ x: 0.3, y: 0.1 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

function MeshBackgroundInner() {
  const palette = usePalette();

  // One driver per blob, each on its own period so they never line up and the
  // field never appears to pulse in unison.
  const p0 = useSharedValue(0);
  const p1 = useSharedValue(0);
  const p2 = useSharedValue(0);
  const drivers = [p0, p1, p2];

  useEffect(() => {
    BLOBS.forEach((blob, i) => {
      drivers[i]!.value = withRepeat(
        withTiming(1, { ...timing.ambient, duration: blob.duration * MESH.durationScale }),
        -1,
        true, // reverse, so the drift eases back rather than snapping home
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vignetteEdge = palette.scheme === 'dark' ? '#000000' : '#FFFFFF';

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: palette.background }]}
    >
      {BLOBS.map((blob, i) => (
        <Blob key={i} config={blob} progress={drivers[i]!} />
      ))}

      {/* Melts the blobs into one continuous field. iOS only — see theme/perf. */}
      {MESH.blurBlobs ? (
        <BlurView intensity={90} tint={palette.blurTint} style={StyleSheet.absoluteFill} />
      ) : null}

      {/* Vignette: darkens the extremes so hero type keeps its contrast. */}
      <LinearGradient
        colors={[withAlpha(vignetteEdge, 0.45), 'transparent', withAlpha(vignetteEdge, 0.55)]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

export const MeshBackground = memo(MeshBackgroundInner);
