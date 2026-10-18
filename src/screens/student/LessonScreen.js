import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, EmptyState, Icon, LoadingView, Screen } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { getLessonQuestions, loseLife, completeLesson } from '../../services/trailService';
import { lessonResult } from '../../features/student/trailModel';
import { currentLives } from '../../utils/lives';
import { friendlyError } from '../../utils/errors';
import { colors, fonts, text } from '../../theme';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function LessonScreen({ navigation, route }) {
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const lessonId = String(route.params?.lessonId ?? '');
  const title = String(route.params?.title ?? 'Lição');
  const [questions, setQuestions] = useState(undefined);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState(null);
  const [verified, setVerified] = useState(false);
  const [picks, setPicks] = useState([]);
  const [lives, setLives] = useState(currentLives(profile?.stats));
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const busy = useRef(false);

  useEffect(() => { setLives(currentLives(profile?.stats)); }, [profile?.stats]);
  useEffect(() => {
    let active = true;
    setQuestions(undefined);
    setError('');
    getLessonQuestions(lessonId, profile.classId).then((data) => { if (active) setQuestions(data); })
      .catch((e) => { if (active) setError(friendlyError(e)); });
    return () => { active = false; };
  }, [lessonId, profile.classId, attempt]);

  const question = questions?.[index];
  const correctChoice = choice === question?.answer;
  const isLast = index === (questions?.length ?? 0) - 1;

  function leave() {
    if (result || (!index && !verified)) return navigation.goBack();
    Alert.alert('Sair da lição?', 'O progresso desta tentativa ainda não foi salvo.', [
      { text: 'Continuar', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  }

  async function verify() {
    if (choice === null || busy.current) return;
    busy.current = true;
    try {
      if (!correctChoice) setLives(await loseLife(user.uid));
      setPicks((old) => [...old, choice]);
      setVerified(true);
    } catch (e) { Alert.alert('Não foi possível registrar a resposta', friendlyError(e)); }
    finally { busy.current = false; }
  }

  async function advance() {
    if (busy.current) return;
    if (!isLast) { setIndex(index + 1); setChoice(null); setVerified(false); return; }
    busy.current = true;
    setSaving(true);
    try {
      const calculated = lessonResult(questions, picks, null);
      const saved = await completeLesson({ uid: user.uid, lessonId, name: profile.name, classId: profile.classId, result: calculated });
      setResult(saved);
    } catch (e) { Alert.alert('Não foi possível salvar a lição', `${friendlyError(e)} Tente novamente.`); }
    finally { setSaving(false); busy.current = false; }
  }

  return <Screen padded={false}>
    <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
      <Pressable onPress={leave} style={styles.close} accessibilityRole="button" accessibilityLabel="Fechar lição"><Icon name="x" size={24} color={colors.gray} /></Pressable>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${result ? 100 : questions?.length ? (index + Number(verified)) / questions.length * 100 : 0}%` }]} /></View>
      <View style={styles.lives}><Icon name="heart" size={19} color={colors.red} fill={colors.red} /><Text style={styles.livesText}>{lives}</Text></View>
    </View>
    {error ? <View style={styles.center}><EmptyState isError title="Não foi possível abrir a lição" message={error} actionLabel="Tentar novamente" actionVariant="success" onAction={() => setAttempt((value) => value + 1)} /></View>
      : questions === undefined ? <LoadingView message="Preparando a lição..." />
      : questions.length === 0 ? <View style={styles.center}><EmptyState title="Lição sem questões" message="O conteúdo desta lição ainda não foi publicado. Volte à trilha ou tente novamente mais tarde." actionLabel="Voltar à trilha" actionVariant="success" onAction={() => navigation.goBack()} /></View>
      : result ? <View style={styles.center}>
        <View style={styles.resultBadge}><Icon name="trophy" size={42} color={colors.yellowDark} /></View>
        <Text style={styles.resultTitle}>Lição concluída!</Text><Text style={styles.resultSub}>{title}</Text>
        <View style={styles.resultCard}><Text style={styles.stars}>{'★'.repeat(result.stars)}{'☆'.repeat(3 - result.stars)}</Text><Text style={styles.resultScore}>{result.correct} de {result.total} respostas certas</Text><Text style={styles.xp}>+{result.xp} XP</Text></View>
        <Text style={styles.streak}>🔥 {result.streak} {result.streak === 1 ? 'dia' : 'dias'} de ofensiva</Text>
        <Button title="Voltar à trilha" onPress={() => navigation.goBack()} variant="success" style={styles.fullButton} />
      </View> : <>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>{title.toUpperCase()}</Text>
          <Text style={styles.counter}>QUESTÃO {index + 1} DE {questions.length}</Text>
          <Text style={styles.question}>{question.text}</Text>
          <View style={styles.options}>{question.options.map((option, optionIndex) => {
            const selected = choice === optionIndex;
            const correct = verified && optionIndex === question.answer;
            const wrong = verified && selected && !correct;
            return <Pressable key={optionIndex} disabled={verified} onPress={() => setChoice(optionIndex)} accessibilityRole="radio" accessibilityState={{ selected }}
              style={[styles.option, selected && styles.optionSelected, correct && styles.optionCorrect, wrong && styles.optionWrong]}>
              <View style={[styles.letter, selected && styles.letterSelected, correct && styles.letterCorrect, wrong && styles.letterWrong]}><Text style={[styles.letterText, selected && styles.letterTextSelected]}>{LETTERS[optionIndex]}</Text></View>
              <Text style={styles.optionText}>{option}</Text>{correct && <Icon name="check" size={20} color={colors.green} />}
            </Pressable>;
          })}</View>
          {verified && <View style={[styles.feedback, correctChoice ? styles.feedbackCorrect : styles.feedbackWrong]}>
            <Text style={styles.feedbackTitle}>{correctChoice ? 'Boa resposta!' : 'Quase! Vamos aprender.'}</Text>
            <Text style={styles.feedbackText}>{question.explanation || `Resposta correta: ${question.options[question.answer]}.`}</Text>
          </View>}
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 10 }]}>
          <Button title={verified ? isLast ? 'Concluir lição' : 'Continuar' : 'Verificar resposta'} onPress={verified ? advance : verify} disabled={!verified && choice === null} loading={saving} variant={verified ? 'success' : 'primary'} />
        </View>
      </>}
  </Screen>;
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: colors.surface },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, progressTrack: { flex: 1, height: 12, borderRadius: 8, backgroundColor: colors.border, overflow: 'hidden' }, progressFill: { height: '100%', borderRadius: 8, backgroundColor: colors.green },
  lives: { minWidth: 44, flexDirection: 'row', alignItems: 'center', gap: 4 }, livesText: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.red }, center: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  content: { padding: 20, paddingBottom: 30, flexGrow: 1 }, eyebrow: { ...text.caption, color: colors.green, marginBottom: 18 }, counter: { ...text.label, color: colors.purple, marginBottom: 12 }, question: { fontFamily: fonts.extrabold, fontSize: 25, lineHeight: 34, color: colors.ink, marginBottom: 28 },
  options: { gap: 12 }, option: { minHeight: 64, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }, optionSelected: { borderColor: colors.blue, backgroundColor: colors.blueSoft }, optionCorrect: { borderColor: colors.green, backgroundColor: colors.greenSoft }, optionWrong: { borderColor: colors.red, backgroundColor: colors.redSoft },
  letter: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }, letterSelected: { backgroundColor: colors.blue }, letterCorrect: { backgroundColor: colors.green }, letterWrong: { backgroundColor: colors.red }, letterText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.gray }, letterTextSelected: { color: colors.white }, optionText: { flex: 1, fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: colors.ink },
  feedback: { borderRadius: 16, padding: 16, marginTop: 20 }, feedbackCorrect: { backgroundColor: colors.greenSoft }, feedbackWrong: { backgroundColor: colors.redSoft }, feedbackTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink }, feedbackText: { ...text.body, lineHeight: 23, marginTop: 6 }, footer: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  resultBadge: { alignSelf: 'center', width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.yellowSoft, marginBottom: 20 }, resultTitle: { ...text.h1, textAlign: 'center' }, resultSub: { ...text.body, color: colors.gray, textAlign: 'center', marginTop: 8 }, resultCard: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 20, padding: 24, alignItems: 'center', marginTop: 28 }, stars: { fontSize: 34, letterSpacing: 4, color: colors.yellowDark }, resultScore: { ...text.body, marginTop: 10 }, xp: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.green, marginTop: 8 }, streak: { ...text.body, textAlign: 'center', marginTop: 22 }, fullButton: { marginTop: 30 },
});
