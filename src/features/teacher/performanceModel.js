export function performanceSections(data) {
  return { quizMetrics: data.responses > 0, lessonSupport: data.strugglingStudents.length > 0 };
}
