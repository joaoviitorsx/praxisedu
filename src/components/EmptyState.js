import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors, text } from '../theme';
import Icon from './Icon';
import Button from './Button';

// Used for "empty" and "error" states. Pass a mascot image, or isError for the alert icon.
export default function EmptyState({ image, title, message, isError, actionLabel, onAction, actionVariant = 'teacher' }) {
  return (
    <View style={styles.box}>
      {image && <Image source={image} style={styles.image} contentFit="contain" cachePolicy="memory-disk" />}
      {isError && (
        <View style={styles.errorIcon}>
          <Icon name="alert-triangle" size={32} color={colors.redText} />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && (
        <View style={{ width: '100%', marginTop: 8 }}>
          <Button title={actionLabel} onPress={onAction} variant={actionVariant} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: 12, paddingVertical: 32, paddingHorizontal: 12 },
  image: { width: 160, height: 110 },
  errorIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' },
  title: { ...text.h2, textAlign: 'center' },
  message: { ...text.body, color: colors.gray, textAlign: 'center', lineHeight: 24 },
});
