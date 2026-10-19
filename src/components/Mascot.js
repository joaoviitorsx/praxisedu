import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../theme';
import { mascotImages } from '../constants/mascotImages';
import Icon from './Icon';
import Mito from './Mito';

// Mascot picture. thinking = purple "?" badge, like in the prototype.
export default function Mascot({ name, size = 100, thinking }) {
  if (name === 'mito') return <View style={{ width: size, height: size }}><Mito size={size} /></View>;
  const width = Math.round(size * 1.59);
  const badge = Math.max(18, Math.round(size * 0.26));
  return (
    <View style={{ width, height: size }}>
      <Image source={mascotImages[name] ?? mascotImages.sapo} style={{ width, height: size }} contentFit="contain" cachePolicy="memory-disk" />
      {thinking && (
        <View style={[styles.badge, { width: badge, height: badge, borderRadius: badge / 2, right: Math.round(width * 0.12) }]}>
          <Icon name="help-circle" size={Math.round(badge * 0.6)} color={colors.white} strokeWidth={2.6} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute', top: 0, backgroundColor: colors.purple, borderWidth: 2, borderColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
});
