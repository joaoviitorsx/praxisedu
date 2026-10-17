import { View, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from '../theme';

// Base screen: background color, optional scroll and side padding.
// lightStatusBar = white status bar icons (for screens with a colored header).
export default function Screen({ children, scroll, padded = true, lightStatusBar, style, contentStyle }) {
  const content = [padded && styles.padded, contentStyle];
  return (
    <View style={[styles.root, style]}>
      <StatusBar style={lightStatusBar ? 'light' : 'dark'} />
      {scroll ? (
        <ScrollView contentContainerStyle={[{ flexGrow: 1 }, ...content]} showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, ...content]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  padded: { paddingHorizontal: spacing.screen },
});
