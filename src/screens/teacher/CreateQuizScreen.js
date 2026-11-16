import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, router } from 'expo-router';
import { Button, EmptyState, Icon, Input } from '../../components';
import TeacherHero, { teacherSheetStyle } from '../../components/TeacherHero';
import QuestionForm from '../../components/QuestionForm';
import { useAuth } from '../../contexts/AuthContext';
import { TOPICS } from '../../constants/topics';
import { generateQuestions } from '../../services/aiService';
import { loadTeacherClasses } from '../../services/classService';
import { createQuiz } from '../../services/quizService';
import { validateQuiz } from '../../features/teacher/quizModel';
import { friendlyError } from '../../utils/errors';
import { colors, fonts, text } from '../../theme';

const blankQuestion = () => ({ id: `manual-${Date.now()}-${Math.random()}`, text: '', options: ['', '', '', ''], answer: null, explanation: '' });

export default function CreateQuizScreen() {
  const { classId: initialClassId } = useLocalSearchParams();
  const { user } = useAuth();
  const [classes, setClasses] = useState(null);
  const [classId, setClassId] = useState(typeof initialClassId === 'string' ? initialClassId : '');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState([]);
  const [creationMode, setCreationMode] = useState('ai');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [aiError, setAiError] = useState('');
  const [notice, setNotice] = useState('');
  const [hasAiQuestions, setHasAiQuestions] = useState(false);
  const selectedClass = classes?.find((item) => item.id === classId);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoadError('');
    loadTeacherClasses(user.uid).then((list) => { if (active) setClasses(list); })
      .catch((e) => { if (active) setLoadError(friendlyError(e)); });
    return () => { active = false; };
  }, [user.uid]));

  useEffect(() => {
    if (typeof initialClassId === 'string') setClassId(initialClassId);
  }, [initialClassId]);

  async function retryClasses() {
    setLoadError('');
    try { setClasses(await loadTeacherClasses(user.uid)); }
    catch (e) { setLoadError(friendlyError(e)); }
  }

  function patchQuestion(id, change) {
    setError('');
    setQuestions((current) => current.map((question) => question.id === id ? { ...question, ...change } : question));
  }

  async function generate() {
    const theme = aiPrompt.trim() || TOPICS[topic]?.label;
    if (!theme) { setAiError('Escolha um tema acima ou descreva o conteúdo aqui.'); return; }
    setAiError(''); setGenerating(true);
    try {
      const generated = await generateQuestions(theme, 3);
      setQuestions((current) => [
        ...current.filter((question) => question.text.trim() || question.options.some((option) => option.trim())),
        ...generated.map((question, index) => ({ ...question, id: `ai-${Date.now()}-${index}` })),
      ]);
      setHasAiQuestions(true);
      setNotice('Questões adicionadas. Revise o gabarito e as explicações antes de salvar.');
    } catch (e) { setAiError(friendlyError(e)); }
    finally { setGenerating(false); }
  }

  async function save(publish) {
    const issue = validateQuiz({ classId, title, topic, questions });
    if (issue) { setError(issue); return; }
    setSaving(true); setError('');
    try {
      await createQuiz(classId, user.uid, { title, topic, questions, source: hasAiQuestions ? 'ai' : 'manual', publish });
      router.replace({ pathname: '/teacher/class/[classId]', params: { classId, tab: 'activities', toast: publish ? 'Quiz publicado' : 'Rascunho salvo' } });
    } catch (e) { setError(friendlyError(e)); setSaving(false); }
  }

  return <View style={styles.root}>
    <TeacherHero eyebrow="ATIVIDADE DA TURMA" title="Quiz de sala" subtitle="Prepare questões para responder durante a aula." onBack={() => router.back()} />
    <View style={styles.sheet}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.intro}><Text style={styles.introTitle}>Monte o quiz</Text><Text style={styles.hint}>Depois de publicar, libere o quiz no Modo Sala da turma.</Text></View>

          <View style={styles.section}>
            <StepHeading number="1" title="Dados do quiz" subtitle="Defina um nome e o conteúdo que será trabalhado." />
            <Text style={text.label}>TURMA</Text>
            {loadError ? <EmptyState isError title="Não foi possível carregar as turmas" message={loadError} actionLabel="Tentar novamente" onAction={retryClasses} /> : !classes ? <ActivityIndicator color={colors.blue} /> : classes.length === 0 ?
              <EmptyState title="Crie uma turma primeiro" message="Você precisa de uma turma para publicar um quiz." actionLabel="Criar turma" onAction={() => router.push('/teacher/class/new')} /> :
              selectedClass ? <View style={styles.selectedClass}><Icon name="users" size={20} color={colors.blue} /><Text style={styles.selectedClassName}>{selectedClass.name}</Text></View> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
                {classes.map((cls) => <Choice key={cls.id} selected={classId === cls.id} label={cls.name} onPress={() => { setClassId(cls.id); setError(''); }} />)}
              </ScrollView>}
            <Input label="Título do quiz" value={title} onChangeText={(value) => { setTitle(value); setError(''); }} placeholder="Ex.: Revisão de Citologia" accent={colors.blue} maxLength={80} />
            <Text style={text.label}>TEMA DE BIOLOGIA</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
              {Object.entries(TOPICS).map(([key, value]) => <Choice key={key} selected={topic === key} label={value.label} onPress={() => { setTopic(key); setError(''); }} />)}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <StepHeading number="2" title="Crie as questões" subtitle="Escolha como começar. Depois você poderá editar tudo." />
            <View style={styles.modeChoices} accessibilityRole="radiogroup">
              <ModeChoice label="Gerar com IA" icon="sparkles" selected={creationMode === 'ai'} onPress={() => setCreationMode('ai')} />
              <ModeChoice label="Escrever" icon="pencil" selected={creationMode === 'manual'} onPress={() => setCreationMode('manual')} />
            </View>
            {creationMode === 'ai' ? <View style={styles.aiBox}>
              <View style={styles.aiHeading}><Icon name="sparkles" size={20} color={colors.purple} /><Text style={styles.aiTitle}>Gemini ajuda no primeiro rascunho</Text></View>
              <Text style={styles.hint}>Gera 3 questões sobre o tema escolhido. Detalhe o conteúdo se quiser focar em algo específico.</Text>
              <Text style={text.label}>CONTEÚDO (OPCIONAL)</Text>
              <TextInput value={aiPrompt} onChangeText={setAiPrompt} placeholder="Ex.: organelas e suas funções" placeholderTextColor={colors.gray} style={styles.aiInput} accessibilityLabel="Conteúdo específico para gerar questões" />
              {aiError ? <View style={styles.inlineError}><Icon name="alert-triangle" size={18} color={colors.redText} /><Text style={styles.errorText}>{aiError}</Text></View> : null}
              <Button title={generating ? 'Gerando questões...' : 'Gerar 3 questões'} icon="sparkles" variant="teacher" size="md" loading={generating} onPress={generate} />
            </View> : <View style={styles.manualBox}>
              <Text style={styles.hint}>Escreva o enunciado, quatro alternativas, o gabarito e a explicação.</Text>
              <Button title="Adicionar questão manual" icon="plus" variant="outline" size="md" onPress={() => setQuestions((current) => [...current, blankQuestion()])} />
            </View>}
          </View>

          <View style={styles.reviewHeading}><StepHeading number="3" title="Revise e publique" subtitle={questions.length ? 'Confira o enunciado, o gabarito e a explicação.' : 'As questões aparecerão aqui para revisão.'} /><Text style={styles.count}>{questions.length}</Text></View>
          {notice ? <View style={styles.notice}><Icon name="check-circle" size={20} color={colors.green} /><Text style={styles.noticeText}>{notice}</Text></View> : null}
          {questions.length === 0 ? <View style={styles.emptyReview}><Icon name="file-plus" size={26} color={colors.blue} /><Text style={styles.emptyTitle}>Nenhuma questão ainda</Text><Text style={styles.hint}>Gere com IA ou escreva sua primeira questão acima.</Text></View> : questions.map((question, index) => <QuestionForm key={question.id} number={index + 1} question={question}
            onChange={(change) => patchQuestion(question.id, change)}
            onRemove={() => setQuestions((current) => current.filter((item) => item.id !== question.id))} />)}
          {questions.length ? <Button title="Adicionar outra questão" icon="plus" variant="outline" size="md" onPress={() => { setCreationMode('manual'); setQuestions((current) => [...current, blankQuestion()]); }} /> : null}
          <View style={styles.saveActions}>
            {error ? <View style={styles.error}><Icon name="alert-triangle" size={20} color={colors.redText} /><Text style={styles.errorText}>{error}</Text></View> : null}
            <Button title="Salvar e publicar" variant="teacher" onPress={() => save(true)} loading={saving} disabled={!questions.length || generating} />
            <Button title="Salvar rascunho" variant="secondary" onPress={() => save(false)} loading={saving} disabled={!questions.length || generating} />
            <Text style={styles.saveHint}>O rascunho também precisa estar completo, mas não ficará visível para os alunos.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  </View>;
}

function StepHeading({ number, title, subtitle }) {
  return <View style={styles.stepHeading}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View><View style={styles.stepCopy}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.hint}>{subtitle}</Text></View></View>;
}

function ModeChoice({ label, icon, selected, onPress }) {
  return <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: selected }} style={({ pressed }) => [styles.modeChoice, selected && styles.modeChoiceOn, pressed && styles.pressed]}>
    <Icon name={icon} size={19} color={selected ? colors.blue : colors.gray} /><Text style={[styles.modeText, selected && styles.modeTextOn]}>{label}</Text>
  </Pressable>;
}

function Choice({ selected, label, onPress }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} style={({ pressed }) => [styles.choice, selected && styles.choiceOn, pressed && styles.pressed]}>
    <Text style={[styles.choiceText, selected && { color: colors.blue }]}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  sheet: teacherSheetStyle,
  fill: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 44, gap: 18 },
  intro: { gap: 4, marginBottom: 2 },
  introTitle: { ...text.h1, fontSize: 23 },
  section: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 20, padding: 16, gap: 14 },
  stepHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  stepNumber: { width: 32, height: 32, borderRadius: 11, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.blue },
  stepCopy: { flex: 1, gap: 3 },
  sectionTitle: { ...text.h2, fontSize: 19 },
  hint: { ...text.caption, fontSize: 14, lineHeight: 20 },
  choices: { gap: 8, paddingVertical: 2 },
  selectedClass: { minHeight: 50, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.blueSoft, borderRadius: 14 },
  selectedClassName: { fontFamily: fonts.bold, fontSize: 15, color: colors.blue, flex: 1 },
  choice: { minHeight: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center' },
  choiceOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  choiceText: { fontFamily: fonts.bold, fontSize: 14, color: colors.gray },
  modeChoices: { flexDirection: 'row', gap: 8 },
  modeChoice: { flex: 1, minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 2, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface },
  modeChoiceOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  modeText: { fontFamily: fonts.bold, fontSize: 14, color: colors.gray },
  modeTextOn: { color: colors.blue },
  aiBox: { gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.purpleSoft },
  manualBox: { gap: 12, paddingTop: 4 },
  aiHeading: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  aiTitle: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.purpleDark, flex: 1 },
  aiInput: { minHeight: 52, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.border, borderRadius: 13, paddingHorizontal: 14, fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  inlineError: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  reviewHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  count: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.blue, backgroundColor: colors.blueSoft, overflow: 'hidden', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  emptyReview: { alignItems: 'center', gap: 8, padding: 24, borderWidth: 2, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.surface },
  emptyTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
  questionCard: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 20, padding: 16, gap: 12 },
  questionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  remove: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', margin: -8 },
  multiline: { minHeight: 84, height: undefined, paddingVertical: 14, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  optionLetter: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.blueSoft },
  optionLetterOn: { backgroundColor: colors.green },
  optionLetterText: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.blue },
  optionInput: { flex: 1, minHeight: 48, borderWidth: 2, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  saveActions: { gap: 10, marginTop: 4 },
  saveHint: { ...text.caption, textAlign: 'center', marginTop: 2 },
  error: { backgroundColor: colors.redSoft, borderColor: '#F5B5B5', borderWidth: 2, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  errorText: { ...text.body, flex: 1, color: colors.redText },
  notice: { backgroundColor: colors.greenSoft, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  noticeText: { ...text.caption, flex: 1, color: colors.greenDark },
  pressed: { opacity: 0.72 },
});
