import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LoadingView, EmptyState, FadeIn } from '../../components';
import { loadClassPerformance } from '../../services/classService';
import { topicLabel } from '../../constants/topics';
import { friendlyError } from '../../utils/errors';
import { initials, plural } from '../../utils/format';
import { colors, fonts, text } from '../../theme';

const CHART_HEIGHT = 150;

// Green from 75%, yellow from 60%, red below
const barColor = (percent) => (percent >= 75 ? colors.green : percent >= 60 ? colors.yellow : colors.red);

// Screen 19: overall accuracy, accuracy by topic and students who need support
export default function ClassPerformanceTab({ classId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setData(null);
    setError('');
    loadClassPerformance(classId)
      .then((result) => { if (active) setData(result); })
      .catch((e) => { if (active) setError(friendlyError(e)); });
    return () => { active = false; };
  }, [classId, attempt]);

  if (error) {
    return <EmptyState isError title="Não foi possível carregar" message={error} actionLabel="Tentar de novo" onAction={() => setAttempt(attempt + 1)} />;
  }
  if (!data) return <LoadingView message="Calculando desempenho..." />;

  if (data.responses === 0) {
    return (
      <EmptyState
        image={require('../../../assets/mascotes/abelha.png')}
        title="Ainda sem respostas"
        message="Quando os estudantes responderem aos quizzes, o desempenho da turma aparece aqui."
      />
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <FadeIn style={[styles.card, { gap: 10 }]}>
        <Text style={text.label}>Taxa de acerto geral</Text>
        <Text style={styles.big}>{data.overall}%</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${data.overall}%` }]} />
        </View>
        <Text style={text.caption}>
          {plural(data.responses, 'resposta', 'respostas')} em {plural(data.quizzesCount, 'quiz', 'quizzes')}
        </Text>
      </FadeIn>

      <FadeIn delay={90} style={styles.card}>
        <Text style={text.label}>Acerto por tema</Text>
        {data.byTopic.length === 0 ? (
          <Text style={[text.caption, { marginTop: 8 }]}>Sem dados por tema ainda.</Text>
        ) : (
          <View style={styles.chart}>
            {data.byTopic.map((t) => (
              <View key={t.topic} style={styles.column}>
                <View style={styles.barArea}>
                  <Text style={styles.percent}>{t.percent}%</Text>
                  <View style={[styles.bar, { height: Math.max(4, (t.percent / 100) * CHART_HEIGHT), backgroundColor: barColor(t.percent) }]} />
                </View>
                <Text style={styles.topicName} numberOfLines={2}>{topicLabel(t.topic)}</Text>
              </View>
            ))}
          </View>
        )}
      </FadeIn>

      <FadeIn delay={180} style={[styles.card, { gap: 12 }]}>
        <Text style={text.label}>Alunos com dificuldade</Text>
        {data.strugglingStudents.length === 0 ? (
          <Text style={text.caption}>Nenhum aluno precisa de apoio no momento. 🎉</Text>
        ) : (
          data.strugglingStudents.map((s) => (
            <View key={s.id} style={styles.studentRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(s.name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{s.name}</Text>
                <Text style={text.caption}>{s.answersCorrect} de {s.answersTotal} respostas corretas</Text>
              </View>
              <Text style={styles.studentPercent}>{s.accuracy}%</Text>
            </View>
          ))
        )}
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 20, padding: 18 },
  big: { fontFamily: fonts.extrabold, fontSize: 44, lineHeight: 48, color: colors.ink },
  track: { height: 12, borderRadius: 999, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999, backgroundColor: colors.green },
  chart: { flexDirection: 'row', gap: 16, marginTop: 14, alignItems: 'flex-end', borderBottomWidth: 2, borderBottomColor: colors.border, paddingBottom: 4 },
  column: { flex: 1, alignItems: 'center' },
  barArea: { height: CHART_HEIGHT + 28, justifyContent: 'flex-end', alignItems: 'center', gap: 6, width: '100%' },
  percent: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
  bar: { width: 44, maxWidth: '100%', borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  topicName: { ...text.caption, fontFamily: fonts.bold, textAlign: 'center', marginTop: 8, minHeight: 34 },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.redText },
  studentName: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
  studentPercent: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.redText },
});
