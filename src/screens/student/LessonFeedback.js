import { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Icon } from '../../components';
import useReducedMotion from '../../hooks/useReducedMotion';
import { colors, fonts, text } from '../../theme';

export default function LessonFeedback({ correct, correctAnswer, explanation, lives, checking, isLast, loading, onContinue, bottomInset }) {
  const reduceMotion = useReducedMotion();
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) { reveal.setValue(1); return; }
    reveal.setValue(0);
    Animated.timing(reveal, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [correct, reduceMotion, reveal]);

  const tone = correct ? colors.green : colors.red;
  return <Animated.View style={[styles.panel, correct ? styles.correct : styles.wrong, {
    paddingBottom: bottomInset,
    opacity: reveal,
    transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  }]} accessibilityLiveRegion="polite">
    <ScrollView style={styles.details} contentContainerStyle={styles.detailsContent} showsVerticalScrollIndicator={false}>
      <View style={styles.heading}>
        <View style={[styles.mark, { backgroundColor: tone }]}><Icon name={correct ? 'check' : 'x'} size={18} color={colors.white} strokeWidth={3} /></View>
        <Text style={[styles.title, { color: correct ? colors.greenDark : colors.redText }]}>{correct ? 'Muito bem, você acertou!' : 'Não foi dessa vez'}</Text>
      </View>
      {!correct && <View style={styles.answer}>
        <Text style={styles.answerLabel}>RESPOSTA CORRETA</Text>
        <Text style={styles.answerText}>{correctAnswer}</Text>
      </View>}
      {!correct && !!explanation && <Text style={styles.explanation}>{explanation}</Text>}
      {!correct && <View style={styles.lifeNote}><Icon name="heart" size={15} color={colors.redText} fill={colors.redText} /><Text style={styles.lifeText}>{checking ? 'Atualizando suas vidas...' : `${lives} ${lives === 1 ? 'vida restante' : 'vidas restantes'}`}</Text></View>}
    </ScrollView>
    <Button title={isLast ? 'VER RESULTADO' : 'CONTINUAR'} onPress={onContinue} loading={loading} variant={correct ? 'reward' : 'danger'} />
  </Animated.View>;
}

const styles = StyleSheet.create({
  panel: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 14, gap: 13 },
  correct: { borderTopColor: '#B9DEC9', backgroundColor: '#E9F5EF' },
  wrong: { borderTopColor: '#F2B8B5', backgroundColor: '#FDE3E0' },
  details: { maxHeight: 210 }, detailsContent: { gap: 10, paddingBottom: 2 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 30 },
  mark: { width: 27, height: 27, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: fonts.extrabold, fontSize: 18, lineHeight: 24 },
  answer: { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 13, paddingHorizontal: 12, paddingVertical: 10, gap: 3 },
  answerLabel: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 0.8, color: colors.redText },
  answerText: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 20, color: colors.ink },
  explanation: { ...text.body, fontSize: 13, lineHeight: 19, color: colors.ink },
  lifeNote: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lifeText: { fontFamily: fonts.bold, fontSize: 12, color: colors.redText },
});
