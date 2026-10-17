import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Icon, Mascot, LoadingView, EmptyState } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { listenTrail, listenProgress } from '../../services/trailService';
import { getClass, listenActiveRoom } from '../../services/classService';
import { currentLives } from '../../utils/lives';
import { topicLabel } from '../../constants/topics';
import { friendlyError } from '../../utils/errors';
import { initials } from '../../utils/format';
import TrailPath, { lessonStates } from './TrailPath';
import { colors, fonts, text, radius } from '../../theme';

const YEARS = [1, 2, 3];

// Screen 11: Trilhas (home of the student)
export default function TrailsScreen({ navigation }) {
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const stats = profile.stats ?? {};

  const [classInfo, setClassInfo] = useState(null);
  const [pickedYear, setPickedYear] = useState(null);
  const [pickedUnit, setPickedUnit] = useState(null);
  const [trail, setTrail] = useState(undefined); // undefined = loading, null = no content
  const [progress, setProgress] = useState(null);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');

  const year = pickedYear ?? classInfo?.grade ?? 1;

  // class (for the default year) + live "Modo Sala" notice
  useEffect(() => {
    getClass(profile.classId).then(setClassInfo).catch(() => {});
    return listenActiveRoom(profile.classId, setRoom);
  }, [profile.classId]);

  // progress of this student
  useEffect(() => listenProgress(user.uid, setProgress, (e) => setError(friendlyError(e))), [user.uid]);

  // trail of the selected year
  useEffect(() => {
    setTrail(undefined);
    setPickedUnit(null);
    return listenTrail(year, setTrail, (e) => setError(friendlyError(e)));
  }, [year]);

  const unit = useMemo(() => {
    if (!trail) return null;
    return trail.units.find((u) => u.id === pickedUnit) ?? trail.units[0] ?? null;
  }, [trail, pickedUnit]);

  const items = unit && progress ? lessonStates(unit.lessons, progress) : [];

  function playLesson(lesson) {
    navigation.navigate('Lesson', { lessonId: lesson.id, title: lesson.title });
  }

  return (
    <Screen padded={false}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => navigation.navigate('StudentProfile')} style={styles.avatar} accessibilityLabel="Perfil">
          <Text style={styles.avatarText}>{initials(profile.name)}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pill icon="flame" color={colors.orange} background={colors.orangeSoft} label={`${stats.streak ?? 0} dias`} />
        <Pill icon="zap" color={colors.purple} background={colors.purpleSoft} label={`${stats.xp ?? 0} XP`} />
        <Pill icon="heart" color={colors.red} background={colors.redSoft} label={`${currentLives(stats)}/5`} />
      </View>

      {error ? (
        <EmptyState isError title="Não foi possível carregar" message={error} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View>
            <Text style={styles.kicker}>
              {year}º ANO{unit ? ` · ${topicLabel(unit.topic).toUpperCase()}` : ''}
            </Text>
            <Text style={styles.unitTitle}>{unit?.title ?? trail?.title ?? ' '}</Text>
          </View>

          <View style={styles.years}>
            {YEARS.map((y) => {
              const on = y === year;
              return (
                <Pressable key={y} onPress={() => setPickedYear(y)} style={[styles.year, on && styles.yearOn]}>
                  <Text style={[styles.yearText, on && styles.yearTextOn]}>{y}º Ano</Text>
                </Pressable>
              );
            })}
          </View>

          {trail === undefined || !progress ? (
            <LoadingView message="Carregando trilha..." />
          ) : !unit ? (
            <EmptyState
              image={require('../../../assets/mascotes/sapo.png')}
              title="Trilha ainda não disponível"
              message={`O conteúdo do ${year}º ano ainda não foi publicado. Tente outro ano.`}
            />
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitsScroll} contentContainerStyle={styles.units}>
                {trail.units.map((u) => {
                  const on = u.id === unit.id;
                  const done = u.lessons.filter((l) => progress[l.id]).length;
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
              </ScrollView>

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
    </Screen>
  );
}

function Pill({ icon, color, background, label }) {
  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      <Icon name={icon} size={20} color={color} fill={color} />
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingBottom: 12,
    backgroundColor: colors.surface, borderBottomWidth: 2, borderBottomColor: colors.border,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.white },
  pill: { height: 40, paddingHorizontal: 10, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 4 },
  pillText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.ink },
  content: { padding: 20, paddingBottom: 32, gap: 14 },
  kicker: { fontFamily: fonts.extrabold, fontSize: 13, letterSpacing: 0.8, color: colors.green },
  unitTitle: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 28, color: colors.ink, marginTop: 4 },
  years: { flexDirection: 'row', gap: 6, padding: 4, borderRadius: 16, backgroundColor: colors.border },
  year: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  yearOn: { backgroundColor: colors.white, borderBottomWidth: 2, borderBottomColor: '#CBD5E1' },
  yearText: { fontFamily: fonts.bold, fontSize: 16, color: colors.gray },
  yearTextOn: { fontFamily: fonts.extrabold, color: colors.greenDark },
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
