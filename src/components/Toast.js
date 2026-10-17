import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';
import Icon from './Icon';

// Dark pill at the bottom. Hides itself after 2.2s by calling onHide.
export default function Toast({ message, onHide }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onHide, 2200);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.toast}>
        <Icon name="check-circle" size={20} color={colors.yellow} />
        <Text style={styles.text}>{message}</Text>
      </View>
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
