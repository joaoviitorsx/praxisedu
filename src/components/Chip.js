import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../theme';

// Small pill label. Colors come from props (e.g. blue/blueSoft for class codes).
export default function Chip({ label, color = colors.blue, background = colors.blueSoft, borderColor, spaced }) {
  return (
    <View style={[styles.chip, { backgroundColor: background }, borderColor && { borderWidth: 1.5, borderColor }]}>
      <Text style={[styles.label, { color }, spaced && { letterSpacing: 0.8 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  label: { fontFamily: fonts.extrabold, fontSize: 13 },
});
