import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

// Brand purple gradient with soft decorative circles. Fills its parent.
export default function GradientBackdrop({ style, startColor = colors.purple, endColor = colors.purpleDark }) {
  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <LinearGradient colors={[startColor, endColor]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[styles.circle, { width: 280, height: 280, top: -110, right: -90, backgroundColor: 'rgba(255,255,255,0.09)' }]} />
      <View style={[styles.circle, { width: 170, height: 170, bottom: -60, left: -50, backgroundColor: 'rgba(255,255,255,0.07)' }]} />
      <View style={[styles.circle, { width: 26, height: 26, top: '30%', left: 28, backgroundColor: 'rgba(255,197,61,0.55)' }]} />
      <View style={[styles.circle, { width: 14, height: 14, top: '18%', right: 46, backgroundColor: 'rgba(255,197,61,0.7)' }]} />
      <View style={[styles.circle, { width: 18, height: 18, bottom: '24%', right: 30, backgroundColor: 'rgba(255,255,255,0.3)' }]} />
    </View>
  );
}

const styles = StyleSheet.create({ circle: { position: 'absolute', borderRadius: 999 } });
