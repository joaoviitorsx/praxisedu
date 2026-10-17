import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';
import { Icon } from '../components';

// Bottom tab bar from the prototype. Active tab has a soft pill behind the icon.
// icons: { RouteName: 'icon-name' }, accent / accentSoft / accentDark: profile colors.
export default function TabBar({ state, descriptors, navigation, icons, accent, accentSoft, accentDark }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = descriptors[route.key].options.title ?? route.name;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tab} accessibilityRole="button">
            <View style={[styles.pill, focused && { backgroundColor: accentSoft }]}>
              <Icon name={icons[route.name]} size={24} color={focused ? accent : colors.gray} strokeWidth={focused ? 2.4 : 2} />
            </View>
            <Text style={[styles.label, focused ? { fontFamily: fonts.extrabold, color: accentDark } : null]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 2, borderTopColor: colors.border, paddingTop: 6, paddingHorizontal: 4 },
  tab: { flex: 1, minHeight: 56, alignItems: 'center', gap: 4, paddingVertical: 4 },
  pill: { width: 56, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.gray },
});
