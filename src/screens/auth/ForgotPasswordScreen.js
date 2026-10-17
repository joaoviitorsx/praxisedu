import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Input, Button, Icon } from '../../components';
import { resetPassword, authErrorMessage } from '../../services/authService';
import AuthLayout from './AuthLayout';
import { colors, fonts, text } from '../../theme';

// Screen 05 (Esqueceu a Senha) and 05ok (confirmation)
export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Digite um e-mail válido');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e) {
      // unknown e-mail looks like success, so we do not reveal which e-mails exist
      if (e?.code === 'auth/user-not-found') setSent(true);
      else setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Esqueceu a senha?" subtitle="Sem problemas, a gente ajuda você" mascot="guara" thinking onBack={() => navigation.goBack()}>
      <Text style={styles.body}>Digite o e-mail da sua conta. Vamos enviar um link para você criar uma nova senha.</Text>
      <View style={{ marginTop: 20 }}>
        <Input label="E-mail" value={email} onChangeText={setEmail} placeholder="seu@email.com"
          autoCapitalize="none" keyboardType="email-address" error={error || undefined} />
      </View>

      {sent && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.success}>
          <Icon name="check-circle" size={24} color={colors.green} />
          <Text style={styles.successText}>Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.</Text>
        </Animated.View>
      )}

      <View style={{ marginTop: 28, gap: 12 }}>
        {sent ? (
          <>
            <Button title="Voltar para o login" onPress={() => navigation.goBack()} />
            <Button title="Reenviar e-mail" variant="ghost" size="md" onPress={send} loading={loading} />
          </>
        ) : (
          <Button title="Enviar" onPress={send} loading={loading} />
        )}
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  body: { ...text.body, color: colors.gray, lineHeight: 24 },
  success: {
    marginTop: 20, flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 16,
    borderRadius: 16, backgroundColor: colors.greenSoft, borderWidth: 2, borderColor: '#A7DFC1',
  },
  successText: { flex: 1, fontFamily: fonts.semibold, fontSize: 16, color: colors.greenDark, lineHeight: 23 },
});
