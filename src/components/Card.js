import { Pressable, View, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

// White card with a border and a 4px bottom edge. Pass onPress to make it tappable.
export default function Card({ children, onPress, style, accessibilityLabel }) {
  if (!onPress) {
    return (
      <View style={styles.edge}>
        <View style={[styles.card, style]}>{children}</View>
      </View>
    );
  }
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      {({ pressed }) => (
        <View style={styles.edge}>
          <View style={[styles.card, style, pressed && { transform: [{ translateY: 2 }] }]}>{children}</View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  edge: { backgroundColor: colors.border, borderRadius: radius.card, paddingBottom: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 16,
  },
});
