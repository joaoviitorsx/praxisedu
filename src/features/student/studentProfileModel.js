import { BADGES } from '../../constants/badges.js';

const safeCount = (value) => Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

export function getProfileBadges(badges = {}) {
  return BADGES.map((badge) => ({ ...badge, unlocked: !!badges?.[badge.id] }))
    .sort((a, b) => Number(b.unlocked) - Number(a.unlocked));
}

export function getProfileProgress(stats = {}, badges = {}) {
  const answersTotal = safeCount(stats?.answersTotal);
  const answersCorrect = safeCount(stats?.answersCorrect);
  return {
    xp: safeCount(stats?.xp),
    streak: safeCount(stats?.streak),
    lessons: safeCount(stats?.lessonsCompleted),
    accuracy: answersTotal ? Math.min(100, Math.round(answersCorrect / answersTotal * 100)) : null,
    earned: BADGES.filter((badge) => !!badges?.[badge.id]).length,
    total: BADGES.length,
  };
}
