import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Icon, Button, LoadingView, EmptyState } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { loadTeacherClasses } from '../../services/classService';
import { friendlyError } from '../../utils/errors';
import { initials } from '../../utils/format';
import { colors, fonts, text } from '../../theme';

// Screen 24: teacher profile with totals, data and the class list
export default function TeacherProfileScreen({ navigation }) {
  const { user, profile, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [classes, setClasses] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    loadTeacherClasses(user.uid).then(setClasses).catch((e) => setError(friendlyError(e)));
  }, [user.uid]);
  useFocusEffect(load);

  const students = classes?.reduce((sum, c) => sum + c.studentsCount, 0) ?? 0;
  const quizzes = classes?.reduce((sum, c) => sum + c.quizzesCount, 0) ?? 0;

  const rows = [
    { icon: 'mail', label: 'E-mail', value: profile.email },
    profile.school && { icon: 'school', label: 'Escola', value: profile.school },
    { icon: 'book-open', label: 'Disciplina', value: 'Biologia · Ensino Médio' },
  ].filter(Boolean);

  return (
    <Screen padded={false} lightStatusBar>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials(profile.name)}</Text></View>
        <Text style={styles.name}>Prof. {profile.name}</Text>
        <Text style={styles.role}>Professor de Biologia</Text>
      </View>

      <Screen scroll contentStyle={styles.content}>
        {error ? (
          <EmptyState isError title="Não foi possível carregar" message={error} actionLabel="Tentar de novo" onAction={load} />
        ) : !classes ? (
          <LoadingView />
        ) : (
          <>
            <View style={styles.stats}>
              <Stat value={classes.length} label="turmas" />
              <Stat value={students} label="estudantes" />
              <Stat value={quizzes} label="quizzes" />
            </View>

            <View style={styles.list}>
              {rows.map((r, i) => (
                <View key={r.label} style={[styles.row, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.rowIcon}><Icon name={r.icon} size={20} color={colors.blue} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>{r.label}</Text>
                    <Text style={styles.rowValue}>{r.value}</Text>
                  </View>
                </View>
              ))}
            </View>

            {classes.length > 0 && (
              <>
                <Text style={[text.label, { marginTop: 4 }]}>Minhas turmas</Text>
                <View style={styles.list}>
                  {classes.map((c, i) => (
                    <Pressable key={c.id} onPress={() => navigation.navigate('ClassPanel', { classId: c.id })}
                      style={[styles.row, i === classes.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.className}>{c.name}</Text>
                        <Text style={text.caption}>{c.code} · {c.studentsCount} alunos</Text>
                      </View>
                      <Icon name="chevron-right" size={20} color={colors.gray} />
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <View style={{ marginTop: 8 }}>
              <Button title="Sair da Conta" icon="log-out" variant="dangerOutline" onPress={signOut} />
            </View>
          </>
        )}
      </Screen>
    </Screen>
  );
}

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={text.caption}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.blue, paddingHorizontal: 20, paddingBottom: 24, alignItems: 'center', gap: 8 },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 4, borderBottomColor: colors.blueDark,
  },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 30, color: colors.blue },
  name: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.white, marginTop: 4, textAlign: 'center' },
  role: { fontFamily: fonts.semibold, fontSize: 15, color: '#DCE6FF' },
  content: { paddingTop: 16, paddingBottom: 32, gap: 12 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 16, padding: 12, alignItems: 'center' },
  statValue: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.blue },
  list: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: '#F1F5F9' },
  rowIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.gray },
  rowValue: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  className: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
});
