import Animated, { FadeInDown, FadeInUp, FadeIn as FadeOnly } from 'react-native-reanimated';

// Wrapper that animates its content when it appears.
// from: "bottom" (default, slides up) | "top" | "none" (only fades). delay in ms (use index * 60 for lists).
export default function FadeIn({ children, delay = 0, from = 'bottom', style }) {
  const base = from === 'top' ? FadeInUp : from === 'none' ? FadeOnly : FadeInDown;
  const entering = base.delay(delay).duration(380);
  return <Animated.View entering={entering} style={style}>{children}</Animated.View>;
}
