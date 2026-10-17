import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, text } from '../theme';
import Icon from './Icon';
import Button from './Button';

// Centered confirmation dialog (e.g. "Excluir turma X?").
export default function ConfirmModal({ visible, title, message, confirmLabel = 'Excluir', loading, onConfirm, onCancel }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Icon name="trash" size={30} color={colors.red} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Button title={confirmLabel} variant="danger" onPress={onConfirm} loading={loading} />
            <Pressable onPress={onCancel} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(26,26,46,0.55)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, paddingTop: 24, alignItems: 'center', gap: 10 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' },
  title: { ...text.h2, marginTop: 4, textAlign: 'center' },
  message: { ...text.body, color: colors.gray, textAlign: 'center', lineHeight: 24 },
  actions: { width: '100%', gap: 8, marginTop: 10 },
  cancel: { height: 48, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.gray },
});
