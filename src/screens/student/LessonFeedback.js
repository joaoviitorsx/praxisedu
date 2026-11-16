import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Icon } from '../../components';
import useReducedMotion from '../../hooks/useReducedMotion';
import { createNote } from '../../services/notesService';
import { playClickSound, playCorrectSound } from '../../services/soundService';
import { colors, fonts, text } from '../../theme';

export default function LessonFeedback({
  correct,
  correctAnswer,
  explanation,
  mnemonic,
  questionText,
  topic = 'citologia',
  uid,
  lives,
  checking,
  isLast,
  loading,
  onContinue,
  bottomInset,
}) {
  const reduceMotion = useReducedMotion();
  const reveal = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const [savedNote, setSavedNote] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState(false);

  useEffect(() => {
    if (reduceMotion) { reveal.setValue(1); bounce.setValue(1); return; }
    reveal.setValue(0);
    bounce.setValue(0);
    Animated.parallel([
      Animated.timing(reveal, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(bounce, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true }),
    ]).start();
  }, [correct, reduceMotion, reveal, bounce]);

  async function handleSaveNote() {
    if (!uid || savedNote || savingNote) return;
    playClickSound();
    setSavingNote(true);
    setNoteError(false);
    try {
      const noteTitle = questionText ? questionText.slice(0, 70) : 'Dica de Biologia';
      const noteContent = [
        questionText ? `Questão: ${questionText}` : '',
        correctAnswer ? `Gabarito: ${correctAnswer}` : '',
        explanation ? `Explicação: ${explanation}` : '',
        mnemonic ? `💡 Macete: ${mnemonic}` : '',
      ].filter(Boolean).join('\n\n');

      await createNote(uid, {
        title: noteTitle,
        content: noteContent || 'Revisão da questão de Biologia.',
        topic: topic || 'citologia',
        color: '#10B981',
      });
      playCorrectSound();
      setSavedNote(true);
    } catch {
      // Não trava a lição: só avisa e deixa tentar de novo.
      setNoteError(true);
    } finally {
      setSavingNote(false);
    }
  }

  const tone = correct ? colors.green : colors.red;
  return (
    <Animated.View style={[styles.panel, correct ? styles.correct : styles.wrong, {
      paddingBottom: bottomInset,
      opacity: reveal,
      transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
    }]} accessibilityLiveRegion="polite">
      <ScrollView style={styles.details} contentContainerStyle={styles.detailsContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <Animated.View style={[styles.mark, { backgroundColor: tone, transform: [{ scale: bounce }] }]}>
            <Icon name={correct ? 'check' : 'x'} size={18} color={colors.white} strokeWidth={3} />
          </Animated.View>
          <Text style={[styles.title, { color: correct ? colors.greenDark : colors.redText }]}>
            {correct ? 'Muito bem, você acertou!' : 'Não foi dessa vez'}
          </Text>
        </View>

        {!correct && (
          <View style={styles.answer}>
            <Text style={styles.answerLabel}>RESPOSTA CORRETA</Text>
            <Text style={styles.answerText}>{correctAnswer}</Text>
          </View>
        )}

        {!!explanation && <Text style={styles.explanation}>{explanation}</Text>}

        {!!mnemonic && (
          <View style={styles.mnemonicCard}>
            <View style={styles.mnemonicHeader}>
              <Icon name="sparkles" size={14} color="#D97706" />
              <Text style={styles.mnemonicTitle}>Macete do Prof. Maurício</Text>
            </View>
            <Text style={styles.mnemonicText}>{mnemonic}</Text>
          </View>
        )}

        {uid ? (
          <Pressable
            onPress={handleSaveNote}
            disabled={savedNote || savingNote}
            style={[styles.saveBtn, savedNote && styles.saveBtnDone]}
            accessibilityRole="button"
          >
            <Icon
              name={savedNote ? 'check-circle' : 'bookmark'}
              size={14}
              color={savedNote ? colors.greenDark : colors.ink}
            />
            <Text style={[styles.saveBtnText, savedNote && styles.saveBtnTextDone]}>
              {savedNote ? 'Salvo no seu Caderno de Notas!' : savingNote ? 'Salvando no Caderno...' : noteError ? 'Não deu para salvar. Tentar de novo' : 'Guardar no meu Caderno'}
            </Text>
          </Pressable>
        ) : null}

        {!correct && (
          <View style={styles.lifeNote}>
            <Icon name="heart" size={15} color={colors.redText} fill={colors.redText} />
            <Text style={styles.lifeText}>
              {checking ? 'Atualizando suas vidas...' : `${lives} ${lives === 1 ? 'vida restante' : 'vidas restantes'}`}
            </Text>
          </View>
        )}
      </ScrollView>

      <Button
        title={isLast ? 'VER RESULTADO' : 'CONTINUAR'}
        onPress={onContinue}
        loading={loading}
        variant={correct ? 'reward' : 'danger'}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 14, gap: 13 },
  correct: { borderTopColor: '#B9DEC9', backgroundColor: '#E9F5EF' },
  wrong: { borderTopColor: '#F2B8B5', backgroundColor: '#FDE3E0' },
  details: { maxHeight: 240 },
  detailsContent: { gap: 10, paddingBottom: 2 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 30 },
  mark: { width: 27, height: 27, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: fonts.extrabold, fontSize: 18, lineHeight: 24 },
  answer: { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 13, paddingHorizontal: 12, paddingVertical: 10, gap: 3 },
  answerLabel: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 0.8, color: colors.redText },
  answerText: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 20, color: colors.ink },
  explanation: { ...text.body, fontSize: 13, lineHeight: 19, color: colors.ink },
  mnemonicCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 4,
  },
  mnemonicHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mnemonicTitle: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 0.6, color: '#B45309' },
  mnemonicText: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 17, color: '#78350F' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  saveBtnDone: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  saveBtnText: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  saveBtnTextDone: { color: colors.greenDark },
  lifeNote: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lifeText: { fontFamily: fonts.bold, fontSize: 12, color: colors.redText },
});
