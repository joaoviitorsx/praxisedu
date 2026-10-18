import { ref, onValue, get, update, serverTimestamp } from 'firebase/database';
import { db } from '../config/firebase';
import { earnedBadges } from '../features/student/badgeModel';
import { normalizeAllTrails } from '../features/student/trailModel';
import sampleTrails from '../../seed/trails.json';

export function listenBadges(uid, onData, onError) {
  return onValue(ref(db, `userBadges/${uid}`), (snapshot) => onData(snapshot.val() ?? {}), onError);
}

export async function unlockBadges(uid, badgeIds) {
  if (!badgeIds.length) return;
  const snapshot = await get(ref(db, `userBadges/${uid}`));
  const current = snapshot.val() ?? {};
  const updates = {};
  badgeIds.forEach((id) => { if (!current[id]) updates[id] = { unlockedAt: serverTimestamp() }; });
  if (Object.keys(updates).length) await update(ref(db, `userBadges/${uid}`), updates);
}

export async function reconcileLessonBadges(uid, stats) {
  const [progressSnap, trailSnap] = await Promise.all([
    get(ref(db, `progress/${uid}`)), get(ref(db, 'trails')),
  ]);
  const trail = normalizeAllTrails({ ...sampleTrails, ...(trailSnap.val() ?? {}) });
  await unlockBadges(uid, earnedBadges(stats, progressSnap.val() ?? {}, trail));
}

export async function reconcileDuelBadge(uid, classId) {
  if (!classId) return;
  const snapshot = await get(ref(db, `duels/${classId}`));
  const wins = Object.values(snapshot.val() ?? {}).filter((duel) => duel.status === 'finished' && duel.winnerId === uid).length;
  if (wins >= 3) await unlockBadges(uid, ['born_duelist']);
}
