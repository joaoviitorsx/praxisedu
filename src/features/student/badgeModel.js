export function earnedBadges(stats = {}, progress = {}, trail = null) {
  const ids = [];
  if ((stats.lessonsCompleted ?? 0) > 0) ids.push('first_lesson');
  const units = trail?.units ?? [];
  const cytology = units.filter((unit) => unit.topic === 'cytology').flatMap((unit) => unit.lessons ?? []);
  if (cytology.length && cytology.every((lesson) => progress?.[lesson.id]?.stars === 3)) ids.push('cytology_master');
  const genetics = units.filter((unit) => unit.topic === 'genetics').flatMap((unit) => unit.lessons ?? []);
  if (genetics.length && genetics.every((lesson) => progress?.[lesson.id]?.completedAt || progress?.[lesson.id]?.stars > 0)) ids.push('dna_guardian');
  if ((stats.streak ?? 0) >= 7) ids.push('streak_7');
  return ids;
}
