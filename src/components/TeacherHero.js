import { View, Text, Pressable, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { colors, fonts } from '../theme';

// The navigation row stays in normal layout flow so it cannot overlap long class titles.
export default function TeacherHero({ eyebrow, title, subtitle, action, onBack, backLabel = 'Voltar' }) {
  const insets = useSafeAreaInsets();
  const hasNavigation = !!onBack || !!action;
  return <View style={[styles.hero, { paddingTop: insets.top + (hasNavigation ? 8 : 24) }]}>
    <StatusBar style="light" />
    {hasNavigation ? <View style={styles.navigationRow}>
      {onBack ? <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={`Voltar para ${backLabel}`} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><Icon name="chevron-left" size={21} color={colors.white} /><Text style={styles.backText}>{backLabel}</Text></Pressable> : <View />}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View> : null}
    <View style={styles.copy}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  </View>;
}

export const teacherSheetStyle = {
  flex: 1,
  marginTop: -26,
  paddingTop: 22,
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  backgroundColor: colors.background,
};

const styles = StyleSheet.create({
  hero: { minHeight: 172, paddingHorizontal: 20, paddingBottom: 48, backgroundColor: colors.blueDark },
  navigationRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  copy: { gap: 6 },
  eyebrow: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 1.2, color: '#DCE6FF' },
  title: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 38, color: colors.white },
  subtitle: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: '#E8EFFF' },
  action: { minWidth: 48, minHeight: 48, alignItems: 'flex-end', justifyContent: 'center' },
  back: { minHeight: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingRight: 16, gap: 4, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)' },
  backText: { fontFamily: fonts.bold, fontSize: 14, color: colors.white },
  pressed: { opacity: 0.65 },
});
