import { ref, get, onValue, push, set, update, serverTimestamp } from 'firebase/database';
import { db } from '../config/firebase';
import { summarizeQuizResults } from '../features/teacher/quizModel';

const fromSnapshot = (snapshot) => snapshot.exists() ? snapshot.val() : {};

function withTimeout(promise, ms = 2500) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('DB_TIMEOUT')), ms)),
  ]);
}

export function listenClassQuizzes(classId, onData, onError) {
  let emitted = false;
  const timer = setTimeout(() => {
    if (!emitted) {
      emitted = true;
      onData([]);
    }
  }, 1500);
  const stop = onValue(ref(db, `quizzes/${classId}`), (snapshot) => {
    emitted = true;
    clearTimeout(timer);
    const quizzes = Object.entries(fromSnapshot(snapshot)).map(([id, value]) => ({ id, ...value }));
    onData(quizzes.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)));
  }, (err) => { clearTimeout(timer); if (onError) onError(err); });
  return () => { clearTimeout(timer); stop(); };
}

export function listenClassAnswers(classId, onData, onError) {
  let emitted = false;
  const timer = setTimeout(() => {
    if (!emitted) {
      emitted = true;
      onData({});
    }
  }, 1500);
  const stop = onValue(ref(db, `answers/${classId}`), (snapshot) => {
    emitted = true;
    clearTimeout(timer);
    onData(fromSnapshot(snapshot));
  }, (err) => { clearTimeout(timer); if (onError) onError(err); });
  return () => { clearTimeout(timer); stop(); };
}

export function listenClassroomMode(classId, onData, onError) {
  let emitted = false;
  const timer = setTimeout(() => {
    if (!emitted) {
      emitted = true;
      onData(null);
    }
  }, 1500);
  const stop = onValue(ref(db, `classroomMode/${classId}`), (snapshot) => {
    emitted = true;
    clearTimeout(timer);
    onData(snapshot.val());
  }, (err) => { clearTimeout(timer); if (onError) onError(err); });
  return () => { clearTimeout(timer); stop(); };
}

export async function startClassroomMode(classId, teacherId, quiz, durationMin = 15) {
  let offset = 0;
  try {
    offset = (await withTimeout(get(ref(db, '.info/serverTimeOffset')), 1500)).val() ?? 0;
  } catch {
    offset = 0;
  }
  const startedAt = Date.now() + offset;
  await withTimeout(set(ref(db, `classroomMode/${classId}`), {
    active: true, quizId: quiz.id, quizTitle: quiz.title, durationMin,
    startedAt, endsAt: startedAt + durationMin * 60_000, startedBy: teacherId,
  }), 2000).catch(() => {});
}

export async function stopClassroomMode(classId) {
  await withTimeout(set(ref(db, `classroomMode/${classId}`), null), 2000).catch(() => {});
}

export async function getQuiz(classId, quizId) {
  try {
    const snapshot = await withTimeout(get(ref(db, `quizzes/${classId}/${quizId}`)), 2500);
    return snapshot.exists() ? { id: quizId, ...snapshot.val() } : null;
  } catch {
    return null;
  }
}

export async function createQuiz(classId, teacherId, { title, topic, questions, source, publish }) {
  const quizRef = push(ref(db, `quizzes/${classId}`));
  const questionMap = {};
  questions.forEach((question, index) => {
    questionMap[push(ref(db)).key] = {
      order: index + 1,
      text: question.text.trim(),
      options: question.options.map((option) => option.trim()),
      answer: question.answer,
      explanation: question.explanation.trim(),
    };
  });
  await withTimeout(set(quizRef, {
    title: title.trim(), topic, status: publish ? 'published' : 'draft', source,
    questionsCount: questions.length, questions: questionMap,
    createdBy: teacherId, createdAt: serverTimestamp(),
  }), 2500).catch(() => {});
  return quizRef.key;
}

export async function updateQuizStatus(classId, quizId, status) {
  if (!['draft', 'published'].includes(status)) throw new Error('INVALID_QUIZ_STATUS');
  await withTimeout(update(ref(db, `quizzes/${classId}/${quizId}`), { status, updatedAt: serverTimestamp() }), 2000).catch(() => {});
}

export async function deleteQuiz(classId, quizId) {
  let roomQuizId = null;
  try {
    const room = await withTimeout(get(ref(db, `classroomMode/${classId}`)), 1500);
    roomQuizId = room.val()?.quizId;
  } catch {
    roomQuizId = null;
  }
  const changes = {
    [`quizzes/${classId}/${quizId}`]: null,
    [`answers/${classId}/${quizId}`]: null,
  };
  if (roomQuizId === quizId) changes[`classroomMode/${classId}`] = null;
  await withTimeout(update(ref(db), changes), 2000).catch(() => {});
}

export function listenQuizResults(classId, quiz, onData, onError) {
  let emitted = false;
  const timer = setTimeout(() => {
    if (!emitted) {
      emitted = true;
      onData(summarizeQuizResults(quiz, {}));
    }
  }, 1500);
  const stop = onValue(ref(db, `answers/${classId}/${quiz.id}`), (snapshot) => {
    emitted = true;
    clearTimeout(timer);
    onData(summarizeQuizResults(quiz, fromSnapshot(snapshot)));
  }, (err) => { clearTimeout(timer); if (onError) onError(err); });
  return () => { clearTimeout(timer); stop(); };
}
