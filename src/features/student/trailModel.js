import { XP_PER_CORRECT, XP_PER_CORRECT_REPLAY } from '../../constants/gamification.js';

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

export function normalizeTrailData(raw) {
  if (!raw) return null;
  return {
    title: raw.title,
    units: Object.entries(raw.units ?? {}).filter(([, unit]) => unit && !unit.hidden).map(([id, unit]) => ({
      ...unit, id,
      lessons: Object.entries(unit.lessons ?? {}).map(([lessonId, lesson]) => ({ ...lesson, id: lessonId })).sort(byOrder),
    })).sort(byOrder),
  };
}

export function normalizeAllTrails(raw) {
  return { units: Object.values(raw ?? {}).flatMap((grade) => normalizeTrailData(grade)?.units ?? []) };
}

export function lessonStates(lessons = [], progress = {}) {
  let nextFound = false;
  return lessons.map((lesson) => {
    const record = progress?.[lesson.id];
    if (record?.completedAt || record?.stars > 0) return { lesson, kind: 'done', stars: record.stars ?? 0 };
    if (!nextFound) { nextFound = true; return { lesson, kind: 'current', stars: 0 }; }
    return { lesson, kind: 'locked', stars: 0 };
  });
}

export function lessonCompletionKind(trail, progress, lessonId) {
  const unit = trail?.units?.find((item) => item.lessons.some((lesson) => lesson.id === lessonId));
  if (!unit) return 'lesson';
  const doneAfterThisLesson = (lesson) => lesson.id === lessonId || !!(progress?.[lesson.id]?.completedAt || progress?.[lesson.id]?.stars > 0);
  if (trail.units.every((item) => item.lessons.every(doneAfterThisLesson))) return 'trail';
  if (unit.lessons.every(doneAfterThisLesson)) return 'topic';
  return 'lesson';
}

export function orderedLessonQuestions(raw) {
  return Object.entries(raw ?? {}).map(([id, question]) => ({ ...question, id }))
    .filter((question) => typeof question.text === 'string' && question.text.trim()
      && Array.isArray(question.options) && question.options.length === 4
      && question.options.every((option) => typeof option === 'string' && option.trim())
      && Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 4)
    .sort(byOrder);
}

export function lessonResult(questions, picks, previous) {
  if (!questions.length || picks.length !== questions.length || picks.some((pick) => !Number.isInteger(pick) || pick < 0 || pick > 3)) {
    throw new Error('Responda todas as questões antes de concluir.');
  }
  const correct = questions.reduce((total, question, index) => total + Number(question.answer === picks[index]), 0);
  const accuracy = correct / questions.length;
  return { correct, total: questions.length, stars: accuracy === 1 ? 3 : accuracy >= 0.7 ? 2 : 1,
    xp: correct * (previous ? XP_PER_CORRECT_REPLAY : XP_PER_CORRECT) };
}

export function nextStreak(stats, today, yesterday) {
  if (stats.lastStudyDate === today) return stats.streak ?? 0;
  return stats.lastStudyDate === yesterday ? (stats.streak ?? 0) + 1 : 1;
}
