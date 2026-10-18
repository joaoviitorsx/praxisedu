import { memo, useCallback, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { EmptyState, Icon, LoadingView } from '../../components';
import TeacherHero, { teacherSheetStyle } from '../../components/TeacherHero';
import { useAuth } from '../../contexts/AuthContext';
import { activityDestination, resolveActivityClassId } from '../../features/teacher/activityHubModel';
import { loadTeacherClasses } from '../../services/classService';
import { friendlyError } from '../../utils/errors';
import { colors, fonts, text } from '../../theme';

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
    <TeacherHero eyebrow="ÁREA DO PROFESSOR" title="Atividade" subtitle="Escolha a turma e o que deseja preparar." />
    <View style={styles.sheet}>
      {error && !classes ? <EmptyState isError title="Não foi possível carregar as turmas" message={error} actionLabel="Tentar novamente" onAction={() => setAttempt((value) => value + 1)} />
        : !classes ? <LoadingView message="Carregando turmas..." />
          : classes.length === 0 ? <EmptyState title="Crie uma turma primeiro" message="As trilhas e os quizzes são preparados para uma turma." actionLabel="Criar turma" onAction={() => router.push('/teacher/class/new')} />
            : showPicker ? <FlatList data={classes} renderItem={renderClass} keyExtractor={(item) => item.id} style={styles.fill} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
              ListHeaderComponent={<View style={styles.heading}><Text style={styles.step}>PASSO 1 DE 2</Text><Text style={styles.title}>Escolha a turma</Text><Text style={styles.description}>O conteúdo ficará disponível apenas para os alunos desta turma.</Text>{error ? <Text style={styles.error}>{error}</Text> : null}</View>} />
              : <ScrollView style={styles.fill} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.heading}><Text style={styles.step}>PASSO 1 DE 2 · TURMA</Text><Text style={styles.title}>Para quem é a atividade?</Text></View>
                <Pressable onPress={() => setChoosingClass(true)} accessibilityRole="button" accessibilityLabel={`Turma ${selected.name}. Trocar turma`} style={({ pressed }) => [styles.selectedClass, pressed && styles.pressed]}>
                  <View style={styles.classIcon}><Icon name="users" size={22} color={colors.blue} /></View>
                  <View style={styles.classCopy}><Text style={styles.className}>{selected.name}</Text><Text style={styles.classMeta}>{selected.grade}º ano · {selected.studentsCount ?? 0} {selected.studentsCount === 1 ? 'aluno' : 'alunos'}</Text></View>
                  <Text style={styles.change}>Trocar</Text>
                </Pressable>

                <View style={styles.heading}><Text style={styles.step}>PASSO 2 DE 2 · FORMATO</Text><Text style={styles.title}>O que você vai criar?</Text><Text style={styles.description}>Escolha o formato adequado para o momento da aula.</Text></View>
                <ActivityChoice icon="book-open" title="Criar trilha" description="Organize tópicos, etapas e questões para os alunos avançarem no próprio ritmo." onPress={() => open('trail')} />
                <Pressable onPress={() => open('trail-list')} accessibilityRole="button" style={({ pressed }) => [styles.existingLink, pressed && styles.pressed]}><Text style={styles.existingLinkText}>Ver trilhas já criadas</Text><Icon name="arrow-right" size={18} color={colors.blue} /></Pressable>
                <ActivityChoice icon="presentation" title="Quiz de sala" description="Prepare perguntas para liberar durante a aula e acompanhar as respostas." onPress={() => open('quiz')} />
              </ScrollView>}
    </View>
  </View>;
}

const ClassChoice = memo(function ClassChoice({ item, onPress }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Selecionar turma ${item.name}`} style={({ pressed }) => [styles.classChoice, pressed && styles.pressed]}>
    <View style={styles.classIcon}><Icon name="users" size={22} color={colors.blue} /></View>
    <View style={styles.classCopy}><Text style={styles.className}>{item.name}</Text><Text style={styles.classMeta}>{item.grade}º ano · {item.studentsCount ?? 0} {item.studentsCount === 1 ? 'aluno' : 'alunos'}</Text></View>
    <Icon name="chevron-right" size={22} color={colors.blue} />
  </Pressable>;
});

function ActivityChoice({ icon, title, description, onPress }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} accessibilityHint={description} style={({ pressed }) => [styles.activityChoice, pressed && styles.pressed]}>
    <View style={styles.activityIcon}><Icon name={icon} size={26} color={colors.blue} /></View>
    <View style={styles.activityCopy}><Text style={styles.activityTitle}>{title}</Text><Text style={styles.description}>{description}</Text></View>
    <Icon name="chevron-right" size={22} color={colors.blue} />
  </Pressable>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  sheet: teacherSheetStyle,
  fill: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 36, gap: 14 },
  heading: { gap: 5, marginTop: 8, marginBottom: 4 },
  step: { ...text.label, color: colors.blue, fontSize: 11 },
  title: { ...text.h2, fontSize: 21 },
  description: { ...text.caption, fontSize: 14, lineHeight: 21, flexShrink: 1 },
  classChoice: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 18 },
  selectedClass: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: colors.blueSoft, borderWidth: 2, borderColor: colors.blue, borderRadius: 18, marginBottom: 10 },
  classIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueSoft },
  classCopy: { flex: 1, gap: 3 },
  className: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
  classMeta: { ...text.caption, fontSize: 12 },
  change: { fontFamily: fonts.bold, fontSize: 13, color: colors.blue },
  activityChoice: { minHeight: 132, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 20 },
  activityIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueSoft },
  activityCopy: { flex: 1, gap: 5 },
  activityTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  existingLink: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  existingLinkText: { fontFamily: fonts.bold, fontSize: 14, color: colors.blue },
  error: { ...text.caption, color: colors.redText },
  pressed: { opacity: 0.7 },
});
