import { ref, push, set, update, remove, onValue, serverTimestamp } from 'firebase/database';
import { db } from '../config/firebase';

/**
 * Listen to all doubts for a specific class (used by the Teacher).
 */
export function listenClassDoubts(classId, onData, onError) {
  if (!classId) return () => {};
  const doubtsRef = ref(db, `anonymousDoubts/${classId}`);
  return onValue(
    doubtsRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData([]);
        return;
      }
      const raw = snapshot.val();
      const list = Object.keys(raw).map((key) => ({
        id: key,
        ...raw[key],
      }));
      // Sort newest first
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onData(list);
    },
    onError
  );
}

/**
 * Listen only to the doubts sent by a specific student (used by the Student).
 * Ensures students CANNOT see each other's doubts/messages.
 */
export function listenStudentDoubts(classId, studentId, onData, onError) {
  if (!classId || !studentId) return () => {};
  const doubtsRef = ref(db, `anonymousDoubts/${classId}`);
  return onValue(
    doubtsRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData([]);
        return;
      }
      const raw = snapshot.val();
      const list = Object.keys(raw)
        .map((key) => ({
          id: key,
          ...raw[key],
        }))
        .filter((d) => d.studentId === studentId);

      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onData(list);
    },
    onError
  );
}

/**
 * Submit a doubt/message from a student directly to the teacher.
 */
export async function sendAnonymousDoubt(classId, { text, topic = 'geral', studentId }) {
  if (!classId || !text?.trim()) throw new Error('EMPTY_DOUBT');
  const doubtsRef = ref(db, `anonymousDoubts/${classId}`);
  const newDoubtRef = push(doubtsRef);
  await set(newDoubtRef, {
    text: text.trim(),
    topic: topic || 'geral',
    status: 'pending', // 'pending' | 'addressed'
    studentId: studentId || null,
    createdAt: serverTimestamp(),
  });
  return newDoubtRef.key;
}

/**
 * Mark a doubt as addressed / explained in classroom by the teacher.
 */
export async function toggleDoubtStatus(classId, doubtId, currentStatus) {
  if (!classId || !doubtId) return;
  const newStatus = currentStatus === 'addressed' ? 'pending' : 'addressed';
  const doubtRef = ref(db, `anonymousDoubts/${classId}/${doubtId}`);
  await update(doubtRef, {
    status: newStatus,
    addressedAt: newStatus === 'addressed' ? serverTimestamp() : null,
  });
}

/**
 * Delete a doubt from the wall.
 */
export async function deleteDoubt(classId, doubtId) {
  if (!classId || !doubtId) return;
  const doubtRef = ref(db, `anonymousDoubts/${classId}/${doubtId}`);
  await remove(doubtRef);
}
