import { View, Text, StyleSheet } from 'react-native';
import { colors, text } from '../theme';
import Header from './Header';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';
import Screen from './Screen';

// Temporary screen for modules owned by teammates.
export default function Placeholder({ title, owner, accent = colors.blue, actions = [], onBack }) {
  const { signOut } = useAuth();
  return (
    <Screen padded={false} lightStatusBar>
      <Header title={title} background={accent} backLabel={onBack ? 'Voltar' : undefined} onBack={onBack} />
      <View style={styles.body}>
        <Text style={text.h2}>{title}</Text>
        <Text style={text.caption}>Em construção · {owner}</Text>
        {/* TEMP: shortcuts and sign out, so we can test without the final screens */}
        <View style={styles.logout}>
          {actions.map((a) => (
            <Button key={a.title} title={a.title} variant="primary" size="md" onPress={a.onPress} />
          ))}
          <Button title="Sair (teste)" variant="secondary" size="md" onPress={signOut} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  logout: { marginTop: 24, width: 220, gap: 12 },
});
