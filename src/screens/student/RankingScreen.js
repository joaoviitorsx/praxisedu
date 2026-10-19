import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { EmptyState, Icon, LoadingView, Screen } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import useReducedMotion from '../../hooks/useReducedMotion';
import { getClass } from '../../services/classService';
import { listenWeeklyRanking } from '../../services/rankingService';
import { rankingPodium, rankingSummary } from '../../features/student/rankingModel';
import { getWeekId } from '../../utils/dates';
import { initials } from '../../utils/format';
import { friendlyError } from '../../utils/errors';
import { colors, fonts } from '../../theme';

const formatPoints = (points) => Number(points || 0).toLocaleString('pt-BR');

export default function RankingScreen() {
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const compactPodium = width < 350 || fontScale >= 1.3;
  const [rows, setRows] = useState(undefined);
  const [classInfo, setClassInfo] = useState(undefined);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const weekId = getWeekId();

  useEffect(() => {
    setError('');
    if (!profile.classId) { setRows([]); setClassInfo(null); return undefined; }
    setRows(undefined);
    setClassInfo(undefined);
    let active = true;
    getClass(profile.classId).then((data) => { if (active) setClassInfo(data); }).catch((cause) => { if (active) setError(friendlyError(cause)); });
    const stop = listenWeeklyRanking(profile.classId, weekId, user.uid, setRows, (cause) => setError(friendlyError(cause)));
    return () => { active = false; stop(); };
  }, [profile.classId, user.uid, weekId, retry]);

  const summary = useMemo(() => rankingSummary(rows ?? [], user.uid), [rows, user.uid]);
  const podium = useMemo(() => rankingPodium(rows ?? []), [rows]);
  const renderRow = useCallback(({ item }) => <RankingRow item={item} />, []);
  const weekNumber = weekId.split('-W')[1];

  const hero = <LinearGradient colors={[colors.greenDark, colors.green]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 15 }]}>
      <View style={styles.heroInner}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}><Icon name="trophy" size={23} color={colors.greenDark} /></View>
          <View style={styles.weekChip}><Icon name="clock" size={14} color={colors.white} /><Text style={styles.weekChipText}>Semana {weekNumber}</Text></View>
        </View>
        <Text style={styles.eyebrow}>LIGA SEMANAL DE BIOLOGIA</Text>
        <Text style={styles.heading}>Ranking da turma</Text>
        <Text style={styles.subtitle} numberOfLines={2}>{classInfo?.name ?? 'Sua turma'}</Text>
      </View>
    </LinearGradient>;

  const header = <View>
    {hero}

    {rows?.length ? <View style={styles.sections}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Pódio da turma</Text>
        <Text style={styles.participants}>{rows.length} {rows.length === 1 ? 'participante' : 'participantes'}</Text>
      </View>

      <Reanimated.View entering={reduceMotion ? undefined : FadeInDown.duration(320).delay(70)} style={[styles.podium, compactPodium && styles.podiumCompact]}>
        {(compactPodium ? [...podium].sort((a, b) => a.position - b.position) : podium).map((person) => <PodiumCard key={person.id} person={person} compact={compactPodium} />)}
      </Reanimated.View>

      <Reanimated.View entering={reduceMotion ? undefined : FadeInDown.duration(320).delay(150)} style={styles.summary}>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryEyebrow}>{summary ? 'SUA POSIÇÃO' : 'SUA VEZ DE ENTRAR'}</Text>
          <Text style={styles.summaryTitle}>{summary ? `${summary.position}º lugar · ${formatPoints(summary.points)} pts` : 'Seu nome ainda não aparece'}</Text>
          <Text style={styles.summaryMessage}>{summary ? summary.position === 1 ? 'Você está na liderança esta semana.' : summary.gap ? `${formatPoints(summary.gap)} pontos até ${summary.nextName}.` : `Empatado em pontos com ${summary.nextName}.` : 'Conclua lições ou vença duelos para pontuar.'}</Text>
        </View>
        <View style={styles.summaryMark}><Icon name={summary ? 'trophy' : 'zap'} size={22} color={colors.green} /></View>
      </Reanimated.View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Classificação completa</Text>
      </View>
    </View> : null}
  </View>;

  const isLoading = rows === undefined || classInfo === undefined;

  return <Screen padded={false} lightStatusBar={Boolean(error) || isLoading || headerVisible}>
    {error ? <>{hero}<View style={styles.center}><EmptyState isError title="Não foi possível carregar o ranking" message={error} actionLabel="Tentar novamente" actionVariant="success" onAction={() => setRetry((value) => value + 1)} /></View></>
      : isLoading ? <>{hero}<LoadingView message="Carregando ranking..." /></>
      : <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
        ListHeaderComponent={header}
        ListEmptyComponent={<View style={styles.empty}><EmptyState title={profile.classId ? 'A liga começa com você' : 'Entre em uma turma para participar'} message={profile.classId ? 'Conclua uma lição para ganhar os primeiros pontos da semana.' : 'Quando você entrar em uma turma, a classificação semanal aparecerá aqui.'} /></View>}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={32}
        onScroll={({ nativeEvent }) => setHeaderVisible(nativeEvent.contentOffset.y < insets.top + 145)}
      />}
  </Screen>;
}

const PodiumCard = memo(function PodiumCard({ person, compact }) {
  const isFirst = person.position === 1;
  return <View style={[styles.podiumCard, isFirst && styles.podiumFirst, compact && styles.podiumCardCompact]} accessible accessibilityLabel={`${person.position}º lugar: ${person.isMe ? 'você' : person.name}, ${formatPoints(person.points)} pontos`}>
    <View style={[styles.podiumAvatar, isFirst && styles.podiumAvatarFirst, person.isMe && styles.avatarMe]}><Text style={styles.podiumInitials}>{initials(person.name)}</Text></View>
    <View style={[styles.podiumDetails, compact && styles.podiumDetailsCompact]}>
      <View style={[styles.placePill, isFirst && styles.placePillFirst]}><Text style={[styles.place, isFirst && styles.placeFirst]}>{person.position}º lugar</Text></View>
      <Text style={[styles.podiumName, compact && styles.podiumNameCompact]} numberOfLines={compact ? 1 : 2}>{person.isMe ? 'Você' : person.name}</Text>
      <Text style={[styles.podiumPoints, isFirst && styles.podiumPointsFirst]}>{formatPoints(person.points)} pts</Text>
    </View>
  </View>;
});

const RankingRow = memo(function RankingRow({ item }) {
  return <View style={[styles.row, item.isMe && styles.meRow]} accessible accessibilityLabel={`${item.position}º lugar: ${item.isMe ? 'você' : item.name}, ${formatPoints(item.points)} pontos`}>
    <Text style={[styles.rowPlaceText, item.isMe && styles.rowPlaceTextMe]}>{item.position}º</Text>
    <View style={[styles.rowAvatar, item.isMe && styles.avatarMe]}><Text style={styles.rowInitials}>{initials(item.name)}</Text></View>
    <View style={styles.rowCopy}>
      <Text style={styles.rowName} numberOfLines={1}>{item.isMe ? 'Você' : item.name}</Text>
      {item.isMe || item.duelsWon > 0 ? <Text style={styles.rowDetail} numberOfLines={1}>{item.isMe ? item.name : `${item.duelsWon} ${item.duelsWon === 1 ? 'duelo vencido' : 'duelos vencidos'}`}</Text> : null}
    </View>
    <Text style={styles.rowPoints}>{formatPoints(item.points)} pts</Text>
  </View>;
});

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  listContent: { width: '100%', paddingBottom: 28 },
  hero: { paddingHorizontal: 20, paddingBottom: 27, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroInner: { width: '100%', maxWidth: 640, alignSelf: 'center' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 19 },
  heroIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  weekChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#FFFFFF24' },
  weekChipText: { fontFamily: fonts.bold, fontSize: 12, color: colors.white },
  eyebrow: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 1.1, color: '#BCE8CF' },
  heading: { fontFamily: fonts.extrabold, fontSize: 27, lineHeight: 34, color: colors.white, marginTop: 5 },
  subtitle: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 19, color: '#D5F3E2', marginTop: 3 },
  sections: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 27 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  sectionTitle: { flexShrink: 1, fontFamily: fonts.extrabold, fontSize: 19, lineHeight: 26, color: colors.ink },
  participants: { fontFamily: fonts.semibold, fontSize: 12, color: colors.gray },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 15 },
  podiumCompact: { flexDirection: 'column', alignItems: 'stretch' },
  podiumCard: { flex: 1, maxWidth: 190, minWidth: 0, minHeight: 150, paddingHorizontal: 8, paddingVertical: 13, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'flex-end', gap: 9 },
  podiumCardCompact: { flex: 0, maxWidth: '100%', minHeight: 75, flexDirection: 'row', justifyContent: 'flex-start', paddingHorizontal: 13, gap: 12 },
  podiumFirst: { minHeight: 172, borderColor: '#A5D7BA', borderTopWidth: 3 },
  podiumAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.gray, alignItems: 'center', justifyContent: 'center' },
  podiumAvatarFirst: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.greenDark },
  avatarMe: { backgroundColor: colors.green },
  podiumInitials: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.white },
  podiumDetails: { width: '100%', alignItems: 'center', gap: 5 },
  podiumDetailsCompact: { flex: 1, width: 'auto', alignItems: 'flex-start' },
  placePill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.background },
  placePillFirst: { backgroundColor: colors.greenSoft },
  place: { fontFamily: fonts.bold, fontSize: 11, color: colors.gray },
  placeFirst: { color: colors.greenDark },
  podiumName: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 17, textAlign: 'center', color: colors.ink },
  podiumNameCompact: { textAlign: 'left' },
  podiumPoints: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.ink },
  podiumPointsFirst: { color: colors.greenDark },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 17, borderRadius: 18, borderWidth: 1, borderColor: '#CBEAD8', backgroundColor: colors.greenSoft, marginBottom: 26 },
  summaryCopy: { flex: 1, gap: 4 },
  summaryEyebrow: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 1, color: colors.greenDark },
  summaryTitle: { fontFamily: fonts.extrabold, fontSize: 18, lineHeight: 25, color: colors.ink },
  summaryMessage: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, color: colors.greenDark },
  summaryMark: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  empty: { paddingHorizontal: 20, paddingTop: 26 },
  row: { width: '92%', maxWidth: 600, alignSelf: 'center', minHeight: 65, marginBottom: 7, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.surface },
  meRow: { borderColor: '#B9E2CC', backgroundColor: colors.greenSoft },
  rowPlaceText: { width: 27, fontFamily: fonts.extrabold, fontSize: 13, color: colors.gray, textAlign: 'center' },
  rowPlaceTextMe: { color: colors.greenDark },
  rowAvatar: { width: 37, height: 37, borderRadius: 19, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  rowInitials: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.white },
  rowCopy: { flex: 1, minWidth: 0, gap: 2 },
  rowName: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  rowDetail: { fontFamily: fonts.medium, fontSize: 11, color: colors.gray },
  rowPoints: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.greenDark, textAlign: 'right' },
});
