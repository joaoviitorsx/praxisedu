import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { EmptyState, Icon, LoadingView } from '../../components';
import TeacherHero, { teacherSheetStyle } from '../../components/TeacherHero';
import { listenClassMembers } from '../../services/classService';
import { getQuiz, listenQuizResults } from '../../services/quizService';
import { friendlyError } from '../../utils/errors';
import { colors, fonts, text } from '../../theme';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizResultsScreen() {
  const { classId, quizId } = useLocalSearchParams();
  const [quiz, setQuiz] = useState(null);
  const [results, setResults] = useState(null);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let stopResults = () => {};
    setQuiz(null); setResults(null); setError('');
    const stopMembers = listenClassMembers(classId, (list) => { if (active) setMembers(list); }, (e) => { if (active) setError(friendlyError(e)); });
    getQuiz(classId, quizId).then((value) => {
      if (!active) return;
      if (!value) { setError('Este quiz não está mais disponível.'); return; }
      setQuiz(value);
      stopResults = listenQuizResults(classId, value, setResults, (e) => setError(friendlyError(e)));
    }).catch((e) => { if (active) setError(friendlyError(e)); });
    return () => { active = false; stopMembers(); stopResults(); };
  }, [classId, quizId]);

  return <View style={styles.root}>
    <TeacherHero eyebrow="DESEMPENHO DO QUIZ" title="Resultados" subtitle={quiz?.title ?? 'Acompanhe as respostas da turma.'} onBack={() => router.back()} backLabel="Atividades" />
    <View style={styles.sheet}><ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {error ? <EmptyState isError title="Não foi possível carregar" message={error} actionLabel="Voltar" onAction={() => router.back()} /> : !results ? <LoadingView message="Calculando resultados..." /> : <>
        <View style={styles.sectionHeading}><Text style={text.h2}>Visão geral</Text><Text style={text.caption}>{results.responses} de {members.length} estudantes responderam</Text></View>
        <View style={styles.summary}>
          <Stat value={`${results.accuracy}%`} label="acerto médio" color={colors.green} />
          <Stat value={`${results.responses}/${members.length}`} label="responderam" color={colors.blue} />
        </View>
        {results.responses === 0 && <EmptyState title="Ainda sem respostas" message="Os resultados aparecem assim que os estudantes responderem ao quiz." />}
        {results.questions.length > 0 ? <Text style={styles.sectionLabel}>QUESTÃO A QUESTÃO</Text> : null}
        {results.questions.map((question, index) => <View key={index} style={styles.card}>
          <View style={styles.questionTop}><Text style={text.label}>QUESTÃO {index + 1}</Text><Text style={[styles.questionPercent, { color: question.accuracy >= 60 ? colors.green : colors.redText }]}>{question.accuracy}% acerto</Text></View>
          <Text style={styles.questionText}>{question.text}</Text>
          {question.options.map((option, answerIndex) => {
            const count = question.counts[answerIndex];
            const percent = question.responses ? Math.round((count / question.responses) * 100) : 0;
            const correct = question.answer === answerIndex;
            return <View key={answerIndex} style={styles.option}>
              <Text style={[styles.optionLabel, correct && { color: colors.greenDark }]} numberOfLines={2}>{LETTERS[answerIndex]}. {option}</Text>
              <View style={styles.track}><View style={[styles.fill, { width: `${percent}%`, backgroundColor: correct ? colors.green : colors.blue }]} /></View>
              <Text style={styles.percent}>{percent}%</Text>
              {correct && <Icon name="check" size={15} color={colors.green} />}
            </View>;
          })}
          <Text style={styles.explanation}>Resposta: {LETTERS[question.answer]} · {question.explanation}</Text>
        </View>)}
      </>}
    </ScrollView></View>
  </View>;
}

function Stat({ value, label, color }) {
  return <View style={styles.stat}><Text style={[styles.statValue, { color }]}>{value}</Text><Text style={text.caption}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  sheet: teacherSheetStyle,
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 36, gap: 12 },
  sectionHeading: { gap: 4, marginBottom: 2 },
  sectionLabel: { ...text.label, marginTop: 12 },
  summary: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 16, padding: 14 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 24 },
  card: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 20, padding: 16, gap: 12 },
  questionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  questionPercent: { fontFamily: fonts.extrabold, fontSize: 15 },
  questionText: { fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 23, color: colors.ink },
  option: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  optionLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.ink, width: 96 },
  track: { flex: 1, height: 9, backgroundColor: colors.border, borderRadius: 99, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 },
  percent: { width: 34, textAlign: 'right', fontFamily: fonts.bold, fontSize: 12, color: colors.gray },
  explanation: { ...text.caption, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, lineHeight: 19 },
});
