import { memo, useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, EmptyState, Icon, LoadingView, Screen } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { listenMyDuels } from '../../services/duelService';
import { duelState } from '../../features/student/duelModel';
import { topicLabel } from '../../constants/topics';
import { friendlyError } from '../../utils/errors';
import { initials } from '../../utils/format';
import { colors, fonts, text } from '../../theme';

const STATE_LABELS = { play: 'Seu turno', waiting: 'Aguardando', result: 'Resultado', declined: 'Recusado' };

export default function DuelsScreen() {
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [duels, setDuels] = useState(undefined);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!profile.classId) { setDuels([]); return undefined; }
    setError('');
    setDuels(undefined);
    return listenMyDuels(profile.classId, user.uid, setDuels, (cause) => setError(friendlyError(cause)));
  }, [profile.classId, user.uid, retry]);

  const renderDuel = useCallback(({ item }) => <DuelRow item={item} uid={user.uid} />, [user.uid]);

  const header = <View style={[styles.header, { paddingTop: insets.top + 20 }]}><Text style={styles.kicker}>DESAFIOS DA TURMA</Text><Text style={styles.heading}>Duelos 1×1</Text><Text style={styles.subtitle}>Convide um colega, responda cinco questões e compare os resultados.</Text><Button title="Desafiar colega" icon="plus" onPress={() => router.push('/student/duel/new')} style={styles.challenge} /></View>;

  return <Screen padded={false}>
    {error ? <View style={styles.center}><EmptyState isError title="Não foi possível carregar os duelos" message={error} actionLabel="Tentar novamente" actionVariant="success" onAction={() => setRetry((value) => value + 1)} /></View>
      : duels === undefined ? <LoadingView message="Carregando duelos..." />
      : <FlatList data={duels} keyExtractor={(duel) => duel.id} ListHeaderComponent={header} contentContainerStyle={styles.content} ListEmptyComponent={<EmptyState title="Nenhum duelo ainda" message="Desafie um colega e descubra quem sabe mais Biologia." />} renderItem={renderDuel} />}
  </Screen>;
}

const DuelRow = memo(function DuelRow({ item, uid }) {
  const otherId = item.challengerId === uid ? item.opponentId : item.challengerId;
  const otherName = item.players?.[otherId]?.name ?? 'Colega';
  const state = duelState(item, uid);
  return <Pressable onPress={() => router.push({ pathname: '/student/duel/[duelId]', params: { duelId: item.id } })} style={({ pressed }) => [styles.row, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`Duelo com ${otherName}, ${STATE_LABELS[state]}`}>
    <View style={styles.avatar}><Text style={styles.avatarText}>{initials(otherName)}</Text></View><View style={styles.rowCopy}><Text style={styles.rowName} numberOfLines={1}>{otherName}</Text><Text style={styles.rowDetail}>{topicLabel(item.topic)}</Text></View><View style={[styles.status, state === 'play' && styles.statusPlay]}><Text style={[styles.statusText, state === 'play' && styles.statusPlayText]}>{STATE_LABELS[state]}</Text></View><Icon name="chevron-right" size={19} color={colors.gray} />
  </Pressable>;
});

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 }, content: { paddingHorizontal: 20, paddingBottom: 30, gap: 12 }, header: { gap: 5, paddingBottom: 16 }, kicker: { ...text.label, color: colors.purple }, heading: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.ink }, subtitle: { ...text.body, color: colors.gray, lineHeight: 23 }, challenge: { marginTop: 14 }, row: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 18 }, pressed: { opacity: 0.7 }, avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.purple }, avatarText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.white }, rowCopy: { flex: 1, gap: 3 }, rowName: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.ink }, rowDetail: { ...text.caption }, status: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.border }, statusPlay: { backgroundColor: colors.yellowSoft }, statusText: { fontFamily: fonts.extrabold, fontSize: 11, color: colors.gray }, statusPlayText: { color: colors.orangeText },
});
