import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  Card, Chip, Button, Icon, LoadingView, EmptyState, ConfirmModal, PopoverMenu, Toast,
} from '../../components';
import TeacherHero, { teacherSheetStyle } from '../../components/TeacherHero';
import { useAuth } from '../../contexts/AuthContext';
import { loadTeacherClasses, deleteClass } from '../../services/classService';
import { friendlyError } from '../../utils/errors';
import { teacherShortName } from '../../utils/format';
import { colors, fonts, text } from '../../theme';

// Screens 06 (Minhas Turmas), 32a (empty), 18a (menu) and 18b (delete confirmation)
export default function ClassesScreen({ navigation, route }) {
  const { user, profile } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [menu, setMenu] = useState(null); // { cls, top }
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');
  const handledToast = useRef('');

  const load = useCallback(async () => {
    try {
      setError('');
      setClasses(await loadTeacherClasses(user.uid));
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.uid]);

  // reload every time the tab / screen gets focus (after creating or editing)
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // toast sent by other screens (e.g. "Turma criada")
  useEffect(() => {
    const incoming = route.params?.toast;
    if (incoming && handledToast.current !== incoming) {
      handledToast.current = incoming;
      setToast(incoming);
      navigation.setParams({ toast: undefined });
    }
    if (!incoming) handledToast.current = '';
  }, [route.params?.toast, navigation]);

  const supportTotal = classes.reduce((sum, c) => sum + c.supportCount, 0);
  const supportClass = classes.find((c) => c.supportCount > 0);

  async function copyCode(cls) {
    await Clipboard.setStringAsync(cls.code);
    setToast('Código copiado');
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteClass(user.uid, toDelete.id, toDelete.code);
      setToDelete(null);
      setToast('Turma excluída');
      await load();
    } catch (e) {
      setToDelete(null);
      setError(friendlyError(e));
    } finally {
      setDeleting(false);
    }
  }

  const renderClass = useCallback(({ item }) => <ClassCard
    cls={item}
    onOpen={() => navigation.navigate('ClassPanel', { classId: item.id })}
    onMenu={(top) => setMenu({ cls: item, top })}
  />, [navigation]);

  return (
    <View style={styles.root}>
      <TeacherHero eyebrow="ÁREA DO PROFESSOR" title="Turmas" subtitle={`Olá, ${teacherShortName(profile.name)}. Acompanhe suas aulas por aqui.`} />
      <View style={styles.sheet}>
      {loading ? (
        <LoadingView message="Carregando turmas..." />
      ) : (
        <FlatList
          data={error ? [] : classes}
          renderItem={renderClass}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListHeaderComponent={!error ? <>
              {supportTotal > 0 && (
                <View style={styles.alertSection}>
                  <Text style={text.label}>PRECISAM DE ATENÇÃO</Text>
                  <Pressable
                    onPress={() => navigation.navigate('ClassPanel', { classId: supportClass.id, tab: 'performance' })}
                    style={({ pressed }) => [styles.alert, pressed && styles.pressed]}
                    accessibilityRole="button"
                  >
                    <Icon name="alert-triangle" size={22} color={colors.redText} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.alertTitle}>
                        {supportTotal} {supportTotal === 1 ? 'aluno precisa' : 'alunos precisam'} de apoio
                      </Text>
                      <Text style={text.caption}>{supportClass.name}</Text>
                    </View>
                    <Icon name="chevron-right" size={20} color={colors.redText} />
                  </Pressable>
                </View>
              )}

              <View style={styles.titleRow}>
                <View style={styles.titleCopy}><Text style={text.h2}>Minhas turmas</Text><Text style={text.caption}>Selecione uma turma para ver alunos e atividades.</Text></View>
                <View style={styles.count} accessible accessibilityLabel={`${classes.length} ${classes.length === 1 ? 'turma' : 'turmas'}`}>
                  <Text style={styles.countNumber}>{classes.length}</Text>
                  <Text style={styles.countLabel}>{classes.length === 1 ? 'TURMA' : 'TURMAS'}</Text>
                </View>
              </View>
            </> : null}
          ListEmptyComponent={error ? <EmptyState isError title="Não foi possível carregar" message={error} actionLabel="Tentar de novo" onAction={load} /> :
            <EmptyState image={require('../../../assets/mascotes/baleia.png')} title="Nenhuma turma por aqui" message="Crie sua primeira turma e compartilhe o código com os estudantes." />}
          ListFooterComponent={!error ? <View style={styles.footer}><Button title="Criar nova turma" icon="plus" variant="teacher" onPress={() => navigation.navigate('ClassForm')} /></View> : null}
        />
      )}
      </View>

      <PopoverMenu
        visible={!!menu}
        top={menu?.top ?? 0}
        onClose={() => setMenu(null)}
        items={menu ? [
          { label: 'Editar turma', icon: 'pencil', onPress: () => navigation.navigate('ClassForm', { classId: menu.cls.id }) },
          { label: 'Copiar código', icon: 'copy', onPress: () => copyCode(menu.cls) },
          { label: 'Excluir turma', icon: 'trash', danger: true, onPress: () => setToDelete(menu.cls) },
        ] : []}
      />

      <ConfirmModal
        visible={!!toDelete}
        title={`Excluir turma ${toDelete?.name ?? ''}?`}
        message={`Os ${toDelete?.studentsCount ?? 0} alunos perdem o acesso às atividades e ao histórico da turma. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir turma"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />

      <Toast message={toast} onHide={() => setToast('')} />
    </View>
  );
}

const ClassCard = memo(function ClassCard({ cls, onOpen, onMenu }) {
  return (
    <Card onPress={onOpen} accessibilityLabel={`Abrir turma ${cls.name}`} style={{ gap: 14 }}>
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <Icon name="users" size={24} color={colors.blue} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{cls.name}</Text>
          <View style={styles.chips}>
            <Chip label={cls.code} spaced />
            {cls.roomActive && <Chip label="Modo Sala: ATIVO" color={colors.ink} background={colors.yellow} />}
          </View>
        </View>
        <Pressable
          onPress={(e) => { e.stopPropagation(); onMenu(e.nativeEvent.pageY + 20); }}
          style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Ações da turma"
        >
          <Icon name="more-vertical" size={22} color={colors.gray} />
        </Pressable>
      </View>
      <View style={styles.stats}>
        <Stat value={cls.studentsCount} label="alunos" />
        <Stat value={cls.quizzesCount} label="quizzes" />
        <Stat value={cls.quizzesCount ? `${cls.accuracy}%` : '—'} label="acertos" color={colors.green} />
      </View>
    </Card>
  );
});

function Stat({ value, label, color = colors.ink }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={text.caption}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  sheet: teacherSheetStyle,
  content: { paddingHorizontal: 20, paddingBottom: 32, flexGrow: 1 },
  separator: { height: 12 },
  footer: { paddingTop: 18 },
  alertSection: { gap: 8, marginBottom: 22 },
  alert: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 16, borderWidth: 2, borderColor: '#F5B5B5', backgroundColor: colors.redSoft,
  },
  alertTitle: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.ink },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  titleCopy: { flex: 1, gap: 3 },
  count: { minWidth: 70, minHeight: 62, paddingHorizontal: 10, paddingVertical: 7, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: colors.blueSoft },
  countNumber: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 26, color: colors.blue },
  countLabel: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 0.6, color: colors.blue },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  menuButton: { width: 44, height: 44, marginTop: -6, marginRight: -8, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 2, borderTopColor: '#F1F5F9' },
  statValue: { fontFamily: fonts.extrabold, fontSize: 20 },
  pressed: { opacity: 0.7 },
});
