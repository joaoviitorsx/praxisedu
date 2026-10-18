import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { db } from '../config/firebase';
import { rankingRows } from '../features/student/rankingModel';

export function listenWeeklyRanking(classId, weekId, uid, onData, onError) {
  const ranked = query(ref(db, `weeklyRanking/${classId}/${weekId}`), orderByChild('points'), limitToLast(50));
  return onValue(ranked, (snapshot) => onData(rankingRows(snapshot.val(), uid)), onError);
}
