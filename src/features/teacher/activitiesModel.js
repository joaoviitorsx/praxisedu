export function activitiesViewState(quizzes, error) {
  if (quizzes === null) return error ? 'error' : 'loading';
  return quizzes.length === 0 ? 'empty' : 'ready';
}
