import { memo, useCallback, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { EmptyState, Icon, LoadingView } from '../../components';
import TeacherHero, { teacherSheetStyle } from '../../components/TeacherHero';
import { useAuth } from '../../contexts/AuthContext';
import { activityDestination, resolveActivityClassId } from '../../features/teacher/activityHubModel';
import { loadTeacherClasses } from '../../services/classService';
import { friendlyError } from '../../utils/errors';
import { colors, fonts, text } from '../../theme';

const ACTIVITIES = [
  { kind: 'trail', icon: 'book-open', tag: 'NO RITMO DO ALUNO', title: 'Trilha de aprendizagem',
    description: 'Organize um caminho com textos, vídeos, arquivos e questões opcionais.',
    phases: ['Tópico', 'Etapas'], action: 'Criar trilha',
    library: 'Ver minhas trilhas', libraryIcon: 'file-text', libraryKind: 'trail-list' },
  { kind: 'quiz', icon: 'presentation', tag: 'DURANTE A AULA', title: 'Quiz de sala',
    description: 'Prepare perguntas, libere para a turma e acompanhe as respostas ao vivo.',
    phases: ['Preparar', 'Liberar', 'Acompanhar'], action: 'Criar quiz',
    library: 'Ver quizzes e resultados', libraryIcon: 'bar-chart', libraryKind: 'quiz-list' },
];

export default function ActivityHubScreen() {
  const { classId: requestedId } = useLocalSearchParams();
  const { user } = useAuth();
  const [classes, setClasses] = useState(null);
  const [classId, setClassId] = useState('');
  const [choosingClass, setChoosingClass] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    setError('');
    if (attempt > 0) setClasses(null);
    loadTeacherClasses(user.uid).then((list) => {
      if (!active) return;
      setClasses(list);
      setClassId((current) => resolveActivityClassId(list, requestedId, current));
    }).catch((cause) => { if (active) setError(friendlyError(cause)); });
    return () => { active = false; };
  }, [user.uid, requestedId, attempt]));

  const selected = classes?.find((item) => item.id === classId);
  const showPicker = !selected || choosingClass;
  const choose = useCallback((item) => { setClassId(item.id); setChoosingClass(false); }, []);
  const renderClass = useCallback(({ item }) => <ClassChoice item={item} onPress={() => choose(item)} />, [choose]);
  const open = useCallback((kind) => {
    const destination = activityDestination(kind, selected?.id);
    if (destination) router.push(destination);
  }, [selected?.id]);

  return <View style={styles.root}>
    <TeacherHero eyebrow="ÁREA DO PROFESSOR" title="Atividade" subtitle="Crie experiências para a sua turma." />
    <View style={styles.sheet}>
      {error && !classes ? <EmptyState isError title="Não foi possível carregar as turmas" message={error} actionLabel="Tentar novamente" onAction={() => setAttempt((value) => value + 1)} />
        : !classes ? <LoadingView message="Carregando turmas..." />
          : classes.length === 0 ? <EmptyState title="Comece por uma turma" message="Crie uma turma para preparar trilhas e quizzes para seus alunos." actionLabel="Criar turma" onAction={() => router.push('/teacher/class/new')} />
            : showPicker ? <FlatList data={classes} renderItem={renderClass} keyExtractor={(item) => item.id} style={styles.fill} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
              ListHeaderComponent={<View style={styles.pickerHeader}>
                {selected && <Pressable onPress={() => setChoosingClass(false)} accessibilityRole="button" style={styles.backChoice}><Icon name="chevron-left" size={18} color={colors.blue} /><Text style={styles.backChoiceText}>Voltar às atividades</Text></Pressable>}
                <ClassPickerBanner count={classes.length} />
                <Text style={styles.listEyebrow}>SUAS TURMAS</Text>
                {error ? <Text style={styles.error}>{error}</Text> : null}
              </View>} />
              : <ScrollView style={styles.fill} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <SectionHeading number="01" eyebrow="CONTEXTO" title="Turma ativa" />
                <Pressable onPress={() => setChoosingClass(true)} accessibilityRole="button" accessibilityLabel={`Turma ${selected.name}. Trocar turma`} style={({ pressed }) => [styles.selectedClass, pressed && styles.pressed]}>
                  <LinearGradient colors={['#244BAD', colors.blueDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.selectedGradient}>
                    <View pointerEvents="none" style={styles.selectedOrb} />
                    <View style={styles.selectedClassIcon}><Icon name="school" size={24} color={colors.white} /></View>
                    <View style={styles.selectedCopy}><Text style={styles.selectedLabel}>CRIANDO PARA</Text><Text style={styles.selectedName} numberOfLines={2}>{selected.name}</Text><Text style={styles.selectedMeta}>{selected.grade}º ano · {selected.studentsCount ?? 0} {selected.studentsCount === 1 ? 'aluno' : 'alunos'}</Text></View>
                    <View style={styles.switchClass}><Text style={styles.switchClassText}>Trocar</Text></View>
                  </LinearGradient>
                </Pressable>
                <View style={styles.formatHeading}><SectionHeading number="02" eyebrow="PRÓXIMO PASSO" title="O que vamos criar?" /><Text style={styles.sectionDescription}>Escolha o formato que combina com sua aula.</Text></View>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                {ACTIVITIES.map((activity) => <ActivityChoice key={activity.kind} activity={activity} onCreate={() => open(activity.kind)} onLibrary={() => open(activity.libraryKind)} />)}
              </ScrollView>}
    </View>
  </View>;
}

function SectionHeading({ number, eyebrow, title }) {
  return <View style={styles.sectionHeading}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View><View style={styles.headingCopy}><Text style={styles.sectionEyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text></View></View>;
}

const ClassChoice = memo(function ClassChoice({ item, onPress }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Selecionar turma ${item.name}`} style={({ pressed }) => [styles.classChoice, pressed && styles.pressed]}>
    <View style={styles.classIcon}><Icon name="school" size={22} color={colors.blue} /></View>
    <View style={styles.classCopy}><Text style={styles.className} numberOfLines={2}>{item.name}</Text><Text style={styles.classMeta}>{item.grade}º ano · {item.studentsCount ?? 0} {item.studentsCount === 1 ? 'aluno' : 'alunos'}</Text></View>
    <View style={styles.choiceArrow}><Icon name="arrow-right" size={18} color={colors.blue} /></View>
  </Pressable>;
});

function ClassPickerBanner({ count }) {
  return <LinearGradient colors={['#244BAD', colors.blueDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pickerBanner}>
    <View pointerEvents="none" style={styles.pickerOrb} />
    <View style={styles.pickerIcon}><Icon name="school" size={26} color={colors.white} /></View>
    <Text style={styles.pickerEyebrow}>PRIMEIRO, O CONTEXTO</Text>
    <Text style={styles.pickerTitle}>Escolha a turma</Text>
    <Text style={styles.pickerCaption}>Depois você escolhe entre uma trilha para estudar ou um quiz para a aula.</Text>
    <View style={styles.pickerCount}><Icon name="users" size={16} color={colors.white} /><Text style={styles.pickerCountText}>{count} {count === 1 ? 'turma disponível' : 'turmas disponíveis'}</Text></View>
  </LinearGradient>;
}

function ActivityChoice({ activity, onCreate, onLibrary }) {
  const trail = activity.kind === 'trail';
  const accent = trail ? colors.greenDark : colors.purpleDark;
  return <View style={[styles.activityCard, trail ? styles.trailCard : styles.quizCard]}>
    <View pointerEvents="none" style={[styles.activityOrb, trail ? styles.trailOrb : styles.quizOrb]} />
    <View style={styles.activityTop}>
      <View style={[styles.activityIcon, trail ? styles.trailIcon : styles.quizIcon]}><Icon name={activity.icon} size={25} color={accent} /></View>
      <View style={[styles.activityTag, trail ? styles.trailTag : styles.quizTag]}><Text style={[styles.activityTagText, { color: accent }]}>{activity.tag}</Text></View>
    </View>
    <Text style={styles.activityTitle}>{activity.title}</Text>
    <Text style={styles.activityDescription}>{activity.description}</Text>
    <View style={styles.phases} accessibilityLabel={`Passos: ${activity.phases.join(', ')}`}>
      {activity.phases.map((phase, index) => <View key={phase} style={styles.phaseGroup}><View style={[styles.phaseDot, { backgroundColor: accent }]} /><Text style={styles.phaseText}>{phase}</Text>{index < activity.phases.length - 1 && <Icon name="chevron-right" size={14} color={colors.gray} />}</View>)}
    </View>
    <Pressable onPress={onCreate} accessibilityRole="button" accessibilityLabel={activity.action} style={({ pressed }) => [styles.createButton, trail ? styles.trailButton : styles.quizButton, pressed && styles.pressed]}><Text style={styles.createButtonText}>{activity.action}</Text><Icon name="arrow-right" size={20} color={colors.white} /></Pressable>
    <Pressable onPress={onLibrary} accessibilityRole="button" accessibilityLabel={activity.library} style={({ pressed }) => [styles.libraryButton, pressed && styles.pressed]}><Icon name={activity.libraryIcon} size={18} color={accent} /><Text style={[styles.libraryText, { color: accent }]}>{activity.library}</Text><Icon name="chevron-right" size={18} color={accent} /></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, sheet: teacherSheetStyle, fill: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36, gap: 14 },
  pickerHeader: { gap: 16, marginBottom: 3 },
  backChoice: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4 },
  backChoiceText: { fontFamily: fonts.bold, fontSize: 13, color: colors.blue },
  pickerBanner: { minHeight: 220, overflow: 'hidden', gap: 7, padding: 21, borderRadius: 24 },
  pickerOrb: { position: 'absolute', right: -55, top: -70, width: 205, height: 205, borderRadius: 103, backgroundColor: 'rgba(255,255,255,0.09)' },
  pickerIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.17)', alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  pickerEyebrow: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 1, color: '#DCE6FF' },
  pickerTitle: { fontFamily: fonts.extrabold, fontSize: 25, lineHeight: 31, color: colors.white },
  pickerCaption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: '#E8EFFF', maxWidth: 290 },
  pickerCount: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.15)' },
  pickerCountText: { fontFamily: fonts.bold, fontSize: 11, color: colors.white },
  listEyebrow: { ...text.label, fontSize: 11, color: colors.blue, marginTop: 2 },
  classChoice: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 18 },
  classIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueSoft },
  classCopy: { flex: 1, gap: 3, minWidth: 0 }, className: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.ink },
  classMeta: { ...text.caption, fontSize: 12 }, choiceArrow: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueSoft },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  stepNumber: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueSoft },
  stepNumberText: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.blue },
  headingCopy: { gap: 1 }, sectionEyebrow: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 0.9, color: colors.blue },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 19, color: colors.ink },
  selectedClass: { overflow: 'hidden', borderRadius: 20, marginBottom: 4 },
  selectedGradient: { minHeight: 104, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  selectedOrb: { position: 'absolute', width: 145, height: 145, borderRadius: 73, right: -25, top: -70, backgroundColor: 'rgba(255,255,255,0.08)' },
  selectedClassIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.17)' },
  selectedCopy: { flex: 1, gap: 2, minWidth: 0 }, selectedLabel: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 0.8, color: '#DCE6FF' },
  selectedName: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 22, color: colors.white },
  selectedMeta: { fontFamily: fonts.medium, fontSize: 12, color: '#E8EFFF' },
  switchClass: { minWidth: 60, height: 36, paddingHorizontal: 8, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  switchClassText: { fontFamily: fonts.bold, fontSize: 11, color: colors.blueDark },
  formatHeading: { gap: 4, marginTop: 6 }, sectionDescription: { ...text.caption, fontSize: 13, marginLeft: 49 },
  activityCard: { overflow: 'hidden', gap: 10, padding: 17, borderRadius: 22, borderWidth: 1.5 },
  trailCard: { backgroundColor: '#F0FAF4', borderColor: '#B6DFC7' }, quizCard: { backgroundColor: '#F7F2FF', borderColor: '#D9C8F9' },
  activityOrb: { position: 'absolute', width: 140, height: 140, borderRadius: 70, right: -53, top: -75 },
  trailOrb: { backgroundColor: 'rgba(8,122,69,0.07)' }, quizOrb: { backgroundColor: 'rgba(124,58,237,0.07)' },
  activityTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  activityIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  trailIcon: { backgroundColor: '#D9F0E2' }, quizIcon: { backgroundColor: '#E9DFFF' },
  activityTag: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999 }, trailTag: { backgroundColor: '#D9F0E2' }, quizTag: { backgroundColor: '#E9DFFF' },
  activityTagText: { fontFamily: fonts.extrabold, fontSize: 9, letterSpacing: 0.45 },
  activityTitle: { fontFamily: fonts.extrabold, fontSize: 20, lineHeight: 26, color: colors.ink },
  activityDescription: { ...text.caption, fontSize: 13, lineHeight: 19 },
  phases: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 3, marginBottom: 3 },
  phaseGroup: { flexDirection: 'row', alignItems: 'center', gap: 5 }, phaseDot: { width: 6, height: 6, borderRadius: 3 },
  phaseText: { fontFamily: fonts.bold, fontSize: 10, color: colors.gray },
  createButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderRadius: 14 },
  trailButton: { backgroundColor: colors.green }, quizButton: { backgroundColor: colors.purple },
  createButtonText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.white },
  libraryButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(71,85,105,0.13)', marginTop: 1, paddingTop: 5 },
  libraryText: { flex: 1, fontFamily: fonts.bold, fontSize: 13 },
  error: { ...text.caption, color: colors.redText }, pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
});
