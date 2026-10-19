import { useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  FadeInDown, FadeInUp, ZoomIn, Easing,
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Icon, Logo, GradientBackdrop } from '../../components';
import { colors, fonts } from '../../theme';
import { classMascotsImage } from '../../constants/mascotImages';

const MASCOTS_RATIO = 808 / 242; // turma.png

export default function SplashScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // the logo floats slowly up and down
  const float = useSharedValue(0);
  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.quad) })
      ),
      -1
    );
  }, [float]);
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.hero}>
        <GradientBackdrop />
        <View style={[styles.brand, { paddingTop: insets.top + 24 }]}>
          <Animated.View entering={ZoomIn.springify().damping(12).delay(100)} style={floatStyle}>
            <View style={styles.logoGlow}>
              <Logo variant="symbol" tone="white" size={104} />
            </View>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.wordmark}>
            <Text style={styles.name}>PRÁXIS</Text>
            <Text style={[styles.name, { color: colors.yellow }]}>EDU</Text>
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(500).duration(500)} style={styles.tagline}>
            Aprender nunca foi tão divertido
          </Animated.Text>
        </View>
        {/* animals stand on the grass strip, right on the edge of the white sheet */}
        <Animated.View entering={FadeInUp.delay(650).duration(600)}>
          <Image source={classMascotsImage} style={{ width, height: width / MASCOTS_RATIO }} contentFit="fill" cachePolicy="memory-disk" priority="high" />
        </Animated.View>
      </View>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <Animated.View entering={FadeInUp.delay(800).duration(450)} style={styles.pill}>
          <Icon name="leaf" size={20} color={colors.green} />
          <Text style={styles.pillText}>Biologia no Ensino Médio</Text>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(900).duration(450)} style={styles.buttons}>
          <Button title="Entrar" onPress={() => navigation.navigate('Login')} />
          <Button title="Criar conta" variant="secondary" onPress={() => navigation.navigate('Signup')} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: { flex: 1, justifyContent: 'space-between', overflow: 'hidden' },
  brand: { alignItems: 'center', gap: 14, paddingHorizontal: 20 },
  logoGlow: {
    padding: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 10 },
  },
  wordmark: { flexDirection: 'row', gap: 10, marginTop: 4 },
  name: { fontFamily: fonts.extrabold, fontSize: 40, letterSpacing: 1, color: colors.white },
  tagline: { fontFamily: fonts.semibold, fontSize: 18, color: '#E9DDFF', textAlign: 'center' },
  sheet: { backgroundColor: colors.background, paddingTop: 20, paddingHorizontal: 20, gap: 18, alignItems: 'center' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 999, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border,
  },
  pillText: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  buttons: { width: '100%', gap: 12 },
});
