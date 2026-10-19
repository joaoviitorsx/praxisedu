import { memo, useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, Icon, LoadingView } from '../../components';
import TeacherHero, { teacherSheetStyle } from '../../components/TeacherHero';
import { useAuth } from '../../contexts/AuthContext';
import { resolveAttendanceClassId } from '../../features/teacher/attendanceModel';
import { listenClassMembers, loadTeacherClasses } from '../../services/classService';
import { friendlyError } from '../../utils/errors';
import { colors, fonts, text } from '../../theme';
import AttendanceTab from './AttendanceTab';
import useReducedMotion from '../../hooks/useReducedMotion';

export default function AttendanceScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const { classId: requestedClassId } = useLocalSearchParams();
  const [classes, setClasses] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [memberState, setMemberState] = useState({ classId: null, members: null, error: '' });
  const [membersAttempt, setMembersAttempt] = useState(0);
  const [attendanceDirty, setAttendanceDirty] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const refreshClasses = useCallback(async (isActive = () => true) => {
    setLoadError('');
    try {
      const list = await loadTeacherClasses(user.uid);
      if (isActive()) setClasses(list);
    } catch (error) {
      if (isActive()) setLoadError(friendlyError(error));
    }
  }, [user.uid]);

  useFocusEffect(useCallback(() => {
    let active = true;
    refreshClasses(() => active);
    return () => { active = false; };
  }, [refreshClasses]));

  const selectedId = resolveAttendanceClassId(classes, typeof requestedClassId === 'string' ? requestedClassId : '', null);
  const selectedClass = classes?.find((item) => item.id === selectedId);

  useEffect(() => {
    if (!selectedId) return undefined;
    setAttendanceDirty(false);
    setMemberState({ classId: selectedId, members: null, error: '' });
    return listenClassMembers(selectedId,
      (members) => setMemberState({ classId: selectedId, members, error: '' }),
      (error) => setMemberState({ classId: selectedId, members: null, error: friendlyError(error) }));
  }, [selectedId, membersAttempt]);

  const chooseClass = useCallback((classId) => {
    setSelectorOpen(false);
    if (classId === selectedId) return;
    const change = () => { setAttendanceDirty(false); router.setParams({ classId }); };
    if (attendanceDirty) {
      Alert.alert('Descartar chamada?', 'As marcações ainda não salvas serão perdidas ao trocar de turma.', [
        { text: 'Continuar editando', style: 'cancel' },
        { text: 'Trocar de turma', style: 'destructive', onPress: change },
      ]);
    } else change();
  }, [selectedId, attendanceDirty]);

  const renderClass = useCallback(({ item }) => (
    <ClassChoice item={item} selected={item.id === selectedId} onPress={() => chooseClass(item.id)} />
  ), [selectedId, chooseClass]);

  const members = memberState.classId === selectedId ? memberState.members : null;
  const memberError = memberState.classId === selectedId ? memberState.error : '';

  return <View style={styles.root}>
    <TeacherHero eyebrow="ROTINA DA TURMA" title="Chamadas" subtitle="Acompanhe a presença de cada aula." />

    <View style={styles.sheet}>
      {classes?.length > 0 ? <View style={styles.sectionHeading}>
        <View style={styles.stepNumber}><Text style={styles.stepNumberText}>01</Text></View>
        <View><Text style={styles.sectionEyebrow}>CONTEXTO</Text><Text style={styles.sectionTitle}>Turma ativa</Text></View>
      </View> : null}

      {loadError && !classes ? <EmptyState isError title="Não foi possível carregar as turmas" message={loadError} actionLabel="Tentar novamente" onAction={() => refreshClasses()} /> : !classes ? <LoadingView message="Carregando turmas..." /> : classes.length === 0 ?
        <EmptyState image={require('../../../assets/mascotes/baleia.png')} title="Nenhuma turma ainda" message="Crie uma turma para começar a registrar a presença." actionLabel="Criar turma" onAction={() => router.push('/teacher/class/new')} /> : <>
          {loadError ? <Pressable onPress={() => refreshClasses()} accessibilityRole="button" style={styles.refreshError}><Text style={styles.refreshErrorText}>{loadError} Toque para tentar novamente.</Text></Pressable> : null}
          <Pressable onPress={() => setSelectorOpen(true)} disabled={classes.length === 1} accessibilityRole="button" accessibilityLabel={`Turma atual: ${selectedClass?.name}. ${classes.length > 1 ? 'Trocar turma' : 'Única turma disponível'}`} accessibilityState={{ disabled: classes.length === 1 }} style={({ pressed }) => [styles.selectedClass, pressed && styles.pressed]}>
            <LinearGradient colors={['#244BAD', colors.blueDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.selectedGradient}>
              <View pointerEvents="none" style={styles.selectedOrb} />
              <View style={styles.selectedIcon}><Icon name="school" size={23} color={colors.white} /></View>
              <View style={styles.selectedCopy}><Text style={styles.selectedLabel}>CHAMADA DE</Text><Text style={styles.selectedName} numberOfLines={2}>{selectedClass?.name}</Text><Text style={styles.selectedDetails}>{selectedClass?.grade}º ano · {members ? members.length : selectedClass?.studentsCount ?? 0} {members?.length === 1 || (!members && selectedClass?.studentsCount === 1) ? 'aluno' : 'alunos'}</Text></View>
              {classes.length > 1 ? <View style={styles.changeAction}><Text style={styles.changeText}>Trocar</Text></View> : null}
            </LinearGradient>
          </Pressable>
          {memberError ? <EmptyState isError title="Não foi possível carregar os alunos" message={memberError} actionLabel="Tentar novamente" onAction={() => setMembersAttempt((value) => value + 1)} /> : !members ? <LoadingView message="Carregando alunos..." /> :
            <AttendanceTab key={selectedId} classId={selectedId} members={members} onDirtyChange={setAttendanceDirty} showHeading={false} />}
        </>}
    </View>

    <Modal visible={selectorOpen} transparent animationType={reduceMotion ? 'fade' : 'slide'} onRequestClose={() => setSelectorOpen(false)}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={() => setSelectorOpen(false)} accessibilityRole="button" accessibilityLabel="Fechar seleção de turma" />
        <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.modalHeading}><View style={styles.modalHeadingIcon}><Icon name="school" size={22} color={colors.blue} /></View><View style={styles.modalHeadingCopy}><Text style={styles.modalTitle}>Selecionar turma</Text><Text style={text.caption}>Escolha onde registrar a chamada.</Text></View><Pressable onPress={() => setSelectorOpen(false)} accessibilityRole="button" accessibilityLabel="Fechar seleção de turma" style={styles.closeButton}><Icon name="x" size={22} color={colors.ink} /></Pressable></View>
          <FlatList data={classes ?? []} renderItem={renderClass} keyExtractor={(item) => item.id} extraData={selectedId} style={{ maxHeight: height * 0.54, flexGrow: 0 }} contentContainerStyle={styles.modalList} showsVerticalScrollIndicator={false} />
        </View>
      </View>
    </Modal>
  </View>;
}

const ClassChoice = memo(function ClassChoice({ item, selected, onPress }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`Turma ${item.name}, ${item.studentsCount} ${item.studentsCount === 1 ? 'aluno' : 'alunos'}${selected ? ', selecionada' : ''}`} style={({ pressed }) => [styles.classChoice, selected && styles.classChoiceOn, pressed && styles.pressed]}>
    <View style={styles.choiceIcon}><Icon name="school" size={20} color={colors.blue} /></View>
    <View style={styles.choiceCopy}><Text style={styles.choiceName} numberOfLines={2}>{item.name}</Text><Text style={styles.choiceCaption}>{item.grade}º ano · {item.studentsCount} {item.studentsCount === 1 ? 'aluno' : 'alunos'}</Text></View>
    {selected ? <Icon name="check-circle" size={22} color={colors.blue} /> : <Icon name="chevron-right" size={22} color={colors.gray} />}
  </Pressable>;
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  sheet: teacherSheetStyle,
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 20 },
  stepNumber: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueSoft },
  stepNumberText: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.blue },
  sectionEyebrow: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 0.9, color: colors.blue },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 19, color: colors.ink },
  refreshError: { minHeight: 48, marginHorizontal: 20, padding: 12, justifyContent: 'center', backgroundColor: colors.redSoft, borderRadius: 12 },
  refreshErrorText: { ...text.caption, color: colors.redText },
  selectedClass: { overflow: 'hidden', marginHorizontal: 20, marginTop: 10, marginBottom: 6, borderRadius: 20 },
  selectedGradient: { minHeight: 94, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15 },
  selectedOrb: { position: 'absolute', width: 145, height: 145, borderRadius: 73, right: -25, top: -70, backgroundColor: 'rgba(255,255,255,0.08)' },
  selectedIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.17)', alignItems: 'center', justifyContent: 'center' },
  selectedCopy: { flex: 1, gap: 2, minWidth: 0 },
  selectedLabel: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 0.8, color: '#DCE6FF' },
  selectedName: { fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 21, color: colors.white },
  selectedDetails: { fontFamily: fonts.medium, fontSize: 12, color: '#E8EFFF' },
  changeAction: { minWidth: 60, minHeight: 36, paddingHorizontal: 8, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  changeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.blueDark },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.52)' },
  modalSheet: { paddingHorizontal: 20, paddingTop: 22, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.background },
  modalHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 18 },
  modalHeadingIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  modalHeadingCopy: { flex: 1, gap: 3 },
  modalTitle: { ...text.h2, fontSize: 21 },
  closeButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: -10, marginRight: -8 },
  modalList: { paddingBottom: 4, gap: 10 },
  classChoice: { minHeight: 76, padding: 12, borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 12 },
  classChoiceOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  pressed: { opacity: 0.7 },
  choiceIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  choiceCopy: { flex: 1, gap: 3 },
  choiceName: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.ink },
  choiceCaption: { fontFamily: fonts.semibold, fontSize: 12, color: colors.gray },
});
