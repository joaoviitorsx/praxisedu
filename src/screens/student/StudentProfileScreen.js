import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, EmptyState, Icon, LoadingView, Screen } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { listenClass, listenClassMembers } from '../../services/classService';
import { listenBadges, reconcileLessonBadges, reconcileDuelBadge } from '../../services/badgeService';
import { getProfileBadges, getProfileProgress } from '../../features/student/studentProfileModel';
import { friendlyError } from '../../utils/errors';
import { initials } from '../../utils/format';
import { colors, fonts } from '../../theme';

const BADGE_COLORS = {
  green: [colors.greenSoft, colors.green], yellow: [colors.yellowSoft, colors.yellowDark],
  purple: [colors.purpleSoft, colors.purple], orange: [colors.orangeSoft, colors.orangeText],
};

export default function StudentProfileScreen({ navigation }) {
  const { user, profile, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const singleBadgeColumn = width < 360 || fontScale >= 1.3;
  const [classInfo, setClassInfo] = useState(undefined);
  const [members, setMembers] = useState(undefined);
  const [badges, setBadges] = useState(undefined);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setError('');
    const fail = (cause) => setError(friendlyError(cause));
    const stops = [
      listenBadges(user.uid, setBadges, fail),
      listenClass(profile.classId, setClassInfo, fail),
      listenClassMembers(profile.classId, setMembers, fail),
    ];
    return () => stops.forEach((stop) => stop());
  }, [user.uid, profile.classId, retry]);
  useEffect(() => { reconcileLessonBadges(user.uid, profile.stats ?? {}).catch(() => {}); }, [user.uid, profile.stats, retry]);
  useEffect(() => { reconcileDuelBadge(user.uid, profile.classId).catch(() => {}); }, [user.uid, profile.classId, retry]);

  const progress = getProfileProgress(profile.stats, badges);
  const orderedBadges = getProfileBadges(badges);
  const statItems = [
    { label: 'XP conquistados', value: progress.xp.toLocaleString('pt-BR'), icon: 'zap', color: colors.purple, bg: colors.purpleSoft },
    { label: 'Dias de ofensiva', value: progress.streak, icon: 'flame', color: colors.orangeText, bg: colors.orangeSoft },
    { label: 'Lições concluídas', value: progress.lessons, icon: 'book-open', color: colors.green, bg: colors.greenSoft },
    { label: 'Acertos', value: progress.accuracy === null ? '—' : `${progress.accuracy}%`, icon: 'target', color: colors.blue, bg: colors.blueSoft },
  ];

  return <Screen padded={false}>
    <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topInner}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.back, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Voltar"><Icon name="chevron-left" size={22} color={colors.ink} /></Pressable>
        <Text style={styles.topTitle}>Meu perfil</Text><View style={styles.topSpacer} />
      </View>
    </View>
    {error ? <View style={styles.center}><EmptyState isError title="Não foi possível carregar o perfil" message={error} actionLabel="Tentar novamente" actionVariant="success" onAction={() => setRetry((value) => value + 1)} /></View>
      : classInfo === undefined || members === undefined || badges === undefined ? <LoadingView message="Carregando seu perfil..." />
      : <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 32 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          <View style={styles.identityGlow} />
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials(profile.name)}</Text></View>
          <View style={styles.identityCopy}>
            <Text style={styles.eyebrow}>PERFIL ESTUDANTE</Text>
            <Text style={styles.name} numberOfLines={2}>{profile.name}</Text>
            <Text style={styles.identityDetail} numberOfLines={2}>{classInfo?.name ?? 'Minha jornada de aprendizagem'}</Text>
          </View>
        </View>

        <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Seu progresso</Text><Text style={styles.sectionSubtitle}>Cada passo conta na sua jornada.</Text></View></View>
        <View style={styles.stats} accessibilityLabel="Resumo do seu progresso">
          {statItems.map((item, index) => <View key={item.label} style={[styles.stat, index % 2 === 0 && styles.statLeft, index < 2 && styles.statTop]}>
            <View style={[styles.statIcon, { backgroundColor: item.bg }]}><Icon name={item.icon} size={19} color={item.color} /></View>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>)}
        </View>

        <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>Minha turma</Text><Text style={styles.sectionSubtitle}>Aprender junto também faz parte.</Text></View></View>
        {classInfo ? <Pressable onPress={() => navigation.navigate('MyClass')} style={({ pressed }) => [styles.classCard, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`Abrir turma ${classInfo.name}`}>
          <View style={styles.classIcon}><Icon name="users" size={25} color={colors.green} /></View>
          <View style={styles.classCopy}>
            <Text style={styles.className} numberOfLines={2}>{classInfo.name}</Text>
            <Text style={styles.classDetail} numberOfLines={2}>{classInfo.teacherName ?? 'Professor(a)'} · {members.length} {members.length === 1 ? 'estudante' : 'estudantes'}</Text>
            {classInfo.school ? <Text style={styles.classSchool} numberOfLines={1}>{classInfo.school}</Text> : null}
          </View><Icon name="chevron-right" size={21} color={colors.gray} />
        </Pressable> : <View style={styles.emptyClass}><Text style={styles.classDetail}>Sua turma não está disponível no momento.</Text></View>}

        <View style={styles.sectionHeading}>
          <View style={styles.achievementCopy}><Text style={styles.sectionTitle}>Conquistas</Text><Text style={styles.sectionSubtitle}>Insígnias que contam sua história.</Text></View>
          <View style={styles.badgeCount}><Icon name="trophy" size={15} color={colors.green} /><Text style={styles.badgeCountText}>{progress.earned}/{progress.total}</Text></View>
        </View>
        <View style={styles.achievementProgress} accessibilityLabel={`${progress.earned} de ${progress.total} insígnias desbloqueadas`}><View style={[styles.achievementProgressFill, { width: `${progress.earned / progress.total * 100}%` }]} /></View>
        <View style={styles.badges}>
          {orderedBadges.map((badge) => {
            const [bg, color] = BADGE_COLORS[badge.color];
            return <View key={badge.id} style={[styles.badge, singleBadgeColumn && styles.badgeWide, !badge.unlocked && styles.badgeLocked]} accessible accessibilityLabel={`${badge.title}, ${badge.unlocked ? 'desbloqueada' : 'bloqueada'}. ${badge.description}`}>
              <View style={[styles.badgeIcon, { backgroundColor: badge.unlocked ? bg : colors.background }]}><Icon name={badge.unlocked ? badge.icon : 'lock'} size={24} color={badge.unlocked ? color : colors.gray} /></View>
              <Text style={[styles.badgeStatus, badge.unlocked ? styles.badgeStatusEarned : styles.badgeStatusLocked]}>{badge.unlocked ? 'CONQUISTADA' : 'A DESBLOQUEAR'}</Text>
              <Text style={styles.badgeTitle}>{badge.title}</Text><Text style={styles.badgeHint}>{badge.description}</Text>
            </View>;
          })}
        </View>

        <View style={styles.account}>
          <Text style={styles.sectionTitle}>Conta</Text><Text style={styles.sectionSubtitle}>Você pode voltar quando quiser.</Text>
          <Button title="Sair da conta" icon="log-out" variant="dangerOutline" onPress={() => Alert.alert('Sair da conta?', 'Você poderá entrar novamente quando quiser.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: signOut }])} />
        </View>
      </ScrollView>}
  </Screen>;
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 20, paddingBottom: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border },
  topInner: { width: '100%', maxWidth: 640, alignSelf: 'center', height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink }, topSpacer: { width: 44 },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 20, gap: 14 },
  identity: { minHeight: 142, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 24, backgroundColor: colors.greenSoft, borderWidth: 1, borderColor: '#CBEAD8' },
  identityGlow: { position: 'absolute', right: -32, top: -72, width: 180, height: 180, borderRadius: 90, borderWidth: 30, borderColor: '#D9F1E4' },
  avatar: { width: 76, height: 76, borderRadius: 24, backgroundColor: colors.green, borderWidth: 3, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 25, color: colors.white }, identityCopy: { flex: 1, gap: 5 },
  eyebrow: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 1, color: colors.greenDark },
  name: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 28, color: colors.ink },
  identityDetail: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 19, color: colors.greenDark },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 10 },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 20, lineHeight: 27, color: colors.ink },
  sectionSubtitle: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: colors.gray },
  stats: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, overflow: 'hidden' },
  stat: { width: '50%', minHeight: 132, padding: 16, justifyContent: 'center', alignItems: 'flex-start', gap: 3 },
  statLeft: { borderRightWidth: 1, borderRightColor: colors.border }, statTop: { borderBottomWidth: 1, borderBottomColor: colors.border },
  statIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.ink },
  statLabel: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 18, color: colors.gray },
  classCard: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20 },
  classIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
  classCopy: { flex: 1, gap: 3 }, className: { fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 22, color: colors.ink },
  classDetail: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 18, color: colors.gray },
  classSchool: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, color: colors.gray },
  emptyClass: { padding: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18 }, pressed: { opacity: 0.72 },
  achievementCopy: { flex: 1 }, badgeCount: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colors.greenSoft },
  badgeCountText: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.greenDark },
  achievementProgress: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden', marginBottom: 2 },
  achievementProgressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.green },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { width: '48%', flexGrow: 1, minHeight: 176, padding: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, alignItems: 'flex-start', gap: 4 },
  badgeWide: { width: '100%' }, badgeLocked: { backgroundColor: '#FCFDFE' },
  badgeIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  badgeStatus: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 0.6 },
  badgeStatusEarned: { color: colors.green }, badgeStatusLocked: { color: colors.gray },
  badgeTitle: { fontFamily: fonts.extrabold, fontSize: 15, lineHeight: 21, color: colors.ink },
  badgeHint: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: colors.gray },
  account: { gap: 7, marginTop: 12 },
});
