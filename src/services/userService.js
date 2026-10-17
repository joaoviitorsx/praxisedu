import { ref, set, update, onValue, serverTimestamp } from 'firebase/database';
import { db } from '../config/firebase';

// Creates users/{uid} right after sign up (MODELAGEM_BANCO.md, section 6.1)
export async function createUserProfile(uid, { name, email, role, school }) {
  const base = { name, email, role, createdAt: serverTimestamp() };
  if (school) base.school = school;
  const studentStats = {
    xp: 0, streak: 0, bestStreak: 0, lastStudyDate: null,
    lessonsCompleted: 0, answersTotal: 0, answersCorrect: 0,
    lives: 5, livesUpdatedAt: serverTimestamp(),
  };
  await set(ref(db, `users/${uid}`), role === 'student' ? { ...base, stats: studentStats } : base);
}

// Listens to users/{uid}. Returns the unsubscribe function.
export function listenProfile(uid, onData, onError) {
  return onValue(ref(db, `users/${uid}`), (snap) => onData(snap.val()), onError);
}

// Used when the student's class was deleted (section 6.3)
export const clearClassId = (uid) => update(ref(db, `users/${uid}`), { classId: null });
