import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Chip, ConfirmModal, EmptyState, Icon, LoadingView } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { topicLabel } from '../../constants/topics';
import { summarizeQuizResults } from '../../features/teacher/quizModel';
import { activitiesViewState } from '../../features/teacher/activitiesModel';
import { deleteQuiz, listenClassAnswers, listenClassQuizzes, listenClassroomMode, startClassroomMode, stopClassroomMode, updateQuizStatus } from '../../services/quizService';
import { friendlyError } from '../../utils/errors';
import { colors, fonts, text } from '../../theme';

export default function ActivitiesScreen({ classId, membersCount = 0 }) {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState(null);
  const [answers, setAnswers] = useState({});
  const [room, setRoom] = useState(null);
  const [pending, setPending] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setQuizzes(null); setAnswers({}); setRoom(null); setError('');
    const fail = (e) => setError(friendlyError(e));
    const stopQuizzes = listenClassQuizzes(classId, setQuizzes, fail);
    const stopAnswers = listenClassAnswers(classId, setAnswers, fail);
    const stopRoom = listenClassroomMode(classId, (value) => { setRoom(value); setNow(Date.now()); }, fail);
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => { stopQuizzes(); stopAnswers(); stopRoom(); clearInterval(timer); };
  }, [classId, attempt]);

  const overview = useMemo(() => quizzes?.map((quiz) => ({
    ...quiz,
    results: summarizeQuizResults(quiz, answers[quiz.id]),
  })) ?? [], [quizzes, answers]);

  const perform = useCallback(async (key, action) => {
    setPending(key); setError('');
    try { await action(); return true; } catch (e) { setError(friendlyError(e)); return false; }
    finally { setPending(''); }
  }, []);

  const toggleRoom = useCallback((quiz) => {
    if (room?.active && now < room.endsAt) {
      if (room.quizId !== quiz.id) {
        Alert.alert('Uma aula já está ativa', 'Encerre o Modo Sala atual antes de liberar outro quiz.');
        return;
      }
      Alert.alert('Encerrar Modo Sala?', 'Os alunos não poderão mais responder durante a aula.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Encerrar', style: 'destructive', onPress: () => perform(quiz.id, () => stopClassroomMode(classId)) },
      ]);
      return;
    }
    Alert.alert('Liberar para a aula?', `O quiz ficará disponível por 15 minutos para os alunos de ${membersCount ? `${membersCount} participantes` : 'sua turma'}.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Liberar', onPress: () => perform(quiz.id, () => startClassroomMode(classId, user.uid, quiz)) },
    ]);
  }, [room, now, classId, membersCount, perform, user.uid]);

  const publishQuiz = useCallback((quiz) => perform(quiz.id, () => updateQuizStatus(classId, quiz.id, 'published')), [classId, perform]);
  const openResults = useCallback((quiz) => router.push({ pathname: '/teacher/class/[classId]/results/[quizId]', params: { classId, quizId: quiz.id } }), [classId]);
  const createActivity = useCallback(() => router.push({ pathname: '/teacher/class/[classId]/quiz/new', params: { classId } }), [classId]);
  const renderQuiz = useCallback(({ item, index }) => <QuizCard quiz={item} index={index} membersCount={membersCount} active={!!(room?.active && room.quizId === item.id && now < room.endsAt)} pending={pending === item.id} onDelete={setToDelete} onPublish={publishQuiz} onToggleRoom={toggleRoom} onResults={openResults} />, [membersCount, room, now, pending, publishQuiz, toggleRoom, openResults]);

  const viewState = activitiesViewState(quizzes, error);

  if (viewState === 'loading') return <LoadingView message="Carregando atividades..." />;
  if (viewState === 'error') return <EmptyState isError title="Não foi possível carregar as atividades" message={error} actionLabel="Tentar novamente" onAction={() => setAttempt((value) => value + 1)} />;

  return <View style={styles.root}>
    <FlatList data={overview} renderItem={renderQuiz} keyExtractor={(quiz) => quiz.id} style={styles.list} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
      ListHeaderComponent={<View style={styles.header}>
        <View style={styles.heading}><Text style={styles.title}>Quizzes de sala</Text><Text style={text.caption}>Publique atividades, libere no Modo Sala e acompanhe as respostas.</Text></View>
        {error ? <View style={styles.error}><Icon name="alert-triangle" size={20} color={colors.redText} /><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => setAttempt((value) => value + 1)} accessibilityRole="button" accessibilityLabel="Tentar carregar atividades novamente" style={styles.retry}><Icon name="refresh-cw" size={20} color={colors.redText} /></Pressable></View> : null}
        {overview.length ? <Text style={styles.listLabel}>{overview.length} {overview.length === 1 ? 'QUIZ CRIADO' : 'QUIZZES CRIADOS'}</Text> : null}
      </View>}
      ListEmptyComponent={<EmptyState image={require('../../../assets/mascotes/abelha.png')} title="Nenhuma atividade ainda" message="Crie um quiz manualmente ou use a IA para começar." actionLabel="Criar primeiro quiz" onAction={createActivity} />}
      ListFooterComponent={overview.length ? <View style={styles.footer}><Button title="Criar atividade" icon="plus" variant="teacher" onPress={createActivity} /></View> : null}
    />
    <ConfirmModal visible={!!toDelete} title={`Excluir ${toDelete?.title ?? 'quiz'}?`} message={`As ${answers[toDelete?.id] ? Object.keys(answers[toDelete.id]).length : 0} respostas e os resultados serão apagados. Essa ação não pode ser desfeita.`} confirmLabel="Excluir quiz" loading={pending === toDelete?.id} onCancel={() => setToDelete(null)} onConfirm={() => perform(toDelete.id, () => deleteQuiz(classId, toDelete.id)).then((ok) => { if (ok) setToDelete(null); })} />
  </View>;
}

const QuizCard = memo(function QuizCard({ quiz, index, membersCount, active, pending, onDelete, onPublish, onToggleRoom, onResults }) {
  const accuracyColor = quiz.results.responses ? quiz.results.accuracy >= 75 ? colors.green : quiz.results.accuracy >= 60 ? colors.yellowDark : colors.redText : colors.gray;
  return <View style={styles.card}>
    <View style={styles.cardHeading}>
      <View style={styles.iconBox}><Icon name="file-text" size={22} color={colors.blue} /></View>
      <View style={{ flex: 1 }}><Text style={styles.eyebrow}>QUIZ {index + 1} · {topicLabel(quiz.topic)}</Text><Text style={styles.quizTitle}>{quiz.title}</Text></View>
      <Pressable onPress={() => onDelete(quiz)} accessibilityRole="button" accessibilityLabel={`Excluir ${quiz.title}`} style={({ pressed }) => [styles.delete, pressed && styles.pressed]}><Icon name="trash" size={19} color={colors.redText} /></Pressable>
    </View>
    <View style={styles.meta}><Chip label={quiz.status === 'published' ? 'Publicado' : 'Rascunho'} color={quiz.status === 'published' ? colors.greenDark : colors.orangeText} background={quiz.status === 'published' ? colors.greenSoft : colors.orangeSoft} /><Text style={text.caption}>{quiz.questionsCount ?? Object.keys(quiz.questions ?? {}).length} questões</Text></View>
    <View style={styles.statLine}><Text style={[styles.accuracy, { color: accuracyColor }]}>{quiz.results.responses ? `${quiz.results.accuracy}%` : '—'}</Text><Text style={styles.statCaption}>{quiz.results.responses ? `de acerto · ${quiz.results.responses} de ${membersCount} responderam` : 'Ainda sem respostas'}</Text></View>
    <View style={styles.track}><View style={[styles.fill, { width: `${quiz.results.accuracy}%`, backgroundColor: accuracyColor }]} /></View>
    <View style={styles.actions}>
      {quiz.status === 'draft' ? <Button title="Publicar" icon="check" variant="teacher" size="md" loading={pending} onPress={() => onPublish(quiz)} /> : <Button title={active ? 'Encerrar sala' : 'Modo Sala'} icon="presentation" variant={active ? 'primary' : 'outline'} size="md" loading={pending} onPress={() => onToggleRoom(quiz)} />}
      <Button title="Resultados" icon="bar-chart" variant="secondary" size="md" onPress={() => onResults(quiz)} />
    </View>
  </View>;
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 14 },
  header: { gap: 14 },
  heading: { paddingHorizontal: 2, gap: 4 },
  title: { ...text.h2, marginBottom: 4 },
  listLabel: { ...text.label, marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 2, borderColor: colors.border, padding: 16, gap: 12 },
  cardHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconBox: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueSoft },
  eyebrow: { ...text.label, fontSize: 11 },
  quizTitle: { ...text.h2, fontSize: 18, marginTop: 2 },
  delete: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: -5, marginRight: -8 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statLine: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  statCaption: { ...text.caption, flex: 1, lineHeight: 19 },
  accuracy: { fontFamily: fonts.extrabold, fontSize: 25, color: colors.green },
  track: { height: 9, borderRadius: 99, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.green, borderRadius: 99 },
  actions: { gap: 8 },
  error: { flexDirection: 'row', gap: 8, alignItems: 'center', borderRadius: 14, padding: 12, backgroundColor: colors.redSoft },
  errorText: { ...text.caption, flex: 1, color: colors.redText },
  retry: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingTop: 4 },
  pressed: { opacity: 0.68 },
});
