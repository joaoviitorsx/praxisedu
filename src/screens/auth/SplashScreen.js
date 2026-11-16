import { useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, FadeInUp, ZoomIn, Easing,
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, cancelAnimation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Icon, Logo } from '../../components';
import { colors, fonts, radius, spacing } from '../../theme';
import useReducedMotion from '../../hooks/useReducedMotion';

const heroMascots = require('../../../assets/mascotes/turma-hero.png');
const MASCOTS_RATIO = 900 / 470;
const SHEET_OVERLAP = 28;

// floating bubbles (position in % of the hero, size in px)
const BUBBLES = [
  { left: '8%', top: '15%', size: 26, color: '#FF9F50', delay: 0 },
  { left: '82%', top: '8%', size: 16, color: colors.yellow, delay: 500 },
  { left: '90%', top: '36%', size: 18, color: 'rgba(200,160,255,0.75)', delay: 1100 },
];

function useLoop(reduceMotion, to, duration, delay = 0) {
  const v = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) { cancelAnimation(v); v.value = 0; return undefined; }
    const t = setTimeout(() => {
      v.value = withRepeat(withSequence(
        withTiming(to, { duration, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.quad) })
      ), -1);
    }, delay);
    return () => { clearTimeout(t); cancelAnimation(v); };
  }, [v, reduceMotion, to, duration, delay]);
  return v;
}

function Bubble({ left, top, size, color, delay, reduceMotion }) {
  const y = useLoop(reduceMotion, -10, 2400, delay);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left, top, width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]}
    />
  );
}

export default function SplashScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const compact = height < 720; // iPhone SE and similar
  const enter = (anim) => (reduceMotion ? undefined : anim);

  const float = useLoop(reduceMotion, -6, 2000);
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));
  const breathe = useLoop(reduceMotion, 0.02, 1800, 300);
  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -breathe.value * 150 }, { scale: 1 + breathe.value }],
  }));

  const mascotsWidth = Math.min(width, 600);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.hero}>
        <LinearGradient
          colors={['#9933FB', '#7E26E4', '#6E1FD0']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={styles.corner} />
        {BUBBLES.map((b, i) => <Bubble key={i} {...b} reduceMotion={reduceMotion} />)}

        <View style={[styles.brand, { paddingTop: insets.top + (compact ? 8 : 24) }]}>
          <Animated.View entering={enter(ZoomIn.springify().damping(14).delay(100))} style={floatStyle}>
            <View style={styles.logoRing}>
              <Logo variant="symbol" tone="white" size={compact ? 96 : 124} />
            </View>
          </Animated.View>
          <Animated.View entering={enter(FadeInDown.delay(300).duration(500))} style={styles.wordmark}>
            <Text style={[styles.name, compact && styles.nameCompact]}>PRÁXIS</Text>
            <Text style={[styles.name, compact && styles.nameCompact, { color: colors.yellow }]}>EDU</Text>
          </Animated.View>
          <Animated.Text entering={enter(FadeInDown.delay(420).duration(500))} style={[styles.headline, compact && styles.headlineCompact]}>
            Aprender nunca foi tão divertido
          </Animated.Text>
        </View>

        <Animated.View entering={enter(FadeInUp.delay(600).duration(700))} style={styles.mascots}>
          <Animated.View style={breatheStyle}>
            <Image
              source={heroMascots}
              style={{ width: mascotsWidth, height: mascotsWidth / MASCOTS_RATIO }}
              contentFit="cover" cachePolicy="memory-disk" priority="high"
              accessibilityLabel="Turma de mascotes do Práxis Edu"
            />
          </Animated.View>
        </Animated.View>
      </View>

      <Animated.View
        entering={enter(FadeInUp.delay(800).duration(450))}
        style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm }]}
      >
        <View style={styles.pill}>
          <Icon name="leaf" size={20} color={colors.green} />
          <Text style={styles.pillText}>Biologia no Ensino Médio</Text>
        </View>
        <View style={styles.buttons}>
          <Button title="Entrar" onPress={() => navigation.navigate('Login')} />
          <Button title="Criar conta" variant="secondary" onPress={() => navigation.navigate('Signup')} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F6F2FF' },
  hero: { flex: 1, overflow: 'hidden', justifyContent: 'space-between' },
  corner: {
    position: 'absolute', right: -110, top: -110, width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  brand: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.screen },
  logoRing: { padding: 12, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.16)' },
  wordmark: { flexDirection: 'row', gap: 12, marginTop: spacing.sm },
  name: { fontFamily: fonts.extrabold, fontSize: 44, letterSpacing: 0.5, color: colors.white },
  nameCompact: { fontSize: 36 },
  headline: { fontFamily: fonts.semibold, fontSize: 19, color: '#F1E8FF', textAlign: 'center' },
  headlineCompact: { fontSize: 16 },
  mascots: { alignItems: 'center', marginBottom: SHEET_OVERLAP - 6 },
  sheet: {
    marginTop: -SHEET_OVERLAP, backgroundColor: '#F6F2FF',
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingTop: spacing.xl, paddingHorizontal: spacing.screen, gap: spacing.lg, alignItems: 'center',
    shadowColor: '#4B1A9E', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: -6 }, elevation: 10,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 10, paddingHorizontal: 22,
    borderRadius: radius.pill, backgroundColor: colors.white,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.14)',
    shadowColor: '#4B1A9E', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  pillText: { fontFamily: fonts.bold, fontSize: 16, color: '#2E1065' },
  buttons: { width: '100%', gap: spacing.md },
});
