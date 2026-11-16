import { Alert, Platform } from 'react-native';

// Alert.alert does nothing on react-native-web, so fall back to the browser dialogs.
const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';

export function showAlert(title, message) {
  if (isWeb) window.alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}

export function confirmAction(title, message, confirmLabel, onConfirm) {
  if (isWeb) {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
