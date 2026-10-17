import {
  ref, get, update, push, onValue, serverTimestamp,
} from 'firebase/database';
import { db } from '../config/firebase';
import { accuracy, classAccuracy, needsSupport, accuracyByTopic } from '../utils/metrics';

// ---------- code ----------

function randomCode() {
  const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const letters = Array.from({ length: 3 }, () => L[Math.floor(Math.random() * L.length)]).join('');
  return letters + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
}

// Returns a code that is not used yet (3 letters + 3 digits)
export async function generateClassCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    if (!(await get(ref(db, `classCodes/${code}`))).exists()) return code;
  }
  throw new Error('CLASS_CODE_UNAVAILABLE');
}

// ---------- create / read / update / delete ----------

// One multi-path update: class + code index + teacher index (atomic)
export async function createClass(teacher, { name, grade, shift, code }) {
  const classId = push(ref(db, 'classes')).key;
  try {
    await update(ref(db), {
      [`classes/${classId}`]: {
        name, grade, shift, code,
        teacherId: teacher.uid, teacherName: teacher.name, school: teacher.school ?? null,
        createdAt: serverTimestamp(),
      },
      [`classCodes/${code}`]: classId,
      [`teacherClasses/${teacher.uid}/${classId}`]: true,
    });
  } catch (e) {
    // the rule refuses if another teacher took the same code in the meantime
    throw new Error('CLASS_CODE_UNAVAILABLE');
  }
  return { classId, code };
}

export async function getClass(classId) {
  const snap = await get(ref(db, `classes/${classId}`));
  return snap.exists() ? { id: classId, ...snap.val() } : null;
}

export const updateClass = (classId, { name, grade, shift }) =>
  update(ref(db, `classes/${classId}`), { name, grade, shift, updatedAt: serverTimestamp() });

// Cascade delete: everything at once (atomic)
export async function deleteClass(teacherId, classId, code) {
  await update(ref(db), {
    [`classes/${classId}`]: null,
    [`classCodes/${code}`]: null,
    [`teacherClasses/${teacherId}/${classId}`]: null,
    [`classMembers/${classId}`]: null,
    [`quizzes/${classId}`]: null,
    [`classroomMode/${classId}`]: null,
    [`answers/${classId}`]: null,
    [`duels/${classId}`]: null,
    [`weeklyRanking/${classId}`]: null,
  });
}

// ---------- screen 06: teacher's classes with counters ----------

const valueOf = (snap) => (snap.exists() ? snap.val() : {});

export async function loadTeacherClasses(teacherId) {
  const idsSnap = await get(ref(db, `teacherClasses/${teacherId}`));
  const ids = Object.keys(valueOf(idsSnap));

  const classes = await Promise.all(ids.map(async (id) => {
    const [cls, members, quizzes, answers, room] = await Promise.all([
      get(ref(db, `classes/${id}`)),
      get(ref(db, `classMembers/${id}`)),
      get(ref(db, `quizzes/${id}`)),
      get(ref(db, `answers/${id}`)),
      get(ref(db, `classroomMode/${id}`)),
    ]);
    if (!cls.exists()) return null;
    const memberList = Object.values(valueOf(members));
    return {
      id,
      ...cls.val(),
      studentsCount: memberList.length,
      supportCount: memberList.filter(needsSupport).length,
      quizzesCount: Object.keys(valueOf(quizzes)).length,
      accuracy: classAccuracy(valueOf(answers)),
      roomActive: !!room.val()?.active,
    };
  }));

  return classes.filter(Boolean).sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
}

// ---------- screens 08, 33: live listeners (call the returned function to stop) ----------

export function listenClass(classId, onData, onError) {
  return onValue(ref(db, `classes/${classId}`),
    (snap) => onData(snap.exists() ? { id: classId, ...snap.val() } : null), onError);
}

// Members sorted by XP (highest first), each with id and accuracy
export function listenClassMembers(classId, onData, onError) {
  return onValue(ref(db, `classMembers/${classId}`), (snap) => {
    const list = Object.entries(valueOf(snap)).map(([id, m]) => ({
      id, ...m, accuracy: accuracy(m.answersCorrect, m.answersTotal), needsSupport: needsSupport(m),
    }));
    onData(list.sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0)));
  }, onError);
}

// ---------- screen 19: performance ----------

export async function loadClassPerformance(classId) {
  const [members, quizzes, answers] = await Promise.all([
    get(ref(db, `classMembers/${classId}`)),
    get(ref(db, `quizzes/${classId}`)),
    get(ref(db, `answers/${classId}`)),
  ]);
  const answersByQuiz = valueOf(answers);
  const quizList = valueOf(quizzes);

  let responses = 0;
  Object.values(answersByQuiz).forEach((byStudent) => { responses += Object.keys(byStudent).length; });

  const memberList = Object.entries(valueOf(members)).map(([id, m]) => ({
    id, ...m, accuracy: accuracy(m.answersCorrect, m.answersTotal),
  }));

  return {
    overall: classAccuracy(answersByQuiz),
    responses,
    quizzesCount: Object.keys(quizList).length,
    byTopic: accuracyByTopic(quizList, answersByQuiz),
    strugglingStudents: memberList.filter(needsSupport).sort((a, b) => a.accuracy - b.accuracy),
  };
}

// ---------- student side ----------

// false only when the class is gone or the student lost access (class deleted).
// Network errors return true so we never clear the classId by mistake.
export async function classStillExists(classId) {
  try {
    return (await get(ref(db, `classes/${classId}`))).exists();
  } catch (e) {
    return !/PERMISSION_DENIED/i.test(`${e?.code} ${e?.message}`);
  }
}

// Number of published quizzes (shown on "Minha Turma")
export async function countPublishedQuizzes(classId) {
  const snap = await get(ref(db, `quizzes/${classId}`));
  return Object.values(valueOf(snap)).filter((q) => q.status === 'published').length;
}

// ---------- join / leave (MODELAGEM_BANCO.md, section 6.4) ----------

// Reads the code index (one direct read) and returns the classId
export async function findClassByCode(rawCode) {
  const code = rawCode.trim().toUpperCase();
  if (!/^[A-Z]{3}[0-9]{3}$/.test(code)) throw new Error('CLASS_NOT_FOUND');
  const snap = await get(ref(db, `classCodes/${code}`));
  if (!snap.exists()) throw new Error('CLASS_NOT_FOUND');
  return { classId: snap.val(), code };
}

// Adds the student to the class and saves classId in the profile (atomic)
export async function joinClass(uid, profile, classId, code) {
  const s = profile.stats ?? {};
  await update(ref(db), {
    [`classMembers/${classId}/${uid}`]: {
      name: profile.name, joinCode: code, joinedAt: serverTimestamp(),
      xp: s.xp ?? 0, streak: s.streak ?? 0, lessonsCompleted: s.lessonsCompleted ?? 0,
      answersTotal: s.answersTotal ?? 0, answersCorrect: s.answersCorrect ?? 0,
      lastActiveAt: serverTimestamp(),
    },
    [`users/${uid}/classId`]: classId,
  });
}

export const leaveClass = (uid, classId) =>
  update(ref(db), { [`classMembers/${classId}/${uid}`]: null, [`users/${uid}/classId`]: null });

export async function countClassMembers(classId) {
  const snap = await get(ref(db, `classMembers/${classId}`));
  return Object.keys(valueOf(snap)).length;
}

// Live "Modo Sala" of the class (null when there is none or it already ended).
// TODO (Ana Luiza): use the server time offset (section 6.6) instead of Date.now().
export function listenActiveRoom(classId, onData) {
  return onValue(ref(db, `classroomMode/${classId}`), (snap) => {
    const room = snap.val();
    onData(room && room.active && Date.now() < room.endsAt ? room : null);
  }, () => onData(null));
}
