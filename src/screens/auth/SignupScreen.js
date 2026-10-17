import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Input, Button, Icon } from '../../components';
import { signUp, authErrorMessage } from '../../services/authService';
import AuthLayout from './AuthLayout';
import { colors, fonts, text } from '../../theme';

const ROLES = [
  { value: 'student', label: 'Estudante', icon: 'book-open', color: colors.green },
  { value: 'teacher', label: 'Professor', icon: 'graduation-cap', color: colors.blue },
];

// Screen 04: the profile (student or teacher) is chosen here
export default function SignupScreen({ navigation }) {
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const nameOk = name.trim().split(/\s+/).filter(Boolean).length >= 2;
  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const passwordOk = password.length >= 8;
  const matchOk = confirm.length > 0 && password === confirm;
  const formOk = nameOk && emailOk && passwordOk && matchOk;

  async function submit() {
    setSubmitError('');
    setLoading(true);
    try {
      await signUp({ name, email, password, role });
      // the navigator changes by itself: student -> Entrar na turma, teacher -> Minhas Turmas
    } catch (e) {
      setSubmitError(authErrorMessage(e));
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Crie sua conta" subtitle="Comece a aprender Biologia" mascot="dinho" onBack={() => navigation.goBack()}>
      <View style={styles.form}>
        <View style={{ gap: 8 }}>
          <Text style={text.label}>Eu sou</Text>
          <View style={styles.roles}>
            {ROLES.map((r) => {
              const on = role === r.value;
              return (
                <Pressable key={r.value} onPress={() => setRole(r.value)} style={[styles.role, on && styles.roleOn]}>
                  <Icon name={r.icon} size={18} color={on ? r.color : colors.gray} />
                  <Text style={[styles.roleText, on && { fontFamily: fonts.extrabold, color: r.color }]}>{r.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Input label="Nome completo" value={name} onChangeText={setName} placeholder="Seu nome e sobrenome"
          autoCapitalize="words" valid={nameOk} error={!nameOk && name ? 'Digite nome e sobrenome' : undefined} />
        <Input label="E-mail" value={email} onChangeText={setEmail} placeholder="seu@email.com"
          autoCapitalize="none" keyboardType="email-address" valid={emailOk}
          error={!emailOk && email ? 'Digite um e-mail válido' : undefined} />
        <Input label="Senha" value={password} onChangeText={setPassword} placeholder="Mínimo de 8 caracteres" password
          error={!passwordOk && password ? 'A senha precisa ter 8 caracteres ou mais' : undefined}
          hint={passwordOk ? 'Senha forte o suficiente' : undefined} />
        <Input label="Confirmar senha" value={confirm} onChangeText={setConfirm} placeholder="Repita a senha" password
          error={!matchOk && confirm ? 'As senhas não coincidem' : undefined} />
      </View>

      {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
      <View style={{ marginTop: 24 }}>
        <Button title="Cadastrar" onPress={submit} loading={loading} disabled={!formOk} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Já está cadastrado?</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.footerLink}>
          <Text style={styles.link}>Login!</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  roles: { flexDirection: 'row', gap: 6, padding: 4, borderRadius: 16, backgroundColor: colors.border },
  role: { flex: 1, height: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  roleOn: { backgroundColor: colors.white, borderBottomWidth: 2, borderBottomColor: '#CBD5E1' },
  roleText: { fontFamily: fonts.bold, fontSize: 16, color: colors.gray },
  submitError: {
    marginTop: 16, fontFamily: fonts.bold, fontSize: 15, color: colors.redText, backgroundColor: colors.redSoft,
    borderWidth: 2, borderColor: '#F5B5B5', borderRadius: 14, padding: 14,
  },
  footer: { marginTop: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
  footerText: { ...text.body, color: colors.gray },
  footerLink: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  link: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.orangeText },
});
