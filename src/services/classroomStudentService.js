import { ref, onValue, get, set, serverTimestamp } from 'firebase/database';
import { db } from '../config/firebase';
import { roomIsOpen, orderedQuizQuestions, scoreQuiz } from '../features/student/classroomModel';
import { unlockBadges } from './badgeService';

export function listenStudentRoom(classId, onData, onError) {
  let emitted = false;
  const timer = setTimeout(() => {
    if (!emitted) {
      emitted = true;
      onData(null);
    }
  }, 1500);
  const stop = onValue(
    ref(db, `classroomMode/${classId}`),
    (snapshot) => {
      emitted = true;
      clearTimeout(timer);
      onData(snapshot.val());
    },
    (err) => {
      clearTimeout(timer);
      if (onError) onError(err);
    }
  );
  return () => {
    clearTimeout(timer);
    stop();
  };
}

export function listenOwnClassroomAnswer(classId, quizId, uid, onData, onError) {
  let emitted = false;
  const timer = setTimeout(() => {
    if (!emitted) {
      emitted = true;
      onData(null);
    }
  }, 1500);
  const stop = onValue(
    ref(db, `answers/${classId}/${quizId}/${uid}`),
    (snapshot) => {
      emitted = true;
      clearTimeout(timer);
      const answer = snapshot.val();
      onData(answer);
      if (answer?.total > 0 && answer.correctCount === answer.total) unlockBadges(uid, ['classroom_hero']).catch(() => {});
    },
    (err) => {
      clearTimeout(timer);
      if (onError) onError(err);
    }
  );
  return () => {
    clearTimeout(timer);
    stop();
  };
}

export function listenServerOffset(onData, onError) {
  let emitted = false;
  const timer = setTimeout(() => {
    if (!emitted) {
      emitted = true;
      onData(0);
    }
  }, 1000);
  const stop = onValue(
    ref(db, '.info/serverTimeOffset'),
    (snapshot) => {
      emitted = true;
      clearTimeout(timer);
      onData(snapshot.val() ?? 0);
    },
    (err) => {
      clearTimeout(timer);
      if (onError) onError(err);
    }
  );
  return () => {
    clearTimeout(timer);
    stop();
  };
}

export async function getPublishedClassroomQuiz(classId, quizId) {
  const snapshot = await get(ref(db, `quizzes/${classId}/${quizId}`));
  const quiz = snapshot.val();
  if (!quiz || quiz.status !== 'published') return null;
  return { id: quizId, title: quiz.title, topic: quiz.topic, questions: orderedQuizQuestions(quiz.questions) };
}

export async function submitClassroomAnswers({ classId, quizId, uid, name, picks, startedAt }) {
  const [roomSnap, offsetSnap, answerSnap, quiz] = await Promise.all([
    get(ref(db, `classroomMode/${classId}`)), get(ref(db, '.info/serverTimeOffset')),
    get(ref(db, `answers/${classId}/${quizId}/${uid}`)), getPublishedClassroomQuiz(classId, quizId),
  ]);
  if (answerSnap.exists()) throw new Error('QUIZ_ALREADY_ANSWERED');
  const now = Date.now() + (offsetSnap.val() ?? 0);
  if (!quiz || roomSnap.val()?.quizId !== quizId || !roomIsOpen(roomSnap.val(), now)) throw new Error('CLASSROOM_EXPIRED');
  const result = scoreQuiz(quiz.questions, picks);
  await set(ref(db, `answers/${classId}/${quizId}/${uid}`), {
    studentName: name, picks, ...result, mode: 'classroom', startedAt: startedAt ?? now, finishedAt: serverTimestamp(),
  });
  if (result.correctCount === result.total) unlockBadges(uid, ['classroom_hero']).catch(() => {});
  return result;
}
