import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, EmptyState, Icon, LoadingView, Mascot, Screen } from '../../components';
import useReducedMotion from '../../hooks/useReducedMotion';
import { useAuth } from '../../contexts/AuthContext';
import { listenStudentRoom, listenServerOffset, listenOwnClassroomAnswer, getPublishedClassroomQuiz, submitClassroomAnswers } from '../../services/classroomStudentService';
import { roomIsOpen } from '../../features/student/classroomModel';
import { friendlyError } from '../../utils/errors';
import { colors, fonts, text } from '../../theme';

function LiveDot() {
  const reduceMotion = useReducedMotion();
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) return undefined;
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }));
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);
  return <View style={styles.dotWrap}>{!reduceMotion && <Animated.View style={[styles.dotRing, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }] }]} />}<View style={styles.dot} /></View>;
}

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
    } catch (cause) {
      const msg = friendlyError(cause);
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(`Resposta não enviada: ${msg}`);
      else Alert.alert('Resposta não enviada', msg);
    }
    finally { setSaving(false); busy.current = false; }
  }

  return <Screen padded={false}>
    <View style={[styles.header, { paddingTop: insets.top + 18 }]}><Text style={styles.kicker}>AO VIVO</Text><View style={styles.titleRow}><Text style={styles.heading}>Modo Sala</Text>{open && <View style={styles.timer}><Icon name="clock" size={18} color={colors.yellow} /><Text style={styles.timerText}>{timeLabel(room.endsAt - serverNow)}</Text></View>}</View><Text style={styles.subtitle}>{room?.quizTitle ?? 'Aprenda junto com sua turma'}</Text></View>
    {error ? <View style={styles.center}><EmptyState isError title="Não foi possível carregar o Modo Sala" message={error} actionLabel="Tentar novamente" actionVariant="success" onAction={() => setRetry((value) => value + 1)} /></View>
      : room === undefined || offset === undefined ? <LoadingView message="Verificando atividade da turma..." />
      : !room || (!open && !answer) ? <View style={styles.center}>
        <View style={styles.lobby}>
          <View style={styles.livePill}><LiveDot /><Text style={styles.livePillText}>{room?.active ? 'Rodada encerrada' : 'Você está na sala'}</Text></View>
          <Mascot name="sapo" size={104} />
          <Text style={styles.lobbyTitle}>{room?.active ? 'Tempo esgotado!' : 'Esperando o professor começar'}</Text>
          <Text style={styles.lobbyText}>{room?.active ? 'Fique por aqui: a próxima rodada abre nesta tela.' : 'O quiz abre aqui sozinho. Não precisa atualizar.'}</Text>
        </View>
        <View style={styles.steps}>{[['clock', 'Espere'], ['zap', 'Responda'], ['trophy', 'Veja o placar']].map(([icon, label], step) => <View key={label} style={styles.step}><View style={styles.stepIcon}><Icon name={icon} size={18} color={colors.greenDark} /></View><Text style={styles.stepText}>{step + 1}. {label}</Text></View>)}</View>
      </View>
      : quiz === undefined || answer === undefined ? <LoadingView message="Preparando quiz da turma..." />
      : !quiz || !quiz.questions.length ? <View style={styles.center}><EmptyState title="Quiz indisponível" message="O professor precisa publicar questões válidas antes de iniciar esta atividade." /></View>
      : answer ? <View style={styles.center}><View style={styles.sentIcon}><Icon name="check" size={36} color={colors.white} /></View><Text style={styles.sentTitle}>Resposta enviada!</Text><Text style={styles.sentText}>Você concluiu {quiz.title}{Number.isFinite(answer.correctCount) && Number.isFinite(answer.total) ? ` (${answer.correctCount}/${answer.total} acertos)` : ''}. O professor já pode acompanhar sua participação.</Text><View style={styles.sentCard}><Icon name="shield-check" size={24} color={colors.green} /><Text style={styles.sentCardText}>Esta atividade só pode ser respondida uma vez.</Text></View></View>
      : <><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.progressRow}><Text style={styles.counter}>QUESTÃO {index + 1} DE {quiz.questions.length}</Text><Text style={styles.remaining}>{timeLabel(room.endsAt - serverNow)} restantes</Text></View><View style={styles.track}><View style={[styles.fill, { width: `${(index + 1) / quiz.questions.length * 100}%` }]} /></View>
        <Text style={styles.question}>{question.text}</Text>
        <View style={styles.options}>{question.options.map((option, optionIndex) => <Pressable key={optionIndex} onPress={() => { if (startedAt === null) setStartedAt(Date.now() + offset); setChoice(optionIndex); }} accessibilityRole="radio" accessibilityState={{ selected: choice === optionIndex }} style={({ pressed }) => [styles.option, choice === optionIndex && styles.optionSelected, pressed && styles.pressed]}><View style={[styles.letter, choice === optionIndex && styles.letterSelected]}><Text style={[styles.letterText, choice === optionIndex && styles.letterTextSelected]}>{LETTERS[optionIndex]}</Text></View><Text style={styles.optionText}>{option}</Text></Pressable>)}</View>
        <View style={styles.info}><Icon name="info" size={19} color={colors.gray} /><Text style={styles.infoText}>O professor acompanha as respostas da turma em tempo real.</Text></View>
      </ScrollView><View style={styles.footer}><Button title={isLast ? 'Enviar respostas' : 'Próxima questão'} disabled={choice === null} loading={saving} onPress={next} /></View></>}
  </Screen>;
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14, backgroundColor: colors.surface, borderBottomWidth: 2, borderColor: colors.border }, kicker: { ...text.label, color: colors.greenDark }, titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 4 }, heading: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.ink }, timer: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.ink, borderRadius: 13, paddingHorizontal: 12 }, timerText: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.yellow }, subtitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.gray, marginTop: 3 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }, mascot: { alignItems: 'center' }, content: { padding: 20, paddingBottom: 30 }, progressRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, counter: { ...text.label }, remaining: { fontFamily: fonts.bold, fontSize: 12, color: colors.orangeText }, track: { height: 10, backgroundColor: colors.border, borderRadius: 8, overflow: 'hidden', marginTop: 10 }, fill: { height: '100%', backgroundColor: colors.orange }, question: { fontFamily: fonts.extrabold, fontSize: 23, lineHeight: 31, color: colors.ink, marginTop: 26, marginBottom: 22 }, options: { gap: 12 }, option: { minHeight: 64, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 }, optionSelected: { borderColor: colors.orange, backgroundColor: colors.orangeSoft }, pressed: { opacity: 0.7 }, letter: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }, letterSelected: { backgroundColor: colors.orange }, letterText: { fontFamily: fonts.extrabold, color: colors.gray, fontSize: 16 }, letterTextSelected: { color: colors.white }, optionText: { flex: 1, fontFamily: fonts.bold, fontSize: 16, lineHeight: 23, color: colors.ink }, info: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 20 }, infoText: { flex: 1, ...text.caption, lineHeight: 19 }, footer: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.surface, borderTopWidth: 2, borderColor: colors.border },
  sentIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }, sentTitle: { ...text.h1, textAlign: 'center' }, sentText: { ...text.body, color: colors.gray, textAlign: 'center', lineHeight: 24, marginTop: 8 }, sentCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.greenSoft, padding: 14, borderRadius: 16, marginTop: 22 }, sentCardText: { flex: 1, fontFamily: fonts.semibold, color: colors.greenDark },
  lobby: { width: '100%', maxWidth: 360, alignItems: 'center', backgroundColor: colors.surface, borderWidth: 2, borderBottomWidth: 6, borderColor: colors.border, borderRadius: 24, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 22 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.greenSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginBottom: 12 },
  livePillText: { fontFamily: fonts.bold, fontSize: 13, color: colors.greenDark },
  dotWrap: { width: 10, height: 10, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green },
  dotRing: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green },
  lobbyTitle: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 28, color: colors.ink, textAlign: 'center', marginTop: 12 },
  lobbyText: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21, color: colors.gray, textAlign: 'center', marginTop: 6 },
  steps: { width: '100%', maxWidth: 360, flexDirection: 'row', gap: 8, marginTop: 14 },
  step: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: colors.yellowSoft, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.yellow, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 4 },
  stepIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink, textAlign: 'center' },
});
