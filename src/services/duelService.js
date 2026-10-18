import { ref, get, onValue, push, set, update, increment, serverTimestamp } from 'firebase/database';
import { db } from '../config/firebase';
import { TOPICS } from '../constants/topics';
import { getWeekId } from '../utils/dates';
import { orderedLessonQuestions } from '../features/student/trailModel';
import { scoreQuiz } from '../features/student/classroomModel';
import { chooseDuelQuestions, duelOutcome, duelState, duelReward } from '../features/student/duelModel';
import sampleTrails from '../../seed/trails.json';
import sampleQuestions from '../../seed/lessonQuestions.json';
import { unlockBadges } from './badgeService';

export function listenMyDuels(classId, uid, onData, onError) {
  return onValue(ref(db, `duels/${classId}`), (snapshot) => {
    const rows = Object.entries(snapshot.val() ?? {}).map(([id, value]) => ({ id, ...value }))
      .filter((duel) => duel.challengerId === uid || duel.opponentId === uid)
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    onData(rows);
  }, onError);
}

export function listenDuel(classId, duelId, onData, onError) {
  return onValue(ref(db, `duels/${classId}/${duelId}`), (snapshot) => onData(snapshot.val() ? { id: duelId, ...snapshot.val() } : null), onError);
}

export async function getDuelTopicPools() {
  const [trailSnap, questionsSnap] = await Promise.all([get(ref(db, 'trails')), get(ref(db, 'lessonQuestions'))]);
  const trails = { ...sampleTrails, ...(trailSnap.val() ?? {}) };
  const questionBank = { ...sampleQuestions, ...(questionsSnap.val() ?? {}) };
  const pools = {};
  Object.values(trails).forEach((grade) => Object.values(grade.units ?? {}).forEach((unit) => {
    const topic = unit.topic;
    if (!TOPICS[topic]) return;
    const items = pools[topic] ?? [];
    Object.keys(unit.lessons ?? {}).forEach((lessonId) => {
      orderedLessonQuestions(questionBank[lessonId]).forEach((question) => items.push({ ...question, id: `${lessonId}_${question.id}` }));
    });
    pools[topic] = items;
  }));
  return Object.entries(pools).filter(([, questions]) => questions.length >= 5)
    .map(([id, questions]) => ({ id, label: TOPICS[id].label, questions }));
}

export async function createDuel({ classId, uid, name, opponentId, topic, pool }) {
  if (!classId || !uid || !opponentId || uid === opponentId) throw new Error('DUEL_INVALID_OPPONENT');
  const memberSnap = await get(ref(db, `classMembers/${classId}/${opponentId}`));
  if (!memberSnap.exists()) throw new Error('DUEL_INVALID_OPPONENT');
  const questions = chooseDuelQuestions(pool, 5);
  const questionMap = {};
  questions.forEach((question, index) => { questionMap[`q${index + 1}`] = { order: index + 1, text: question.text, options: question.options, answer: question.answer, explanation: question.explanation ?? '' }; });
  const duelRef = push(ref(db, `duels/${classId}`));
  await set(duelRef, {
    challengerId: uid, opponentId, topic, status: 'challenger_turn', questions: questionMap,
    players: { [uid]: { name }, [opponentId]: { name: memberSnap.val().name } },
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return duelRef.key;
}

export async function finishDuelTurn(classId, duelId, uid, picks) {
  const duelSnap = await get(ref(db, `duels/${classId}/${duelId}`));
  if (!duelSnap.exists()) throw new Error('DUEL_NOT_FOUND');
  const duel = { id: duelId, ...duelSnap.val() };
  if (duelState(duel, uid) !== 'play') throw new Error('DUEL_NOT_YOUR_TURN');
  const result = scoreQuiz(orderedLessonQuestions(duel.questions), picks);
  const path = `duels/${classId}/${duelId}`;
  const updates = {
    [`${path}/players/${uid}/score`]: result.correctCount,
    [`${path}/players/${uid}/picks`]: picks,
    [`${path}/players/${uid}/playedAt`]: serverTimestamp(),
    [`${path}/updatedAt`]: serverTimestamp(),
  };
  if (uid === duel.challengerId) updates[`${path}/status`] = 'opponent_turn';
  else { updates[`${path}/status`] = 'finished'; updates[`${path}/winnerId`] = duelOutcome(duel, uid, result.correctCount); }
  await update(ref(db), updates);
  return result;
}

export async function declineDuel(classId, duelId, uid) {
  const snap = await get(ref(db, `duels/${classId}/${duelId}`));
  const duel = snap.val();
  if (!duel || duel.opponentId !== uid || duel.status !== 'opponent_turn' || duel.players?.[uid]?.playedAt) throw new Error('DUEL_NOT_YOUR_TURN');
  await update(ref(db, `duels/${classId}/${duelId}`), { status: 'declined', updatedAt: serverTimestamp() });
}

export async function claimDuelReward({ classId, duelId, uid, name }) {
  const snap = await get(ref(db, `duels/${classId}/${duelId}`));
  const duel = snap.val();
  if (!duel || duel.status !== 'finished' || !duel.players?.[uid] || duel.players[uid].rewardClaimed) return null;
  const { outcome, bonus, xp } = duelReward(duel, uid);
  const correct = duel.players[uid].score ?? 0;
  const total = Object.keys(duel.questions ?? {}).length;
  const weekId = getWeekId();
  await update(ref(db), {
    [`duels/${classId}/${duelId}/players/${uid}/rewardClaimed`]: true,
    [`weeklyRanking/${classId}/${weekId}/${uid}/name`]: name,
    [`weeklyRanking/${classId}/${weekId}/${uid}/points`]: increment(bonus + xp),
    [`weeklyRanking/${classId}/${weekId}/${uid}/duelsWon`]: increment(outcome === 'win' ? 1 : 0),
    [`users/${uid}/stats/xp`]: increment(xp),
    [`users/${uid}/stats/answersTotal`]: increment(total),
    [`users/${uid}/stats/answersCorrect`]: increment(correct),
    [`classMembers/${classId}/${uid}/xp`]: increment(xp),
    [`classMembers/${classId}/${uid}/answersTotal`]: increment(total),
    [`classMembers/${classId}/${uid}/answersCorrect`]: increment(correct),
    [`classMembers/${classId}/${uid}/lastActiveAt`]: serverTimestamp(),
  });
  if (outcome === 'win') {
    try {
      const all = (await get(ref(db, `duels/${classId}`))).val() ?? {};
      if (Object.values(all).filter((item) => item.status === 'finished' && item.winnerId === uid).length >= 3) await unlockBadges(uid, ['born_duelist']);
    } catch (_) { /* Points were saved; badge can be reconciled later. */ }
  }
  return { bonus, xp, outcome };
}
