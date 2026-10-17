import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Screen, Card, Chip, Button, Icon, Logo, LoadingView, EmptyState, ConfirmModal, PopoverMenu, Toast, FadeIn,
} from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { loadTeacherClasses, deleteClass } from '../../services/classService';
import { friendlyError } from '../../utils/errors';
import { initials, teacherShortName, plural } from '../../utils/format';
import { colors, fonts, text, spacing } from '../../theme';

// Screens 06 (Minhas Turmas), 32a (empty), 18a (menu) and 18b (delete confirmation)
export default function ClassesScreen({ navigation, route }) {
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [menu, setMenu] = useState(null); // { cls, top }
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');

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
    if (route.params?.toast) {
      setToast(route.params.toast);
      navigation.setParams({ toast: undefined });
    }
  }, [route.params?.toast]);

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

  return (
    <Screen padded={false} lightStatusBar>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View style={styles.brand}>
            <Logo variant="symbol" tone="white" size={32} />
            <Text style={styles.brandName}>PRÁXIS EDU</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Profile')} style={styles.avatar} accessibilityLabel="Perfil">
            <Text style={styles.avatarText}>{initials(profile.name)}</Text>
          </Pressable>
        </View>
        <View>
          <Text style={styles.teacherName}>{teacherShortName(profile.name)}</Text>
          {profile.school ? <Text style={styles.school}>{profile.school}</Text> : null}
        </View>
      </View>

      {loading ? (
        <LoadingView message="Carregando turmas..." />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        >
          {error ? (
            <EmptyState isError title="Não foi possível carregar" message={error} actionLabel="Tentar de novo" onAction={load} />
          ) : (
            <>
              {supportTotal > 0 && (
                <View style={{ gap: 8 }}>
                  <Text style={text.label}>Para hoje</Text>
                  <Pressable
                    onPress={() => navigation.navigate('ClassPanel', { classId: supportClass.id, tab: 'performance' })}
                    style={({ pressed }) => [styles.alert, pressed && { transform: [{ translateY: 2 }] }]}
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
                <Text style={text.h2}>Minhas Turmas</Text>
                {classes.length > 0 && <Text style={styles.count}>{plural(classes.length, 'turma', 'turmas')}</Text>}
              </View>

              {classes.length === 0 ? (
                <EmptyState
                  image={require('../../../assets/mascotes/baleia.png')}
                  title="Nenhuma turma por aqui"
                  message="Crie sua primeira turma e compartilhe o código com os estudantes."
                />
              ) : (
                classes.map((cls, i) => (
                  <FadeIn key={cls.id} delay={i * 70}>
                    <ClassCard
                      cls={cls}
                      onOpen={() => navigation.navigate('ClassPanel', { classId: cls.id })}
                      onMenu={(top) => setMenu({ cls, top })}
                    />
                  </FadeIn>
                ))
              )}

              <Button title="Criar Nova Turma" icon="plus" variant="teacher" onPress={() => navigation.navigate('ClassForm')} />
            </>
          )}
        </ScrollView>
      )}

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
    </Screen>
  );
}

function ClassCard({ cls, onOpen, onMenu }) {
  return (
    <Card onPress={onOpen} style={{ gap: 14 }}>
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
          onPress={(e) => onMenu(e.nativeEvent.pageY + 20)}
          style={styles.menuButton}
          accessibilityLabel="Ações da turma"
        >
          <Icon name="more-vertical" size={22} color={colors.gray} />
        </Pressable>
      </View>
      <View style={styles.stats}>
        <Stat value={cls.studentsCount} label="alunos" />
        <Stat value={cls.quizzesCount} label="quizzes" />
        <Stat value={`${cls.accuracy}%`} label="acertos" color={colors.green} />
      </View>
    </Card>
  );
}

function Stat({ value, label, color = colors.ink }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={text.caption}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.blue, paddingHorizontal: spacing.screen, paddingBottom: 20, gap: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandName: { fontFamily: fonts.extrabold, fontSize: 18, letterSpacing: 0.7, color: colors.white },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, borderWidth: 2,
    borderColor: colors.white, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.blue },
  teacherName: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.white },
  school: { fontFamily: fonts.semibold, fontSize: 15, color: '#DCE6FF', marginTop: 2 },
  content: { padding: spacing.screen, paddingBottom: 32, gap: 16 },
  alert: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 16, borderWidth: 2, borderColor: '#F5B5B5', backgroundColor: colors.redSoft,
  },
  alertTitle: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.ink },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  count: { fontFamily: fonts.bold, fontSize: 13, color: colors.gray },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  menuButton: { width: 44, height: 44, marginTop: -6, marginRight: -8, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 2, borderTopColor: '#F1F5F9' },
  statValue: { fontFamily: fonts.extrabold, fontSize: 20 },
});
