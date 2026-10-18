import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { colors, fonts } from '../theme';
import useReducedMotion from '../hooks/useReducedMotion';
import Logo from './Logo';

export default function LoadingView({ message, compact = false }) {
  const reduceMotion = useReducedMotion();
  const rotation = useSharedValue(0);
  const breathing = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(rotation);
      cancelAnimation(breathing);
      rotation.value = 0;
      breathing.value = 1;
      return undefined;
    }

    rotation.value = withRepeat(withTiming(360, {
      duration: 1700,
      easing: Easing.linear,
      reduceMotion: ReduceMotion.System,
    }), -1, false, undefined, ReduceMotion.System);
    breathing.value = withRepeat(withSequence(
      withTiming(1.035, { duration: 850, easing: Easing.inOut(Easing.quad), reduceMotion: ReduceMotion.System }),
      withTiming(1, { duration: 850, easing: Easing.inOut(Easing.quad), reduceMotion: ReduceMotion.System }),
    ), -1, false, undefined, ReduceMotion.System);

    return () => { cancelAnimation(rotation); cancelAnimation(breathing); };
  }, [reduceMotion, rotation, breathing]);

  const orbitStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  const breathStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathing.value }] }));
  const markSize = compact ? 76 : 108;
  const orbitSize = compact ? 72 : 100;
  const dotSize = compact ? 10 : 12;

  return (
    <View style={[styles.box, compact && styles.compact]} accessible accessibilityRole="progressbar" accessibilityLabel={message || 'Carregando'}>
      <View style={[styles.mark, { width: markSize, height: markSize }]}>
        <Animated.View style={breathStyle}>
          <Logo variant="symbol" size={compact ? 56 : 78} showElectron={reduceMotion} />
        </Animated.View>
        {!reduceMotion && <Animated.View style={[styles.orbit, { width: orbitSize, height: orbitSize, top: (markSize - orbitSize) / 2, left: (markSize - orbitSize) / 2 }, orbitStyle]}>
          <View style={[styles.electron, { width: dotSize, height: dotSize, top: -dotSize / 2, left: (orbitSize - dotSize) / 2 }]} />
        </Animated.View>}
      </View>
      {message ? <Text style={[styles.message, compact && styles.compactMessage]}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  compact: { flex: 0, minHeight: 112, gap: 8, paddingVertical: 12, paddingHorizontal: 16 },
  mark: { alignItems: 'center', justifyContent: 'center' },
  orbit: { position: 'absolute', borderWidth: 2, borderColor: colors.purpleSoft, borderRadius: 999 },
  electron: { position: 'absolute', borderRadius: 999, backgroundColor: colors.yellow, borderWidth: 2, borderColor: colors.purpleDark },
  message: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.gray, textAlign: 'center' },
  compactMessage: { fontSize: 13, lineHeight: 18 },
});
