import { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Icon, Mascot } from '../../components';
import useReducedMotion from '../../hooks/useReducedMotion';
import { colors, fonts, text } from '../../theme';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function LessonCompletion({ title, mascot, completionKind, result, questions, picks, materialsCount, topInset, bottomInset, onLeave }) {
  const reduceMotion = useReducedMotion();
  const entrance = useRef(new Animated.Value(0)).current;
  const hasQuestions = questions.length > 0;
  const accuracy = hasQuestions ? Math.round(result.correct / result.total * 100) : null;
  const mistakes = questions.filter((question, index) => picks[index] !== question.answer);
  const headline = completionKind === 'trail' ? 'Trilha completa!' : completionKind === 'topic' ? 'Tópico completo!' : !hasQuestions ? 'Conteúdo estudado!' : accuracy === 100 ? 'Perfeito!' : accuracy >= 70 ? 'Mandou bem!' : 'Etapa concluída!';
  const subtitle = completionKind === 'trail' ? 'Você concluiu todas as etapas da trilha.' : completionKind === 'topic' ? 'Você concluiu todas as etapas deste tópico.' : '';

  useEffect(() => {
    if (reduceMotion) { entrance.setValue(1); return; }
    entrance.setValue(0);
    Animated.spring(entrance, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }).start();
  }, [entrance, reduceMotion]);

  return <View style={styles.root}>
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset + 20 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Animated.View style={{ opacity: entrance, transform: [{ scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }}>
          <Mascot name={mascot} size={104} />
        </Animated.View>
        <Text style={styles.eyebrow}>{completionKind === 'trail' ? 'TODAS AS ETAPAS' : completionKind === 'topic' ? 'TÓPICO CONCLUÍDO' : 'ETAPA CONCLUÍDA'}</Text>
        <Text style={styles.headline}>{headline}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryCopy}><Text style={styles.summaryLabel}>SEU RESULTADO</Text><Text style={styles.summaryTitle}>{title}</Text></View>
        <View style={styles.summaryScoreRow}><Text style={styles.summaryScore}>{hasQuestions ? `${result.correct}/${result.total}` : materialsCount}</Text><Text style={styles.summaryScoreLabel}>{hasQuestions ? 'respostas certas' : materialsCount === 1 ? 'material explorado' : 'materiais explorados'}</Text></View>
        {hasQuestions && <View style={styles.stars} accessibilityLabel={`${result.stars} de 3 estrelas`}>
          {[0, 1, 2].map((star) => <Icon key={star} name="star" size={28} color={colors.yellowDark} fill={star < result.stars ? colors.yellow : colors.white} strokeWidth={2.4} />)}
        </View>}
        <View style={styles.metrics}>
          <View style={styles.metric}><Icon name="zap" size={19} color={colors.green} /><Text style={styles.metricText}>+{result.xp ?? 0} XP</Text></View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}><Icon name="flame" size={19} color={colors.orangeText} /><Text style={styles.metricText}>{result.streak ?? 0} {result.streak === 1 ? 'dia' : 'dias'}</Text></View>
        </View>
      </View>

      {mistakes.length > 0 && <View style={styles.review}>
        <View style={styles.reviewHeader}><View style={styles.reviewMark}><Icon name="book-open" size={20} color={colors.orangeText} /></View><View style={styles.reviewCopy}><Text style={styles.reviewTitle}>Pontos para revisar</Text><Text style={styles.reviewIntro}>{mistakes.length} {mistakes.length === 1 ? 'questão para reforçar' : 'questões para reforçar'}</Text></View></View>
        {mistakes.map((question) => <View key={question.id} style={styles.reviewItem}>
          <Text style={styles.reviewQuestion}>{question.text}</Text>
          <Text style={styles.reviewAnswer}>{LETTERS[question.answer]}. {question.options[question.answer]}</Text>
        </View>)}
      </View>}
      {mistakes.length === 0 && <Text style={styles.encouragement}>{hasQuestions ? 'Você dominou todas as questões desta etapa. Continue avançando!' : 'Continue explorando a trilha para descobrir a próxima etapa.'}</Text>}
    </ScrollView>
    <View style={[styles.footer, { paddingBottom: bottomInset }]}><Button title="VOLTAR À TRILHA" onPress={onLeave} variant="onGreen" icon="arrow-right" /></View>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.green },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 30, gap: 20, flexGrow: 1 },
  hero: { alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingBottom: 4 },
  eyebrow: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 1, color: '#C8F0DA', marginTop: 8 },
  headline: { fontFamily: fonts.extrabold, fontSize: 34, lineHeight: 42, color: colors.white, textAlign: 'center' },
  subtitle: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22, color: '#DDF7E8', textAlign: 'center' },
  summary: { borderRadius: 20, padding: 20, backgroundColor: colors.white, gap: 9 },
  summaryCopy: { gap: 3 }, summaryLabel: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 1, color: colors.green },
  summaryTitle: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 23, color: colors.ink },
  summaryScoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 9 },
  summaryScore: { fontFamily: fonts.extrabold, fontSize: 34, lineHeight: 42, color: colors.greenDark },
  summaryScoreLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.gray, flexShrink: 1 },
  stars: { flexDirection: 'row', gap: 7 },
  metrics: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: colors.border, marginTop: 7, paddingTop: 15 },
  metric: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  metricDivider: { width: 1, height: 24, backgroundColor: colors.border },
  metricText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.ink },
  review: { backgroundColor: colors.white, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 },
  reviewHeader: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  reviewMark: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.orangeSoft, alignItems: 'center', justifyContent: 'center' },
  reviewCopy: { flex: 1, gap: 2 }, reviewTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink }, reviewIntro: { fontFamily: fonts.semibold, fontSize: 12, color: colors.gray },
  reviewItem: { gap: 5, paddingTop: 11, borderTopWidth: 1, borderColor: colors.border },
  reviewQuestion: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 19, color: colors.ink },
  reviewAnswer: { fontFamily: fonts.extrabold, fontSize: 13, lineHeight: 19, color: colors.greenDark },
  encouragement: { ...text.caption, color: '#E3F8EC', textAlign: 'center', lineHeight: 20, paddingHorizontal: 12 },
  footer: { paddingHorizontal: 20, paddingTop: 13, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.22)', backgroundColor: colors.greenDark },
});
