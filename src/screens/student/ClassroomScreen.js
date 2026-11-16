import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, EmptyState, Icon, LoadingView, Mascot, Screen } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { listenStudentRoom, listenServerOffset, listenOwnClassroomAnswer, getPublishedClassroomQuiz, submitClassroomAnswers } from '../../services/classroomStudentService';
import { roomIsOpen } from '../../features/student/classroomModel';
import { friendlyError } from '../../utils/errors';
import { colors, fonts, text } from '../../theme';

const LETTERS = ['A', 'B', 'C', 'D'];
const timeLabel = (milliseconds) => {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};

export default function ClassroomScreen() {
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [room, setRoom] = useState(undefined);
  const [quiz, setQuiz] = useState(undefined);
  const [answer, setAnswer] = useState(undefined);
  const [offset, setOffset] = useState(undefined);
  const [now, setNow] = useState(null);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState(null);
  const [picks, setPicks] = useState([]);
  const [startedAt, setStartedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const busy = useRef(false);

  useEffect(() => {
    if (!profile.classId) { setRoom(null); setOffset(0); return undefined; }
    setError('');
    const fail = (cause) => setError(friendlyError(cause));
    const stopRoom = listenStudentRoom(profile.classId, setRoom, fail);
    const stopClock = listenServerOffset(setOffset, fail);
    return () => { stopRoom(); stopClock(); };
  }, [profile.classId, retry]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!room?.active || !room.quizId || !profile.classId) { setQuiz(undefined); setAnswer(undefined); return undefined; }
    let active = true;
    setQuiz(undefined);
    setAnswer(undefined);
    setIndex(0);
    setChoice(null);
    setPicks([]);
    setStartedAt(null);
    getPublishedClassroomQuiz(profile.classId, room.quizId).then((data) => { if (active) setQuiz(data); })
      .catch((cause) => { if (active) setError(friendlyError(cause)); });
    const stop = listenOwnClassroomAnswer(profile.classId, room.quizId, user.uid, (data) => { if (active) setAnswer(data); }, (cause) => { if (active) setError(friendlyError(cause)); });
    return () => { active = false; stop(); };
  }, [profile.classId, room?.active, room?.quizId, user.uid, retry]);

  const serverNow = (now ?? 0) + (offset ?? 0);
  const open = now !== null && offset !== undefined && roomIsOpen(room, serverNow);
  const question = quiz?.questions?.[index];
  const isLast = index === (quiz?.questions?.length ?? 0) - 1;

  async function next() {
    if (choice === null || busy.current) return;
    const nextPicks = [...picks, choice];
    if (!isLast) { setPicks(nextPicks); setChoice(null); setIndex(index + 1); return; }
    busy.current = true;
    setSaving(true);
    try {
      const saved = await submitClassroomAnswers({ classId: profile.classId, quizId: room.quizId, uid: user.uid, name: profile.name, picks: nextPicks, startedAt });
      setAnswer({ ...saved, picks: nextPicks });
    } catch (cause) { Alert.alert('Resposta não enviada', friendlyError(cause)); }
    finally { setSaving(false); busy.current = false; }
  }

  return <Screen padded={false}>
    <View style={[styles.header, { paddingTop: insets.top + 18 }]}><Text style={styles.kicker}>ATIVIDADE AO VIVO</Text><View style={styles.titleRow}><Text style={styles.heading}>Modo Sala</Text>{open && <View style={styles.timer}><Icon name="clock" size={18} color={colors.yellow} /><Text style={styles.timerText}>{timeLabel(room.endsAt - serverNow)}</Text></View>}</View><Text style={styles.subtitle}>{room?.quizTitle ?? 'Aprenda junto com sua turma'}</Text></View>
    {error ? <View style={styles.center}><EmptyState isError title="Não foi possível carregar o Modo Sala" message={error} actionLabel="Tentar novamente" actionVariant="success" onAction={() => setRetry((value) => value + 1)} /></View>
      : room === undefined || offset === undefined ? <LoadingView message="Verificando atividade da turma..." />
      : !room || (!open && !answer) ? <View style={styles.center}><View style={styles.mascot}><Mascot name="sapo" size={100} thinking /></View><EmptyState title="Nenhuma atividade ao vivo agora" message={room?.active ? 'O tempo desta atividade terminou. Aguarde o professor iniciar uma nova sessão.' : 'Quando o professor liberar um quiz, ele aparecerá aqui automaticamente.'} /></View>
      : quiz === undefined || answer === undefined ? <LoadingView message="Preparando quiz da turma..." />
      : !quiz || !quiz.questions.length ? <View style={styles.center}><EmptyState title="Quiz indisponível" message="O professor precisa publicar questões válidas antes de iniciar esta atividade." /></View>
      : answer ? <View style={styles.center}><View style={styles.sentIcon}><Icon name="check" size={36} color={colors.white} /></View><Text style={styles.sentTitle}>Resposta enviada!</Text><Text style={styles.sentText}>Você concluiu {quiz.title}. O professor já pode acompanhar sua participação.</Text><View style={styles.sentCard}><Icon name="shield-check" size={24} color={colors.green} /><Text style={styles.sentCardText}>Esta atividade só pode ser respondida uma vez.</Text></View></View>
      : <><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progressRow}><Text style={styles.counter}>QUESTÃO {index + 1} DE {quiz.questions.length}</Text><Text style={styles.remaining}>{timeLabel(room.endsAt - serverNow)} restantes</Text></View><View style={styles.track}><View style={[styles.fill, { width: `${(index + 1) / quiz.questions.length * 100}%` }]} /></View>
        <Text style={styles.question}>{question.text}</Text>
        <View style={styles.options}>{question.options.map((option, optionIndex) => <Pressable key={optionIndex} onPress={() => { if (startedAt === null) setStartedAt(Date.now() + offset); setChoice(optionIndex); }} accessibilityRole="radio" accessibilityState={{ selected: choice === optionIndex }} style={({ pressed }) => [styles.option, choice === optionIndex && styles.optionSelected, pressed && styles.pressed]}><View style={[styles.letter, choice === optionIndex && styles.letterSelected]}><Text style={[styles.letterText, choice === optionIndex && styles.letterTextSelected]}>{LETTERS[optionIndex]}</Text></View><Text style={styles.optionText}>{option}</Text></Pressable>)}</View>
        <View style={styles.info}><Icon name="info" size={19} color={colors.gray} /><Text style={styles.infoText}>O professor acompanha as respostas da turma em tempo real.</Text></View>
      </ScrollView><View style={styles.footer}><Button title={isLast ? 'Enviar respostas' : 'Próxima questão'} disabled={choice === null} loading={saving} onPress={next} /></View></>}
  </Screen>;
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14, backgroundColor: colors.surface, borderBottomWidth: 2, borderColor: colors.border }, kicker: { ...text.label, color: colors.orangeText }, titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 4 }, heading: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.ink }, timer: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.ink, borderRadius: 13, paddingHorizontal: 12 }, timerText: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.yellow }, subtitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.gray, marginTop: 3 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }, mascot: { alignItems: 'center' }, content: { padding: 20, paddingBottom: 30 }, progressRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, counter: { ...text.label }, remaining: { fontFamily: fonts.bold, fontSize: 12, color: colors.orangeText }, track: { height: 10, backgroundColor: colors.border, borderRadius: 8, overflow: 'hidden', marginTop: 10 }, fill: { height: '100%', backgroundColor: colors.orange }, question: { fontFamily: fonts.extrabold, fontSize: 23, lineHeight: 31, color: colors.ink, marginTop: 26, marginBottom: 22 }, options: { gap: 12 }, option: { minHeight: 64, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 }, optionSelected: { borderColor: colors.orange, backgroundColor: colors.orangeSoft }, pressed: { opacity: 0.7 }, letter: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }, letterSelected: { backgroundColor: colors.orange }, letterText: { fontFamily: fonts.extrabold, color: colors.gray, fontSize: 16 }, letterTextSelected: { color: colors.white }, optionText: { flex: 1, fontFamily: fonts.bold, fontSize: 16, lineHeight: 23, color: colors.ink }, info: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 20 }, infoText: { flex: 1, ...text.caption, lineHeight: 19 }, footer: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.surface, borderTopWidth: 2, borderColor: colors.border },
  sentIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }, sentTitle: { ...text.h1, textAlign: 'center' }, sentText: { ...text.body, color: colors.gray, textAlign: 'center', lineHeight: 24, marginTop: 8 }, sentCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.greenSoft, padding: 14, borderRadius: 16, marginTop: 22 }, sentCardText: { flex: 1, fontFamily: fonts.semibold, color: colors.greenDark },
});
