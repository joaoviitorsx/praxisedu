const cleanQuestion = (question) => ({
  text: String(question?.text ?? '').trim(),
  options: (question?.options ?? []).map((option) => String(option ?? '').trim()),
  answer: question.answer,
  explanation: String(question?.explanation ?? '').trim(),
});

export function validateTrailUnit(unit) {
  if (!unit.title?.trim() || unit.title.trim().length < 2) return 'Dê um título ao tópico.';
  if (!unit.topic?.trim() || unit.topic.trim().length < 2) return 'Informe o tema do tópico.';
  if (!unit.lessons?.length) return 'Adicione pelo menos uma etapa.';
  for (let index = 0; index < unit.lessons.length; index += 1) {
    const lesson = unit.lessons[index];
    if (!lesson.title?.trim()) return `Dê um nome à etapa ${index + 1}.`;
    if (!lesson.questions?.length) return `Adicione uma questão à etapa ${index + 1}.`;
    for (let q = 0; q < lesson.questions.length; q += 1) {
      const item = lesson.questions[q];
      const place = `questão ${q + 1} da etapa ${index + 1}`;
      if (!item.text?.trim()) return `Preencha o enunciado da ${place}.`;
      if (!Array.isArray(item.options) || item.options.length !== 4 || item.options.some((option) => !option?.trim())) return `Preencha as quatro alternativas da ${place}.`;
      if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer > 3) return `Marque o gabarito da ${place}.`;
      if (!item.explanation?.trim()) return `Explique a resposta da ${place}.`;
    }
  }
  return null;
}

export function applyPublishedUnit(base, unitId, unit) {
  return { ...base, units: { ...(base?.units ?? {}), [unitId]: unit } };
}

export function selectClassTrail(custom, fallback, grade) {
  return custom?.grade === Number(grade) ? custom : fallback;
}

export function preparePublishedUnit(draft, previous, oldQuestions, allocateId) {
  const lessons = {};
  const questions = {};
  draft.lessons.forEach((lesson, index) => {
    const normalized = lesson.questions.map(cleanQuestion);
    const before = (oldQuestions[lesson.id] ?? []).map(cleanQuestion);
    const sameQuestions = previous?.lessons?.[lesson.id] && JSON.stringify(normalized) === JSON.stringify(before);
    const lessonId = sameQuestions ? lesson.id : allocateId();
    lessons[lessonId] = { title: lesson.title.trim(), order: index + 1, questionsCount: normalized.length };
    questions[lessonId] = Object.fromEntries(normalized.map((item, q) => [`q${q + 1}`, { ...item, order: q + 1 }]));
  });
  return {
    unit: { title: draft.title.trim(), topic: draft.topic.trim(), mascot: draft.mascot || 'sapo', order: draft.order, lessons },
    questions,
  };
}
