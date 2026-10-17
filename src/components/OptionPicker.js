import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, text } from '../theme';

// Row of equal buttons where one is selected (grade, shift, duration...).
// options: [{ value, label }]
export default function OptionPicker({ label, options, value, onChange, accent = colors.blue, accentSoft = colors.blueSoft }) {
  return (
    <View style={{ gap: 8 }}>
      {label && <Text style={text.label}>{label}</Text>}
      <View style={styles.row}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable key={String(o.value)} onPress={() => onChange(o.value)} style={styles.item} accessibilityRole="button">
              <View style={[styles.edge, { backgroundColor: on ? accent : colors.border }]}>
                <View style={[styles.face, on && { borderColor: accent, backgroundColor: accentSoft }]}>
                  <Text style={[styles.label, on && { fontFamily: fonts.extrabold, color: accent }]}>{o.label}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  item: { flex: 1 },
  edge: { borderRadius: 14, paddingBottom: 3 },
  face: {
    height: 52, borderRadius: 14, borderWidth: 2, borderColor: colors.border,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  label: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
});
