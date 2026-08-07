import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { usePalette } from '@/theme';

/**
 * The app's ground.
 *
 * Deliberately flat. Soft UI depends on every surface being the *same* colour
 * as what sits behind it — relief comes only from how light catches an edge.
 * Any variation in the background breaks that illusion instantly: a card can
 * no longer be "the ground pushed upward" if the ground is a different colour
 * underneath it. The animated gradient mesh that used to live here belonged to
 * the glassmorphic design and actively worked against this one.
 *
 * It also happens to be the cheapest thing to render in the app: one view, no
 * gradients, no blur, no animation, nothing recomposited per frame. The
 * component is kept (rather than deleted) so the root layout and any other
 * caller keep working unchanged.
 */
function MeshBackgroundInner() {
  const palette = usePalette();

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: palette.background }]}
    />
  );
}

export const MeshBackground = memo(MeshBackgroundInner);
