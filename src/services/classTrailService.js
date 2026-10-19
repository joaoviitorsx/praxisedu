import { get, onValue, push, ref, serverTimestamp, set, update } from 'firebase/database';
import { deleteObject, ref as storageRef } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import sampleTrails from '../../seed/trails.json';
import { normalizeTrailData } from '../features/student/trailModel';
import { applyPublishedUnit, normalizeDraftLessons, preparePublishedUnit, removePublishedUnit, selectClassTrail, validateTrailUnit } from '../features/teacher/classTrailModel';
import { normalizeMaterials } from '../features/trailMaterials';
import { getLessonQuestions } from './trailService';

const fromSnapshot = (snapshot) => snapshot.exists() ? snapshot.val() : null;
const lessonArray = (raw) => Object.entries(raw ?? {}).map(([id, lesson]) => ({ id, ...lesson })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export function listenClassTrail(classId, grade, onData, onError) {
  let classTrail;
  let gradeTrail;
  const emit = () => {
    if (classTrail === undefined || gradeTrail === undefined) return;
    onData(normalizeTrailData(selectClassTrail(classTrail, gradeTrail ?? sampleTrails[`grade${grade}`], grade)));
  };
  const stopClass = onValue(ref(db, `classTrails/${classId}`), (snapshot) => { classTrail = fromSnapshot(snapshot); emit(); }, onError);
  const stopGrade = onValue(ref(db, `trails/grade${grade}`), (snapshot) => { gradeTrail = fromSnapshot(snapshot); emit(); }, onError);
  return () => { stopClass(); stopGrade(); };
}

export function listenTrailDrafts(classId, onData, onError) {
  return onValue(ref(db, `classTrailDrafts/${classId}`), (snapshot) => onData(fromSnapshot(snapshot) ?? {}), onError);
}

export function allocateTrailId() {
  return push(ref(db, 'classTrails')).key;
}

export async function loadTrailEditor(classId, unitId) {
  const classSnapshot = await get(ref(db, `classes/${classId}`));
  if (!classSnapshot.exists()) throw new Error('CLASS_NOT_FOUND');
  const grade = classSnapshot.val().grade;
  const [draftSnapshot, publishedSnapshot, gradeSnapshot] = await Promise.all([
    get(ref(db, `classTrailDrafts/${classId}/${unitId}`)),
    get(ref(db, `classTrails/${classId}`)),
    get(ref(db, `trails/grade${grade}`)),
  ]);
  const base = selectClassTrail(fromSnapshot(publishedSnapshot), fromSnapshot(gradeSnapshot) ?? sampleTrails[`grade${grade}`], grade);
  const source = base?.units?.[unitId]?.hidden ? null : base?.units?.[unitId];
  const rawDraft = fromSnapshot(draftSnapshot);
  const savedDraft = rawDraft?.grade === grade ? rawDraft : null;
  if (savedDraft) {
    return { grade, unit: { ...savedDraft, lessons: normalizeDraftLessons(savedDraft.lessons) }, isDraft: true };
  }
  if (!source) return { grade, unit: { grade, title: '', topic: '', mascot: 'sapo', order: Object.keys(base?.units ?? {}).length + 1, lessons: [] }, isDraft: false };
  const lessons = await Promise.all(lessonArray(source.lessons).map(async (lesson) => ({
    ...lesson, materials: normalizeMaterials(lesson.materials), questions: await getLessonQuestions(lesson.id, classId),
  })));
  return { grade, unit: { ...source, grade, lessons }, isDraft: false };
}

export async function saveTrailDraft(classId, unitId, draft) {
  await set(ref(db, `classTrailDrafts/${classId}/${unitId}`), { ...draft, updatedAt: serverTimestamp() });
}

export async function publishTrailUnit(classId, unitId, draft) {
  const issue = validateTrailUnit(draft);
  if (issue) throw new Error(issue);
  const classSnapshot = await get(ref(db, `classes/${classId}`));
  if (!classSnapshot.exists()) throw new Error('CLASS_NOT_FOUND');
  const grade = classSnapshot.val().grade;
  if (draft.grade !== grade) throw new Error('TRAIL_GRADE_CHANGED');
  const [publishedSnapshot, gradeSnapshot] = await Promise.all([
    get(ref(db, `classTrails/${classId}`)), get(ref(db, `trails/grade${grade}`)),
  ]);
  const base = selectClassTrail(fromSnapshot(publishedSnapshot), fromSnapshot(gradeSnapshot) ?? sampleTrails[`grade${grade}`], grade);
  const previous = base?.units?.[unitId];
  const oldQuestions = Object.fromEntries(await Promise.all(draft.lessons.map(async (lesson) => [lesson.id, await getLessonQuestions(lesson.id, classId)])));
  const { unit, questions } = preparePublishedUnit(draft, previous, oldQuestions, allocateTrailId);
  const changes = {
    [`classTrails/${classId}`]: { ...applyPublishedUnit(base, unitId, unit), grade },
    [`classTrailDrafts/${classId}/${unitId}`]: null,
  };
  Object.entries(questions).forEach(([lessonId, questionMap]) => { changes[`classTrailQuestions/${classId}/${lessonId}`] = questionMap; });
  await update(ref(db), changes);
}

export async function deleteTrailUnit(classId, unitId) {
  const classSnapshot = await get(ref(db, `classes/${classId}`));
  if (!classSnapshot.exists()) throw new Error('CLASS_NOT_FOUND');
  const grade = classSnapshot.val().grade;
  const [draftSnapshot, publishedSnapshot, gradeSnapshot] = await Promise.all([
    get(ref(db, `classTrailDrafts/${classId}/${unitId}`)),
    get(ref(db, `classTrails/${classId}`)),
    get(ref(db, `trails/grade${grade}`)),
  ]);
  const base = selectClassTrail(fromSnapshot(publishedSnapshot), fromSnapshot(gradeSnapshot) ?? sampleTrails[`grade${grade}`], grade);
  const published = base?.units?.[unitId];
  const draft = fromSnapshot(draftSnapshot);
  if ((!published || published.hidden) && !draft) throw new Error('TRAIL_NOT_FOUND');

  const filePrefix = `trailMaterials/${classSnapshot.val().teacherId}/${classId}/${unitId}/`;
  const linkedFiles = new Set([published, draft].flatMap((unit) => Object.values(unit?.lessons ?? {})
    .flatMap((lesson) => normalizeMaterials(lesson.materials).map((material) => material.storagePath))
    .filter((path) => typeof path === 'string' && path.startsWith(filePrefix))));

  const changes = { [`classTrailDrafts/${classId}/${unitId}`]: null };
  if (published && !published.hidden) {
    changes[`classTrails/${classId}`] = { ...removePublishedUnit(base, unitId), grade };
    Object.keys(published.lessons ?? {}).forEach((lessonId) => {
      changes[`classTrailQuestions/${classId}/${lessonId}`] = null;
    });
  }
  await update(ref(db), changes);
  const files = await Promise.allSettled([...linkedFiles].map((path) => deleteObject(storageRef(storage, path))));
  return { filesPendingCleanup: files.filter((result) => result.status === 'rejected' && result.reason?.code !== 'storage/object-not-found').length };
}
