import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { colors, fonts } from '../theme';

// Atom with orbits, a leaf as the nucleus and a yellow electron.
// tone "color" = purple circle, tone "white" = white circle (for colored headers).
function Symbol({ size, tone, showElectron }) {
  const isWhite = tone === 'white';
  const bg = isWhite ? colors.white : colors.purple;
  const fg = isWhite ? colors.purple : colors.white;
  const dot = isWhite ? colors.purple : colors.yellow;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx={32} cy={32} r={31} fill={bg} />
      {[-35, 35].map((angle) => (
        <Ellipse key={angle} cx={32} cy={32} rx={24} ry={9} transform={`rotate(${angle} 32 32)`}
          fill="none" stroke={fg} strokeWidth={2.6} />
      ))}
      <Path d="M32 20 C40.5 24.5 41.5 36 32 44 C22.5 36 23.5 24.5 32 20 Z" fill={fg} />
      <Path d="M32 25 V40 M32 31.5 l3.6 -3.2 M32 36 l-3.6 -3.2" fill="none" stroke={bg}
        strokeWidth={1.8} strokeLinecap="round" />
      {showElectron && <Circle cx={51.7} cy={18.2} r={3.8} fill={dot} stroke={bg} strokeWidth={1.5} />}
      <Circle cx={12.3} cy={45.8} r={2.6} fill={fg} />
    </Svg>
  );
}

// variant: "symbol" (only the atom) or "horizontal" (atom + PRÁXIS EDU)
// light = white/yellow wordmark, for dark or purple backgrounds
export default function Logo({ variant = 'symbol', size = 40, tone = 'color', light, showElectron = true }) {
  if (variant === 'symbol') return <Symbol size={size} tone={tone} showElectron={showElectron} />;
  const fontSize = Math.round(size * 0.5);
  return (
    <View style={[styles.row, { gap: Math.round(size * 0.28) }]}>
      <Symbol size={size} tone={tone} showElectron={showElectron} />
      <View style={styles.word}>
        <Text style={[styles.text, { fontSize, color: light ? colors.white : colors.ink }]}>PRÁXIS</Text>
        <Text style={[styles.text, { fontSize, color: light ? colors.yellow : colors.purple }]}>EDU</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  word: { flexDirection: 'row', gap: 8 },
  text: { fontFamily: fonts.extrabold, letterSpacing: 0.6 },
});
