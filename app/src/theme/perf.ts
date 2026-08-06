import { Platform } from 'react-native';

/**
 * Rendering budget, per platform.
 *
 * The first release felt laggy on Android, and the cause was structural rather
 * than any single slow function:
 *
 *  - Every `GlassCard` mounted its own `BlurView`. A screen with six cards paid
 *    for six blur passes plus their gradient overlays, on top of a full-screen
 *    blurred mesh that animated continuously behind them.
 *
 *  - On Android that cost bought nothing. `expo-blur` only performs a true
 *    backdrop blur there when `experimentalBlurMethod` is set; with the default
 *    it renders a flat translucent overlay. So Android was paying for a
 *    compositing pass and receiving a plain tinted rectangle.
 *
 * The fix is to stop pretending the platforms are equivalent: iOS keeps real
 * blur (UIVisualEffectView is GPU-cheap and genuinely refracts), while Android
 * gets slightly more opaque solid fills that reproduce the same *look* the
 * translucent overlay was already producing — minus the compositing work.
 */

export const IS_IOS = Platform.OS === 'ios';

/** Real backdrop blur is only worth its cost on iOS. */
export const USE_REAL_BLUR = IS_IOS;

/**
 * Android compensates for the missing blur with a denser fill, otherwise the
 * cards read as washed-out rectangles rather than frosted glass.
 */
export const FILL_BOOST = IS_IOS ? 0 : 0.06;

/** Mesh blobs. Fewer, slower and un-blurred on Android. */
export const MESH = {
  blobCount: IS_IOS ? 3 : 2,
  /** Full-screen blur pass over the blobs — iOS only. */
  blurBlobs: IS_IOS,
  /** Longer periods mean fewer recomposites per second. */
  durationScale: IS_IOS ? 1 : 1.6,
  /** Softer, wider gradients stand in for the missing blur. */
  opacity: IS_IOS ? 0.55 : 0.34,
} as const;

/**
 * Rasterising an animated layer lets the GPU cache it as a texture and merely
 * transform it, instead of re-rasterising the gradient every frame. Only
 * applied to layers that move but never change their content.
 */
export const staticLayerProps = IS_IOS
  ? { shouldRasterizeIOS: true as const }
  : { renderToHardwareTextureAndroid: true as const };
