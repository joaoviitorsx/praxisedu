import { ref, onValue, get, update, increment, serverTimestamp } from 'firebase/database';
import { db } from '../config/firebase';
import { normalizeTrailData, normalizeAllTrails, orderedLessonQuestions, nextStreak } from '../features/student/trailModel';
import { currentLives } from '../utils/lives';
import { toDateKey, getWeekId } from '../utils/dates';
import { XP_PER_CORRECT, XP_PER_CORRECT_REPLAY } from '../constants/gamification';
import sampleTrails from '../../seed/trails.json';
import sampleQuestions from '../../seed/lessonQuestions.json';
import { earnedBadges } from '../features/student/badgeModel';

// trails/grade1 | grade2 | grade3 (content imported by the team). Returns the unsubscribe function.
export function listenTrail(grade, onData, onError) {
  return onValue(ref(db, `trails/grade${grade}`), (snap) => {
    onData(normalizeTrailData(snap.val() ?? sampleTrails[`grade${grade}`]));
  }, onError);
}

// progress/{uid}: { lessonId: { stars, ... } }
export function listenProgress(uid, onData, onError) {
  return onValue(ref(db, `progress/${uid}`), (snap) => onData(snap.val() ?? {}), onError);
}

export async function getLessonQuestions(lessonId, classId) {
  if (classId) {
    const own = await get(ref(db, `classTrailQuestions/${classId}/${lessonId}`));
    if (own.exists()) return orderedLessonQuestions(own.val());
  }
  const snap = await get(ref(db, `lessonQuestions/${lessonId}`));
  return orderedLessonQuestions(snap.val() ?? sampleQuestions[lessonId]);
}

export async function loseLife(uid) {
  const snap = await get(ref(db, `users/${uid}/stats`));
  const lives = currentLives(snap.val() ?? {});
  if (lives <= 0) return 0;
  await update(ref(db, `users/${uid}/stats`), { lives: lives - 1, livesUpdatedAt: serverTimestamp() });
  return lives - 1;
}

export async function completeLesson({ uid, lessonId, name, classId, result }) {
  const [progressSnap, statsSnap, badgesSnap, trailSnap, classTrailSnap, classSnap] = await Promise.all([
    get(ref(db, `progress/${uid}`)), get(ref(db, `users/${uid}/stats`)),
    get(ref(db, `userBadges/${uid}`)), get(ref(db, 'trails')),
    classId ? get(ref(db, `classTrails/${classId}`)) : null,
    classId ? get(ref(db, `classes/${classId}`)) : null,
  ]);
  const allProgress = progressSnap.val() ?? {};
  const previous = allProgress[lessonId];
  const stats = statsSnap.val() ?? {};
  const now = new Date();
  const today = toDateKey(now);
  const yesterday = toDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const streak = nextStreak(stats, today, yesterday);
  const xp = result.correct * (previous ? XP_PER_CORRECT_REPLAY : XP_PER_CORRECT);
  const updates = {
    [`progress/${uid}/${lessonId}`]: {
      stars: Math.max(result.stars, previous?.stars ?? 0),
      bestCorrect: Math.max(result.correct, previous?.bestCorrect ?? 0),
      attempts: (previous?.attempts ?? 0) + 1,
      xpEarned: (previous?.xpEarned ?? 0) + xp,
      completedAt: previous?.completedAt ?? serverTimestamp(),
      lastPlayedAt: serverTimestamp(),
    },
    [`users/${uid}/stats/xp`]: increment(xp),
    [`users/${uid}/stats/answersTotal`]: increment(result.total),
    [`users/${uid}/stats/answersCorrect`]: increment(result.correct),
    [`users/${uid}/stats/lessonsCompleted`]: increment(previous ? 0 : 1),
    [`users/${uid}/stats/streak`]: streak,
    [`users/${uid}/stats/bestStreak`]: Math.max(streak, stats.bestStreak ?? 0),
    [`users/${uid}/stats/lastStudyDate`]: today,
  };
  const nextProgress = { ...allProgress, [lessonId]: { stars: Math.max(result.stars, previous?.stars ?? 0) } };
  const nextStats = { ...stats, lessonsCompleted: (stats.lessonsCompleted ?? 0) + (previous ? 0 : 1), streak };
  const unlocked = badgesSnap.val() ?? {};
  const grade = classSnap?.val()?.grade;
  const ownTrail = grade && classTrailSnap?.val()?.grade === grade ? classTrailSnap.val()
    : grade ? (trailSnap.val()?.[`grade${grade}`] ?? sampleTrails[`grade${grade}`]) : null;
  const badgeTrail = ownTrail ? normalizeTrailData(ownTrail) : normalizeAllTrails({ ...sampleTrails, ...(trailSnap.val() ?? {}) });
  earnedBadges(nextStats, nextProgress, badgeTrail).forEach((id) => {
    if (!unlocked[id]) updates[`userBadges/${uid}/${id}`] = { unlockedAt: serverTimestamp() };
  });
  if (classId) Object.assign(updates, {
    [`classMembers/${classId}/${uid}/xp`]: increment(xp),
    [`classMembers/${classId}/${uid}/answersTotal`]: increment(result.total),
    [`classMembers/${classId}/${uid}/answersCorrect`]: increment(result.correct),
    [`classMembers/${classId}/${uid}/lessonsCompleted`]: increment(previous ? 0 : 1),
    [`classMembers/${classId}/${uid}/streak`]: streak,
    [`classMembers/${classId}/${uid}/lastActiveAt`]: serverTimestamp(),
    [`weeklyRanking/${classId}/${getWeekId(now)}/${uid}/name`]: name,
    [`weeklyRanking/${classId}/${getWeekId(now)}/${uid}/points`]: increment(xp),
  });
  await update(ref(db), updates);
  return { ...result, xp, streak };
}
