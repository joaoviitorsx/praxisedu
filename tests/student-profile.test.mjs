import test from 'node:test';
import assert from 'node:assert/strict';
import { getProfileBadges, getProfileProgress } from '../src/features/student/studentProfileModel.js';

test('profile progress ignores unknown badges and keeps counters safe', () => {
  assert.deepEqual(getProfileProgress({ xp: -2, streak: 4, lessonsCompleted: 7, answersTotal: 0 }, { first_lesson: true, obsolete: true }), {
    xp: 0,
    streak: 4,
    lessons: 7,
    accuracy: null,
    earned: 1,
    total: 6,
  });
});

test('profile accuracy is rounded and constrained to 100 percent', () => {
  assert.equal(getProfileProgress({ answersCorrect: 9, answersTotal: 8 }).accuracy, 100);
  assert.equal(getProfileProgress({ answersCorrect: 2, answersTotal: 3 }).accuracy, 67);
});

test('earned badges come before future goals without losing catalog order', () => {
  const badges = getProfileBadges({ born_duelist: true, first_lesson: true });
  assert.deepEqual(badges.slice(0, 2).map(({ id }) => id), ['first_lesson', 'born_duelist']);
  assert.equal(badges.length, 6);
  assert.equal(badges[2].unlocked, false);
});
