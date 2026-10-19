import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

function BadgeRow({ badge, last }) {
  const [background, color] = BADGE_COLORS[badge.color] ?? BADGE_COLORS.green;
  return <View style={[styles.badgeRow, !last && styles.badgeDivider]} accessible accessibilityLabel={`${badge.title}, ${badge.unlocked ? 'desbloqueada' : 'bloqueada'}. ${badge.description}`}>
    <View style={[styles.badgeIcon, { backgroundColor: badge.unlocked ? background : colors.background }]}>
      <Icon name={badge.unlocked ? badge.icon : 'lock'} size={21} color={badge.unlocked ? color : colors.gray} />
    </View>
    <View style={styles.badgeCopy}>
      <Text style={[styles.badgeTitle, !badge.unlocked && styles.badgeTitleLocked]}>{badge.title}</Text>
      <Text style={styles.badgeHint}>{badge.description}</Text>
    </View>
    {badge.unlocked ? <Icon name="check-circle" size={19} color={colors.green} /> : null}
  </View>;
}

export default function StudentProfileScreen({ navigation }) {
  const { user, profile, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [classInfo, setClassInfo] = useState(undefined);
  const [members, setMembers] = useState(undefined);
  const [badges, setBadges] = useState(undefined);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);

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
  const earnedBadges = orderedBadges.filter((badge) => badge.unlocked);
  const upcomingBadges = orderedBadges.filter((badge) => !badge.unlocked);
  const statItems = [
    { label: 'XP conquistados', value: progress.xp.toLocaleString('pt-BR'), icon: 'zap', color: colors.purple, bg: colors.purpleSoft },
    { label: 'Dias de ofensiva', value: progress.streak, icon: 'flame', color: colors.orangeText, bg: colors.orangeSoft },
    { label: 'Lições concluídas', value: progress.lessons, icon: 'book-open', color: colors.green, bg: colors.greenSoft },
    { label: 'Acertos', value: progress.accuracy === null ? '—' : `${progress.accuracy}%`, icon: 'target', color: colors.blue, bg: colors.blueSoft },
  ];

  return <Screen padded={false} lightStatusBar={headerVisible}>
    <ScrollView showsVerticalScrollIndicator={false} scrollEventThrottle={32} onScroll={({ nativeEvent }) => setHeaderVisible(nativeEvent.contentOffset.y < insets.top + 140)} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 28 }}>
      <LinearGradient colors={[colors.greenDark, colors.green]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 10 }]}>
        <View style={styles.heroInner}>
          <View style={styles.topRow}>
            <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.back, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Voltar">
              <Icon name="chevron-left" size={22} color={colors.white} />
            </Pressable>
            <Text style={styles.topTitle}>Meu perfil</Text>
            <View style={styles.topSpacer} />
          </View>
          <View style={styles.identity}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials(profile.name)}</Text></View>
            <View style={styles.identityCopy}>
              <Text style={styles.eyebrow}>ESTUDANTE</Text>
              <Text style={styles.name} numberOfLines={2}>{profile.name}</Text>
              <Text style={styles.identityDetail} numberOfLines={2}>{classInfo?.name ?? 'Minha turma'}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {error ? <View style={styles.center}><EmptyState isError title="Não foi possível carregar o perfil" message={error} actionLabel="Tentar novamente" actionVariant="success" onAction={() => setRetry((value) => value + 1)} /></View>
        : classInfo === undefined || members === undefined || badges === undefined ? <LoadingView message="Carregando seu perfil..." />
        : <View style={styles.content}>
        <Text style={styles.sectionTitle}>Seu progresso</Text>
        <View style={styles.stats} accessibilityLabel="Resumo do seu progresso">
          {statItems.map((item, index) => <View key={item.label} style={[styles.stat, index % 2 === 0 && styles.statLeft, index < 2 && styles.statTop]}>
            <View style={styles.statTopLine}>
              <View style={[styles.statIcon, { backgroundColor: item.bg }]}><Icon name={item.icon} size={18} color={item.color} /></View>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{item.value}</Text>
            </View>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>)}
        </View>

        <Text style={[styles.sectionTitle, styles.sectionGap]}>Minha turma</Text>
        {classInfo ? <Pressable onPress={() => navigation.navigate('MyClass')} style={({ pressed }) => [styles.classCard, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`Abrir turma ${classInfo.name}`}>
          <View style={styles.classIcon}><Icon name="users" size={25} color={colors.green} /></View>
          <View style={styles.classCopy}>
            <Text style={styles.className} numberOfLines={2}>{classInfo.name}</Text>
            <Text style={styles.classDetail} numberOfLines={2}>{classInfo.teacherName ?? 'Professor(a)'} · {members.length} {members.length === 1 ? 'estudante' : 'estudantes'}</Text>
            {classInfo.school ? <Text style={styles.classSchool} numberOfLines={1}>{classInfo.school}</Text> : null}
          </View><Icon name="chevron-right" size={21} color={colors.gray} />
        </Pressable> : <View style={styles.emptyClass}><Text style={styles.classDetail}>Sua turma não está disponível no momento.</Text></View>}

        <View style={[styles.sectionHeading, styles.sectionGap]}>
          <Text style={styles.sectionTitle}>Conquistas</Text>
          <Text style={styles.badgeCount}>{progress.earned} de {progress.total}</Text>
        </View>
        <View style={styles.achievementProgress} accessibilityLabel={`${progress.earned} de ${progress.total} insígnias desbloqueadas`}>
          <View style={[styles.achievementProgressFill, { width: `${progress.total ? progress.earned / progress.total * 100 : 0}%` }]} />
        </View>
        <View style={styles.badgeGroup}>
          <Text style={styles.groupTitle}>Conquistadas</Text>
          {earnedBadges.length ? <View style={styles.badgeList}>{earnedBadges.map((badge, index) => <BadgeRow key={badge.id} badge={badge} last={index === earnedBadges.length - 1} />)}</View>
            : <View style={styles.badgeList}><Text style={styles.emptyBadges}>Suas conquistas vão aparecer aqui.</Text></View>}
        </View>
        {upcomingBadges.length ? <View style={styles.badgeGroup}>
          <Text style={styles.groupTitle}>Próximos objetivos</Text>
          <View style={styles.badgeList}>{upcomingBadges.map((badge, index) => <BadgeRow key={badge.id} badge={badge} last={index === upcomingBadges.length - 1} />)}</View>
        </View> : null}

        <View style={styles.account}>
          <Text style={styles.sectionTitle}>Conta</Text>
          <Button title="Sair da conta" icon="log-out" variant="dangerOutline" onPress={() => Alert.alert('Sair da conta?', 'Você poderá entrar novamente quando quiser.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: signOut }])} />
        </View>
      </View>}
    </ScrollView>
  </Screen>;
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingBottom: 27, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroInner: { width: '100%', maxWidth: 640, alignSelf: 'center' },
  topRow: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFFFFF24', alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.white },
  topSpacer: { width: 44 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 25 },
  avatar: { width: 66, height: 66, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 23, color: colors.greenDark },
  identityCopy: { flex: 1, gap: 3 },
  eyebrow: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 1.1, color: '#BCE8CF' },
  name: { fontFamily: fonts.extrabold, fontSize: 23, lineHeight: 29, color: colors.white },
  identityDetail: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 19, color: '#D5F3E2' },
  center: { paddingHorizontal: 20, paddingTop: 28 },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 27, gap: 12 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 19, lineHeight: 26, color: colors.ink },
  sectionGap: { marginTop: 18 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, overflow: 'hidden' },
  stat: { width: '50%', minHeight: 98, paddingHorizontal: 14, paddingVertical: 15, justifyContent: 'center', gap: 9 },
  statLeft: { borderRightWidth: 1, borderRightColor: colors.border },
  statTop: { borderBottomWidth: 1, borderBottomColor: colors.border },
  statTopLine: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  statIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  statValue: { flex: 1, fontFamily: fonts.extrabold, fontSize: 21, color: colors.ink },
  statLabel: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 17, color: colors.gray },
  classCard: { minHeight: 83, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20 },
  classIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
  classCopy: { flex: 1, gap: 3 }, className: { fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 22, color: colors.ink },
  classDetail: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 18, color: colors.gray },
  classSchool: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, color: colors.gray },
  emptyClass: { padding: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18 }, pressed: { opacity: 0.72 },
  badgeCount: { fontFamily: fonts.bold, fontSize: 13, color: colors.greenDark },
  achievementProgress: { height: 7, borderRadius: 4, backgroundColor: '#DDE9E2', overflow: 'hidden' },
  achievementProgressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.green },
  badgeGroup: { gap: 9, marginTop: 8 },
  groupTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.gray },
  badgeList: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 15, overflow: 'hidden' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  badgeDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  badgeIcon: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badgeCopy: { flex: 1, gap: 3 },
  badgeTitle: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 19, color: colors.ink },
  badgeTitleLocked: { color: colors.gray },
  badgeHint: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: colors.gray },
  emptyBadges: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 20, color: colors.gray, paddingVertical: 17 },
  account: { gap: 13, marginTop: 22 },
});
