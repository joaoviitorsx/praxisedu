import { useCallback, useState } from 'react';
import { Alert, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Icon, Button, LoadingView, EmptyState } from '../../components';
import TeacherHero, { teacherSheetStyle } from '../../components/TeacherHero';
import { useAuth } from '../../contexts/AuthContext';
import { teacherProfileSummary } from '../../features/teacher/teacherProfileModel';
import { loadTeacherClasses } from '../../services/classService';
import { friendlyError } from '../../utils/errors';
import { initials } from '../../utils/format';
import { colors, fonts } from '../../theme';

export default function TeacherProfileScreen({ navigation }) {
  const { user, profile, signOut } = useAuth();
  const [classes, setClasses] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    setError('');
    if (retry > 0) setClasses(null);
    loadTeacherClasses(user.uid)
      .then((data) => { if (active) setClasses(data); })
      .catch((cause) => { if (active) setError(friendlyError(cause)); });
    return () => { active = false; };
  }, [user.uid, retry]));

  const teacherName = profile?.name?.trim() || 'Professor(a)';
  const summary = teacherProfileSummary(classes);
  const details = [
    { icon: 'mail', label: 'E-mail', value: profile?.email || user?.email || 'Não informado' },
    profile?.school && { icon: 'school', label: 'Escola', value: profile.school },
    { icon: 'book-open', label: 'Disciplina', value: 'Biologia · Ensino Médio' },
  ].filter(Boolean);
  const confirmSignOut = () => Alert.alert('Sair da conta?', 'Você poderá entrar novamente quando quiser.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Sair', style: 'destructive', onPress: signOut },
  ]);

  return (
    <View style={styles.root}>
      <TeacherHero eyebrow="SUA CONTA" title="Meu perfil" subtitle="Sua jornada como professor em um só lugar." />
      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.identityCard}>
            <View style={styles.identityAvatar}><Text style={styles.identityAvatarText}>{initials(teacherName)}</Text></View>
            <View style={styles.identityCopy}>
              <Text style={styles.identityLabel}>PERFIL DOCENTE</Text>
              <Text style={styles.name}>{teacherName}</Text>
              <Text style={styles.role}>Docente de Biologia · Ensino Médio</Text>
            </View>
          </View>

          {(!error || classes) ? <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seu espaço de ensino</Text>
            {classes ? <View style={styles.stats}>
              <Stat icon="users" value={summary.classes} label="Turmas" accessibilityLabel={`${summary.classes} ${summary.classes === 1 ? 'turma' : 'turmas'}`} />
              <View style={styles.statDivider} />
              <Stat icon="user" value={summary.students} label="Alunos" accessibilityLabel={`${summary.students} ${summary.students === 1 ? 'aluno' : 'alunos'}`} />
              <View style={styles.statDivider} />
              <Stat icon="help-circle" value={summary.quizzes} label="Quizzes" accessibilityLabel={`${summary.quizzes} ${summary.quizzes === 1 ? 'quiz' : 'quizzes'}`} />
            </View> : <LoadingView compact message="Carregando resumo" />}
          </View> : null}

          {(classes || error) ? <View style={styles.section}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Minhas turmas</Text>
              {classes?.length > 0 ? <Text style={styles.sectionCount}>{classes.length}</Text> : null}
            </View>
            {error ? <EmptyState isError title="Não foi possível carregar as turmas" message={error} actionLabel="Tentar de novo" onAction={() => setRetry((value) => value + 1)} />
              : classes.length === 0 ? <View style={styles.emptyCard}>
                  <View style={styles.emptyIcon}><Icon name="users" size={24} color={colors.blue} /></View>
                  <Text style={styles.emptyTitle}>Sua primeira turma começa aqui</Text>
                  <Text style={styles.emptyText}>Crie uma turma para reunir seus alunos e acompanhar as atividades.</Text>
                  <Button title="Criar primeira turma" icon="plus" variant="teacher" onPress={() => navigation.navigate('ClassForm')} />
                </View> : <>
                  <View style={styles.list}>
                    {classes.slice(0, 3).map((classroom, index) => <Pressable key={classroom.id}
                      onPress={() => navigation.navigate('ClassPanel', { classId: classroom.id })}
                      style={({ pressed }) => [styles.classRow, index === Math.min(classes.length, 3) - 1 && styles.lastRow, pressed && styles.pressed]}
                      accessibilityRole="button" accessibilityLabel={`Abrir turma ${classroom.name}`}>
                      <View style={styles.rowIcon}><Icon name="users" size={20} color={colors.blue} /></View>
                      <View style={styles.rowCopy}>
                        <Text style={styles.className} numberOfLines={2}>{classroom.name}</Text>
                        <Text style={styles.classMeta}>{classroom.code} · {classroom.studentsCount || 0} alunos</Text>
                      </View>
                      <Icon name="chevron-right" size={20} color={colors.gray} />
                    </Pressable>)}
                  </View>
                  <Pressable onPress={() => navigation.navigate('Classes')} style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}
                    accessibilityRole="button" accessibilityLabel="Ver todas as turmas">
                    <Text style={styles.viewAllText}>Ver todas as turmas</Text>
                    <Icon name="arrow-right" size={18} color={colors.blue} />
                  </Pressable>
                </>}
          </View> : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados profissionais</Text>
            <View style={styles.list}>
              {details.map((detail, index) => <View key={detail.label} style={[styles.detailRow, index === details.length - 1 && styles.lastRow]}>
                <View style={styles.rowIcon}><Icon name={detail.icon} size={20} color={colors.blue} /></View>
                <View style={styles.rowCopy}>
                  <Text style={styles.detailLabel}>{detail.label}</Text>
                  <Text style={styles.detailValue} selectable={detail.label === 'E-mail'}>{detail.value}</Text>
                </View>
              </View>)}
            </View>
          </View>

          <View style={styles.logout}><Button title="Sair da conta" icon="log-out" variant="dangerOutline" onPress={confirmSignOut} /></View>
        </ScrollView>
      </View>
    </View>
  );
}

function Stat({ icon, value, label, accessibilityLabel }) {
  return <View style={styles.stat} accessible accessibilityLabel={accessibilityLabel}>
    <View style={styles.statIcon}><Icon name={icon} size={18} color={colors.blue} /></View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  sheet: teacherSheetStyle,
  content: { paddingHorizontal: 20, paddingBottom: 36, gap: 24 },
  identityCard: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 100, padding: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20 },
  identityAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  identityAvatarText: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.white },
  identityCopy: { flex: 1, minWidth: 0, gap: 4 },
  identityLabel: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 1, color: colors.blue },
  name: { fontFamily: fonts.extrabold, fontSize: 20, lineHeight: 26, color: colors.ink },
  role: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: colors.gray },
  section: { gap: 12 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 18, lineHeight: 24, color: colors.ink },
  sectionCount: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.blue, backgroundColor: colors.blueSoft, overflow: 'hidden', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  stats: { flexDirection: 'row', alignItems: 'stretch', paddingVertical: 16, paddingHorizontal: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20 },
  stat: { flex: 1, minWidth: 0, alignItems: 'center', gap: 3, paddingHorizontal: 4 },
  statDivider: { width: 1, marginVertical: 8, backgroundColor: colors.border },
  statIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 27, lineHeight: 33, color: colors.blueDark, textAlign: 'center' },
  statLabel: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 18, color: colors.gray, textAlign: 'center' },
  list: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, overflow: 'hidden' },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 72, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  lastRow: { borderBottomWidth: 0 },
  rowIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, minWidth: 0, gap: 2 },
  className: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, color: colors.ink },
  classMeta: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: colors.gray },
  viewAll: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, backgroundColor: colors.blueSoft },
  viewAllText: { fontFamily: fonts.bold, fontSize: 14, color: colors.blue },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 70, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 17, color: colors.gray },
  detailValue: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 20, color: colors.ink },
  emptyCard: { alignItems: 'center', gap: 10, padding: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20 },
  emptyIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 22, color: colors.ink, textAlign: 'center' },
  emptyText: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: colors.gray, textAlign: 'center' },
  logout: { marginTop: 2 },
  pressed: { opacity: 0.7 },
});
