import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Icon, Mascot, LoadingView, EmptyState } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { listenProgress } from '../../services/trailService';
import { listenClassTrail } from '../../services/classTrailService';
import { listenClass, listenActiveRoom } from '../../services/classService';
import { gradeForClass } from '../../features/student/trailLayout';
import { currentLives } from '../../utils/lives';
import { topicLabel } from '../../constants/topics';
import { friendlyError } from '../../utils/errors';
import { initials } from '../../utils/format';
import TrailPath, { lessonStates } from './TrailPath';
import StudentStatPopover from '../../components/StudentStatPopover';
import { TabSwipeProtectedScroll } from '../../navigation/EdgeTabSwipe';
import { colors, fonts, text, radius } from '../../theme';

function compactXp(value) {
  const amount = Math.max(0, Number(value) || 0);
  if (amount < 1000) return String(Math.floor(amount));
  if (amount < 1000000) return `${(amount / 1000).toFixed(amount < 10000 ? 1 : 0).replace('.', ',')}k`;
  return `${(amount / 1000000).toFixed(1).replace('.', ',')}M`;
}

// Screen 11: Trilhas (home of the student)
export default function TrailsScreen({ navigation }) {
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const { width, height, fontScale } = useWindowDimensions();
  const narrowHeader = width < 360;
  const accessibleHeader = width < 320 || fontScale > 1.3;
  const stats = profile.stats ?? {};
  const statTriggers = useRef({});
  const [activeStat, setActiveStat] = useState(null);

  const [classInfo, setClassInfo] = useState(undefined);
  const [pickedUnit, setPickedUnit] = useState(null);
  const [trail, setTrail] = useState(undefined); // undefined = loading, null = no content
  const [progress, setProgress] = useState(null);
  const [room, setRoom] = useState(null);
  const [classError, setClassError] = useState('');
  const [trailError, setTrailError] = useState('');
  const [progressError, setProgressError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const year = gradeForClass(classInfo);
  const error = classError || trailError || progressError;

  // The class is the only source of truth for the student's grade.
  useEffect(() => {
    if (!profile.classId) return undefined;
    setClassInfo(undefined);
    setClassError('');
    return listenClass(profile.classId, (data) => { setClassInfo(data); setClassError(''); }, (e) => setClassError(friendlyError(e)));
  }, [profile.classId, retryKey]);

  useEffect(() => {
    if (!profile.classId) return undefined;
    return listenActiveRoom(profile.classId, setRoom);
  }, [profile.classId, retryKey]);

  // progress of this student
  useEffect(() => listenProgress(user.uid, (data) => { setProgress(data); setProgressError(''); }, (e) => setProgressError(friendlyError(e))), [user.uid, retryKey]);

  // Never subscribe to another grade or silently fall back to grade 1.
  useEffect(() => {
    setTrail(undefined);
    setPickedUnit(null);
    setTrailError('');
    if (!year) return undefined;
    return listenClassTrail(profile.classId, year, (data) => { setTrail(data); setTrailError(''); }, (e) => setTrailError(friendlyError(e)));
  }, [profile.classId, year, retryKey]);

  const unit = useMemo(() => {
    if (!trail) return null;
    return trail.units.find((u) => u.id === pickedUnit) ?? trail.units[0] ?? null;
  }, [trail, pickedUnit]);

  const items = unit && progress ? lessonStates(unit.lessons, progress) : [];

  function playLesson(lesson) {
    navigation.navigate('Lesson', { lessonId: lesson.id, title: lesson.title });
  }

  function openStat(id) {
    statTriggers.current[id]?.measureInWindow((x, y, triggerWidth, triggerHeight) => {
      if (!triggerWidth || !triggerHeight) return;
      const value = id === 'streak'
        ? `${stats.streak ?? 0} ${stats.streak === 1 ? 'dia' : 'dias'}`
        : id === 'xp' ? `${stats.xp ?? 0} XP` : `${currentLives(stats)} de 5 vidas`;
      setActiveStat({ id, value, anchor: { x, y, width: triggerWidth, height: triggerHeight } });
    });
  }

  return (
    <Screen padded={false} style={{ backgroundColor: colors.white }}>
      <View style={[styles.header, narrowHeader && styles.headerNarrow, { paddingTop: insets.top + 8 }]}>
        <View style={[styles.identityRow, accessibleHeader && styles.identityRowAccessible]}>
          <Pressable onPress={() => navigation.navigate('StudentProfile')} hitSlop={4} style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]} accessibilityRole="button" accessibilityLabel="Abrir meu perfil">
            <Text style={styles.avatarText}>{initials(profile.name)}</Text>
          </Pressable>
          <View style={styles.identityText}>
            <Text style={styles.headerCopy} numberOfLines={1}>Minha jornada</Text>
            <Text style={[styles.headerCopy, styles.headerClass]} numberOfLines={1}>{classInfo?.name ?? 'Trilhas de biologia'}</Text>
          </View>
          <View style={[styles.headerStats, accessibleHeader && styles.headerStatsAccessible]}>
            <Status icon="flame" color={colors.orangeText} label="Sequência" value={String(stats.streak ?? 0)} fullValue={`${stats.streak ?? 0} dias`} triggerRef={(node) => { statTriggers.current.streak = node; }} onPress={() => openStat('streak')} selected={activeStat?.id === 'streak'} />
            <Status icon="zap" color={colors.purple} label="Experiência" value={compactXp(stats.xp)} fullValue={`${stats.xp ?? 0} XP`} triggerRef={(node) => { statTriggers.current.xp = node; }} onPress={() => openStat('xp')} selected={activeStat?.id === 'xp'} />
            <Status icon="heart" color={colors.red} label="Vidas" value={`${currentLives(stats)}/5`} fullValue={`${currentLives(stats)} de 5`} triggerRef={(node) => { statTriggers.current.lives = node; }} onPress={() => openStat('lives')} selected={activeStat?.id === 'lives'} />
          </View>
        </View>
      </View>

      {error ? (
        <EmptyState isError title="Não foi possível carregar" message={error} actionLabel="Tentar novamente" actionVariant="success" onAction={() => setRetryKey((value) => value + 1)} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {classInfo === undefined || (year && (trail === undefined || !progress)) ? (
            <LoadingView message="Carregando trilha..." />
          ) : !classInfo ? (
            <EmptyState isError title="Turma não encontrada" message="Entre novamente na sua turma para acessar as trilhas." actionLabel="Minha turma" onAction={() => navigation.navigate('MyClass')} />
          ) : !year ? (
            <EmptyState isError title="Ano da turma indisponível" message="Peça ao professor para conferir o ano cadastrado nesta turma." />
          ) : !unit ? (
            <EmptyState
              image={require('../../../assets/mascotes/sapo.png')}
              title="Trilha ainda não disponível"
              message={`O conteúdo do ${year}º ano ainda não foi publicado.`}
            />
          ) : (
            <>
              <View style={styles.intro}>
                <Text style={styles.kicker}>TRILHA DO {year}º ANO</Text>
                <Text style={styles.heroTitle}>{unit.title}</Text>
                <Text style={styles.introHint}>Escolha um tema e avance pela sua jornada.</Text>
              </View>
              <TabSwipeProtectedScroll showsHorizontalScrollIndicator={false} style={styles.unitsScroll} contentContainerStyle={styles.units}>
                {trail.units.map((u) => {
                  const on = u.id === unit.id;
                  const done = u.lessons.filter((l) => progress[l.id]?.completedAt || progress[l.id]?.stars > 0).length;
                  return (
                    <Pressable key={u.id} onPress={() => setPickedUnit(u.id)} style={[styles.unitEdge, { backgroundColor: on ? colors.green : colors.border }]}>
                      {({ pressed }) => (
                        <View style={[styles.unit, on && { borderColor: colors.green, backgroundColor: colors.greenSoft }, pressed && { transform: [{ translateY: 4 }] }]}>
                          <Mascot name={u.mascot} size={50} />
                          <Text style={styles.unitName}>{topicLabel(u.topic)}</Text>
                          <Text style={styles.unitProgress}>{done}/{u.lessons.length}</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </TabSwipeProtectedScroll>

              {room && (
                <Pressable onPress={() => navigation.navigate('Classroom')} style={styles.roomEdge}>
                  {({ pressed }) => (
                    <View style={[styles.room, pressed && { transform: [{ translateY: 4 }] }]}>
                      <View style={styles.roomIcon}><Icon name="radio" size={24} color={colors.yellow} /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.roomTitle}>Modo Sala: Quiz Liberado!</Text>
                        <Text style={styles.roomSub}>{room.quizTitle}{classInfo?.teacherName ? ` · ${classInfo.teacherName}` : ''}</Text>
                      </View>
                      <Icon name="arrow-right" size={24} color={colors.ink} strokeWidth={2.6} />
                    </View>
                  )}
                </Pressable>
              )}

              {items.length === 0 ? (
                <EmptyState title="Nenhuma lição neste tema" message="As lições aparecem aqui quando forem publicadas." />
              ) : (
                <TrailPath items={items} mascot={unit.mascot} onPlay={playLesson} />
              )}
            </>
          )}
        </ScrollView>
      )}
      <StudentStatPopover active={activeStat} viewport={{ width, height }} onClose={() => setActiveStat(null)} />
    </Screen>
  );
}

function Status({ icon, color, label, value, fullValue, triggerRef, onPress, selected }) {
  return (
    <Pressable ref={triggerRef} onPress={onPress} style={styles.statusTouch} accessibilityRole="button" accessibilityLabel={`${label}: ${fullValue}`} accessibilityHint="Toque para saber mais" accessibilityState={{ expanded: selected }}>
      {({ pressed }) => (
        <View style={[styles.status, selected && styles.statusSelected, pressed && styles.statusPressed]}>
          <Icon name={icon} size={16} color={color} fill={color} />
          <Text style={[styles.statusValue, { color }]} numberOfLines={1}>{value}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16, paddingBottom: 10,
    backgroundColor: colors.greenSoft,
  },
  headerNarrow: { paddingHorizontal: 12 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  identityRowAccessible: { flexWrap: 'wrap' },
  identityText: { flex: 1, minWidth: 0, gap: 1 },
  headerCopy: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 18, color: colors.greenDark },
  headerClass: { color: colors.gray },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  avatarPressed: { opacity: 0.75 },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.white },
  headerStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerStatsAccessible: { width: '100%', marginLeft: 46, marginTop: 4 },
  statusTouch: { minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  status: { height: 32, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 5, backgroundColor: colors.surface },
  statusSelected: { borderWidth: 1, borderColor: colors.green },
  statusPressed: { transform: [{ scale: 0.96 }] },
  statusValue: { fontFamily: fonts.extrabold, fontSize: 11, fontVariant: ['tabular-nums'] },
  content: { padding: 20, paddingTop: 16, paddingBottom: 32, gap: 14 },
  intro: { gap: 4 },
  heroTitle: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 28, color: colors.ink },
  kicker: { fontFamily: fonts.extrabold, fontSize: 13, letterSpacing: 0.8, color: colors.green },
  introHint: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.gray },
  unitsScroll: { marginHorizontal: -20, flexGrow: 0 },
  units: { paddingHorizontal: 20, paddingBottom: 8, gap: 10 },
  unitEdge: { width: 128, borderRadius: 18, paddingBottom: 4 },
  unit: {
    alignItems: 'center', gap: 6, paddingTop: 10, paddingBottom: 12, paddingHorizontal: 8,
    borderRadius: 18, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface,
  },
  unitName: { fontFamily: fonts.extrabold, fontSize: 14, lineHeight: 17, color: colors.ink, textAlign: 'center' },
  unitProgress: { ...text.caption, fontFamily: fonts.bold, fontSize: 12 },
  roomEdge: { borderRadius: 18, backgroundColor: colors.yellowDark, paddingBottom: 4 },
  room: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingHorizontal: 16, borderRadius: 18, backgroundColor: colors.yellow },
  roomIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  roomTitle: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.ink },
  roomSub: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
});
