export function validateQuiz({ classId, title, topic, questions }) {
  if (!classId) return 'Selecione uma turma.';
  if (!title?.trim() || title.trim().length < 2) return 'Dê um título ao quiz.';
  if (!topic) return 'Selecione o tema.';
  if (!questions?.length) return 'Adicione pelo menos uma questão.';
  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    if (!question.text?.trim()) return `Preencha o enunciado da questão ${index + 1}.`;
    if (!Array.isArray(question.options) || question.options.length !== 4 || question.options.some((option) => !option?.trim())) {
      return `Preencha as quatro alternativas da questão ${index + 1}.`;
    }
    if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3) {
      return `Marque o gabarito da questão ${index + 1}.`;
    }
    if (!question.explanation?.trim()) return `Explique a resposta da questão ${index + 1}.`;
  }
  return null;
}

export function summarizeQuizResults(quiz, answersByStudent = {}) {
  const answers = Object.values(answersByStudent);
  const questions = Object.values(quiz.questions ?? {}).sort((a, b) => a.order - b.order);
  const correct = answers.reduce((sum, answer) => sum + (answer.correctCount ?? 0), 0);
  const total = answers.reduce((sum, answer) => sum + (answer.total ?? 0), 0);
  return {
    responses: answers.length,
    accuracy: total ? Math.round((correct / total) * 100) : 0,
    questions: questions.map((question, index) => {
      const counts = [0, 0, 0, 0];
      answers.forEach((answer) => {
        const pick = answer.picks?.[index];
        if (Number.isInteger(pick) && pick >= 0 && pick < 4) counts[pick] += 1;
      });
      const validPicks = counts.reduce((sum, value) => sum + value, 0);
      return {
        ...question,
        counts,
        responses: validPicks,
        accuracy: validPicks ? Math.round((counts[question.answer] / validPicks) * 100) : 0,
      };
    }),
  };
}
