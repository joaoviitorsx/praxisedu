import { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';
import { Icon } from '../components';
import useReducedMotion from '../hooks/useReducedMotion';

// Bottom tab bar from the prototype. Active tab has a soft pill behind the icon.
// icons: { RouteName: 'icon-name' }, accent / accentSoft / accentDark: profile colors.
export default function TabBar({ state, descriptors, navigation, icons, accent, accentSoft, accentDark, featuredRoute }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, featuredRoute && styles.barWithFeatured, { paddingBottom: Math.max(insets.bottom, featuredRoute ? 4 : 8) }]}>
      {state.routes.map((route) => {
        const focused = state.routes[state.index]?.key === route.key;
        const label = descriptors[route.key].options.title ?? route.name;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return <TabItem key={route.key} focused={focused} featured={route.name === featuredRoute} inFeaturedBar={!!featuredRoute} label={label} icon={icons[route.name]} accent={accent} accentSoft={accentSoft} accentDark={accentDark} onPress={onPress} onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })} />;
      })}
    </View>
  );
}

function TabItem({ focused, featured, inFeaturedBar, label, icon, accent, accentSoft, accentDark, onPress, onLongPress }) {
  const reduceMotion = useReducedMotion();
  const emphasis = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) { emphasis.setValue(focused ? 1 : 0); return; }
    const animation = featured
      ? Animated.spring(emphasis, { toValue: focused ? 1 : 0, friction: 7, tension: 90, useNativeDriver: true })
      : Animated.timing(emphasis, { toValue: focused ? 1 : 0, duration: 180, easing: Easing.inOut(Easing.ease), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [focused, featured, reduceMotion, emphasis]);

  const scale = emphasis.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const lift = emphasis.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  return <Pressable onPress={onPress} onLongPress={onLongPress} style={({ pressed }) => [styles.tab, inFeaturedBar && styles.studentTab, featured && styles.featuredTab, pressed && styles.pressed]} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={label}>
    {featured ? <View style={styles.featuredShell}>
      <Animated.View style={[styles.featuredHalo, { backgroundColor: accentSoft, opacity: emphasis }]} />
      <Animated.View style={[styles.featuredCircle, { backgroundColor: accent, transform: [{ translateY: lift }, { scale }] }]}><Icon name={icon} size={27} color={colors.white} strokeWidth={2.3} /></Animated.View>
    </View> : <View style={[styles.pill, inFeaturedBar && styles.studentPill]}>
      <Animated.View pointerEvents="none" style={[styles.pillHighlight, { backgroundColor: accentSoft, opacity: emphasis }]} />
      <Animated.View style={[styles.pillIcon, { transform: [{ scale }] }]}>
        <Animated.View style={{ opacity: emphasis.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}><Icon name={icon} size={24} color={colors.gray} strokeWidth={2} /></Animated.View>
        <Animated.View style={[styles.pillIconActive, { opacity: emphasis }]}><Icon name={icon} size={24} color={accent} strokeWidth={2.4} /></Animated.View>
      </Animated.View>
    </View>}
    <Text style={[styles.label, inFeaturedBar && styles.studentLabel, (focused || featured) && { fontFamily: fonts.extrabold, color: accentDark }]} numberOfLines={1}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 2, borderTopColor: colors.border, paddingTop: 6, paddingHorizontal: 4 },
  barWithFeatured: { alignItems: 'flex-end', paddingTop: 2, borderTopWidth: 1 },
  tab: { flex: 1, minHeight: 60, alignItems: 'center', gap: 4, paddingVertical: 4 },
  studentTab: { minHeight: 56, justifyContent: 'flex-end', gap: 2 },
  featuredTab: { height: 64, marginTop: -8, minHeight: 64, gap: 0, paddingVertical: 0 },
  featuredShell: { width: 60, height: 48, alignItems: 'center', justifyContent: 'center' },
  featuredHalo: { position: 'absolute', top: -6, left: 0, width: 60, height: 60, borderRadius: 30 },
  featuredCircle: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  pill: { width: 56, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  pillHighlight: { ...StyleSheet.absoluteFillObject, borderRadius: 999 },
  pillIcon: { width: 24, height: 24 },
  pillIconActive: { position: 'absolute', top: 0, left: 0 },
  studentPill: { height: 30 },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.gray },
  studentLabel: { fontSize: 12, lineHeight: 16 },
  pressed: { opacity: 0.65 },
});
