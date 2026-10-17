import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Input, Button, Icon } from '../../components';
import { signIn, authErrorMessage } from '../../services/authService';
import AuthLayout from './AuthLayout';
import { colors, fonts, text } from '../../theme';

// Login (03 / 03e). Shows an error box when the data is wrong.
export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // { title, detail, wrongData }
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (loading) return;
    if (!email.trim() || !password) {
      setError({ title: 'Preencha e-mail e senha', detail: 'Os dois campos são obrigatórios.' });
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      // AuthContext detects the login and the navigator changes by itself
    } catch (e) {
      const message = authErrorMessage(e);
      const wrongData = message === 'E-mail ou senha incorretos.';
      setError({
        title: wrongData ? 'E-mail ou senha incorretos' : message,
        detail: wrongData ? 'Confira os dados e tente de novo.' : null,
        wrongData,
      });
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Bem-vindo de volta!" subtitle="Entre para continuar sua jornada" mascot="sapo" onBack={() => navigation.goBack()}>
      {error && (
        <Animated.View entering={FadeInDown.duration(250)} style={styles.errorBox}>
          <Icon name="alert-triangle" size={22} color={colors.redText} />
          <View style={{ flex: 1 }}>
            <Text style={styles.errorTitle}>{error.title}</Text>
            {error.detail ? <Text style={styles.errorDetail}>{error.detail}</Text> : null}
          </View>
        </Animated.View>
      )}

      <View style={styles.form}>
        <Input
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          error={error?.wrongData ? ' ' : undefined}
        />
        <Input
          label="Senha"
          value={password}
          onChangeText={setPassword}
          placeholder="Sua senha"
          password
          error={error?.wrongData ? 'Verifique a senha digitada' : undefined}
        />
        <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgot}>
          <Text style={styles.link}>Esqueci a senha!</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 20 }}>
        <Button title={loading ? 'Entrando…' : 'Entrar'} onPress={submit} loading={loading} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Não está cadastrado?</Text>
        <Pressable onPress={() => navigation.navigate('Signup')} style={styles.footerLink}>
          <Text style={styles.link}>Cadastre-se</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    marginBottom: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14,
    borderRadius: 14, backgroundColor: colors.redSoft, borderWidth: 2, borderColor: '#F5B5B5',
  },
  errorTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.redText },
  errorDetail: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink, marginTop: 2 },
  form: { gap: 20 },
  forgot: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', marginTop: -12, marginBottom: -8 },
  link: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.orangeText },
  footer: { marginTop: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
  footerText: { ...text.body, color: colors.gray },
  footerLink: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
});
