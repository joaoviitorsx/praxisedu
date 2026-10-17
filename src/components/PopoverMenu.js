import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';
import Icon from './Icon';

// Small floating menu opened by a "..." button. top = screen Y where it appears.
// items: [{ label, icon, danger, onPress }]
export default function PopoverMenu({ visible, top, items, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.menu, { top }]}>
          {items.map((item, i) => (
            <View key={item.label}>
              {item.danger && i > 0 && <View style={styles.divider} />}
              <Pressable
                onPress={() => { onClose(); item.onPress(); }}
                style={({ pressed }) => [styles.item, pressed && { backgroundColor: item.danger ? colors.redSoft : '#F1F5F9' }]}
              >
                <Icon name={item.icon} size={20} color={item.danger ? colors.redText : colors.ink} />
                <Text style={[styles.label, item.danger && { fontFamily: fonts.extrabold, color: colors.redText }]}>
                  {item.label}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(26,26,46,0.25)' },
  menu: {
    position: 'absolute', right: 28, width: 220, backgroundColor: colors.surface, borderRadius: 16,
    borderWidth: 2, borderColor: colors.border, padding: 6,
  },
  item: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, borderRadius: 10 },
  label: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  divider: { height: 2, backgroundColor: '#F1F5F9', marginVertical: 4 },
});
