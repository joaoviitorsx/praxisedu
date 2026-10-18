import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, EmptyState, Icon, Input, LoadingView, Mascot } from '../../components';
import QuestionForm from '../../components/QuestionForm';
import TeacherHero, { teacherSheetStyle } from '../../components/TeacherHero';
import { TOPICS, topicLabel } from '../../constants/topics';
import { generateQuestions } from '../../services/aiService';
import { allocateTrailId, loadTrailEditor, publishTrailUnit, saveTrailDraft } from '../../services/classTrailService';
import { validateTrailUnit } from '../../features/teacher/classTrailModel';
import { friendlyError } from '../../utils/errors';
import { colors, fonts, text } from '../../theme';

const MASCOTS = ['mito', 'sapo', 'medusa', 'teco', 'mandu', 'borbo', 'dinho', 'guara', 'abelha', 'baleia'];
const blankQuestion = () => ({ id: allocateTrailId(), text: '', options: ['', '', '', ''], answer: null, explanation: '' });
const blankLesson = () => ({ id: allocateTrailId(), title: '', questions: [blankQuestion()] });

export default function TrailEditorScreen() {
  const insets = useSafeAreaInsets();
  const { classId, unitId: routeUnitId } = useLocalSearchParams();
  const [newId] = useState(() => allocateTrailId());
  const unitId = routeUnitId === 'new' ? newId : routeUnitId;
  const [form, setForm] = useState(null);
  const [grade, setGrade] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setForm(null); setError('');
    loadTrailEditor(classId, unitId).then((result) => {
      if (!active) return;
      setForm(result.unit); setGrade(result.grade);
      setExpanded(result.unit.lessons[0]?.id ?? null);
    }).catch((cause) => { if (active) setError(friendlyError(cause)); });
    return () => { active = false; };
  }, [classId, unitId, retry]);

  function patch(change) { setForm((current) => ({ ...current, ...change })); setDirty(true); setNotice(''); setError(''); }
  function patchLesson(id, change) {
    setForm((current) => ({ ...current, lessons: current.lessons.map((lesson) => lesson.id === id ? { ...lesson, ...change } : lesson) }));
    setDirty(true); setNotice(''); setError('');
  }
  function patchQuestion(lesson, questionId, change) {
    patchLesson(lesson.id, { questions: lesson.questions.map((question) => question.id === questionId ? { ...question, ...change } : question) });
  }
  function moveLesson(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= form.lessons.length) return;
    const lessons = [...form.lessons];
    [lessons[index], lessons[target]] = [lessons[target], lessons[index]];
    patch({ lessons });
  }
  function removeLesson(lesson) {
    Alert.alert('Remover etapa?', 'Ela sairá da trilha quando você publicar. O progresso antigo não será apagado.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => { patch({ lessons: form.lessons.filter((item) => item.id !== lesson.id) }); if (expanded === lesson.id) setExpanded(null); } },
    ]);
  }
  async function generateFor(lesson) {
    if (!form.topic.trim() || !lesson.title.trim()) { setError('Informe o tema e o nome da etapa antes de gerar questões.'); return; }
    setGenerating(true); setError('');
    try {
      const generated = await generateQuestions(`${topicLabel(form.topic)} — ${lesson.title}`, 3);
      patchLesson(lesson.id, { questions: [...lesson.questions.filter((question) => question.text.trim() || question.options.some((option) => option.trim())), ...generated.map((question) => ({ ...question, id: allocateTrailId() }))] });
      setNotice('Questões geradas. Revise o gabarito e a explicação antes de publicar.');
    } catch (cause) { setError(friendlyError(cause)); }
    finally { setGenerating(false); }
  }
  async function save(publish) {
    if (publish) {
      const issue = validateTrailUnit(form);
      if (issue) { setError(issue); return; }
    }
    setSaving(true); setError('');
    try {
      if (publish) {
        await publishTrailUnit(classId, unitId, form);
        router.replace({ pathname: '/teacher/class/[classId]', params: { classId, tab: 'trails', toast: 'Tópico publicado' } });
      } else {
        await saveTrailDraft(classId, unitId, form);
        setDirty(false); setNotice('Rascunho salvo. Seus alunos ainda não veem estas alterações.');
        if (routeUnitId === 'new') router.replace({ pathname: '/teacher/class/[classId]/trail/[unitId]', params: { classId, unitId } });
      }
    } catch (cause) { setError(friendlyError(cause)); }
    finally { setSaving(false); }
  }
  function back() {
    if (!dirty) { router.back(); return; }
    Alert.alert('Sair sem salvar?', 'As mudanças deste tópico ainda não foram salvas.', [
      { text: 'Continuar editando', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  return <View style={styles.root}>
    <TeacherHero eyebrow="TRILHAS DA TURMA" title={routeUnitId === 'new' ? 'Novo tópico' : 'Editar tópico'} subtitle="Monte uma etapa de cada vez." onBack={back} backLabel="Trilhas" />
    <View style={styles.sheet}>
      {error && !form ? <EmptyState isError title="Não foi possível abrir o tópico" message={error} actionLabel="Tentar novamente" onAction={() => setRetry((value) => value + 1)} /> : !form ? <LoadingView message="Preparando editor..." /> :
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.intro}><Text style={styles.introTitle}>Sua trilha, no seu ritmo</Text><Text style={styles.hint}>Defina o tema, organize as etapas e publique quando as questões estiverem prontas.</Text></View>

            <View style={styles.section}>
              <StepHeading number="1" title="Tópico" subtitle="É o cartão que o aluno escolhe na trilha." />
              <Input label="Nome da trilha" value={form.title} onChangeText={(title) => patch({ title })} placeholder="Ex.: A Célula como Unidade da Vida" accent={colors.blue} maxLength={80} />
              <Input label="Tema de Biologia" value={TOPICS[form.topic]?.label ?? form.topic} onChangeText={(topic) => patch({ topic })} placeholder="Ex.: Citologia" accent={colors.blue} maxLength={45} hint="Escolha uma sugestão ou escreva outro tema." />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
                {Object.entries(TOPICS).filter(([, topic]) => topic.grade === grade).map(([key, topic]) => <Pressable key={key} onPress={() => patch({ topic: key, mascot: topic.mascot })} accessibilityRole="button" accessibilityState={{ selected: form.topic === key }} style={[styles.topicChoice, form.topic === key && styles.choiceOn]}><Text style={[styles.choiceText, form.topic === key && styles.choiceTextOn]}>{topic.label}</Text></Pressable>)}
              </ScrollView>
              <Text style={text.label}>MASCOTE DO TÓPICO</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
                {MASCOTS.map((name) => <Pressable key={name} onPress={() => patch({ mascot: name })} accessibilityRole="button" accessibilityLabel={`Mascote ${name}`} accessibilityState={{ selected: form.mascot === name }} style={[styles.mascotChoice, form.mascot === name && styles.choiceOn]}><Mascot name={name} size={38} /></Pressable>)}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <StepHeading number="2" title="Etapas" subtitle="Cada etapa vira um nó no mapa do aluno." />
              {form.lessons.length === 0 && <View style={styles.empty}><Icon name="book-open" size={24} color={colors.blue} /><Text style={styles.hint}>Nenhuma etapa ainda. Adicione a primeira para começar.</Text></View>}
              {form.lessons.map((lesson, index) => <View key={lesson.id} style={styles.lessonCard}>
                <Pressable onPress={() => setExpanded(expanded === lesson.id ? null : lesson.id)} accessibilityRole="button" accessibilityState={{ expanded: expanded === lesson.id }} style={styles.lessonHeading}>
                  <View style={styles.lessonNumber}><Text style={styles.lessonNumberText}>{index + 1}</Text></View>
                  <View style={styles.lessonCopy}><Text style={styles.lessonTitle}>{lesson.title || `Etapa ${index + 1}`}</Text><Text style={styles.hint}>{lesson.questions.length} {lesson.questions.length === 1 ? 'questão' : 'questões'}</Text></View>
                  <Icon name={expanded === lesson.id ? 'chevron-down' : 'chevron-right'} size={22} color={colors.blue} />
                </Pressable>
                {expanded === lesson.id && <View style={styles.lessonBody}>
                  <Input label="Nome da etapa" value={lesson.title} onChangeText={(title) => patchLesson(lesson.id, { title })} placeholder="Ex.: Organelas e suas funções" accent={colors.blue} maxLength={80} />
                  <View style={styles.lessonActions}>
                    <Button title="Subir" variant="secondary" size="md" disabled={index === 0} onPress={() => moveLesson(index, -1)} style={styles.smallAction} />
                    <Button title="Descer" variant="secondary" size="md" disabled={index === form.lessons.length - 1} onPress={() => moveLesson(index, 1)} style={styles.smallAction} />
                  </View>
                  <Text style={styles.questionsHeading}>Questões desta etapa</Text>
                  {lesson.questions.map((question, q) => <QuestionForm key={question.id} number={q + 1} question={question} onChange={(change) => patchQuestion(lesson, question.id, change)} onRemove={() => patchLesson(lesson.id, { questions: lesson.questions.filter((item) => item.id !== question.id) })} />)}
                  <Button title="Adicionar questão" icon="plus" variant="outline" size="md" onPress={() => patchLesson(lesson.id, { questions: [...lesson.questions, blankQuestion()] })} />
                  <View style={styles.aiBox}><Text style={styles.aiTitle}>Precisa de um ponto de partida?</Text><Text style={styles.hint}>A IA gera 3 questões para esta etapa. Você pode editar tudo antes de publicar.</Text><Button title="Gerar 3 com IA" icon="sparkles" variant="secondary" size="md" loading={generating} onPress={() => generateFor(lesson)} /></View>
                  <Button title="Remover etapa" icon="trash" variant="dangerOutline" size="md" onPress={() => removeLesson(lesson)} />
                </View>}
              </View>)}
              <Button title="Adicionar etapa" icon="plus" variant="teacher" size="md" onPress={() => { const lesson = blankLesson(); patch({ lessons: [...form.lessons, lesson] }); setExpanded(lesson.id); }} />
            </View>

            <View style={styles.section}>
              <StepHeading number="3" title="Salvar ou publicar" subtitle="Rascunhos ficam só com você. Publicar atualiza a trilha dos alunos." />
              <Text style={styles.hint}>Se você mudar questões já publicadas, a etapa ganha uma nova versão para preservar o progresso anterior.</Text>
              {notice ? <View style={styles.noticeBox}><Icon name="check-circle" size={20} color={colors.green} /><Text style={styles.noticeText}>{notice}</Text></View> : null}
            </View>
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {error ? <View style={styles.errorBox}><Icon name="alert-triangle" size={20} color={colors.redText} /><Text style={styles.errorText}>{error}</Text></View> : null}
            <View style={styles.footerActions}>
              <Button title="Rascunho" variant="secondary" size="md" loading={saving} onPress={() => save(false)} style={styles.footerButton} />
              <Button title="Publicar" variant="teacher" size="md" loading={saving} disabled={generating} onPress={() => save(true)} style={styles.footerButton} />
            </View>
          </View>
        </KeyboardAvoidingView>}
    </View>
  </View>;
}

function StepHeading({ number, title, subtitle }) {
  return <View style={styles.stepHeading}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View><View style={styles.stepCopy}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.hint}>{subtitle}</Text></View></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, sheet: teacherSheetStyle, fill: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 48, gap: 18 }, intro: { gap: 4 },
  introTitle: { ...text.h1, fontSize: 23 }, hint: { ...text.caption, fontSize: 13, lineHeight: 19 },
  section: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 20, padding: 16, gap: 14 },
  stepHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 2 },
  stepNumber: { width: 32, height: 32, borderRadius: 11, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.blue }, stepCopy: { flex: 1, gap: 3 },
  sectionTitle: { ...text.h2, fontSize: 19 }, choices: { gap: 8, paddingVertical: 2 },
  topicChoice: { minHeight: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 2, borderColor: colors.border, justifyContent: 'center' },
  choiceOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft }, choiceText: { fontFamily: fonts.bold, fontSize: 14, color: colors.gray }, choiceTextOn: { color: colors.blue },
  mascotChoice: { minWidth: 76, minHeight: 68, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border, borderRadius: 14 },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 14, backgroundColor: colors.blueSoft },
  lessonCard: { borderWidth: 2, borderColor: colors.border, borderRadius: 16, overflow: 'hidden' }, lessonHeading: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  lessonNumber: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' }, lessonNumberText: { fontFamily: fonts.extrabold, color: colors.blue },
  lessonCopy: { flex: 1 }, lessonTitle: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.ink }, lessonBody: { gap: 14, padding: 12, borderTopWidth: 2, borderTopColor: colors.border },
  lessonActions: { flexDirection: 'row', gap: 8 }, smallAction: { flex: 1 }, questionsHeading: { ...text.h2, fontSize: 17 },
  aiBox: { gap: 10, padding: 14, backgroundColor: colors.purpleSoft, borderRadius: 16 }, aiTitle: { fontFamily: fonts.extrabold, color: colors.purpleDark, fontSize: 15 },
  errorBox: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: colors.redSoft }, errorText: { ...text.caption, color: colors.redText, flex: 1 },
  noticeBox: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: colors.greenSoft }, noticeText: { ...text.caption, color: colors.greenDark, flex: 1 },
  footer: { gap: 8, paddingHorizontal: 20, paddingTop: 10, borderTopWidth: 2, borderTopColor: colors.border, backgroundColor: colors.surface },
  footerActions: { flexDirection: 'row', gap: 10 }, footerButton: { flex: 1 },
});
