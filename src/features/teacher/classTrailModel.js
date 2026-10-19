import { cleanMaterials, normalizeMaterials, validateMaterial } from '../trailMaterials.js';

const cleanQuestion = (question) => ({
  text: String(question?.text ?? '').trim(),
  options: (question?.options ?? []).map((option) => String(option ?? '').trim()),
  answer: question.answer,
  explanation: String(question?.explanation ?? '').trim(),
});

export function normalizeDraftLessons(rawLessons) {
  const lessons = Array.isArray(rawLessons) ? rawLessons : Object.values(rawLessons ?? {});
  return lessons.map((lesson) => ({
    ...lesson,
    questions: Array.isArray(lesson.questions) ? lesson.questions : Object.values(lesson.questions ?? {}),
    materials: normalizeMaterials(lesson.materials),
  }));
}

export function validateTrailLesson(lesson, index) {
    if (!lesson.title?.trim()) return `Dê um nome à etapa ${index + 1}.`;
    const materials = normalizeMaterials(lesson.materials);
    const questions = lesson.questions ?? [];
    if (!materials.length && !questions.length) return `Adicione conteúdo ou uma questão à etapa ${index + 1}.`;
    for (let m = 0; m < materials.length; m += 1) {
      const issue = validateMaterial(materials[m]);
      if (issue) return `Material ${m + 1} da etapa ${index + 1}: ${issue}`;
    }
    for (let q = 0; q < questions.length; q += 1) {
      const item = questions[q];
      const place = `questão ${q + 1} da etapa ${index + 1}`;
      if (!item.text?.trim()) return `Preencha o enunciado da ${place}.`;
      if (!Array.isArray(item.options) || item.options.length !== 4 || item.options.some((option) => !option?.trim())) return `Preencha as quatro alternativas da ${place}.`;
      if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer > 3) return `Marque o gabarito da ${place}.`;
      if (!item.explanation?.trim()) return `Explique a resposta da ${place}.`;
    }
    return null;
}

export function validateTrailUnit(unit) {
  if (!unit.title?.trim() || unit.title.trim().length < 2) return 'Dê um título ao tópico.';
  if (!unit.topic?.trim() || unit.topic.trim().length < 2) return 'Informe o tema do tópico.';
  if (!unit.lessons?.length) return 'Adicione pelo menos uma etapa.';
  for (let index = 0; index < unit.lessons.length; index += 1) {
    const issue = validateTrailLesson(unit.lessons[index], index);
    if (issue) return issue;
  }
  return null;
}

export function applyPublishedUnit(base, unitId, unit) {
  return { ...base, units: { ...(base?.units ?? {}), [unitId]: unit } };
}

// Keep a class-specific marker so a removed grade template topic cannot reappear.
export function removePublishedUnit(base, unitId) {
  return { ...base, units: { ...(base?.units ?? {}), [unitId]: { hidden: true } } };
}

export function selectClassTrail(custom, fallback, grade) {
  return custom?.grade === Number(grade) ? custom : fallback;
}

export function preparePublishedUnit(draft, previous, oldQuestions, allocateId) {
  const lessons = {};
  const questions = {};
  draft.lessons.forEach((lesson, index) => {
    const normalized = (lesson.questions ?? []).map(cleanQuestion);
    const materials = cleanMaterials(lesson.materials);
    const before = (oldQuestions[lesson.id] ?? []).map(cleanQuestion);
    const oldLesson = previous?.lessons?.[lesson.id];
    const unchanged = oldLesson && JSON.stringify(normalized) === JSON.stringify(before)
      && JSON.stringify(materials) === JSON.stringify(cleanMaterials(oldLesson.materials));
    const lessonId = unchanged ? lesson.id : allocateId();
    lessons[lessonId] = { title: lesson.title.trim(), order: index + 1, questionsCount: normalized.length, ...(materials.length ? { materials } : {}) };
    if (normalized.length) questions[lessonId] = Object.fromEntries(normalized.map((item, q) => [`q${q + 1}`, { ...item, order: q + 1 }]));
  });
  return {
    unit: { title: draft.title.trim(), topic: draft.topic.trim(), mascot: draft.mascot || 'sapo', order: draft.order, lessons },
    questions,
  };
}
