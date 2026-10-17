import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Screen, Header, LoadingView, EmptyState } from '../../components';
import { listenClass, listenClassMembers } from '../../services/classService';
import { friendlyError } from '../../utils/errors';
import ClassStudentsTab from './ClassStudentsTab';
import ClassPerformanceTab from './ClassPerformanceTab';
import ActivitiesScreen from './ActivitiesScreen';
import { colors, fonts } from '../../theme';

const TABS = [
  { key: 'students', label: 'Alunos' },
  { key: 'performance', label: 'Desemp.' },
  { key: 'activities', label: 'Atividades' },
];

// Class panel with 3 tabs: Alunos (08) | Desempenho (19) | Atividades (Ana Luiza)
export default function ClassPanelScreen({ navigation, route }) {
  const { classId } = route.params;
  const [tab, setTab] = useState(route.params.tab ?? 'students');
  const [cls, setCls] = useState(null);
  const [members, setMembers] = useState(null);
  const [error, setError] = useState('');

  // live listeners, stopped when the screen closes
  useEffect(() => {
    const onError = (e) => setError(friendlyError(e));
    const stopClass = listenClass(classId, (data) => {
      if (data) setCls(data);
      else navigation.goBack(); // class was deleted
    }, onError);
    const stopMembers = listenClassMembers(classId, setMembers, onError);
    return () => { stopClass(); stopMembers(); };
  }, [classId]);

  const count = members?.length ?? 0;

  return (
    <Screen padded={false} lightStatusBar>
      <Header
        title={cls?.name ?? 'Turma'}
        subtitle={cls ? `${cls.code} · ${count} ${count === 1 ? 'aluno' : 'alunos'}` : undefined}
        backLabel="Turmas"
        onBack={() => navigation.goBack()}
      />
      <View style={styles.tabs}>
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.tab, on && styles.tabOn]}>
              <Text style={[styles.tabText, on && styles.tabTextOn]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <EmptyState isError title="Não foi possível carregar" message={error} actionLabel="Voltar" onAction={() => navigation.goBack()} />
      ) : !cls || !members ? (
        <LoadingView message="Carregando turma..." />
      ) : (
        <Screen scroll contentStyle={styles.content}>
          {tab === 'students' && <ClassStudentsTab members={members} code={cls.code} />}
          {tab === 'performance' && <ClassPerformanceTab classId={classId} />}
          {tab === 'activities' && <ActivitiesScreen classId={classId} />}
        </Screen>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 2, borderBottomColor: colors.border, paddingHorizontal: 8 },
  tab: { flex: 1, height: 52, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent', marginBottom: -2 },
  tabOn: { borderBottomColor: colors.blue },
  tabText: { fontFamily: fonts.bold, fontSize: 16, color: colors.gray },
  tabTextOn: { fontFamily: fonts.extrabold, color: colors.blue },
  content: { paddingTop: 16, paddingBottom: 32 },
});
