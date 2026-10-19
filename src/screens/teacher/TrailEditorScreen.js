import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, EmptyState, Icon, Input, LoadingView, Mascot } from '../../components';
import QuestionForm from '../../components/QuestionForm';
import TeacherHero, { teacherSheetStyle } from '../../components/TeacherHero';
import { TOPICS, topicLabel } from '../../constants/topics';
import { useAuth } from '../../contexts/AuthContext';
import { generateQuestions } from '../../services/aiService';
import { pickAndUploadTrailMaterial } from '../../services/trailMaterialService';
import { allocateTrailId, loadTrailEditor, publishTrailUnit, saveTrailDraft } from '../../services/classTrailService';
import { validateTrailUnit } from '../../features/teacher/classTrailModel';
import { friendlyError } from '../../utils/errors';
import { colors, fonts, text } from '../../theme';
import TeacherTrailMap from './TeacherTrailMap';
import StageMaterialsEditor from './StageMaterialsEditor';

const MASCOTS = ['mito', 'sapo', 'medusa', 'teco', 'mandu', 'borbo', 'dinho', 'guara', 'abelha', 'baleia'];
const blankQuestion = () => ({ id: allocateTrailId(), text: '', options: ['', '', '', ''], answer: null, explanation: '' });
const blankLesson = () => ({ id: allocateTrailId(), title: '', materials: [], questions: [] });
const blankMaterial = (kind) => ({ id: allocateTrailId(), kind, ...(kind === 'text' ? { title: '', body: '' } : kind === 'video' ? { title: '', url: '' } : { name: '', url: '', storagePath: '' }) });

export default function TrailEditorScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { classId, unitId: routeUnitId } = useLocalSearchParams();
  const [newId] = useState(() => allocateTrailId());
  const unitId = routeUnitId === 'new' ? newId : routeUnitId;
  const [form, setForm] = useState(null);
  const [grade, setGrade] = useState(null);
  const [page, setPage] = useState('topic');
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setForm(null); setError('');
    loadTrailEditor(classId, unitId).then((result) => {
      if (!active) return;
      setForm(result.unit); setGrade(result.grade);
      setPage(result.unit.title?.trim() && result.unit.topic?.trim() ? 'map' : 'topic');
      setActiveLessonId(null); setDirty(false);
    }).catch((cause) => { if (active) setError(friendlyError(cause)); });
    return () => { active = false; };
  }, [classId, unitId, retry]);

  const lessons = form?.lessons ?? [];
  const activeIndex = lessons.findIndex((lesson) => lesson.id === activeLessonId);
  const activeLesson = lessons[activeIndex];
  const questionCount = lessons.reduce((total, lesson) => total + (lesson.questions?.length ?? 0), 0);
  const materialCount = lessons.reduce((total, lesson) => total + (lesson.materials?.length ?? 0), 0);

  function patch(change) { setForm((current) => ({ ...current, ...change })); setDirty(true); setNotice(''); setError(''); }
  function patchLesson(id, change) {
    setForm((current) => ({ ...current, lessons: current.lessons.map((lesson) => lesson.id === id ? { ...lesson, ...change } : lesson) }));
    setDirty(true); setNotice(''); setError('');
  }
  function patchQuestion(lesson, questionId, change) {
    patchLesson(lesson.id, { questions: lesson.questions.map((question) => question.id === questionId ? { ...question, ...change } : question) });
  }
  function patchMaterial(lesson, materialId, change) {
    setForm((current) => ({ ...current, lessons: current.lessons.map((entry) => entry.id === lesson.id
      ? { ...entry, materials: (entry.materials ?? []).map((item) => item.id === materialId ? { ...item, ...change } : item) } : entry) }));
    setDirty(true); setNotice(''); setError('');
  }
  async function uploadMaterial(lesson, materialId) {
    setUploading(materialId); setError('');
    try {
      const uploaded = await pickAndUploadTrailMaterial({ teacherId: user.uid, classId, unitId, lessonId: lesson.id, materialId });
      if (uploaded) patchMaterial(lesson, materialId, uploaded);
    } catch (cause) { setError(cause?.code ? friendlyError(cause) : cause?.message || friendlyError(cause)); }
    finally { setUploading(null); }
  }
  function moveLesson(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= lessons.length) return;
    const next = [...lessons];
    [next[index], next[target]] = [next[target], next[index]];
    patch({ lessons: next });
  }
  function addLesson() {
    const lesson = blankLesson();
    patch({ lessons: [...lessons, lesson] });
    setActiveLessonId(lesson.id); setPage('stage');
  }
  function removeLesson(lesson) {
    Alert.alert('Remover etapa?', 'Ela sairá da trilha quando você publicar. O progresso antigo não será apagado.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => { patch({ lessons: lessons.filter((item) => item.id !== lesson.id) }); setActiveLessonId(null); setPage('map'); } },
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
  async function saveDraft(nextPage) {
    setSaving(true); setError('');
    try {
      await saveTrailDraft(classId, unitId, form);
      setDirty(false);
      setNotice('Rascunho salvo. Seus alunos ainda não veem estas alterações.');
      if (nextPage) setPage(nextPage);
    } catch (cause) { setError(friendlyError(cause)); }
    finally { setSaving(false); }
  }
  function continueTopic() {
    if (!form.title?.trim() || form.title.trim().length < 2) { setError('Dê um título ao tópico.'); return; }
    if (!form.topic?.trim() || form.topic.trim().length < 2) { setError('Informe o tema do tópico.'); return; }
    saveDraft('map');
  }
  function finishStage() {
    if (!activeLesson?.title?.trim()) { setError('Dê um nome à etapa antes de voltar ao mapa.'); return; }
    saveDraft('map');
  }
  async function publish() {
    const issue = validateTrailUnit(form);
    if (issue) {
      const match = issue.match(/etapa (\d+)/);
      if (match) {
        setActiveLessonId(lessons[Number(match[1]) - 1]?.id ?? null);
        setPage('stage');
      } else if (!form.title?.trim() || !form.topic?.trim()) setPage('topic');
      setError(issue);
      return;
    }
    setSaving(true); setError('');
    try {
      await publishTrailUnit(classId, unitId, form);
      setDirty(false);
      router.replace({ pathname: '/teacher/class/[classId]', params: { classId, tab: 'trails', toast: 'Tópico publicado' } });
    } catch (cause) { setError(friendlyError(cause)); }
    finally { setSaving(false); }
  }
  function back() {
    if (page === 'stage') { setPage('map'); setError(''); return; }
    if (page === 'map') { setPage('topic'); setError(''); return; }
    if (!dirty) { router.back(); return; }
    Alert.alert('Sair sem salvar?', 'As mudanças deste tópico ainda não foram salvas.', [
      { text: 'Continuar editando', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  const heroTitle = page === 'topic' ? 'Defina o tópico' : page === 'stage' ? `Etapa ${activeIndex + 1}` : 'Monte a trilha';
  const heroSubtitle = page === 'topic' ? 'Comece pelo assunto que os alunos vão explorar.' : page === 'map' ? 'Toque em uma etapa para editar ou no + para criar.' : 'Combine material de estudo e questões nesta etapa.';
  return <View style={styles.root}>
    <TeacherHero eyebrow="EDITOR DE TRILHAS" title={heroTitle} subtitle={heroSubtitle} onBack={back} backLabel={page === 'stage' ? 'Etapas' : page === 'map' ? 'Tópico' : 'Trilhas'} />
    <View style={styles.sheet}>
      {error && !form ? <EmptyState isError title="Não foi possível abrir o tópico" message={error} actionLabel="Tentar novamente" onAction={() => setRetry((value) => value + 1)} /> : !form ? <LoadingView message="Preparando editor..." /> :
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView key={`${page}-${activeLessonId}`} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <ProgressSteps page={page} hasTopic={!!form.title?.trim() && !!form.topic?.trim()}
              onTopic={() => { setPage('topic'); setError(''); }} onMap={() => { setPage('map'); setError(''); }} />
            {page === 'topic' && <>
              <View style={styles.introCard}><Text style={styles.eyebrow}>PASSO 1 DE 2</Text><Text style={styles.introTitle}>Qual é a descoberta?</Text><Text style={styles.hint}>O tópico será o cartão que o aluno escolhe antes de percorrer as etapas.</Text></View>
              <View style={styles.section}>
                <Input label="Nome do tópico" value={form.title} onChangeText={(value) => patch({ title: value })} placeholder="Ex.: A célula como unidade da vida" accent={colors.blue} maxLength={80} />
                <Input label="Tema de Biologia" value={TOPICS[form.topic]?.label ?? form.topic} onChangeText={(value) => patch({ topic: value })} placeholder="Ex.: Citologia" accent={colors.blue} maxLength={45} hint="Escolha uma sugestão ou escreva outro tema." />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
                  {Object.entries(TOPICS).filter(([, topic]) => topic.grade === grade).map(([key, topic]) => <Pressable key={key} onPress={() => patch({ topic: key, mascot: topic.mascot })} accessibilityRole="button" accessibilityState={{ selected: form.topic === key }} style={[styles.topicChoice, form.topic === key && styles.choiceOn]}><Text style={[styles.choiceText, form.topic === key && styles.choiceTextOn]}>{topic.label}</Text></Pressable>)}
                </ScrollView>
                <Text style={text.label}>MASCOTE DO TÓPICO</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
                  {MASCOTS.map((name) => <Pressable key={name} onPress={() => patch({ mascot: name })} accessibilityRole="button" accessibilityLabel={`Mascote ${name}`} accessibilityState={{ selected: form.mascot === name }} style={[styles.mascotChoice, form.mascot === name && styles.choiceOn]}><Mascot name={name} size={38} /></Pressable>)}
                </ScrollView>
              </View>
              <View style={styles.preview}><Mascot name={form.mascot} size={55} /><View style={styles.previewCopy}><Text style={styles.eyebrow}>PRÉVIA DO CARTÃO</Text><Text style={styles.previewTitle}>{form.title?.trim() || 'Seu tópico aparece aqui'}</Text><Text style={styles.hint}>{topicLabel(form.topic) || 'Tema de Biologia'}</Text></View></View>
            </>}
            {page === 'map' && <>
              <View style={styles.topicBanner}><Mascot name={form.mascot} size={60} /><View style={styles.topicCopy}><Text style={styles.eyebrow}>TÓPICO · {topicLabel(form.topic)}</Text><Text style={styles.topicTitle}>{form.title}</Text><Text style={styles.topicMeta}>{lessons.length} {lessons.length === 1 ? 'etapa' : 'etapas'} · {materialCount} {materialCount === 1 ? 'material' : 'materiais'} · {questionCount} {questionCount === 1 ? 'questão' : 'questões'}</Text></View><Pressable onPress={() => setPage('topic')} accessibilityRole="button" accessibilityLabel="Editar tópico" style={styles.editTopic}><Icon name="pencil" size={18} color={colors.blue} /></Pressable></View>
              <View style={styles.mapIntro}><Text style={styles.eyebrow}>PASSO 2 DE 2</Text><Text style={styles.sectionTitle}>Caminho das etapas</Text><Text style={styles.hint}>Esta é a ordem em que as etapas aparecem para o aluno. Toque em uma etapa para organizar seus materiais e questões.</Text></View>
              <TeacherTrailMap lessons={lessons} mascot={form.mascot} onOpen={(id) => { setActiveLessonId(id); setPage('stage'); setError(''); }} onAdd={addLesson} />
              <View style={styles.mapHelp}><Icon name="plus" size={20} color={colors.blue} /><Text style={styles.hint}>Toque no círculo + para adicionar a próxima etapa.</Text></View>
              <View style={styles.publishCard}><View style={styles.publishHeading}><Icon name="check-circle" size={23} color={colors.green} /><Text style={styles.sectionTitle}>Pronto para publicar?</Text></View><Text style={styles.hint}>Cada etapa precisa de um nome e de pelo menos um material ou uma questão completa. Rascunhos são visíveis apenas para você.</Text></View>
            </>}
            {page === 'stage' && activeLesson && <>
              <View style={styles.introCard}><Text style={styles.eyebrow}>ETAPA {activeIndex + 1} · CONTEÚDO</Text><Text style={styles.introTitle}>{activeLesson.title?.trim() || 'Nova etapa'}</Text><Text style={styles.hint}>O aluno encontrará seus materiais e atividades neste ponto da trilha.</Text></View>
              <View style={styles.section}>
                <Input label="Nome da etapa" value={activeLesson.title} onChangeText={(value) => patchLesson(activeLesson.id, { title: value })} placeholder="Ex.: Organelas e suas funções" accent={colors.blue} maxLength={80} />
                {lessons.length > 1 && <View style={styles.orderRow}><Text style={styles.orderLabel}>Posição na trilha</Text><View style={styles.orderActions}><Button title="Subir" variant="secondary" size="md" disabled={activeIndex === 0} onPress={() => moveLesson(activeIndex, -1)} style={styles.orderButton} /><Button title="Descer" variant="secondary" size="md" disabled={activeIndex === lessons.length - 1} onPress={() => moveLesson(activeIndex, 1)} style={styles.orderButton} /></View></View>}
              </View>
              <StageMaterialsEditor materials={activeLesson.materials ?? []}
                onAdd={(kind) => patchLesson(activeLesson.id, { materials: [...(activeLesson.materials ?? []), blankMaterial(kind)] })}
                onChange={(materialId, change) => patchMaterial(activeLesson, materialId, change)}
                onRemove={(materialId) => patchLesson(activeLesson.id, { materials: (activeLesson.materials ?? []).filter((item) => item.id !== materialId) })}
                onUpload={(materialId) => uploadMaterial(activeLesson, materialId)} uploading={uploading} />
              <View style={styles.questionHeading}><View><Text style={styles.eyebrow}>QUESTÕES DA ETAPA</Text><Text style={styles.sectionTitle}>{activeLesson.questions.length} {activeLesson.questions.length === 1 ? 'questão' : 'questões'}</Text></View><View style={styles.questionIcon}><Icon name="book-open" size={24} color={colors.blue} /></View></View>
              {activeLesson.questions.length === 0 && <View style={styles.emptyQuestions}><Icon name="file-plus" size={30} color={colors.blue} /><Text style={styles.emptyTitle}>Quer acrescentar uma prática?</Text><Text style={styles.hint}>As questões são opcionais. Se adicionar uma, preencha pergunta, alternativas, gabarito e explicação.</Text></View>}
              {activeLesson.questions.map((question, index) => <QuestionForm key={question.id} number={index + 1} question={question} onChange={(change) => patchQuestion(activeLesson, question.id, change)} onRemove={() => patchLesson(activeLesson.id, { questions: activeLesson.questions.filter((item) => item.id !== question.id) })} />)}
              <Button title="Adicionar questão" icon="plus" variant="outline" size="md" onPress={() => patchLesson(activeLesson.id, { questions: [...activeLesson.questions, blankQuestion()] })} />
              <View style={styles.aiBox}><View style={styles.aiHeading}><Icon name="sparkles" size={20} color={colors.purple} /><Text style={styles.aiTitle}>Precisa de um ponto de partida?</Text></View><Text style={styles.hint}>A IA gera três questões para esta etapa. Revise tudo antes de publicar.</Text><Button title="Gerar 3 com IA" icon="sparkles" variant="secondary" size="md" loading={generating} onPress={() => generateFor(activeLesson)} /></View>
              <Button title="Remover etapa" icon="trash" variant="dangerOutline" size="md" onPress={() => removeLesson(activeLesson)} />
            </>}
            {notice ? <View style={styles.noticeBox}><Icon name="check-circle" size={20} color={colors.green} /><Text style={styles.noticeText}>{notice}</Text></View> : null}
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {error ? <View style={styles.errorBox}><Icon name="alert-triangle" size={20} color={colors.redText} /><Text style={styles.errorText}>{error}</Text></View> : null}
            <View style={styles.footerActions}>
              <Button title="Rascunho" variant="secondary" size="md" loading={saving} disabled={generating || !!uploading} onPress={() => saveDraft()} style={styles.footerButton} />
              <Button title={page === 'topic' ? 'Continuar' : page === 'stage' ? 'Salvar etapa' : 'Publicar'} icon={page === 'map' ? 'send' : 'arrow-right'} variant="teacher" size="md" loading={saving} disabled={generating || !!uploading} onPress={page === 'topic' ? continueTopic : page === 'stage' ? finishStage : publish} style={styles.footerButton} />
            </View>
          </View>
        </KeyboardAvoidingView>}
    </View>
  </View>;
}

function ProgressSteps({ page, hasTopic, onTopic, onMap }) {
  const steps = [{ key: 'topic', label: 'Tópico', enabled: true, onPress: onTopic }, { key: 'map', label: 'Etapas', enabled: hasTopic, onPress: onMap }];
  return <View style={styles.progress} accessibilityLabel="Etapas da criação da trilha">
    {steps.map((step, index) => {
      const selected = step.key === 'topic' ? page === 'topic' : page !== 'topic';
      return <Pressable key={step.key} onPress={step.onPress} disabled={!step.enabled} accessibilityRole="button" accessibilityState={{ selected, disabled: !step.enabled }} style={[styles.progressStep, selected && styles.progressStepOn, !step.enabled && styles.progressStepOff]}>
        <View style={[styles.progressNumber, selected && styles.progressNumberOn]}><Text style={[styles.progressNumberText, selected && styles.progressNumberTextOn]}>{index + 1}</Text></View><Text style={[styles.progressText, selected && styles.progressTextOn]} numberOfLines={1}>{step.label}</Text>
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, sheet: teacherSheetStyle, fill: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 42, gap: 16 },
  progress: { flexDirection: 'row', gap: 6, marginBottom: 2 },
  progressStep: { flex: 1, minWidth: 0, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 5, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border },
  progressStepOn: { backgroundColor: colors.blueSoft, borderColor: colors.blue }, progressStepOff: { opacity: 0.5 },
  progressNumber: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }, progressNumberOn: { backgroundColor: colors.blue },
  progressNumberText: { fontFamily: fonts.extrabold, fontSize: 11, color: colors.gray }, progressNumberTextOn: { color: colors.white },
  progressText: { fontFamily: fonts.bold, fontSize: 12, color: colors.gray, flexShrink: 1 }, progressTextOn: { color: colors.blue },
  introCard: { gap: 6, padding: 18, borderRadius: 20, backgroundColor: colors.blueSoft },
  eyebrow: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 0.8, color: colors.blue },
  introTitle: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 29, color: colors.ink },
  hint: { ...text.caption, fontSize: 13, lineHeight: 19 }, sectionTitle: { ...text.h2, fontSize: 19 },
  section: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 20, padding: 16, gap: 14 },
  choices: { gap: 8, paddingVertical: 2 },
  topicChoice: { minHeight: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 2, borderColor: colors.border, justifyContent: 'center' },
  choiceOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft }, choiceText: { fontFamily: fonts.bold, fontSize: 14, color: colors.gray }, choiceTextOn: { color: colors.blue },
  mascotChoice: { minWidth: 76, minHeight: 68, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border, borderRadius: 14 },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 2, borderColor: colors.border },
  previewCopy: { flex: 1, gap: 3 }, previewTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
  topicBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 2, borderColor: colors.border },
  topicCopy: { flex: 1, gap: 3 }, topicTitle: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 22, color: colors.ink }, topicMeta: { ...text.caption, fontSize: 12 },
  editTopic: { width: 44, height: 44, borderRadius: 13, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  mapIntro: { gap: 5, paddingHorizontal: 2 }, mapHelp: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 14, borderRadius: 16, backgroundColor: colors.blueSoft },
  publishCard: { gap: 9, padding: 16, borderRadius: 20, backgroundColor: colors.greenSoft }, publishHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  orderRow: { gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }, orderLabel: { ...text.label }, orderActions: { flexDirection: 'row', gap: 8 }, orderButton: { flex: 1 },
  questionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, questionIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  emptyQuestions: { alignItems: 'center', gap: 8, padding: 22, borderRadius: 20, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface },
  emptyTitle: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.ink, textAlign: 'center' },
  aiBox: { gap: 10, padding: 16, backgroundColor: colors.purpleSoft, borderRadius: 18 }, aiHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 }, aiTitle: { fontFamily: fonts.extrabold, color: colors.purpleDark, fontSize: 15, flex: 1 },
  errorBox: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: colors.redSoft }, errorText: { ...text.caption, color: colors.redText, flex: 1 },
  noticeBox: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: colors.greenSoft }, noticeText: { ...text.caption, color: colors.greenDark, flex: 1 },
  footer: { gap: 8, paddingHorizontal: 20, paddingTop: 10, borderTopWidth: 2, borderTopColor: colors.border, backgroundColor: colors.surface },
  footerActions: { flexDirection: 'row', gap: 10 }, footerButton: { flex: 1 },
});
