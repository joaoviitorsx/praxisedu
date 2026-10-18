import test from 'node:test';
import assert from 'node:assert/strict';
import { rankingRows, rankingSummary, rankingPodium } from '../src/features/student/rankingModel.js';
import { earnedBadges } from '../src/features/student/badgeModel.js';
import { orderedQuizQuestions, scoreQuiz, roomIsOpen } from '../src/features/student/classroomModel.js';
import { duelState, duelOutcome, chooseDuelQuestions, duelReward } from '../src/features/student/duelModel.js';

test('ranking ordena pontos, usa desempate estável e identifica o aluno', () => {
  const rows = rankingRows({ a: { name: 'Ana', points: 25 }, b: { name: 'Bia', points: 30 }, c: { name: 'Caio', points: 25 } }, 'a');
  assert.deepEqual(rows.map((row) => row.id), ['b', 'a', 'c']);
  assert.equal(rows[1].position, 2);
  assert.equal(rows[1].isMe, true);
  assert.deepEqual(rankingSummary(rows, 'a'), { position: 2, points: 25, gap: 5, nextName: 'Bia' });
});

test('pódio mostra segundo, primeiro e terceiro nessa ordem sem perder o ranking real', () => {
  const rows = rankingRows({ a: { name: 'Ana', points: 10 }, b: { name: 'Bia', points: 30 }, c: { name: 'Caio', points: 20 } }, 'a');
  assert.deepEqual(rankingPodium(rows).map((person) => person.position), [2, 1, 3]);
  assert.deepEqual(rankingPodium(rows.slice(0, 1)).map((person) => person.position), [1]);
});

test('modo sala ordena questões e impede envio incompleto ou fora do prazo', () => {
  const questions = orderedQuizQuestions({ b: { order: 2, text: 'B', options: ['1','2','3','4'], answer: 2 }, a: { order: 1, text: 'A', options: ['1','2','3','4'], answer: 1 } });
  assert.deepEqual(questions.map((question) => question.id), ['a', 'b']);
  assert.deepEqual(scoreQuiz(questions, [1, 0]), { correctCount: 1, total: 2 });
  assert.throws(() => scoreQuiz(questions, [1]), /Responda/);
  assert.equal(roomIsOpen({ active: true, quizId: 'q', endsAt: 2000 }, 1999), true);
  assert.equal(roomIsOpen({ active: true, quizId: 'q', endsAt: 2000 }, 2001), false);
});

test('insígnias de lição e ofensiva são derivadas de dados reais', () => {
  const trail = { units: [{ topic: 'cytology', lessons: [{ id: 'a' }, { id: 'b' }] }] };
  const progress = { a: { stars: 3 }, b: { stars: 2 } };
  assert.deepEqual(earnedBadges({ lessonsCompleted: 1, streak: 7 }, progress, trail), ['first_lesson', 'streak_7']);
  progress.b.stars = 3;
  assert.deepEqual(earnedBadges({ lessonsCompleted: 2, streak: 7 }, progress, trail), ['first_lesson', 'cytology_master', 'streak_7']);
});

test('Guardião do DNA exige concluir todas as lições de Genética', () => {
  const trail = { units: [{ topic: 'genetics', lessons: [{ id: 'dna1' }, { id: 'dna2' }] }] };
  assert.deepEqual(earnedBadges({}, { dna1: { completedAt: 1 } }, trail), []);
  assert.deepEqual(earnedBadges({}, { dna1: { completedAt: 1 }, dna2: { stars: 1 } }, trail), ['dna_guardian']);
});

test('duelo respeita turno, calcula empate e exige cinco questões únicas', () => {
  const duel = { challengerId: 'a', opponentId: 'b', status: 'challenger_turn', players: { a: { name: 'Ana' }, b: { name: 'Bia' } } };
  assert.equal(duelState(duel, 'a'), 'play');
  assert.equal(duelState(duel, 'b'), 'waiting');
  duel.status = 'opponent_turn';
  duel.players.a.score = 3;
  assert.equal(duelState(duel, 'b'), 'play');
  assert.equal(duelOutcome(duel, 'b', 3), 'draw');
  assert.equal(duelOutcome(duel, 'b', 4), 'b');
  const questions = Array.from({ length: 6 }, (_, index) => ({ id: `q${index}` }));
  assert.equal(new Set(chooseDuelQuestions(questions, 5, () => 0.5).map((item) => item.id)).size, 5);
  assert.throws(() => chooseDuelQuestions(questions.slice(0, 4), 5), /cinco/);
});

test('recompensa do duelo separa XP por acerto e bônus de resultado', () => {
  assert.deepEqual(duelReward({ winnerId: 'a', challengerId: 'a', opponentId: 'b', players: { a: { score: 3 } } }, 'a'), { outcome: 'win', bonus: 30, xp: 45 });
  assert.deepEqual(duelReward({ winnerId: 'draw', challengerId: 'a', opponentId: 'b', players: { a: { score: 2 } } }, 'a'), { outcome: 'draw', bonus: 15, xp: 30 });
  assert.throws(() => duelReward({ winnerId: 'intruso', challengerId: 'a', opponentId: 'b', players: { a: { score: 2 } } }, 'a'), /DUEL_NOT_READY/);
});
