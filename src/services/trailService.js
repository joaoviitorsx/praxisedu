import { ref, onValue } from 'firebase/database';
import { db } from '../config/firebase';

// trails/grade1 | grade2 | grade3 (content imported by the team). Returns the unsubscribe function.
export function listenTrail(grade, onData, onError) {
  return onValue(ref(db, `trails/grade${grade}`), (snap) => {
    const trail = snap.val();
    if (!trail) return onData(null);
    // units and lessons come as objects: turn them into ordered arrays
    const units = Object.entries(trail.units ?? {})
      .map(([id, u]) => ({
        id, ...u,
        lessons: Object.entries(u.lessons ?? {}).map(([lessonId, l]) => ({ id: lessonId, ...l })).sort((a, b) => a.order - b.order),
      }))
      .sort((a, b) => a.order - b.order);
    onData({ title: trail.title, units });
  }, onError);
}

// progress/{uid}: { lessonId: { stars, ... } }
export function listenProgress(uid, onData, onError) {
  return onValue(ref(db, `progress/${uid}`), (snap) => onData(snap.val() ?? {}), onError);
}
