import { Platform, Alert } from 'react-native';

if (Platform.OS === 'web') {
  Alert.alert = (title, message, buttons) => {
    const formattedText = [title, message].filter(Boolean).join('\n\n');
    if (!buttons || buttons.length === 0) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(formattedText);
      }
      return;
    }
    if (buttons.length === 1) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(formattedText);
      }
      buttons[0]?.onPress?.();
      return;
    }
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm(formattedText);
      if (confirmed) {
        const actionBtn = buttons.find((b) => b.style === 'destructive' || b.style !== 'cancel') || buttons[1] || buttons[0];
        actionBtn?.onPress?.();
      } else {
        const cancelBtn = buttons.find((b) => b.style === 'cancel');
        cancelBtn?.onPress?.();
      }
    } else {
      const actionBtn = buttons.find((b) => b.style === 'destructive' || b.style !== 'cancel') || buttons[0];
      actionBtn?.onPress?.();
    }
  };
}
