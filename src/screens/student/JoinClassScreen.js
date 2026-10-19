import { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Button, Icon, Mascot } from '../../components';
import AppTextInput from '../../components/AppTextInput';
import { useAuth } from '../../contexts/AuthContext';
import { findClassByCode, joinClass, getClass, countClassMembers } from '../../services/classService';
import { friendlyError } from '../../utils/errors';
import { initials } from '../../utils/format';
import { colors, fonts, text } from '../../theme';
import { classMascotsImage } from '../../constants/mascotImages';

// Screen 25 (Entrar na turma) and 25ok (Entrou na turma).
// `welcome` is kept by the navigator: it is set BEFORE the join is written, so the
// success screen stays visible even though the profile (classId) changes right away.
export default function JoinClassScreen({ welcome, onJoining, onJoinFailed, onContinue }) {
  if (welcome) return <JoinSuccess welcome={welcome} onContinue={onContinue} />;
  return <JoinForm onJoining={onJoining} onJoinFailed={onJoinFailed} />;
}

function JoinForm({ onJoining, onJoinFailed }) {
  const insets = useSafeAreaInsets();
  const { user, profile, signOut } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    setLoading(true);
    try {
      const found = await findClassByCode(code);
      onJoining(found);
      await joinClass(user.uid, profile, found.classId, found.code);
    } catch (e) {
      onJoinFailed();
      setError(friendlyError(e));
      setLoading(false);
    }
  }

  return (
    <Screen style={{ paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 16) + 16 }}>
      <KeyboardAvoidingView style={{ flex: 1, paddingHorizontal: 20 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ alignItems: 'center' }}><Mascot name="dinho" size={110} /></View>
        <Text style={styles.title}>Entre na sua turma</Text>
        <Text style={styles.subtitle}>Digite o código que seu professor compartilhou.</Text>

        <View style={styles.codeEdge}>
          <AppTextInput
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="BIO000"
            placeholderTextColor="#CBD5E1"
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.code}
          />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : <Text style={styles.hint}>6 caracteres · letras e números</Text>}

        <View style={{ flex: 1 }} />
        <Button title="Entrar na turma" onPress={submit} loading={loading} disabled={code.length < 6} />
        <Pressable
          onPress={() => Alert.alert('Onde encontro o código?', 'Peça ao seu professor. O código tem 3 letras e 3 números, como BIO101, e aparece na turma dele.')}
          style={styles.help}
        >
          <Text style={styles.helpText}>Onde encontro o código?</Text>
        </Pressable>
        <Pressable onPress={signOut} style={styles.help}>
          <Text style={[styles.helpText, { color: colors.gray }]}>Sair da conta</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function JoinSuccess({ welcome, onContinue }) {
  const insets = useSafeAreaInsets();
  const [cls, setCls] = useState(null);
  const [peers, setPeers] = useState(null);

  // after the join the student is a member, so the class can be read
  useEffect(() => {
    let active = true;
    getClass(welcome.classId).then((c) => active && setCls(c)).catch(() => {});
    countClassMembers(welcome.classId).then((n) => active && setPeers(n - 1)).catch(() => {});
    return () => { active = false; };
  }, [welcome.classId]);

  return (
    <Screen style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 16) + 16 }}>
      <View style={styles.successBody}>
        <Image source={classMascotsImage} style={styles.mascots} contentFit="contain" cachePolicy="memory-disk" />
        <View style={styles.accepted}>
          <Icon name="check-circle" size={18} color={colors.green} />
          <Text style={styles.acceptedText}>CÓDIGO {welcome.code} ACEITO</Text>
        </View>
        <Text style={styles.successTitle}>Você entrou no{'\n'}{cls?.name ?? 'sua turma'}!</Text>
        {cls && (
          <View style={styles.card}>
            <View style={styles.teacherRow}>
              <View style={styles.teacherAvatar}>
                <Text style={styles.teacherInitials}>{initials((cls.teacherName ?? '').replace('Prof. ', ''))}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.teacherName}>{cls.teacherName}</Text>
                {cls.school ? <Text style={text.caption}>{cls.school}</Text> : null}
              </View>
            </View>
            {peers !== null && (
              <View style={styles.peers}>
                <Icon name="users" size={20} color={colors.green} />
                <Text style={styles.peersText}>
                  {peers > 0 ? `${peers} ${peers === 1 ? 'colega já está' : 'colegas já estão'} na turma` : 'Você é o primeiro da turma!'}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
      <Button title="Continuar" variant="success" onPress={onContinue} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...text.h1, fontSize: 28, textAlign: 'center', marginTop: 20, marginBottom: 6 },
  subtitle: { ...text.body, color: colors.gray, textAlign: 'center', lineHeight: 24 },
  codeEdge: { marginTop: 28, backgroundColor: colors.green, borderRadius: 20, paddingBottom: 4 },
  code: {
    height: 88, borderRadius: 20, borderWidth: 3, borderColor: colors.green, backgroundColor: colors.surface,
    textAlign: 'center', fontFamily: fonts.extrabold, fontSize: 40, letterSpacing: 8, color: colors.ink,
  },
  hint: { ...text.caption, marginTop: 12, textAlign: 'center' },
  error: { fontFamily: fonts.bold, fontSize: 15, color: colors.redText, marginTop: 12, textAlign: 'center' },
  help: { marginTop: 8, height: 48, alignItems: 'center', justifyContent: 'center' },
  helpText: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.orangeText },
  successBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  mascots: { width: '100%', height: 200 },
  accepted: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.greenSoft,
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, marginTop: 8,
  },
  acceptedText: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.greenDark },
  successTitle: { ...text.h1, fontSize: 28, lineHeight: 34, textAlign: 'center' },
  card: {
    width: '100%', marginTop: 12, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border,
    borderRadius: 20, padding: 16, gap: 12,
  },
  teacherRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  teacherAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  teacherInitials: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.white },
  teacherName: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
  peers: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  peersText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.gray },
});
