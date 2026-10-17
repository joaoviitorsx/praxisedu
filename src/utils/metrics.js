// Percentages are never saved in the database: they are calculated here.
export const accuracy = (correct, total) => (total ? Math.round((correct / total) * 100) : 0);

// "Needs support" tag: at least 10 answers and less than 60% correct
export const needsSupport = (m) => m.answersTotal >= 10 && accuracy(m.answersCorrect, m.answersTotal) < 60;

// Class card (screen 06): % of correct answers in the quizzes
export function classAccuracy(answersByQuiz = {}) {
  let c = 0, t = 0;
  Object.values(answersByQuiz).forEach((byStudent) =>
    Object.values(byStudent).forEach((a) => { c += a.correctCount; t += a.total; }));
  return accuracy(c, t);
}

// Performance by topic (screen 19)
export function accuracyByTopic(quizzes = {}, answersByQuiz = {}) {
  const acc = {};
  Object.entries(answersByQuiz).forEach(([quizId, byStudent]) => {
    const topic = quizzes[quizId]?.topic;
    if (!topic) return;
    acc[topic] ??= { correct: 0, total: 0 };
    Object.values(byStudent).forEach((a) => { acc[topic].correct += a.correctCount; acc[topic].total += a.total; });
  });
  return Object.entries(acc).map(([topic, v]) => ({ topic, percent: accuracy(v.correct, v.total) }));
}

// Results by question (screen 20)
export function resultsByQuestion(quiz, answers = {}) {
  const ordered = Object.values(quiz.questions).sort((a, b) => a.order - b.order);
  return ordered.map((q, i) => {
    const counts = [0, 0, 0, 0];
    const wrong = [];
    Object.values(answers).forEach((a) => {
      const p = a.picks?.[i];
      if (p != null) counts[p]++;
      if (p !== q.answer) wrong.push(a.studentName);
    });
    const responded = counts.reduce((x, y) => x + y, 0);
    return {
      text: q.text,
      percentCorrect: accuracy(counts[q.answer], responded),
      mostPicked: counts.indexOf(Math.max(...counts)),
      wrongStudents: wrong,
    };
  });
}
