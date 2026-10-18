export function teacherProfileSummary(classes) {
  const list = Array.isArray(classes) ? classes : [];
  return list.reduce((summary, item) => ({
    classes: summary.classes + 1,
    students: summary.students + (Number(item?.studentsCount) || 0),
    quizzes: summary.quizzes + (Number(item?.quizzesCount) || 0),
  }), { classes: 0, students: 0, quizzes: 0 });
}
