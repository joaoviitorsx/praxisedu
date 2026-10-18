import { orderedLessonQuestions } from './trailModel.js';

export const orderedQuizQuestions = orderedLessonQuestions;

export function roomIsOpen(room, now) {
  return !!room?.active && !!room.quizId && Number.isFinite(room.endsAt) && now < room.endsAt;
}

export function scoreQuiz(questions, picks) {
  if (!questions.length || picks.length !== questions.length || picks.some((pick) => !Number.isInteger(pick) || pick < 0 || pick > 3)) {
    throw new Error('Responda todas as questões antes de enviar.');
  }
  return { correctCount: questions.reduce((total, question, index) => total + Number(question.answer === picks[index]), 0), total: questions.length };
}
