import { View, Text, TextInput, StyleSheet } from 'react-native';

// TextInput with its own placeholder. On iOS the native placeholder shows wide letter
// spacing when a custom font is used, so we draw the placeholder as a normal Text.
export default function AppTextInput({ placeholder, placeholderTextColor = '#64748B', value, style, ...props }) {
  const flat = StyleSheet.flatten(style) || {};
  const showPlaceholder = !!placeholder && !value;
  const isMultiline = !!props.multiline;
  // margins belong to the wrapper, otherwise the placeholder overlay drifts off the input
  const marginKeys = ['margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginVertical', 'marginHorizontal'];
  const margins = {};
  const inputReset = {};
  marginKeys.forEach((k) => { if (flat[k] != null) { margins[k] = flat[k]; inputReset[k] = 0; } });

  return (
    <View style={[styles.wrapper, flat.flex != null && { flex: flat.flex }, flat.width != null && { width: flat.width }, flat.alignSelf && { alignSelf: flat.alignSelf }, margins]}>
      <TextInput {...props} value={value} style={[style, inputReset, flat.flex != null && { flex: undefined }]} />
      {showPlaceholder && (
        <View pointerEvents="none" style={[styles.overlay, { justifyContent: isMultiline ? 'flex-start' : 'center' }]}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: flat.fontFamily,
              fontSize: flat.fontSize,
              textAlign: flat.textAlign,
              letterSpacing: flat.letterSpacing,
              color: placeholderTextColor,
              paddingLeft: flat.paddingLeft ?? flat.paddingHorizontal ?? 0,
              paddingRight: flat.paddingRight ?? flat.paddingHorizontal ?? 0,
              paddingTop: isMultiline ? (flat.paddingTop ?? flat.paddingVertical ?? 0) : 0,
            }}
          >
            {placeholder}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  overlay: { ...StyleSheet.absoluteFillObject },
});
