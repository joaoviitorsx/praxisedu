export function attendanceSummary(members, entries = {}) {
  return members.reduce((summary, member) => {
    const status = entries[member.id]?.status;
    if (status === 'present') summary.present += 1;
    else if (status === 'absent') summary.absent += 1;
    else summary.unmarked += 1;
    return summary;
  }, { present: 0, absent: 0, unmarked: 0 });
}

export function attendanceListColumns(memberCount, width, fontScale = 1) {
  if (memberCount < 12 || width < 340 || fontScale >= 1.3) return 1;
  if (width >= 700) return 4;
  if (width >= 600) return 3;
  return 2;
}

export function resolveAttendanceClassId(classes, requestedId, currentId) {
  if (!classes?.length) return null;
  if (classes.some((item) => item.id === requestedId)) return requestedId;
  if (classes.some((item) => item.id === currentId)) return currentId;
  return classes[0].id;
}

export function attendanceSnapshotForEditor(record, hasUnsavedMarks, members) {
  if (hasUnsavedMarks) return null;
  const savedMarks = Object.fromEntries(Object.entries(record?.entries ?? {}).map(([id, entry]) => [id, entry.status]));
  return {
    record,
    marks: members ? Object.fromEntries(members.map(({ id }) => [id, savedMarks[id] === 'present' ? 'present' : 'absent'])) : savedMarks,
  };
}

export const toggleAttendanceMark = (status) => status === 'present' ? 'absent' : 'present';

export function recentAttendanceDates(records, todayKey) {
  return Object.keys(records ?? {})
    .filter((key) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || key > todayKey) return false;
      const date = new Date(`${key}T12:00:00Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === key;
    })
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 8);
}

export function buildAttendanceRecord(members, marks, dateKey, teacherId) {
  const entries = {};
  members.forEach((member) => {
    if (marks[member.id] !== 'present' && marks[member.id] !== 'absent') {
      throw new Error(`Marque a presença de ${member.name} antes de salvar.`);
    }
    entries[member.id] = {
      name: member.name,
      status: marks[member.id],
    };
  });
  return { date: dateKey, teacherId, entries };
}
