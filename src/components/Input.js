import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import AppTextInput from './AppTextInput';
import { colors, fonts, radius, text } from '../theme';
import Icon from './Icon';

// Labeled text field.
// accent = focus color; error = red border + message + alert icon; valid = green check;
// hint = small gray text under the field; password = hides the text and shows an eye button.
export default function Input({ label, error, valid, hint, password, accent = colors.purple, style, ...props }) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const hasIcon = password || valid || error;
  return (
    <View style={styles.wrapper}>
      {label && <Text style={text.label}>{label}</Text>}
      <View>
        <AppTextInput
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={password && !visible}
          style={[
            styles.input,
            hasIcon && { paddingRight: 52 },
            focused && { borderColor: accent },
            !!error && { borderColor: colors.red },
            style,
          ]}
          {...props}
        />
        {password ? (
          <Pressable onPress={() => setVisible(!visible)} style={styles.eye} accessibilityLabel="Mostrar senha">
            <Icon name={visible ? 'eye-off' : 'eye'} size={22} color={colors.gray} />
          </Pressable>
        ) : (valid || error) ? (
          <View style={styles.status}>
            <Icon name={error ? 'alert-triangle' : 'check-circle'} size={22} color={error ? colors.red : colors.green} />
          </View>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={text.caption}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  input: {
    height: 56,
    borderRadius: radius.button,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.ink,
  },
  eye: { position: 'absolute', right: 6, top: 6, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  status: { position: 'absolute', right: 16, top: 17 },
  error: { fontFamily: fonts.bold, fontSize: 13, color: colors.redText },
});
