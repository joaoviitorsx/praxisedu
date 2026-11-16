import { ref, push, set, update, remove, onValue } from 'firebase/database';
import { db } from '../config/firebase';
import { NOTE_TOPICS, validateNote } from '../features/student/notesModel';

export { NOTE_TOPICS };

/**
 * Listen in realtime to all private notes of a student.
 */
export function listenUserNotes(userId, onData, onError) {
  if (!userId) return () => {};
  const notesRef = ref(db, `userNotes/${userId}`);
  return onValue(
    notesRef,
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
      list.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
      onData(list);
    },
    onError
  );
}

/**
 * Create a new personal note.
 */
export async function createNote(userId, { title, content, topic = 'geral', color = '#10B981' }) {
  if (!userId) throw new Error('MISSING_USER_ID');
  const check = validateNote({ title, content });
  if (!check.valid) throw new Error(check.error);

  const notesRef = ref(db, `userNotes/${userId}`);
  const newNoteRef = push(notesRef);
  const now = Date.now();

  await set(newNoteRef, {
    title: check.title,
    content: check.content,
    topic: topic || 'geral',
    color: color || '#10B981',
    createdAt: now,
    updatedAt: now,
  });

  return newNoteRef.key;
}

/**
 * Update an existing personal note.
 */
export async function updateNote(userId, noteId, updates) {
  if (!userId || !noteId) throw new Error('MISSING_NOTE_REFERENCE');

  const noteRef = ref(db, `userNotes/${userId}/${noteId}`);
  const payload = {
    ...updates,
    updatedAt: Date.now(),
  };
  if (payload.title !== undefined) payload.title = payload.title.trim();
  if (payload.content !== undefined) payload.content = payload.content.trim();

  await update(noteRef, payload);
}

/**
 * Delete a personal note.
 */
export async function deleteNote(userId, noteId) {
  if (!userId || !noteId) throw new Error('MISSING_NOTE_REFERENCE');
  const noteRef = ref(db, `userNotes/${userId}/${noteId}`);
  await remove(noteRef);
}
