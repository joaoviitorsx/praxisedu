import { ref, onValue, set, serverTimestamp, query, orderByKey, endAt, limitToLast } from 'firebase/database';
import { db } from '../config/firebase';
import { buildAttendanceRecord, recentAttendanceDates } from '../features/teacher/attendanceModel';

export function listenAttendance(classId, dateKey, onData, onError) {
  return onValue(ref(db, `attendance/${classId}/${dateKey}`),
    (snapshot) => onData(snapshot.exists() ? snapshot.val() : null), onError);
}

export function listenRecentAttendance(classId, todayKey, onData, onError) {
  const recentQuery = query(ref(db, `attendance/${classId}`), orderByKey(), endAt(todayKey), limitToLast(8));
  return onValue(recentQuery, (snapshot) => onData(recentAttendanceDates(snapshot.val(), todayKey)), onError);
}

export async function saveAttendance(classId, dateKey, members, marks, teacherId) {
  const record = buildAttendanceRecord(members, marks, dateKey, teacherId);
  await set(ref(db, `attendance/${classId}/${dateKey}`), {
    ...record,
    updatedAt: serverTimestamp(),
  });
}
