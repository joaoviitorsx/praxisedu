export function resolveActivityClassId(classes, requestedId, selectedId) {
  if (!Array.isArray(classes) || !classes.length) return '';
  if (classes.some((item) => item.id === selectedId)) return selectedId;
  if (classes.some((item) => item.id === requestedId)) return requestedId;
  return classes.length === 1 ? classes[0].id : '';
}

export function activityDestination(kind, classId) {
  if (!classId) return null;
  if (kind === 'trail') return { pathname: '/teacher/class/[classId]/trail/[unitId]', params: { classId, unitId: 'new' } };
  if (kind === 'trail-list') return { pathname: '/teacher/class/[classId]', params: { classId, tab: 'trails' } };
  if (kind === 'quiz') return { pathname: '/teacher/class/[classId]/quiz/new', params: { classId } };
  return null;
}
