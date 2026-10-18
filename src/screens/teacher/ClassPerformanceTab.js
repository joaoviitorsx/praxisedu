import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Button, LoadingView, EmptyState, FadeIn, Icon } from '../../components';
import { loadClassPerformance } from '../../services/classService';
import { performanceSections } from '../../features/teacher/performanceModel';
import { topicLabel } from '../../constants/topics';
import { friendlyError } from '../../utils/errors';
import { initials, plural } from '../../utils/format';
import { colors, fonts, text } from '../../theme';

// Green from 75%, yellow from 60%, red below
const barColor = (percent) => (percent >= 75 ? colors.green : percent >= 60 ? colors.yellow : colors.red);

export default function ClassPerformanceTab({ classId, membersCount = 0, onShowStudents }) {
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
    return <EmptyState isError title="Não foi possível carregar" message={error} actionLabel="Tentar de novo" onAction={() => setAttempt((value) => value + 1)} />;
  }
  if (!data) return <LoadingView message="Calculando desempenho..." />;
  const { quizMetrics, lessonSupport } = performanceSections(data);

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.heading}><Text style={text.h2}>Desempenho da turma</Text><Text style={text.caption}>Quizzes e lições apresentados separadamente para orientar as próximas aulas.</Text></View>
      {quizMetrics ? <>
      <FadeIn style={[styles.card, { gap: 10 }]}>
        <Text style={text.label}>ACERTO NOS QUIZZES</Text>
        <View style={styles.overallRow}><Text style={styles.big}>{data.overall}%</Text><View style={styles.overallIcon}><Icon name="target" size={24} color={colors.blue} /></View></View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${data.overall}%`, backgroundColor: barColor(data.overall) }]} />
        </View>
        <Text style={text.caption}>
          {plural(data.responses, 'resposta', 'respostas')} {data.responses === 1 ? 'registrada' : 'registradas'} · {membersCount} estudantes na turma
        </Text>
      </FadeIn>

      <FadeIn delay={90} style={styles.card}>
        <Text style={text.label}>ACERTO POR TEMA</Text>
        {data.byTopic.length === 0 ? (
          <Text style={[text.caption, { marginTop: 8 }]}>Sem dados por tema ainda.</Text>
        ) : (
          <View style={styles.chart}>
            {data.byTopic.map((t) => (
              <View key={t.topic} style={styles.topicRow}>
                <View style={styles.topicHead}><Text style={styles.topicName}>{topicLabel(t.topic)}</Text><Text style={styles.percent}>{t.percent}%</Text></View>
                <View style={styles.topicTrack}><View style={[styles.topicFill, { width: `${t.percent}%`, backgroundColor: barColor(t.percent) }]} /></View>
              </View>
            ))}
          </View>
        )}
      </FadeIn>

      </> : <EmptyState image={require('../../../assets/mascotes/abelha.png')} title="Ainda sem respostas aos quizzes" message={data.quizzesCount ? 'Quando os estudantes responderem, os acertos por tema aparecerão aqui.' : 'Crie um quiz para começar a acompanhar os acertos da turma.'} actionLabel={data.quizzesCount ? undefined : 'Criar quiz'} onAction={() => router.push({ pathname: '/teacher/class/[classId]/quiz/new', params: { classId } })} />}

      {lessonSupport || quizMetrics ? <FadeIn delay={180} style={[styles.card, { gap: 12 }]}>
        <View style={styles.supportHeading}><Text style={text.label}>APOIO NAS LIÇÕES</Text><Text style={text.caption}>Com base nas atividades das lições, não nos quizzes.</Text></View>
        {lessonSupport ? <>
          {data.strugglingStudents.slice(0, 5).map((s) => (
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
          ))}
          {data.strugglingStudents.length > 5 ? <Text style={text.caption}>Exibindo 5 de {data.strugglingStudents.length} estudantes que precisam de apoio.</Text> : null}
          {onShowStudents ? <Button title="Ver alunos da turma" variant="secondary" onPress={onShowStudents} /> : null}
        </> : <Text style={text.caption}>Nenhum estudante precisa de apoio nas lições no momento.</Text>}
      </FadeIn> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { paddingHorizontal: 2, gap: 4 },
  supportHeading: { gap: 4 },
  card: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 20, padding: 18 },
  big: { fontFamily: fonts.extrabold, fontSize: 44, lineHeight: 48, color: colors.ink },
  overallRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overallIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  track: { height: 12, borderRadius: 999, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999, backgroundColor: colors.green },
  chart: { gap: 16, marginTop: 16 },
  topicRow: { gap: 7 },
  topicHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  percent: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.ink },
  topicTrack: { height: 10, borderRadius: 999, backgroundColor: colors.border, overflow: 'hidden' },
  topicFill: { height: '100%', borderRadius: 999 },
  topicName: { ...text.caption, fontFamily: fonts.bold, fontSize: 14, flex: 1 },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.redText },
  studentName: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
  studentPercent: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.redText },
});
