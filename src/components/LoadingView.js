import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, text } from '../theme';

export default function LoadingView({ message }) {
  return (
    <View style={styles.box}>
      <ActivityIndicator size="large" color={colors.purple} />
      {message && <Text style={text.caption}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
});
