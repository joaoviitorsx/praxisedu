import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Input from './Input';
import Icon from './Icon';
import { colors, fonts, text } from '../theme';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function QuestionForm({ number, question, onChange, onRemove }) {
  return <View style={styles.card}>
    <View style={styles.top}><Text style={text.label}>QUESTÃO {number}</Text><Pressable onPress={onRemove} accessibilityRole="button" accessibilityLabel={`Remover questão ${number}`} style={({ pressed }) => [styles.remove, pressed && styles.pressed]}><Icon name="trash" size={19} color={colors.redText} /></Pressable></View>
    <Input label="Enunciado" value={question.text} onChangeText={(value) => onChange({ text: value })} placeholder="Digite a pergunta" multiline style={styles.multiline} accent={colors.blue} />
    <Text style={text.label}>ALTERNATIVAS</Text>
    {question.options.map((option, index) => <View key={index} style={styles.optionRow}>
      <Pressable onPress={() => onChange({ answer: index })} accessibilityRole="radio" accessibilityState={{ checked: question.answer === index }} accessibilityLabel={`Marcar alternativa ${LETTERS[index]} como correta`} style={({ pressed }) => [styles.optionLetter, question.answer === index && styles.optionLetterOn, pressed && styles.pressed]}>
        <Text style={[styles.optionLetterText, question.answer === index && { color: colors.white }]}>{LETTERS[index]}</Text>
      </Pressable>
      <TextInput value={option} onChangeText={(value) => onChange({ options: question.options.map((item, position) => position === index ? value : item) })} placeholder={`Alternativa ${LETTERS[index]}`} placeholderTextColor={colors.gray} style={styles.optionInput} accessibilityLabel={`Texto da alternativa ${LETTERS[index]}`} />
    </View>)}
    <Input label="Explicação da resposta" value={question.explanation} onChangeText={(value) => onChange({ explanation: value })} placeholder="O aluno verá após responder" multiline style={styles.multiline} accent={colors.blue} />
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 20, padding: 16, gap: 12 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  remove: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', margin: -8 },
  multiline: { minHeight: 84, height: undefined, paddingVertical: 14, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  optionLetter: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.blueSoft },
  optionLetterOn: { backgroundColor: colors.green },
  optionLetterText: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.blue },
  optionInput: { flex: 1, minHeight: 48, borderWidth: 2, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  pressed: { opacity: 0.72 },
});
