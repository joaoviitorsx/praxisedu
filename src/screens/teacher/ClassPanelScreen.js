import { useEffect, useState } from 'react';
import { Alert, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { LoadingView, EmptyState, Toast } from '../../components';
import TeacherHero, { teacherSheetStyle } from '../../components/TeacherHero';
import { listenClass, listenClassMembers } from '../../services/classService';
import { friendlyError } from '../../utils/errors';
import ClassStudentsTab from './ClassStudentsTab';
import ClassPerformanceTab from './ClassPerformanceTab';
import ActivitiesScreen from './ActivitiesScreen';
import AttendanceTab from './AttendanceTab';
import ClassTrailsTab from './ClassTrailsTab';
import { colors, fonts } from '../../theme';

const TABS = [
  { key: 'students', label: 'Alunos' },
  { key: 'attendance', label: 'Chamadas' },
  { key: 'performance', label: 'Desempenho' },
  { key: 'trails', label: 'Trilhas' },
  { key: 'activities', label: 'Atividades' },
];

export default function ClassPanelScreen() {
  const { classId, tab: initialTab, toast } = useLocalSearchParams();
  const navigation = useNavigation();
  const [tab, setTab] = useState(typeof initialTab === 'string' ? initialTab : 'students');
  const [cls, setCls] = useState(null);
  const [members, setMembers] = useState(null);
  const [error, setError] = useState('');
  const [attendanceDirty, setAttendanceDirty] = useState(false);

  usePreventRemove(tab === 'attendance' && attendanceDirty, ({ data }) => {
    Alert.alert('Sair sem salvar?', 'As marcações desta chamada serão perdidas.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  // live listeners, stopped when the screen closes
  useEffect(() => {
    const onError = (e) => setError(friendlyError(e));
    const stopClass = listenClass(classId, (data) => {
      if (data) setCls(data);
      else router.back(); // class was deleted
    }, onError);
    const stopMembers = listenClassMembers(classId, setMembers, onError);
    return () => { stopClass(); stopMembers(); };
  }, [classId]);

  useEffect(() => {
    if (typeof initialTab === 'string') setTab(initialTab);
  }, [initialTab]);

  function selectTab(next) {
    if (tab === next) return;
    const switchTab = () => { setAttendanceDirty(false); setTab(next); };
    if (tab === 'attendance' && attendanceDirty) {
      Alert.alert('Descartar chamada?', 'Há presenças ainda não salvas.', [
        { text: 'Continuar editando', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: switchTab },
      ]);
    } else switchTab();
  }

  function goBack() {
    router.back();
  }

  return (
    <View style={styles.root}>
      <TeacherHero eyebrow="PAINEL DA TURMA" title={cls?.name ?? 'Turma'}
        subtitle={cls ? cls.code : 'Alunos, chamadas e atividades em um só lugar.'}
        onBack={goBack} backLabel="Turmas" />
      <View style={styles.sheet}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => selectTab(t.key)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={({ pressed }) => [styles.tab, on && styles.tabOn, pressed && styles.pressed]}>
              <Text style={[styles.tabText, on && styles.tabTextOn]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {error ? (
        <EmptyState isError title="Não foi possível carregar" message={error} actionLabel="Voltar" onAction={() => router.back()} />
      ) : !cls || !members ? (
        <LoadingView message="Carregando turma..." />
      ) : tab === 'attendance' ? (
        <View style={styles.attendanceContent}>
          <AttendanceTab classId={classId} members={members} onDirtyChange={setAttendanceDirty} contentPadding={0} />
        </View>
      ) : tab === 'students' ? (
        <ClassStudentsTab members={members} code={cls.code} />
      ) : tab === 'trails' ? (
        <ClassTrailsTab classId={classId} grade={cls.grade} />
      ) : tab === 'activities' ? (
        <ActivitiesScreen classId={classId} membersCount={members.length} />
      ) : (
        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {tab === 'performance' && <ClassPerformanceTab classId={classId} membersCount={members.length} onShowStudents={() => selectTab('students')} />}
        </ScrollView>
      )}
      </View>
      <Toast message={typeof toast === 'string' ? toast : ''} onHide={() => router.setParams({ toast: '' })} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  sheet: teacherSheetStyle,
  tabs: { flexGrow: 0, marginBottom: 4 },
  tabsContent: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
  tab: { minWidth: 100, paddingHorizontal: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 14 },
  tabOn: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  tabText: { fontFamily: fonts.bold, fontSize: 14, color: colors.gray },
  tabTextOn: { fontFamily: fonts.extrabold, color: colors.blue },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  contentScroll: { flex: 1 },
  attendanceContent: { flex: 1, paddingHorizontal: 20 },
  pressed: { opacity: 0.72 },
});
