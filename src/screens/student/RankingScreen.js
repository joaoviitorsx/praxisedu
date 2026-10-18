import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
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
  const reduceMotion = useReducedMotion();
  const [rows, setRows] = useState(undefined);
  const [classInfo, setClassInfo] = useState(undefined);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
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

  const header = <View>
    <View style={[styles.hero, { paddingTop: insets.top + 18 }]}>
      <View style={styles.heroTop}>
        <View style={styles.heroIcon}><Icon name="trophy" size={25} color={colors.green} /></View>
        <View style={styles.weekChip}><Icon name="clock" size={15} color={colors.greenDark} /><Text style={styles.weekChipText}>Semana {weekNumber}</Text></View>
      </View>
      <Text style={styles.eyebrow}>LIGA SEMANAL DE BIOLOGIA</Text>
      <Text style={styles.heading}>Ranking da turma</Text>
      <Text style={styles.subtitle} numberOfLines={2}>{classInfo?.name ?? 'Sua turma'} · uma nova chance a cada semana</Text>
    </View>

    {rows?.length ? <View style={styles.sections}>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionCopy}><Text style={styles.sectionTitle}>Pódio da turma</Text><Text style={styles.sectionHint}>Quem mais pontuou nesta semana</Text></View>
        <View style={styles.participants}><Icon name="users" size={15} color={colors.green} /><Text style={styles.participantsText}>{rows.length}</Text></View>
      </View>

      <Reanimated.View entering={reduceMotion ? undefined : FadeInDown.duration(320).delay(70)} style={styles.podium}>
        {podium.map((person) => <PodiumCard key={person.id} person={person} />)}
      </Reanimated.View>

      <Reanimated.View entering={reduceMotion ? undefined : FadeInDown.duration(320).delay(150)} style={styles.summary}>
        <View style={styles.summaryIcon}><Icon name={summary ? 'trophy' : 'info'} size={22} color={colors.green} /></View>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryEyebrow}>{summary ? 'SUA POSIÇÃO' : 'SUA VEZ DE ENTRAR'}</Text>
          <Text style={styles.summaryTitle}>{summary ? `${summary.position}º lugar · ${formatPoints(summary.points)} pts` : 'Seu nome ainda não aparece'}</Text>
          <Text style={styles.summaryMessage}>{summary ? summary.position === 1 ? 'Você lidera a liga! Continue aprendendo para manter a posição.' : summary.gap ? `Faltam ${formatPoints(summary.gap)} pontos para alcançar ${summary.nextName}.` : `Você está empatado em pontos com ${summary.nextName}.` : 'Conclua lições e participe dos duelos para pontuar.'}</Text>
        </View>
      </Reanimated.View>

      <View style={styles.sectionHeading}>
        <View style={styles.sectionCopy}><Text style={styles.sectionTitle}>Classificação completa</Text><Text style={styles.sectionHint}>Acompanhe sua turma em tempo real</Text></View>
      </View>
    </View> : null}
  </View>;

  return <Screen padded={false}>
    {error ? <View style={styles.center}><EmptyState isError title="Não foi possível carregar o ranking" message={error} actionLabel="Tentar novamente" actionVariant="success" onAction={() => setRetry((value) => value + 1)} /></View>
      : rows === undefined || classInfo === undefined ? <LoadingView message="Carregando ranking..." />
      : <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
        ListHeaderComponent={header}
        ListEmptyComponent={<View style={styles.empty}><EmptyState title={profile.classId ? 'A liga começa com você' : 'Entre em uma turma para participar'} message={profile.classId ? 'Conclua uma lição para ganhar os primeiros pontos da semana.' : 'Quando você entrar em uma turma, a classificação semanal aparecerá aqui.'} /></View>}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />}
  </Screen>;
}

const PodiumCard = memo(function PodiumCard({ person }) {
  const isFirst = person.position === 1;
  return <View style={[styles.podiumCard, isFirst && styles.podiumFirst]} accessible accessibilityLabel={`${person.position}º lugar: ${person.isMe ? 'você' : person.name}, ${formatPoints(person.points)} pontos`}>
    <View style={[styles.podiumAvatar, isFirst && styles.podiumAvatarFirst, person.isMe && styles.avatarMe]}><Text style={styles.podiumInitials}>{initials(person.name)}</Text></View>
    <Text style={[styles.place, isFirst && styles.placeFirst]}>{person.position}º</Text>
    <Text style={styles.podiumName} numberOfLines={2}>{person.isMe ? 'Você' : person.name}</Text>
    <Text style={styles.podiumPoints}>{formatPoints(person.points)} pts</Text>
  </View>;
});

const RankingRow = memo(function RankingRow({ item }) {
  return <View style={[styles.row, item.isMe && styles.meRow]} accessible accessibilityLabel={`${item.position}º lugar: ${item.isMe ? 'você' : item.name}, ${formatPoints(item.points)} pontos`}>
    <View style={[styles.rowPlace, item.isMe && styles.rowPlaceMe]}><Text style={[styles.rowPlaceText, item.isMe && styles.rowPlaceTextMe]}>{item.position}º</Text></View>
    <View style={[styles.rowAvatar, item.isMe && styles.avatarMe]}><Text style={styles.rowInitials}>{initials(item.name)}</Text></View>
    <View style={styles.rowCopy}><Text style={styles.rowName} numberOfLines={1}>{item.name}{item.isMe ? ' · Você' : ''}</Text>{item.duelsWon > 0 && <Text style={styles.rowDetail}>{item.duelsWon} {item.duelsWon === 1 ? 'duelo vencido' : 'duelos vencidos'}</Text>}</View>
    <Text style={styles.rowPoints}>{formatPoints(item.points)} pts</Text>
  </View>;
});

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  listContent: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingBottom: 28 },
  hero: { paddingHorizontal: 20, paddingBottom: 24, backgroundColor: colors.green, gap: 5 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  heroIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  weekChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.white },
  weekChipText: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.greenDark },
  eyebrow: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 1, color: colors.greenSoft },
  heading: { fontFamily: fonts.extrabold, fontSize: 29, lineHeight: 36, color: colors.white },
  subtitle: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.white },
  sections: { paddingHorizontal: 20, paddingTop: 20 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  sectionCopy: { flex: 1, gap: 2 },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 20, lineHeight: 27, color: colors.ink },
  sectionHint: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, color: colors.gray },
  participants: { flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 42, minHeight: 34, justifyContent: 'center', borderRadius: 11, backgroundColor: colors.greenSoft, paddingHorizontal: 9 },
  participantsText: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.greenDark },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 16 },
  podiumCard: { flex: 1, maxWidth: 190, minWidth: 0, minHeight: 158, paddingHorizontal: 7, paddingVertical: 12, borderRadius: 19, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  podiumFirst: { minHeight: 184, backgroundColor: colors.yellowSoft, borderColor: colors.yellow },
  podiumAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  podiumAvatarFirst: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.yellowDark },
  avatarMe: { backgroundColor: colors.green },
  podiumInitials: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.white },
  place: { fontFamily: fonts.extrabold, fontSize: 21, color: colors.ink },
  placeFirst: { color: colors.greenDark },
  podiumName: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16, textAlign: 'center', color: colors.ink },
  podiumPoints: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.greenDark },
  summary: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#CBEAD8', backgroundColor: colors.greenSoft, marginBottom: 24 },
  summaryIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  summaryCopy: { flex: 1, gap: 3 },
  summaryEyebrow: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 1, color: colors.greenDark },
  summaryTitle: { fontFamily: fonts.extrabold, fontSize: 18, lineHeight: 24, color: colors.ink },
  summaryMessage: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: colors.greenDark },
  empty: { paddingHorizontal: 20, paddingTop: 26 },
  row: { minHeight: 68, marginHorizontal: 20, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 11, paddingVertical: 9, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.surface },
  meRow: { borderColor: colors.green, backgroundColor: colors.greenSoft },
  rowPlace: { width: 31, height: 31, borderRadius: 10, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  rowPlaceMe: { backgroundColor: colors.white },
  rowPlaceText: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.gray },
  rowPlaceTextMe: { color: colors.greenDark },
  rowAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  rowInitials: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.white },
  rowCopy: { flex: 1, minWidth: 0, gap: 2 },
  rowName: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  rowDetail: { fontFamily: fonts.medium, fontSize: 11, color: colors.gray },
  rowPoints: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.greenDark },
});
