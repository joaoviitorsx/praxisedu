import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { TabSwipeProtectedScroll } from '../../navigation/EdgeTabSwipe';
import { Button, EmptyState, Icon, LoadingView } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { attendanceListColumns, attendanceSummary, attendanceSnapshotForEditor, buildAttendanceRecord, toggleAttendanceMark } from '../../features/teacher/attendanceModel';
import { attendanceLoadMessage } from '../../features/teacher/attendanceErrors';
import { listenAttendance, listenRecentAttendance, saveAttendance } from '../../services/attendanceService';
import { toDateKey } from '../../utils/dates';
import { initials } from '../../utils/format';
import { colors, fonts, text } from '../../theme';

const dateFromKey = (key) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
};
const moveDate = (key, days) => {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
};

export default function AttendanceTab({ classId, members, onDirtyChange, showHeading = true, contentPadding = 20 }) {
  const { user } = useAuth();
  const { width, fontScale } = useWindowDimensions();
  const [dateKey, setDateKey] = useState(toDateKey(new Date()));
  const [record, setRecord] = useState(undefined);
  const [marks, setMarks] = useState({});
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [recentDates, setRecentDates] = useState([]);
  const [recentError, setRecentError] = useState(false);

  useEffect(() => {
    setRecentDates([]);
    setRecentError(false);
    return listenRecentAttendance(classId, toDateKey(new Date()), setRecentDates, () => setRecentError(true));
  }, [classId]);

  useEffect(() => {
    dirtyRef.current = false;
    setRecord(undefined); setError(''); setNotice(''); setDirty(false);
    return listenAttendance(classId, dateKey, (value) => {
      const snapshot = attendanceSnapshotForEditor(value, dirtyRef.current);
      if (!snapshot) return;
      setRecord(snapshot.record);
      setMarks(snapshot.marks);
      setDirty(false); onDirtyChange?.(false);
    }, (e) => setError(attendanceLoadMessage(e)));
  }, [classId, dateKey, onDirtyChange, attempt]);

  const effectiveMarks = useMemo(() => Object.fromEntries(members.map(({ id }) => [id, marks[id] === 'present' ? 'present' : 'absent'])), [members, marks]);
  const summary = useMemo(() => attendanceSummary(members, Object.fromEntries(Object.entries(effectiveMarks).map(([id, status]) => [id, { status }]))), [members, effectiveMarks]);
  const columns = attendanceListColumns(members.length, width, fontScale);
  const gridMode = columns > 1;
  const tileSize = gridMode ? Math.floor((width - 40 - (columns - 1) * 8) / columns) : 0;
  const dateLabel = dateFromKey(dateKey).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const isToday = dateKey === toDateKey(new Date());
  const statusLabel = dirty ? 'Alterações pendentes' : record ? 'Salva' : 'Nova chamada';
  const statusColor = dirty ? colors.orangeText : record ? colors.greenDark : colors.blue;
  const statusStyle = dirty ? styles.statusPending : record ? styles.statusSaved : styles.statusNew;

  const mark = useCallback((id) => {
    dirtyRef.current = true;
    setMarks((current) => ({ ...current, [id]: toggleAttendanceMark(current[id]) }));
    setDirty(true); onDirtyChange?.(true); setNotice('');
  }, [onDirtyChange]);

  function selectDate(nextKey) {
    if (saving || nextKey === dateKey) return;
    const next = () => { dirtyRef.current = false; setDirty(false); onDirtyChange?.(false); setRecord(undefined); setMarks({}); setDateKey(nextKey); };
    if (dirty) Alert.alert('Descartar alterações?', 'A chamada deste dia ainda não foi salva.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: next },
    ]);
    else next();
  }

  function changeDate(days) { selectDate(moveDate(dateKey, days)); }

  async function save() {
    setSaving(true); setError('');
    try {
      await saveAttendance(classId, dateKey, members, effectiveMarks, user.uid);
      setRecord(buildAttendanceRecord(members, effectiveMarks, dateKey, user.uid));
      dirtyRef.current = false;
      setDirty(false); onDirtyChange?.(false); setNotice('Chamada salva para esta data.');
    } catch (e) { dirtyRef.current = true; setDirty(true); onDirtyChange?.(true); setError(attendanceLoadMessage(e)); }
    finally { setSaving(false); }
  }

  const renderMember = useCallback(({ item }) => <AttendanceRow member={item} status={effectiveMarks[item.id]} onMark={mark} grid={gridMode} tileSize={tileSize} />, [effectiveMarks, mark, gridMode, tileSize]);

  return <FlatList
    key={`attendance-${columns}`}
    data={record !== undefined ? members : []}
    renderItem={renderMember}
    keyExtractor={(item) => item.id}
    numColumns={columns}
    columnWrapperStyle={gridMode ? styles.gridColumns : undefined}
    extraData={effectiveMarks}
    style={styles.root}
    contentContainerStyle={[styles.content, { paddingHorizontal: contentPadding }]}
    showsVerticalScrollIndicator={false}
    keyboardShouldPersistTaps="handled"
    ListHeaderComponent={<View style={styles.headerArea}>
      {showHeading ? <View><Text style={styles.heading}>Chamada</Text><Text style={text.caption}>Registre e consulte a presença por dia.</Text></View> : null}
      <View style={styles.dateCard}>
        <Pressable onPress={() => changeDate(-1)} accessibilityRole="button" accessibilityLabel="Dia anterior" style={({ pressed }) => [styles.dateArrow, pressed && styles.pressed]}><Icon name="chevron-left" size={22} color={colors.blue} /></Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}><Text style={text.label}>{isToday ? 'HOJE' : 'DATA DA CHAMADA'}</Text><Text style={styles.dateText}>{dateLabel}</Text></View>
        <Pressable onPress={() => changeDate(1)} disabled={isToday} accessibilityRole="button" accessibilityState={{ disabled: isToday }} accessibilityLabel="Próximo dia" style={({ pressed }) => [styles.dateArrow, pressed && styles.pressed]}><Icon name="chevron-right" size={22} color={isToday ? colors.border : colors.blue} /></Pressable>
      </View>
      {record !== undefined && members.length > 0 ? <>
        <View style={styles.attendanceHeading}>
          <Text style={styles.summaryHeading}>RESUMO DA CHAMADA</Text>
          <View style={[styles.callStatusBadge, statusStyle]} accessible accessibilityLabel={`Situação: ${statusLabel}`}>
            <Icon name={dirty ? 'info' : record ? 'check-circle' : 'clock'} size={16} color={statusColor} />
            <Text style={[styles.callStatusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        <View style={styles.summary}>
          <Stat value={summary.present} label="presentes" color={colors.green} />
          <View style={styles.summaryDivider} />
          <Stat value={summary.absent} label="ausentes" color={colors.redText} />
        </View>
        <View style={styles.listIntro}>
          <Text style={styles.listHeading}>Alunos da chamada · {members.length}</Text>
          <Text style={styles.listHelper}>{record ? 'Toque em um aluno para corrigir a presença.' : 'Todos começam como falta. Toque em quem está presente.'}</Text>
        </View>
        <View style={styles.bulkActions}>
          <Pressable onPress={() => { dirtyRef.current = true; setMarks(Object.fromEntries(members.map((member) => [member.id, 'present']))); setDirty(true); onDirtyChange?.(true); setNotice(''); }} style={({ pressed }) => [styles.bulkButton, styles.allPresent, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Marcar todos os alunos presentes"><Text style={styles.allPresentText}>Todos presentes</Text></Pressable>
          <Pressable onPress={() => { dirtyRef.current = true; setMarks(Object.fromEntries(members.map((member) => [member.id, 'absent']))); setDirty(true); onDirtyChange?.(true); setNotice(''); }} style={({ pressed }) => [styles.bulkButton, styles.allAbsent, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Marcar todos os alunos faltantes"><Text style={styles.allAbsentText}>Todos faltantes</Text></Pressable>
        </View>
      </> : null}
    </View>}
    ListEmptyComponent={record === undefined && error ? <EmptyState isError title="Não foi possível carregar a chamada" message={error} actionLabel="Tentar novamente" onAction={() => setAttempt((value) => value + 1)} /> : record === undefined ? <LoadingView message="Carregando chamada..." /> : <EmptyState title="Nenhum aluno nesta turma" message="Quando os estudantes entrarem na turma, a lista de chamada aparecerá aqui." />}
    ListFooterComponent={record !== undefined && (members.length > 0 || recentDates.length > 0 || recentError) ? <View style={styles.footer}>
      {members.length > 0 ? <View style={styles.saveArea}>
        {error ? <View style={styles.error}><Icon name="alert-triangle" size={20} color={colors.redText} /><Text style={styles.errorText}>{error}</Text></View> : null}
        <Button title={saving ? 'Salvando...' : dirty ? 'Salvar chamada' : record ? 'Chamada salva' : 'Salvar chamada'} variant="teacher" loading={saving} disabled={!dirty && !!record} onPress={save} />
        {notice ? <View style={styles.savedInline}><Icon name="check-circle" size={18} color={colors.greenDark} /><Text style={styles.savedText}>{notice}</Text></View> : null}
      </View> : null}
      {recentDates.length > 0 ? <View style={styles.recentSection}>
        <Text style={styles.recentHeading}>CHAMADAS SALVAS</Text>
        <TabSwipeProtectedScroll showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentList} accessibilityLabel="Datas com chamadas salvas">
          {recentDates.map((key) => {
            const selected = key === dateKey;
            const label = dateFromKey(key).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
            return <Pressable key={key} onPress={() => selectDate(key)} accessibilityRole="button" accessibilityLabel={`Abrir chamada de ${dateFromKey(key).toLocaleDateString('pt-BR')}`} accessibilityState={{ selected }} style={({ pressed }) => [styles.recentChip, selected && styles.recentChipSelected, pressed && styles.pressed]}>
              <Text style={[styles.recentChipText, selected && styles.recentChipTextSelected]}>{label}</Text>
            </Pressable>;
          })}
        </TabSwipeProtectedScroll>
      </View> : null}
      {recentError ? <Text style={styles.recentError}>Não foi possível listar chamadas salvas. Use as setas para escolher a data.</Text> : null}
    </View> : null}
  />;
}

const AttendanceRow = memo(function AttendanceRow({ member, status, onMark, grid, tileSize }) {
  const present = status === 'present';
  return <Pressable onPress={() => onMark(member.id)} accessibilityRole="switch" accessibilityState={{ checked: present }} accessibilityLabel={`${member.name}: ${present ? 'presente' : 'falta'}. Toque para marcar ${present ? 'falta' : 'presença'}.`} style={({ pressed }) => [styles.row, grid && styles.gridTile, grid && { width: tileSize }, present && styles.rowPresent, pressed && styles.pressed]}>
    <View style={[styles.avatar, grid && styles.gridAvatar]}><Text style={styles.avatarText}>{initials(member.name)}</Text></View>
    <Text style={[styles.name, grid && styles.gridName]} numberOfLines={2}>{member.name}</Text>
    <View style={[styles.statusBadge, grid && styles.gridStatusBadge, present ? styles.statusPresent : styles.statusAbsent]}><Icon name={present ? 'check' : 'x'} size={16} color={present ? colors.greenDark : colors.redText} /><Text style={[styles.statusText, { color: present ? colors.greenDark : colors.redText }]}>{present ? 'Presente' : 'Falta'}</Text></View>
  </Pressable>;
});

function Stat({ value, label, color }) {
  return <View style={styles.stat}><Text style={[styles.statValue, { color }]}>{value}</Text><Text style={text.caption}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: 24, gap: 8 },
  headerArea: { gap: 14, paddingTop: 8, paddingBottom: 4 },
  heading: { ...text.h2, marginBottom: 4 },
  dateCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 18, paddingVertical: 8, paddingHorizontal: 6 },
  dateArrow: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink, textTransform: 'capitalize', textAlign: 'center' },
  recentSection: { gap: 8, marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  recentHeading: { ...text.label },
  recentList: { gap: 8, paddingRight: 4 },
  recentChip: { minHeight: 48, minWidth: 72, paddingHorizontal: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border },
  recentChipSelected: { backgroundColor: colors.blueSoft, borderColor: colors.blue },
  recentChipText: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink, textTransform: 'capitalize' },
  recentChipTextSelected: { fontFamily: fonts.extrabold, color: colors.blue },
  recentError: { ...text.caption, color: colors.redText },
  attendanceHeading: { minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  summaryHeading: { ...text.label, color: colors.blueDark },
  callStatusBadge: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, borderRadius: 10 },
  statusNew: { backgroundColor: colors.blueSoft },
  statusSaved: { backgroundColor: colors.greenSoft },
  statusPending: { backgroundColor: colors.yellowSoft },
  callStatusText: { fontFamily: fonts.bold, fontSize: 12 },
  summary: { flexDirection: 'row', paddingVertical: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18 },
  summaryDivider: { width: 1, marginVertical: 10, backgroundColor: colors.border },
  stat: { flex: 1, alignItems: 'center', gap: 2, padding: 8 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 25, lineHeight: 31 },
  listIntro: { gap: 3, paddingTop: 4 },
  listHeading: { fontFamily: fonts.extrabold, fontSize: 18, lineHeight: 24, color: colors.ink },
  listHelper: { ...text.caption, lineHeight: 19 },
  bulkActions: { flexDirection: 'row', gap: 8 },
  bulkButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingHorizontal: 8 },
  allPresent: { backgroundColor: colors.greenSoft },
  allAbsent: { backgroundColor: colors.redSoft },
  allPresentText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.greenDark },
  allAbsentText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.redText },
  row: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 2, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.surface },
  gridColumns: { gap: 8 },
  gridTile: { aspectRatio: 1, flexDirection: 'column', alignItems: 'stretch', justifyContent: 'space-between', gap: 4, padding: 10, borderWidth: 1 },
  rowPresent: { borderColor: colors.green, backgroundColor: colors.greenSoft },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  gridAvatar: { width: 34, height: 34, borderRadius: 17 },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.blue },
  name: { flex: 1, fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  gridName: { flex: 0, alignSelf: 'stretch', minHeight: 36, fontSize: 13, lineHeight: 18 },
  statusBadge: { minWidth: 96, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 11, paddingHorizontal: 7 },
  gridStatusBadge: { minWidth: 0, minHeight: 30, alignSelf: 'flex-start', paddingHorizontal: 8 },
  statusPresent: { backgroundColor: colors.surface },
  statusAbsent: { backgroundColor: colors.redSoft },
  statusText: { fontFamily: fonts.extrabold, fontSize: 12 },
  footer: { gap: 16, paddingTop: 14 },
  saveArea: { gap: 10 },
  error: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 14, backgroundColor: colors.redSoft },
  errorText: { ...text.caption, flex: 1, color: colors.redText },
  savedInline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  savedText: { ...text.caption, color: colors.greenDark },
  pressed: { opacity: 0.7 },
});
