import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '../theme';
import Icon from './Icon';

// Colored top bar. backLabel shows a "< Label" button; right is any element.
export default function Header({ title, subtitle, backLabel, onBack, right, background = colors.blue, subtitleColor = '#DCE6FF' }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { backgroundColor: background, paddingTop: insets.top + 8 }]}>
      {backLabel && (
        <Pressable onPress={onBack} style={styles.back} hitSlop={8}>
          <Icon name="chevron-left" size={22} color={colors.white} strokeWidth={2.6} />
          <Text style={styles.backLabel}>{backLabel}</Text>
        </Pressable>
      )}
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text>}
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.screen, paddingBottom: 18 },
  back: { minHeight: 44, marginLeft: -8, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  backLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.white },
  subtitle: { fontFamily: fonts.semibold, fontSize: 15, marginTop: 2 },
});
