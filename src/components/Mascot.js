import { View, Image, StyleSheet } from 'react-native';
import { colors } from '../theme';
import Icon from './Icon';
import Mito from './Mito';

const IMAGES = {
  sapo: require('../../assets/mascotes/sapo.png'),
  guara: require('../../assets/mascotes/guara.png'),
  dinho: require('../../assets/mascotes/dinho.png'),
  mandu: require('../../assets/mascotes/mandu.png'),
  medusa: require('../../assets/mascotes/medusa.png'),
  borbo: require('../../assets/mascotes/borbo.png'),
  teco: require('../../assets/mascotes/teco.png'),
  baleia: require('../../assets/mascotes/baleia.png'),
  abelha: require('../../assets/mascotes/abelha.png'),
};

// Mascot picture. thinking = purple "?" badge, like in the prototype.
export default function Mascot({ name, size = 100, thinking }) {
  if (name === 'mito') return <View style={{ width: size, height: size }}><Mito size={size} /></View>;
  const width = Math.round(size * 1.59);
  const badge = Math.max(18, Math.round(size * 0.26));
  return (
    <View style={{ width, height: size }}>
      <Image source={IMAGES[name]} style={{ width, height: size }} resizeMode="contain" />
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
