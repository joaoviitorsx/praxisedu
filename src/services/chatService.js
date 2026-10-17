import {
  ref, push, onValue, query, orderByChild, limitToLast, runTransaction, serverTimestamp,
} from 'firebase/database';
import { db } from '../config/firebase';
import { toDateKey } from '../utils/dates';

// Daily limit per user. field: 'chatCount' (student) or 'generateCount' (teacher).
// Throws AI_DAILY_LIMIT when the limit is reached.
export async function consumeAiQuota(uid, field, limit) {
  const quotaRef = ref(db, `aiUsage/${uid}/${toDateKey(new Date())}/${field}`);
  const { committed } = await runTransaction(quotaRef, (n) => ((n || 0) >= limit ? undefined : (n || 0) + 1));
  if (!committed) throw new Error('AI_DAILY_LIMIT');
}

// role is 'user' or 'model' (same values Gemini uses)
export const saveChatMessage = (uid, role, text) =>
  push(ref(db, `botChats/${uid}`), { role, text, createdAt: serverTimestamp() });

// Last 50 messages, oldest first. Returns the unsubscribe function.
export function listenChat(uid, onData, onError) {
  const chatQuery = query(ref(db, `botChats/${uid}`), orderByChild('createdAt'), limitToLast(50));
  return onValue(chatQuery, (snap) => {
    const list = [];
    snap.forEach((child) => { list.push({ id: child.key, ...child.val() }); });
    onData(list);
  }, onError);
}
