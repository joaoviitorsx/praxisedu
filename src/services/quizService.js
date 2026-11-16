import { ref, get, onValue, push, set, update, serverTimestamp } from 'firebase/database';
import { db } from '../config/firebase';
import { summarizeQuizResults } from '../features/teacher/quizModel';

const fromSnapshot = (snapshot) => snapshot.exists() ? snapshot.val() : {};

export function listenClassQuizzes(classId, onData, onError) {
  return onValue(ref(db, `quizzes/${classId}`), (snapshot) => {
    const quizzes = Object.entries(fromSnapshot(snapshot)).map(([id, value]) => ({ id, ...value }));
    onData(quizzes.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)));
  }, onError);
}

export function listenClassAnswers(classId, onData, onError) {
  return onValue(ref(db, `answers/${classId}`), (snapshot) => onData(fromSnapshot(snapshot)), onError);
}

export function listenClassroomMode(classId, onData, onError) {
  return onValue(ref(db, `classroomMode/${classId}`), (snapshot) => onData(snapshot.val()), onError);
}

export async function startClassroomMode(classId, teacherId, quiz, durationMin = 15) {
  const offset = (await get(ref(db, '.info/serverTimeOffset'))).val() ?? 0;
  const startedAt = Date.now() + offset;
  await set(ref(db, `classroomMode/${classId}`), {
    active: true, quizId: quiz.id, quizTitle: quiz.title, durationMin,
    startedAt, endsAt: startedAt + durationMin * 60_000, startedBy: teacherId,
  });
}

export async function stopClassroomMode(classId) {
  await set(ref(db, `classroomMode/${classId}`), null);
}

export async function getQuiz(classId, quizId) {
  const snapshot = await get(ref(db, `quizzes/${classId}/${quizId}`));
  return snapshot.exists() ? { id: quizId, ...snapshot.val() } : null;
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
  await set(quizRef, {
    title: title.trim(), topic, status: publish ? 'published' : 'draft', source,
    questionsCount: questions.length, questions: questionMap,
    createdBy: teacherId, createdAt: serverTimestamp(),
  });
  return quizRef.key;
}

export async function updateQuizStatus(classId, quizId, status) {
  if (!['draft', 'published'].includes(status)) throw new Error('INVALID_QUIZ_STATUS');
  await update(ref(db, `quizzes/${classId}/${quizId}`), { status, updatedAt: serverTimestamp() });
}

export async function deleteQuiz(classId, quizId) {
  const room = await get(ref(db, `classroomMode/${classId}`));
  const changes = {
    [`quizzes/${classId}/${quizId}`]: null,
    [`answers/${classId}/${quizId}`]: null,
  };
  if (room.val()?.quizId === quizId) changes[`classroomMode/${classId}`] = null;
  await update(ref(db), changes);
}

export function listenQuizResults(classId, quiz, onData, onError) {
  return onValue(ref(db, `answers/${classId}/${quiz.id}`), (snapshot) => {
    onData(summarizeQuizResults(quiz, fromSnapshot(snapshot)));
  }, onError);
}
