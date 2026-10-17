import { Pressable, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../theme';
import Icon from './Icon';

const DEPTH = 4; // height of the solid bottom "shadow"

// bg / text / shadow / border color for each variant
const VARIANTS = {
  primary: { bg: colors.yellow, text: colors.ink, shadow: colors.yellowDark },
  teacher: { bg: colors.blue, text: colors.white, shadow: colors.blueDark },
  success: { bg: colors.green, text: colors.white, shadow: colors.greenDark },
  dark: { bg: colors.ink, text: colors.white, shadow: '#000000' },
  danger: { bg: colors.red, text: colors.white, shadow: colors.redDark },
  outline: { bg: colors.white, text: colors.blue, shadow: '#C7D5F8', border: '#C7D5F8' },
  dangerOutline: { bg: colors.white, text: colors.redText, shadow: '#F5B5B5', border: '#F5B5B5' },
  secondary: { bg: colors.white, text: colors.ink, shadow: colors.border, border: colors.border },
  ghost: { bg: 'transparent', text: colors.gray, shadow: 'transparent', flat: true },
  disabled: { bg: colors.border, text: colors.gray, shadow: '#CBD5E1' },
};

// Duolingo-style button: solid bottom shadow that "sinks" when pressed.
// size: "lg" (56) | "md" (48)
export default function Button({ title, onPress, variant = 'primary', size = 'lg', icon, loading, disabled, style }) {
  const isDisabled = disabled || loading;
  const v = VARIANTS[disabled ? 'disabled' : variant];
  const height = size === 'lg' ? 56 : 48;
  const depth = v.flat ? 0 : DEPTH;
  const textColor = v.text;

  return (
    <Pressable onPress={onPress} disabled={isDisabled} accessibilityRole="button"
      style={[{ height: height + depth }, style]}>
      {({ pressed }) => (
        <View style={{ height: height + depth }}>
          {!v.flat && (
            <View style={[styles.shadow, { height, backgroundColor: v.shadow }]} />
          )}
          <View style={[
            styles.face,
            { height, backgroundColor: pressed && v.flat ? colors.border : v.bg },
            v.border && { borderWidth: 2, borderColor: v.border },
            !v.flat && pressed && { transform: [{ translateY: DEPTH }] },
          ]}>
            {loading ? (
              <ActivityIndicator color={textColor} />
            ) : (
              <>
                {icon && <Icon name={icon} size={20} color={textColor} strokeWidth={2.4} />}
                <Text style={[styles.text, { color: textColor, fontSize: size === 'lg' ? 18 : 16 }]}>{title}</Text>
              </>
            )}
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: { position: 'absolute', left: 0, right: 0, bottom: 0, borderRadius: radius.button },
  face: {
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: { fontFamily: fonts.extrabold },
});
