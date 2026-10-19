import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Icon, Mascot, LoadingView, EmptyState } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { listenProgress } from '../../services/trailService';
import { listenClassTrail } from '../../services/classTrailService';
import { listenClass, listenActiveRoom } from '../../services/classService';
import { gradeForClass } from '../../features/student/trailLayout';
import { lessonCompletionKind } from '../../features/student/trailModel';
import { currentLives } from '../../utils/lives';
import { topicLabel } from '../../constants/topics';
import { friendlyError } from '../../utils/errors';
import { initials } from '../../utils/format';
import TrailPath, { lessonStates } from './TrailPath';
import StudentStatPopover from '../../components/StudentStatPopover';
import { TabSwipeProtectedScroll } from '../../navigation/EdgeTabSwipe';
import { colors, fonts } from '../../theme';

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
  const accessibleHeader = width < 320 || fontScale > 1.4;
  const firstName = String(profile.name ?? '').trim().split(/\s+/)[0] || 'estudante';
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
  const completedCount = items.filter((item) => item.kind === 'done').length;
  const nextLesson = items.find((item) => item.kind === 'current')?.lesson;
  const topicProgress = items.length ? Math.round(completedCount / items.length * 100) : 0;

  function playLesson(lesson) {
    navigation.navigate('Lesson', {
      lessonId: lesson.id,
      title: lesson.title,
      mascot: unit.mascot || 'sapo',
      completionKind: lessonCompletionKind(trail, progress, lesson.id),
    });
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
    <Screen padded={false} lightStatusBar style={{ backgroundColor: colors.white }}>
      <LinearGradient colors={[colors.greenDark, colors.green]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, narrowHeader && styles.headerNarrow, { paddingTop: insets.top + 12 }]}>
        <View pointerEvents="none" style={styles.headerOrbitOuter} />
        <View pointerEvents="none" style={styles.headerOrbitInner} />
        <View style={styles.headerInner}>
          <View style={styles.identityRow}>
            <View style={styles.identityText}>
              <Text style={styles.headerEyebrow}>MINHA JORNADA</Text>
              <Text style={[styles.headerGreeting, narrowHeader && styles.headerGreetingNarrow]} numberOfLines={1}>Olá, {firstName}!</Text>
              <View style={styles.classLine}>
                <Icon name="school" size={15} color={colors.greenSoft} />
                <Text style={styles.headerClass} numberOfLines={1}>{classInfo?.name ?? 'Trilhas de biologia'}</Text>
              </View>
            </View>
            <Pressable onPress={() => navigation.navigate('StudentProfile')} style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]} accessibilityRole="button" accessibilityLabel="Abrir meu perfil">
              <Text style={styles.avatarText}>{initials(profile.name)}</Text>
            </Pressable>
          </View>
          <View style={[styles.headerStats, accessibleHeader && styles.headerStatsAccessible]} accessibilityLabel="Seu progresso">
            <Status icon="flame" color={colors.orangeText} tint={colors.orangeSoft} label="Sequência" value={String(stats.streak ?? 0)} fullValue={`${stats.streak ?? 0} dias`} triggerRef={(node) => { statTriggers.current.streak = node; }} onPress={() => openStat('streak')} selected={activeStat?.id === 'streak'} stacked={accessibleHeader} />
            <View style={[styles.statDivider, accessibleHeader && styles.statDividerAccessible]} />
            <Status icon="zap" color={colors.purple} tint={colors.purpleSoft} label="Experiência" value={compactXp(stats.xp)} fullValue={`${stats.xp ?? 0} XP`} triggerRef={(node) => { statTriggers.current.xp = node; }} onPress={() => openStat('xp')} selected={activeStat?.id === 'xp'} stacked={accessibleHeader} />
            <View style={[styles.statDivider, accessibleHeader && styles.statDividerAccessible]} />
            <Status icon="heart" color={colors.red} tint={colors.redSoft} label="Vidas" value={`${currentLives(stats)}/5`} fullValue={`${currentLives(stats)} de 5`} triggerRef={(node) => { statTriggers.current.lives = node; }} onPress={() => openStat('lives')} selected={activeStat?.id === 'lives'} stacked={accessibleHeader} />
          </View>
        </View>
      </LinearGradient>

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
                <View style={styles.introRow}>
                  <View style={styles.introCopy}>
                    <Text style={styles.kicker}>TRILHA DO {year}º ANO</Text>
                    <Text style={styles.heroTitle}>{unit.title}</Text>
                    <Text style={styles.introHint}>{nextLesson ? `Próxima etapa: ${nextLesson.title}` : items.length ? 'Todas as etapas concluídas. Continue revisando!' : 'As etapas deste tópico aparecerão aqui.'}</Text>
                  </View>
                  <View style={styles.introMascot}><Mascot name={unit.mascot || 'sapo'} size={56} /></View>
                </View>
                {!!items.length && <><View style={styles.topicProgressRow}><Text style={styles.topicProgressText}>{completedCount} de {items.length} etapas concluídas</Text><Text style={styles.topicProgressPercent}>{topicProgress}%</Text></View><View style={styles.topicProgressTrack} accessibilityRole="progressbar" accessibilityLabel="Progresso do tópico" accessibilityValue={{ min: 0, max: 100, now: topicProgress }}><View style={[styles.topicProgressFill, { width: `${topicProgress}%` }]} /></View></>}
              </View>
              <View style={styles.unitsHeadingRow}>
                <Text style={styles.unitsHeading}>ESCOLHA UM TÓPICO</Text>
                <Text style={styles.unitsCount}>{trail.units.length} {trail.units.length === 1 ? 'tópico' : 'tópicos'}</Text>
              </View>
              <TabSwipeProtectedScroll showsHorizontalScrollIndicator={false} style={styles.unitsScroll} contentContainerStyle={styles.units}>
                {trail.units.map((u, unitIndex) => {
                  const on = u.id === unit.id;
                  const done = u.lessons.filter((l) => progress[l.id]?.completedAt || progress[l.id]?.stars > 0).length;
                  const total = u.lessons.length;
                  const percent = total ? Math.round(done / total * 100) : 0;
                  const name = u.title?.trim() || topicLabel(u.topic) || 'Tópico sem título';
                  return (
                    <Pressable key={u.id} onPress={() => setPickedUnit(u.id)} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`${name}, ${total ? `${done} de ${total} etapas concluídas` : 'etapas em breve'}`}
                      style={({ pressed }) => [styles.unit, on && styles.unitSelected, pressed && styles.unitPressed]}>
                      <View style={styles.unitTop}>
                        <Text style={[styles.unitIndex, on && styles.unitIndexSelected]}>TÓPICO {String(unitIndex + 1).padStart(2, '0')}</Text>
                        <View style={[styles.unitMarker, on && styles.unitMarkerSelected]}>{on && <Icon name="check" size={13} color={colors.white} strokeWidth={3} />}</View>
                      </View>
                      <View style={styles.unitMascot}><Mascot name={u.mascot || 'sapo'} size={43} /></View>
                      <Text style={styles.unitName} numberOfLines={2}>{name}</Text>
                      <Text style={styles.unitTheme} numberOfLines={1}>{topicLabel(u.topic) || 'Biologia'}</Text>
                      <View style={styles.unitProgressRow}>
                        <Text style={styles.unitProgress}>{total ? `${done} de ${total} ${total === 1 ? 'etapa' : 'etapas'}` : 'Etapas em breve'}</Text>
                        {!!total && <Text style={[styles.unitPercent, on && styles.unitPercentSelected]}>{percent}%</Text>}
                      </View>
                      <View style={styles.unitTrack}><View style={[styles.unitFill, { width: `${percent}%` }]} /></View>
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

              <View style={styles.trailSection}>
                {items.length === 0 ? (
                  <EmptyState title="Nenhuma lição neste tema" message="As lições aparecem aqui quando forem publicadas." />
                ) : (
                  <TrailPath sceneKey={unit.id} items={items} mascot={unit.mascot} onPlay={playLesson} />
                )}
              </View>
            </>
          )}
        </ScrollView>
      )}
      <StudentStatPopover active={activeStat} viewport={{ width, height }} onClose={() => setActiveStat(null)} />
    </Screen>
  );
}

function Status({ icon, color, tint, label, value, fullValue, triggerRef, onPress, selected, stacked }) {
  return (
    <Pressable ref={triggerRef} onPress={onPress} style={[styles.statusTouch, stacked && styles.statusTouchStacked, selected && styles.statusSelected]} accessibilityRole="button" accessibilityLabel={`${label}: ${fullValue}`} accessibilityHint="Toque para saber mais" accessibilityState={{ expanded: selected }}>
      {({ pressed }) => (
        <View style={[styles.status, stacked && styles.statusStacked, pressed && styles.statusPressed]}>
          <View style={styles.statusTop}>
            <View style={[styles.statusIcon, { backgroundColor: tint }]}><Icon name={icon} size={16} color={color} fill={color} /></View>
            <Text style={styles.statusValue} numberOfLines={1}>{value}</Text>
          </View>
          <Text style={styles.statusLabel} numberOfLines={1}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20, paddingBottom: 18,
    borderBottomLeftRadius: 26, borderBottomRightRadius: 26,
    overflow: 'hidden',
  },
  headerNarrow: { paddingHorizontal: 14 },
  headerOrbitOuter: { position: 'absolute', width: 210, height: 210, borderRadius: 105, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', right: -76, top: -96 },
  headerOrbitInner: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.06)', right: -22, top: -54 },
  headerInner: { width: '100%', maxWidth: 620, alignSelf: 'center' },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 74 },
  identityText: { flex: 1, minWidth: 0, gap: 4 },
  headerEyebrow: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 1.5, color: colors.greenSoft },
  headerGreeting: { fontFamily: fonts.extrabold, fontSize: 25, lineHeight: 32, color: colors.white },
  headerGreetingNarrow: { fontSize: 22, lineHeight: 29 },
  classLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerClass: { flex: 1, fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, color: colors.greenSoft },
  avatar: { width: 52, height: 52, borderRadius: 19, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.yellow, alignItems: 'center', justifyContent: 'center' },
  avatarPressed: { transform: [{ scale: 0.96 }] },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.greenDark },
  headerStats: { marginTop: 15, padding: 4, flexDirection: 'row', alignItems: 'stretch', borderRadius: 20, backgroundColor: colors.white, shadowColor: colors.greenDark, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 3 },
  headerStatsAccessible: { flexDirection: 'column' },
  statDivider: { width: 1, marginVertical: 12, backgroundColor: colors.border },
  statDividerAccessible: { width: '100%', height: 1, marginVertical: 0 },
  statusTouch: { flex: 1, minWidth: 0, minHeight: 66, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statusTouchStacked: { flex: 0, minHeight: 48, alignItems: 'stretch' },
  status: { alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 3 },
  statusStacked: { flexDirection: 'row', justifyContent: 'flex-start', gap: 12, paddingHorizontal: 12 },
  statusTop: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  statusSelected: { backgroundColor: colors.greenSoft },
  statusPressed: { transform: [{ scale: 0.96 }] },
  statusValue: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.ink, fontVariant: ['tabular-nums'] },
  statusLabel: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 15, color: colors.gray },
  content: { padding: 20, paddingTop: 16, paddingBottom: 32, gap: 14 },
  intro: { gap: 13, padding: 17, borderRadius: 21, backgroundColor: colors.greenSoft, borderWidth: 1, borderColor: '#C8E8D5' },
  introRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  introCopy: { flex: 1, minWidth: 0, gap: 5 },
  introMascot: { width: 65, height: 65, borderRadius: 19, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  topicProgressRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  topicProgressText: { fontFamily: fonts.bold, fontSize: 12, color: colors.greenDark },
  topicProgressPercent: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.greenDark },
  topicProgressTrack: { height: 8, borderRadius: 8, backgroundColor: '#C8E8D5', overflow: 'hidden' },
  topicProgressFill: { height: '100%', borderRadius: 8, backgroundColor: colors.green },
  unitsHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 9 },
  unitsHeading: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 0.9, color: colors.gray },
  unitsCount: { fontFamily: fonts.semibold, fontSize: 12, color: colors.gray },
  heroTitle: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 28, color: colors.ink },
  kicker: { fontFamily: fonts.extrabold, fontSize: 13, letterSpacing: 0.8, color: colors.green },
  introHint: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.gray },
  unitsScroll: { marginHorizontal: -20, flexGrow: 0 },
  units: { paddingHorizontal: 20, paddingBottom: 4, gap: 10 },
  unit: { width: 174, minHeight: 168, padding: 11, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  unitSelected: { borderColor: colors.green, backgroundColor: colors.greenSoft },
  unitPressed: { opacity: 0.78 },
  unitTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  unitIndex: { fontFamily: fonts.extrabold, fontSize: 9, letterSpacing: 0.7, color: colors.gray },
  unitIndexSelected: { color: colors.greenDark },
  unitMarker: { width: 19, height: 19, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  unitMarkerSelected: { borderColor: colors.green, backgroundColor: colors.green },
  unitMascot: { alignSelf: 'center', height: 43, marginTop: 2, alignItems: 'center', justifyContent: 'center' },
  unitName: { minHeight: 36, marginTop: 2, fontFamily: fonts.extrabold, fontSize: 13, lineHeight: 18, color: colors.ink, textAlign: 'center' },
  unitTheme: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 14, color: colors.gray, textAlign: 'center' },
  unitProgressRow: { marginTop: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  unitProgress: { fontFamily: fonts.semibold, fontSize: 10, color: colors.gray },
  unitPercent: { fontFamily: fonts.extrabold, fontSize: 10, color: colors.gray },
  unitPercentSelected: { color: colors.greenDark },
  unitTrack: { height: 4, marginTop: 5, borderRadius: 4, backgroundColor: '#DCE8E2', overflow: 'hidden' },
  unitFill: { height: '100%', borderRadius: 5, backgroundColor: colors.green },
  trailSection: { marginTop: 10 },
  roomEdge: { borderRadius: 18, backgroundColor: colors.yellowDark, paddingBottom: 4 },
  room: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingHorizontal: 16, borderRadius: 18, backgroundColor: colors.yellow },
  roomIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  roomTitle: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.ink },
  roomSub: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
});
