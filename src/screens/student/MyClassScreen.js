import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import AppTextInput from '../../components/AppTextInput';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Icon, LoadingView, EmptyState, Header } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { listenClass, listenClassMembers, countPublishedQuizzes } from '../../services/classService';
import { friendlyError } from '../../utils/errors';
import { initials, teacherShortName } from '../../utils/format';
import { colors, fonts, text, radius } from '../../theme';

const AVATAR_COLORS = [colors.orangeText, colors.blue, colors.purple, colors.green, colors.gray];

// Screen 33: student's view of the class (teacher and classmates)
export default function MyClassScreen({ navigation }) {
  const { user, profile } = useAuth();
  const classId = profile.classId;
  const [cls, setCls] = useState(undefined);
  const [members, setMembers] = useState(undefined);
  const [quizzes, setQuizzes] = useState(0);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!classId) { setCls(null); setMembers([]); return undefined; }
    setError('');
    const onError = (e) => setError(friendlyError(e));
    const stopClass = listenClass(classId, setCls, onError);
    const stopMembers = listenClassMembers(classId, setMembers, onError);
    countPublishedQuizzes(classId).then(setQuizzes).catch(() => {});
    return () => { stopClass(); stopMembers(); };
  }, [classId, retry]);

  if (error) {
    return (
      <Screen padded={false}>
        <Header title="Minha Turma" backLabel="Perfil" onBack={() => navigation.goBack()} background={colors.green} />
        <EmptyState isError title="Não foi possível carregar" message={error} actionLabel="Tentar novamente" onAction={() => setRetry((value) => value + 1)} actionVariant="success" />
      </Screen>
    );
  }
  if (cls === undefined || members === undefined) return <LoadingView message="Carregando turma..." />;
  if (!cls) return <Screen><EmptyState title="Turma indisponível" message="Sua turma não está disponível. Volte ao perfil e tente novamente." actionLabel="Voltar ao perfil" onAction={() => navigation.goBack()} actionVariant="success" /></Screen>;

  const position = members.findIndex((m) => m.id === user.uid) + 1;
  const classmates = members
    .filter((m) => m.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Screen padded={false} lightStatusBar>
      <ClassHeader cls={cls} total={members.length} quizzes={quizzes} position={position} onBack={() => navigation.goBack()} />
      <Screen scroll contentStyle={styles.content}>
        <Text style={text.label}>Professor</Text>
        <View style={styles.row}>
          <View style={[styles.avatarBig, { backgroundColor: colors.blue }]}>
            <Text style={styles.avatarText}>{initials(cls.teacherName?.replace('Prof. ', ''))}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{cls.teacherName ?? teacherShortName('')}</Text>
            <Text style={text.caption}>Responsável pela turma</Text>
          </View>
          <View style={styles.teacherTag}><Text style={styles.teacherTagText}>Professor</Text></View>
        </View>

        <View style={styles.listTitle}>
          <Text style={text.label}>Colegas · {members.length}</Text>
          <Text style={styles.az}>A–Z</Text>
        </View>
        <View style={styles.searchWrap}>
          <View style={styles.searchIcon}><Icon name="search" size={22} color={colors.gray} /></View>
          <AppTextInput value={search} onChangeText={setSearch} placeholder="Buscar colega" placeholderTextColor="#64748B" style={styles.search} />
        </View>

        {classmates.length === 0 ? (
          <EmptyState title="Nenhum colega encontrado" message="Tente buscar por outro nome." />
        ) : (
          <View style={styles.list}>
            {classmates.map((m, i) => {
              const me = m.id === user.uid;
              return (
                <View key={m.id} style={[styles.member, me && { backgroundColor: colors.greenSoft }, i === classmates.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
                    <Text style={styles.avatarText}>{initials(m.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name} numberOfLines={1}>{m.name}</Text>
                      {me && <View style={styles.me}><Text style={styles.meText}>Você</Text></View>}
                    </View>
                    <View style={styles.xp}>
                      <Icon name="zap" size={14} color={colors.purple} fill={colors.purple} />
                      <Text style={styles.xpText}>{m.xp ?? 0} XP</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </Screen>
    </Screen>
  );
}

function ClassHeader({ cls, total, quizzes, position, onBack }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Pressable onPress={onBack} style={styles.back} hitSlop={8}>
        <Icon name="chevron-left" size={22} color={colors.white} strokeWidth={2.6} />
        <Text style={styles.backLabel}>Perfil</Text>
      </Pressable>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>MINHA TURMA</Text>
          <Text style={styles.className}>{cls.name}</Text>
          <Text style={styles.school}>{cls.school ? `${cls.school} · ` : ''}Biologia</Text>
        </View>
        <View style={styles.codePill}><Text style={styles.codeText}>{cls.code}</Text></View>
      </View>
      <View style={styles.stats}>
        <Stat value={total} label="estudantes" />
        <Stat value={quizzes} label="quizzes" />
        <Stat value={position ? `${position}º` : '-'} label="sua posição" color={colors.greenDark} />
      </View>
    </View>
  );
}

function Stat({ value, label, color = colors.ink }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={text.caption}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.green, paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  back: { minHeight: 44, marginLeft: -8, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  backLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
  headerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  kicker: { fontFamily: fonts.extrabold, fontSize: 13, letterSpacing: 1, color: colors.white },
  className: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.white, marginTop: 2 },
  school: { fontFamily: fonts.semibold, fontSize: 15, color: colors.white, marginTop: 2 },
  codePill: { backgroundColor: colors.white, paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill },
  codeText: { fontFamily: fonts.extrabold, fontSize: 13, letterSpacing: 1, color: colors.greenDark },
  stats: { flexDirection: 'row', gap: 8, marginTop: 4 },
  stat: { flex: 1, backgroundColor: colors.white, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 20 },
  content: { paddingTop: 16, paddingBottom: 42, gap: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 20, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border,
  },
  avatarBig: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.white },
  name: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink, flexShrink: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  teacherTag: { backgroundColor: colors.blueSoft, paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.pill },
  teacherTagText: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.blue },
  listTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  az: { fontFamily: fonts.bold, fontSize: 13, color: colors.gray },
  searchWrap: { justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: 16, zIndex: 1 },
  search: {
    height: 54, borderRadius: radius.button, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface,
    paddingLeft: 48, paddingRight: 16, fontFamily: fonts.medium, fontSize: 16, color: colors.ink,
  },
  list: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 20, overflow: 'hidden' },
  member: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingLeft: 14, paddingRight: 12, borderBottomWidth: 2, borderBottomColor: '#F1F5F9' },
  me: { backgroundColor: colors.green, paddingVertical: 2, paddingHorizontal: 8, borderRadius: radius.pill },
  meText: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.white },
  xp: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  xpText: { fontFamily: fonts.bold, fontSize: 13, color: colors.purpleDark },
});
