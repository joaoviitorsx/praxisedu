import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, EmptyState, Icon, LoadingView, Screen } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { getLessonMaterials, getLessonQuestions, loseLife, completeLesson } from '../../services/trailService';
import LessonMaterials from './LessonMaterials';
import { lessonResult } from '../../features/student/trailModel';
import { currentLives } from '../../utils/lives';
import { friendlyError } from '../../utils/errors';
import { colors, fonts } from '../../theme';
import LessonFeedback from './LessonFeedback';
import LessonCompletion from './LessonCompletion';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function LessonScreen({ navigation, route }) {
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const lessonId = String(route.params?.lessonId ?? '');
  const title = String(route.params?.title ?? 'Lição');
  const mascot = String(route.params?.mascot ?? 'sapo');
  const completionKind = String(route.params?.completionKind ?? 'lesson');
  const [questions, setQuestions] = useState(undefined);
  const [materials, setMaterials] = useState([]);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState(null);
  const [verified, setVerified] = useState(false);
  const [picks, setPicks] = useState([]);
  const [lives, setLives] = useState(currentLives(profile?.stats));
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const busy = useRef(false);
  const scrollRef = useRef(null);

  useEffect(() => { setLives(currentLives(profile?.stats)); }, [profile?.stats]);
  useEffect(() => {
    let active = true;
    setQuestions(undefined); setMaterials([]); setReading(false); setError('');
    setIndex(0); setChoice(null); setVerified(false); setPicks([]); setResult(null); setChecking(false);
    Promise.all([getLessonQuestions(lessonId, profile.classId), getLessonMaterials(lessonId, profile.classId)]).then(([data, content]) => {
      if (!active) return;
      setQuestions(data); setMaterials(content); setReading(content.length > 0);
    })
      .catch((e) => { if (active) setError(friendlyError(e)); });
    return () => { active = false; };
  }, [lessonId, profile.classId, attempt]);

  const question = questions?.[index];
  const correctChoice = choice === question?.answer;
  const isLast = index === (questions?.length ?? 0) - 1;
  const progress = result ? 100 : reading ? 0 : questions?.length ? (index + Number(verified)) / questions.length * 100 : 0;

  function leave() {
    if (result || (!index && !verified)) return navigation.goBack();
    Alert.alert('Sair da lição?', 'O progresso desta tentativa ainda não foi salvo.', [
      { text: 'Continuar', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  }

  async function verify() {
    if (choice === null || busy.current) return;
    busy.current = true; setChecking(true);
    setPicks((old) => [...old, choice]);
    setVerified(true);
    try {
      if (!correctChoice) setLives(await loseLife(user.uid));
    } catch (e) {
      setPicks((old) => old.slice(0, -1));
      setVerified(false);
      Alert.alert('Não foi possível registrar a resposta', friendlyError(e));
    }
    finally { setChecking(false); busy.current = false; }
  }

  async function advance() {
    if (busy.current) return;
    if (!isLast) { setIndex(index + 1); setChoice(null); setVerified(false); scrollRef.current?.scrollTo({ y: 0, animated: true }); return; }
    busy.current = true;
    setSaving(true);
    try {
      const calculated = lessonResult(questions, picks, null);
      const saved = await completeLesson({ uid: user.uid, lessonId, name: profile.name, classId: profile.classId, result: calculated });
      setResult(saved);
    } catch (e) { Alert.alert('Não foi possível salvar a lição', `${friendlyError(e)} Tente novamente.`); }
    finally { setSaving(false); busy.current = false; }
  }

  async function finishContent() {
    if (busy.current) return;
    busy.current = true; setSaving(true);
    try {
      const saved = await completeLesson({ uid: user.uid, lessonId, name: profile.name, classId: profile.classId, result: { correct: 0, total: 0, stars: 1 } });
      setResult(saved);
    } catch (e) { Alert.alert('Não foi possível concluir a etapa', `${friendlyError(e)} Tente novamente.`); }
    finally { setSaving(false); busy.current = false; }
  }

  if (result) return <Screen padded={false} lightStatusBar style={{ backgroundColor: colors.greenDark }}>
    <LessonCompletion title={title} mascot={mascot} completionKind={completionKind} result={result} questions={questions} picks={picks} materialsCount={materials.length} topInset={insets.top} bottomInset={Math.max(insets.bottom, 12) + 10} onLeave={() => navigation.goBack()} />
  </Screen>;

  return <Screen padded={false} lightStatusBar>
    <LinearGradient colors={[colors.greenDark, colors.green]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.top, { paddingTop: insets.top + 12 }]}>
      <View style={styles.topRow}>
        <Pressable onPress={leave} style={({ pressed }) => [styles.close, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Fechar etapa"><Icon name="x" size={20} color={colors.white} /></Pressable>
        <View style={styles.topCopy}><Text style={styles.topEyebrow}>{reading ? 'MOMENTO DE ESTUDO' : 'DESAFIO DA ETAPA'}</Text><Text style={styles.topTitle} numberOfLines={1}>{title}</Text></View>
        {!!questions?.length && <View style={styles.lives} accessibilityLabel={`${lives} ${lives === 1 ? 'vida' : 'vidas'} restantes`}><Icon name="heart" size={17} color={colors.red} fill={colors.red} /><Text style={styles.livesText}>{lives}</Text></View>}
      </View>
      <View style={styles.progressRow}><Text style={styles.progressLabel}>{reading ? 'Leia no seu ritmo' : `Questão ${index + 1} de ${questions?.length ?? 0}`}</Text><Text style={styles.progressLabel}>{Math.round(progress)}%</Text></View>
      <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityLabel="Progresso da etapa" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
    </LinearGradient>
    {error ? <View style={styles.center}><EmptyState isError title="Não foi possível abrir a lição" message={error} actionLabel="Tentar novamente" actionVariant="success" onAction={() => setAttempt((value) => value + 1)} /></View>
      : questions === undefined ? <LoadingView message="Preparando a lição..." />
      : questions.length === 0 && materials.length === 0 ? <View style={styles.center}><EmptyState title="Etapa sem conteúdo" message="O conteúdo desta etapa ainda não foi publicado. Volte à trilha ou tente novamente mais tarde." actionLabel="Voltar à trilha" actionVariant="success" onAction={() => navigation.goBack()} /></View>
      : reading ? <>
        <ScrollView contentContainerStyle={[styles.content, styles.studyContent]} showsVerticalScrollIndicator={false}>
          <View style={styles.studyHeadingRow}><View style={styles.studyHeadingCopy}><Text style={styles.studyHeading}>Materiais de estudo</Text><Text style={styles.studyDescription}>Conteúdo preparado pelo professor</Text></View><Text style={styles.studyCountText}>{materials.length} {materials.length === 1 ? 'material' : 'materiais'}</Text></View>
          <LessonMaterials materials={materials} onError={(cause) => Alert.alert('Não foi possível abrir o material', friendlyError(cause))} />
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 10 }]}>
          <Button title={questions.length ? 'Responder questões' : 'Concluir etapa'} onPress={questions.length ? () => setReading(false) : finishContent} loading={saving} variant="success" icon={questions.length ? 'arrow-right' : 'check'} />
        </View>
      </> : <>
        <ScrollView ref={scrollRef} contentContainerStyle={[styles.content, styles.questionContent]} showsVerticalScrollIndicator={false}>
          <View style={styles.questionBlock}><Text style={styles.question}>{question.text}</Text><Text style={styles.questionHint}>Escolha uma alternativa</Text></View>
          <View style={styles.options}>{question.options.map((option, optionIndex) => {
            const selected = choice === optionIndex;
            const correct = verified && optionIndex === question.answer;
            const wrong = verified && selected && !correct;
            return <Pressable key={optionIndex} disabled={verified} onPress={() => setChoice(optionIndex)} accessibilityRole="radio" accessibilityState={{ selected, disabled: verified }} accessibilityLabel={`${LETTERS[optionIndex]}. ${option}${correct ? ', resposta correta' : wrong ? ', resposta incorreta' : ''}`}
              style={({ pressed }) => [styles.option, selected && styles.optionSelected, correct && styles.optionCorrect, wrong && styles.optionWrong, pressed && !verified && styles.pressed]}>
              <View style={[styles.letter, selected && styles.letterSelected, correct && styles.letterCorrect, wrong && styles.letterWrong]}><Text style={[styles.letterText, (selected || correct) && styles.letterTextOn]}>{LETTERS[optionIndex]}</Text></View>
              <Text style={styles.optionText}>{option}</Text>{(correct || wrong) && <Icon name={correct ? 'check-circle' : 'x-circle'} size={21} color={correct ? colors.green : colors.red} />}
            </Pressable>;
          })}</View>
        </ScrollView>
        {verified ? <LessonFeedback key={index} correct={correctChoice} correctAnswer={`${LETTERS[question.answer]}. ${question.options[question.answer]}`} explanation={question.explanation} lives={lives} checking={checking} loading={saving || checking} isLast={isLast} onContinue={advance} bottomInset={Math.max(insets.bottom, 12) + 10} />
          : <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 10 }]}>
            <Button title="Verificar resposta" onPress={verify} disabled={choice === null} loading={checking} variant="primary" icon="check" />
          </View>}
      </>}
  </Screen>;
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 20, paddingBottom: 18, borderBottomLeftRadius: 26, borderBottomRightRadius: 26, overflow: 'hidden' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  close: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  topCopy: { flex: 1, minWidth: 0, gap: 3 }, topEyebrow: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 1.2, color: '#D8F4E5' },
  topTitle: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 22, color: colors.white },
  lives: { minWidth: 54, height: 38, paddingHorizontal: 9, borderRadius: 13, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  livesText: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.redText },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 8 }, progressLabel: { fontFamily: fonts.bold, fontSize: 12, color: '#E4F6EC' },
  progressTrack: { height: 9, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.24)', overflow: 'hidden' }, progressFill: { height: '100%', borderRadius: 9, backgroundColor: colors.yellow },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 }, pressed: { opacity: 0.72 },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 22, paddingBottom: 30, gap: 16 },
  studyContent: { paddingTop: 28, gap: 18 },
  studyHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  studyHeadingCopy: { flex: 1 },
  studyHeading: { fontFamily: fonts.extrabold, fontSize: 21, lineHeight: 27, color: colors.ink },
  studyDescription: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: colors.gray, marginTop: 4 },
  studyCountText: { fontFamily: fonts.bold, fontSize: 12, color: colors.gray },
  questionContent: { paddingTop: 30, gap: 20 },
  questionBlock: { gap: 13, paddingHorizontal: 2, paddingBottom: 4 },
  question: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 33, color: colors.ink },
  questionHint: { fontFamily: fonts.semibold, fontSize: 13, color: colors.gray },
  options: { gap: 10 }, option: { minHeight: 66, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  optionSelected: { borderColor: colors.blue, backgroundColor: colors.blueSoft }, optionCorrect: { borderColor: colors.green, backgroundColor: colors.greenSoft }, optionWrong: { borderColor: colors.red, backgroundColor: colors.redSoft },
  letter: { width: 39, height: 39, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  letterSelected: { backgroundColor: colors.blue }, letterCorrect: { backgroundColor: colors.green }, letterWrong: { backgroundColor: colors.red },
  letterText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.gray }, letterTextOn: { color: colors.white },
  optionText: { flex: 1, fontFamily: fonts.bold, fontSize: 15, lineHeight: 22, color: colors.ink },
  footer: { paddingHorizontal: 20, paddingTop: 13, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
});
