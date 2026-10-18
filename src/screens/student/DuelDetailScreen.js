import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, EmptyState, Icon, LoadingView, Screen } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { listenDuel, finishDuelTurn, claimDuelReward, declineDuel } from '../../services/duelService';
import { orderedQuizQuestions } from '../../features/student/classroomModel';
import { duelState } from '../../features/student/duelModel';
import { DUEL_POINTS, XP_PER_CORRECT } from '../../constants/gamification';
import { topicLabel } from '../../constants/topics';
import { friendlyError } from '../../utils/errors';
import { colors, fonts, text } from '../../theme';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function DuelDetailScreen({ duelId }) {
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [duel, setDuel] = useState(undefined);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState(null);
  const [picks, setPicks] = useState([]);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    setError('');
    setDuel(undefined);
    setIndex(0);
    setChoice(null);
    setPicks([]);
    return listenDuel(profile.classId, duelId, setDuel, (cause) => setError(friendlyError(cause)));
  }, [profile.classId, duelId, retry]);

  const state = duel ? duelState(duel, user.uid) : null;
  const questions = duel ? orderedQuizQuestions(duel.questions) : [];
  const question = questions[index];
  const otherId = duel?.challengerId === user.uid ? duel?.opponentId : duel?.challengerId;
  const otherName = duel?.players?.[otherId]?.name ?? 'colega';
  const mine = duel?.players?.[user.uid];
  const other = duel?.players?.[otherId];
  const result = duel?.winnerId === 'draw' ? 'draw' : duel?.winnerId === user.uid ? 'win' : 'loss';

  async function next() {
    if (choice === null || busy.current) return;
    const nextPicks = [...picks, choice];
    if (index < questions.length - 1) { setPicks(nextPicks); setChoice(null); setIndex(index + 1); return; }
    busy.current = true;
    setSaving(true);
    try { await finishDuelTurn(profile.classId, duelId, user.uid, nextPicks); }
    catch (cause) { Alert.alert('Não foi possível enviar seu turno', friendlyError(cause)); }
    finally { busy.current = false; setSaving(false); }
  }

  async function claim() {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    try { await claimDuelReward({ classId: profile.classId, duelId, uid: user.uid, name: profile.name }); }
    catch (cause) { Alert.alert('Não foi possível resgatar os pontos', friendlyError(cause)); }
    finally { busy.current = false; setSaving(false); }
  }

  function decline() {
    Alert.alert('Recusar duelo?', 'O desafio será encerrado para os dois jogadores.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Recusar', style: 'destructive', onPress: async () => { try { await declineDuel(profile.classId, duelId, user.uid); } catch (cause) { Alert.alert('Não foi possível recusar', friendlyError(cause)); } } },
    ]);
  }

  return <Screen padded={false}>
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}><Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Voltar aos duelos"><Icon name="chevron-left" size={22} color={colors.ink} /><Text style={styles.backText}>Duelos</Text></Pressable><Text style={styles.kicker}>{duel ? topicLabel(duel.topic).toUpperCase() : 'DUELO'}</Text></View>
    {error ? <View style={styles.center}><EmptyState isError title="Não foi possível carregar o duelo" message={error} actionLabel="Tentar novamente" actionVariant="success" onAction={() => setRetry((value) => value + 1)} /></View>
      : duel === undefined ? <LoadingView message="Carregando desafio..." />
      : duel === null ? <View style={styles.center}><EmptyState title="Duelo não encontrado" message="Este desafio não está mais disponível." actionLabel="Voltar" onAction={() => router.back()} /></View>
      : state === 'declined' ? <View style={styles.center}><Icon name="swords" size={50} color={colors.gray} /><Text style={styles.title}>Duelo encerrado</Text><Text style={styles.body}>O desafio com {otherName} foi recusado.</Text><Button title="Voltar aos duelos" variant="secondary" onPress={() => router.back()} style={styles.action} /></View>
      : state === 'waiting' ? <View style={styles.center}><View style={styles.waitIcon}><Icon name="clock" size={40} color={colors.purple} /></View><Text style={styles.title}>{mine?.playedAt ? 'Seu turno foi enviado!' : 'Aguarde sua vez'}</Text><Text style={styles.body}>{mine?.playedAt ? `Agora é a vez de ${otherName}. O resultado aparecerá aqui automaticamente.` : `${otherName} ainda está respondendo. Esta tela atualiza automaticamente quando chegar seu turno.`}</Text>{duel.status === 'opponent_turn' && duel.opponentId === user.uid && !mine?.playedAt && <Button title="Recusar desafio" variant="dangerOutline" onPress={decline} style={styles.action} />}<Button title="Voltar aos duelos" variant="secondary" onPress={() => router.back()} style={styles.action} /></View>
      : state === 'result' ? <View style={styles.center}><View style={styles.resultIcon}><Icon name="trophy" size={42} color={colors.yellow} /></View><Text style={styles.title}>{result === 'win' ? 'Vitória!' : result === 'draw' ? 'Empate!' : 'Boa partida!'}</Text><Text style={styles.body}>Duelo de {topicLabel(duel.topic)} com {otherName}</Text><View style={styles.scoreCard}><View><Text style={styles.scoreName}>Você</Text><Text style={styles.score}>{mine?.score ?? 0}</Text></View><Text style={styles.versus}>×</Text><View><Text style={styles.scoreName}>{otherName}</Text><Text style={styles.score}>{other?.score ?? 0}</Text></View></View><View style={styles.reward}><Text style={styles.rewardText}>+{DUEL_POINTS[result]} pontos de bônus</Text><Text style={styles.rewardText}>+{(mine?.score ?? 0) * XP_PER_CORRECT} XP pelas respostas</Text></View>{mine?.rewardClaimed ? <Text style={styles.claimed}>Recompensa resgatada</Text> : <Button title="Resgatar pontos" variant="primary" onPress={claim} loading={saving} style={styles.action} />}<Button title="Voltar aos duelos" variant="secondary" onPress={() => router.back()} style={styles.action} /></View>
      : questions.length !== 5 ? <View style={styles.center}><EmptyState isError title="Questões indisponíveis" message="Este duelo não possui cinco questões válidas." /></View>
      : <><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Text style={styles.counter}>PERGUNTA {index + 1} DE 5</Text><View style={styles.track}><View style={[styles.fill, { width: `${(index + 1) * 20}%` }]} /></View><Text style={styles.question}>{question.text}</Text><View style={styles.options}>{question.options.map((option, optionIndex) => <Pressable key={optionIndex} onPress={() => setChoice(optionIndex)} accessibilityRole="radio" accessibilityState={{ selected: choice === optionIndex }} style={[styles.option, choice === optionIndex && styles.optionSelected]}><View style={[styles.letter, choice === optionIndex && styles.letterOn]}><Text style={[styles.letterText, choice === optionIndex && styles.letterTextOn]}>{LETTERS[optionIndex]}</Text></View><Text style={styles.optionText}>{option}</Text></Pressable>)}</View></ScrollView><View style={styles.footer}><Button title={index === 4 ? 'Enviar meu turno' : 'Próxima pergunta'} onPress={next} disabled={choice === null} loading={saving} /></View></>}
  </Screen>;
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 12, backgroundColor: colors.surface, borderBottomWidth: 2, borderColor: colors.border }, back: { height: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4 }, backText: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink }, kicker: { ...text.label, color: colors.purple }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }, title: { fontFamily: fonts.extrabold, fontSize: 27, textAlign: 'center', color: colors.ink, marginTop: 16 }, body: { ...text.body, color: colors.gray, textAlign: 'center', lineHeight: 23, marginTop: 8 }, action: { alignSelf: 'stretch', marginTop: 18 }, waitIcon: { width: 82, height: 82, borderRadius: 41, backgroundColor: colors.purpleSoft, alignItems: 'center', justifyContent: 'center' }, resultIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' }, scoreCard: { alignSelf: 'stretch', marginTop: 24, padding: 18, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }, scoreName: { ...text.caption, textAlign: 'center', maxWidth: 100 }, score: { fontFamily: fonts.extrabold, fontSize: 32, color: colors.purple, textAlign: 'center' }, versus: { fontFamily: fonts.extrabold, fontSize: 25, color: colors.gray }, reward: { alignSelf: 'stretch', gap: 6, padding: 16, marginTop: 12, borderRadius: 16, backgroundColor: colors.greenSoft }, rewardText: { fontFamily: fonts.bold, fontSize: 15, color: colors.greenDark }, claimed: { fontFamily: fonts.bold, fontSize: 14, color: colors.green, marginTop: 18 },
  content: { padding: 20, paddingBottom: 24 }, counter: { ...text.label, color: colors.purple }, track: { height: 10, borderRadius: 8, backgroundColor: colors.purpleSoft, marginTop: 10, overflow: 'hidden' }, fill: { height: '100%', backgroundColor: colors.purple }, question: { fontFamily: fonts.extrabold, fontSize: 23, lineHeight: 31, color: colors.ink, marginTop: 26, marginBottom: 22 }, options: { gap: 12 }, option: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.surface, padding: 10 }, optionSelected: { backgroundColor: colors.purpleSoft, borderColor: colors.purple }, letter: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }, letterOn: { backgroundColor: colors.purple }, letterText: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.gray }, letterTextOn: { color: colors.white }, optionText: { flex: 1, fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: colors.ink }, footer: { paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 2, borderColor: colors.border, backgroundColor: colors.surface },
});
