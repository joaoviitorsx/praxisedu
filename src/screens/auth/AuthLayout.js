import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Icon, Logo, Mascot, GradientBackdrop } from '../../components';
import { colors, fonts } from '../../theme';

// Shared layout of Login / Signup / Forgot password:
// purple hero (back button, logo, title, mascot) + a rounded sheet with the form.
export default function AuthLayout({ title, subtitle, mascot, thinking, onBack, children }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
          <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
            <GradientBackdrop style={{ top: -600 }} />
            <View style={styles.topRow}>
              <Pressable onPress={onBack} style={({ pressed }) => [styles.back, pressed && { backgroundColor: 'rgba(255,255,255,0.3)' }]} accessibilityLabel="Voltar">
                <Icon name="chevron-left" size={24} color={colors.white} strokeWidth={2.8} />
              </Pressable>
              <Animated.View entering={ZoomIn.springify().damping(14)}>
                <Logo variant="horizontal" tone="white" size={34} light />
              </Animated.View>
            </View>
            <Animated.View entering={FadeInDown.delay(120).duration(450)} style={styles.titleBox}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </Animated.View>
            <Animated.View entering={FadeInUp.delay(250).duration(500)} style={styles.mascot} pointerEvents="none">
              <Mascot name={mascot} size={92} thinking={thinking} />
            </Animated.View>
          </View>

          <Animated.View entering={FadeInUp.delay(150).duration(450)} style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
            {children}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: { paddingHorizontal: 20, paddingBottom: 56, minHeight: 250 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  titleBox: { marginTop: 22, maxWidth: '62%', gap: 6 },
  title: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 36, color: colors.white },
  subtitle: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22, color: '#E9DDFF' },
  mascot: { position: 'absolute', right: 16, bottom: 26, zIndex: 2 },
  sheet: {
    flex: 1, marginTop: -28, backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 20, paddingTop: 28,
  },
});
