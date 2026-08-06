import { useEffect } from 'react';
import { StyleSheet, Text, TextInput, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
  type WithSpringConfig,
} from 'react-native-reanimated';
import { spring } from '@/theme/motion';
import { usePalette } from '@/theme';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

/**
 * Worklet-safe number formatting.
 *
 * `Number.prototype.toLocaleString` is not available on the UI thread, so
 * thousands separators are inserted by hand. Doing this in a worklet is what
 * lets an animated counter update per-frame without a JS round trip.
 */
function formatWorklet(value: number, decimals: number, separator: boolean): string {
  'worklet';
  const fixed = Math.abs(value).toFixed(decimals);
  const [intPart = '0', fracPart] = fixed.split('.');

  let withSeparators = intPart;
  if (separator && intPart.length > 3) {
    withSeparators = '';
    for (let i = 0; i < intPart.length; i += 1) {
      const fromEnd = intPart.length - i;
      withSeparators += intPart[i];
      if (fromEnd > 1 && fromEnd % 3 === 1) withSeparators += ',';
    }
  }

  const sign = value < 0 ? '-' : '';
  return fracPart ? `${sign}${withSeparators}.${fracPart}` : `${sign}${withSeparators}`;
}

/** Same output as the worklet, for the plain-text path. */
function formatPlain(value: number, decimals: number, separator: boolean): string {
  const fixed = Math.abs(value).toFixed(decimals);
  const [intPart = '0', fracPart] = fixed.split('.');
  const grouped = separator ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : intPart;
  const sign = value < 0 ? '-' : '';
  return fracPart ? `${sign}${grouped}.${fracPart}` : `${sign}${grouped}`;
}

export interface AnimatedNumberProps {
  value: number;
  style?: StyleProp<TextStyle>;
  decimals?: number;
  separator?: boolean;
  prefix?: string;
  suffix?: string;
  config?: WithSpringConfig;
  color?: string;
  /**
   * Spring the value on every change. Off by default.
   *
   * The animated path renders an uneditable `TextInput`, because only its
   * `text` prop can be driven from `useAnimatedProps` without a React render
   * per frame. That is the right trade for a counter that ticks several times
   * a second — and the wrong one everywhere else: `TextInput` is a heavyweight
   * native view (input connection, IME hooks, spans), and an earlier build
   * mounted three dozen of them purely to display static stat values, which
   * cost real frames while scrolling. Static numbers now render as plain
   * `Text`, and only genuinely live figures opt in.
   */
  animate?: boolean;
}

export function AnimatedNumber({
  value,
  style,
  decimals = 0,
  separator = true,
  prefix = '',
  suffix = '',
  config = spring.gentle,
  color,
  animate = false,
}: AnimatedNumberProps) {
  const palette = usePalette();
  const resolved = color ?? palette.text;

  if (!animate) {
    return (
      <Text style={[styles.text, { color: resolved }, style]} numberOfLines={1}>
        {`${prefix}${formatPlain(value, decimals, separator)}${suffix}`}
      </Text>
    );
  }

  return (
    <SpringNumber
      value={value}
      style={style}
      decimals={decimals}
      separator={separator}
      prefix={prefix}
      suffix={suffix}
      config={config}
      color={resolved}
    />
  );
}

/**
 * Split into its own component so the hooks below only ever run on the
 * animated path — calling them conditionally in `AnimatedNumber` would break
 * the rules of hooks.
 */
interface SpringNumberProps {
  value: number;
  style?: StyleProp<TextStyle>;
  decimals: number;
  separator: boolean;
  prefix: string;
  suffix: string;
  config: WithSpringConfig;
  color: string;
}

function SpringNumber({
  value,
  style,
  decimals,
  separator,
  prefix,
  suffix,
  config,
  color,
}: SpringNumberProps) {
  const animated = useSharedValue(value);

  useEffect(() => {
    animated.value = withSpring(value, config);
  }, [animated, value, config]);

  const animatedProps = useAnimatedProps(() => {
    const text = `${prefix}${formatWorklet(animated.value, decimals, separator)}${suffix}`;
    return { text, defaultValue: text };
  });

  return (
    <AnimatedTextInput
      editable={false}
      accessibilityRole="text"
      accessibilityLabel={`${prefix}${value.toFixed(decimals)}${suffix}`}
      underlineColorAndroid="transparent"
      style={[styles.input, { color }, style]}
      animatedProps={animatedProps}
    />
  );
}

const styles = StyleSheet.create({
  text: {
    includeFontPadding: false,
  },
  input: {
    padding: 0,
    margin: 0,
    // TextInput reserves vertical space for a cursor on Android; strip it so
    // the number sits on the same baseline as neighbouring <Text>.
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
