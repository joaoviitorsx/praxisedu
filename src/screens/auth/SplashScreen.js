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
import { classMascotsImage } from '../../constants/mascotImages';
import useReducedMotion from '../../hooks/useReducedMotion';

const MASCOTS_RATIO = 808 / 242; // turma.png
const SHEET_OVERLAP = 24;

// soft floating bubbles (position in % of the hero, size in px)
const BUBBLES = [
  { left: '10%', top: '30%', size: 22, color: 'rgba(255,170,90,0.85)', delay: 0 },
  { left: '84%', top: '12%', size: 16, color: colors.yellow, delay: 600 },
  { left: '86%', top: '46%', size: 14, color: 'rgba(255,255,255,0.35)', delay: 1200 },
  { left: '6%', top: '58%', size: 10, color: 'rgba(255,255,255,0.3)', delay: 900 },
];

function Bubble({ left, top, size, color, delay, reduceMotion }) {
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return undefined;
    const t = setTimeout(() => {
      y.value = withRepeat(withSequence(
        withTiming(-10, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.quad) })
      ), -1);
    }, delay);
    return () => { clearTimeout(t); cancelAnimation(y); };
  }, [y, delay, reduceMotion]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left, top, width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />;
}

export default function SplashScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const compact = height < 720; // iPhone SE and similar
  const enter = (anim) => (reduceMotion ? undefined : anim);

  // the logo floats slowly up and down (off when the user prefers reduced motion)
  const float = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(float);
      float.value = 0;
      return;
    }
    float.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.quad) })
      ),
      -1
    );
  }, [float, reduceMotion]);
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));

  // the class breathes gently (tiny scale bounce)
  const breathe = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) { cancelAnimation(breathe); breathe.value = 1; return; }
    breathe.value = withRepeat(withSequence(
      withTiming(1.025, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) })
    ), -1);
  }, [breathe, reduceMotion]);
  const breatheStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));

  const mascotsWidth = Math.min(width * 1.08, 560);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.hero}>
        <LinearGradient
          colors={[colors.purple, colors.purpleDark]}
          start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* one soft halo behind the logo instead of scattered dots */}
        <View pointerEvents="none" style={[styles.halo, { top: insets.top - 40 }]} />
        <View pointerEvents="none" style={styles.corner} />
        {BUBBLES.map((b, i) => <Bubble key={i} {...b} reduceMotion={reduceMotion} />)}

        <View style={[styles.brand, { paddingTop: insets.top + (compact ? 12 : 28) }]}>
          <Animated.View entering={enter(ZoomIn.springify().damping(14).delay(100))} style={floatStyle}>
            <View style={styles.logoRing}>
              <Logo variant="symbol" tone="white" size={compact ? 72 : 92} />
            </View>
          </Animated.View>
          <Animated.View entering={enter(FadeInDown.delay(300).duration(500))} style={styles.wordmark}>
            <Text style={[styles.name, compact && styles.nameCompact]}>PRÁXIS</Text>
            <Text style={[styles.name, compact && styles.nameCompact, { color: colors.yellow }]}>EDU</Text>
          </Animated.View>
          <Animated.Text
            entering={enter(FadeInDown.delay(420).duration(500))}
            style={[styles.headline, compact && styles.headlineCompact]}
          >
            Aprender nunca foi tão divertido
          </Animated.Text>
        </View>

        {/* the class stands on the edge of the sheet, sheet overlaps the grass */}
        <Animated.View entering={enter(FadeInUp.delay(650).duration(600))} style={styles.mascots}>
          <Animated.View style={breatheStyle}>
          <Image
            source={classMascotsImage}
            style={{ width: mascotsWidth, height: mascotsWidth / MASCOTS_RATIO }}
            contentFit="fill" cachePolicy="memory-disk" priority="high"
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
          <Icon name="leaf" size={18} color={colors.green} />
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
  root: { flex: 1, backgroundColor: colors.purpleDark },
  hero: { flex: 1, overflow: 'hidden' },
  halo: {
    position: 'absolute', alignSelf: 'center', width: 340, height: 340, borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  corner: {
    position: 'absolute', right: -90, top: -90, width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  brand: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.screen },
  logoRing: {
    padding: 10, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  },
  wordmark: { flexDirection: 'row', gap: 10, marginTop: spacing.xs },
  name: { fontFamily: fonts.extrabold, fontSize: 40, letterSpacing: 1, color: colors.white },
  nameCompact: { fontSize: 34 },
  headline: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 26, color: '#E9DDFF', textAlign: 'center' },
  headlineCompact: { fontSize: 16, lineHeight: 22 },
  mascots: { alignItems: 'center', marginBottom: SHEET_OVERLAP - 4, zIndex: 2 },
  sheet: {
    marginTop: -SHEET_OVERLAP, backgroundColor: colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: spacing.xxl, paddingHorizontal: spacing.screen, gap: spacing.lg, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, elevation: 8,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: radius.pill, backgroundColor: colors.white,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.12)',
  },
  pillText: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  buttons: { width: '100%', gap: spacing.md },
});
