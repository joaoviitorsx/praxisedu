import { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';
import Icon from './Icon';
import useReducedMotion from '../hooks/useReducedMotion';

// Dark pill at the bottom. Hides itself after 2.2s by calling onHide.
export default function Toast({ message, onHide }) {
  const reduceMotion = useReducedMotion();
  const entrance = useRef(new Animated.Value(0)).current;
  const hideRef = useRef(onHide);
  useEffect(() => { hideRef.current = onHide; }, [onHide]);
  useEffect(() => {
    if (!message) return undefined;
    entrance.setValue(0);
    Animated.timing(entrance, { toValue: 1, duration: reduceMotion ? 120 : 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const timer = setTimeout(() => hideRef.current?.(), 2200);
    return () => clearTimeout(timer);
  }, [message, reduceMotion, entrance]);

  if (!message) return null;
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View style={[styles.toast, { opacity: entrance, transform: [{ translateY: reduceMotion ? 0 : entrance.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
        <Icon name="check-circle" size={20} color={colors.yellow} />
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 20, right: 20, bottom: 24, alignItems: 'center' },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.ink,
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16,
  },
  text: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
});
