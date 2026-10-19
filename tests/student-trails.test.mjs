import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lessonStates, lessonCompletionKind, normalizeTrailData, orderedLessonQuestions, lessonResult, nextStreak } from '../src/features/student/trailModel.js';
import { gradeForClass, trailNodeLayout } from '../src/features/student/trailLayout.js';

test('ano da trilha é exclusivamente o ano válido da turma do aluno', () => {
  assert.equal(gradeForClass({ grade: 2 }), 2);
  assert.equal(gradeForClass({ grade: '3' }), 3);
  assert.equal(gradeForClass(null), null);
  assert.equal(gradeForClass({ grade: 4 }), null);
});

test('nós e rótulos do mapa em zigue-zague cabem em telas estreitas', () => {
  for (const width of [280, 320, 390]) {
    const positions = Array.from({ length: 5 }, (_, index) => trailNodeLayout(index, width, index === 1 ? 'current' : 'locked'));
    assert.notEqual(positions[0].nodeLeft, positions[1].nodeLeft);
    assert.notEqual(positions[1].nodeLeft, positions[2].nodeLeft);
    for (const { nodeLeft, nodeWidth, labelLeft, labelWidth } of positions) {
      assert.ok(nodeLeft >= 0 && nodeLeft + nodeWidth <= width, `nó fora de ${width}px`);
      assert.ok(labelLeft >= 0 && labelLeft + labelWidth <= width, `rótulo fora de ${width}px`);
    }
  }
});

test('trilha respeita a ordem do conteúdo e desbloqueia só a próxima lição de cada unidade', () => {
  const trail = normalizeTrailData({ title: '1º ano', units: { b: { order: 2, lessons: { b1: { order: 1, title: 'B1' } } }, a: { order: 1, lessons: { a2: { order: 2, title: 'A2' }, a1: { order: 1, title: 'A1' } } } } });
  assert.deepEqual(trail.units.map((unit) => unit.id), ['a', 'b']);
  assert.deepEqual(trail.units[0].lessons.map((lesson) => lesson.id), ['a1', 'a2']);
  assert.deepEqual(lessonStates(trail.units[0].lessons, {}).map((item) => item.kind), ['current', 'locked']);
  assert.deepEqual(lessonStates(trail.units[0].lessons, { a1: { stars: 2 } }).map((item) => item.kind), ['done', 'current']);
});

test('celebra a etapa, o tópico ou a trilha conforme o progresso real', () => {
  const trail = normalizeTrailData({ units: {
    a: { lessons: { a1: { order: 1 }, a2: { order: 2 } } },
    b: { lessons: { b1: { order: 1 } } },
  } });
  assert.equal(lessonCompletionKind(trail, {}, 'a1'), 'lesson');
  assert.equal(lessonCompletionKind(trail, { a1: { stars: 1 } }, 'a2'), 'topic');
  assert.equal(lessonCompletionKind(trail, { a1: { stars: 1 }, a2: { stars: 2 } }, 'b1'), 'trail');
  assert.equal(lessonCompletionKind(trail, {}, 'unknown'), 'lesson');
});

test('questões válidas são ordenadas e o resultado distingue primeira vez de repetição', () => {
  const questions = orderedLessonQuestions({ q2: { order: 2, text: 'Q2', options: ['A', 'B', 'C', 'D'], answer: 2 }, q1: { order: 1, text: 'Q1', options: ['A', 'B', 'C', 'D'], answer: 1 }, bad: { order: 3, text: '', options: [], answer: 0 } });
  assert.deepEqual(questions.map((question) => question.id), ['q1', 'q2']);
  assert.deepEqual(lessonResult(questions, [1, 0], null), { correct: 1, total: 2, stars: 1, xp: 15 });
  assert.deepEqual(lessonResult(questions, [1, 2], { stars: 1 }), { correct: 2, total: 2, stars: 3, xp: 10 });
  assert.throws(() => lessonResult(questions, [1], null), /Responda/);
});

test('ofensiva avança apenas uma vez por dia e reinicia após intervalo', () => {
  assert.equal(nextStreak({ streak: 4, lastStudyDate: '2026-10-17' }, '2026-10-17', '2026-10-16'), 4);
  assert.equal(nextStreak({ streak: 4, lastStudyDate: '2026-10-16' }, '2026-10-17', '2026-10-16'), 5);
  assert.equal(nextStreak({ streak: 4, lastStudyDate: '2026-10-14' }, '2026-10-17', '2026-10-16'), 1);
});

test('todo conteúdo de exemplo publicado tem perguntas válidas', () => {
  const trails = JSON.parse(readFileSync(new URL('../seed/trails.json', import.meta.url)));
  const questionBank = JSON.parse(readFileSync(new URL('../seed/lessonQuestions.json', import.meta.url)));
  for (const grade of Object.values(trails)) {
    for (const unit of Object.values(grade.units ?? {})) {
      for (const [lessonId, lesson] of Object.entries(unit.lessons ?? {})) {
        assert.equal(orderedLessonQuestions(questionBank[lessonId]).length, lesson.questionsCount, lessonId);
      }
    }
  }
});
