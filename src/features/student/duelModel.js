import { DUEL_POINTS, XP_PER_CORRECT } from '../../constants/gamification.js';

export function duelState(duel, uid) {
  if (duel.status === 'declined') return 'declined';
  if (duel.status === 'finished') return 'result';
  if (duel.players?.[uid]?.playedAt || Number.isInteger(duel.players?.[uid]?.score)) return 'waiting';
  if (duel.status === 'challenger_turn' && duel.challengerId === uid) return 'play';
  if (duel.status === 'opponent_turn' && duel.opponentId === uid) return 'play';
  return 'waiting';
}

export function duelOutcome(duel, uid, score) {
  const otherId = uid === duel.challengerId ? duel.opponentId : duel.challengerId;
  const otherScore = duel.players?.[otherId]?.score;
  if (!Number.isInteger(otherScore)) throw new Error('DUEL_NOT_READY');
  return score > otherScore ? uid : score < otherScore ? otherId : 'draw';
}

export function chooseDuelQuestions(pool, count = 5, random = Math.random) {
  const unique = [...new Map(pool.map((question) => [question.id, question])).values()];
  if (unique.length < count) throw new Error('Este tema ainda não tem cinco questões para um duelo.');
  for (let index = unique.length - 1; index > 0; index--) {
    const pick = Math.min(index, Math.floor(random() * (index + 1)));
    [unique[index], unique[pick]] = [unique[pick], unique[index]];
  }
  return unique.slice(0, count);
}
export function duelReward(duel, uid) {
  if (!duel.players?.[uid] || !Number.isInteger(duel.players[uid].score)) throw new Error('DUEL_NOT_READY');
  if (!['draw', duel.challengerId, duel.opponentId].includes(duel.winnerId)) throw new Error('DUEL_NOT_READY');
  const outcome = duel.winnerId === 'draw' ? 'draw' : duel.winnerId === uid ? 'win' : 'loss';
  return { outcome, bonus: DUEL_POINTS[outcome], xp: duel.players[uid].score * XP_PER_CORRECT };
}
