import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { duelState, duelOutcome, chooseDuelQuestions, duelReward, duelCandidates } from '../src/features/student/duelModel.js';
import { rankingRows, rankingSummary, rankingPodium } from '../src/features/student/rankingModel.js';
import { roomIsOpen, scoreQuiz } from '../src/features/student/classroomModel.js';

const json = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));

test('duelo: estados, empate, recompensa e candidatos com acentos', () => {
  const duel = { challengerId: 'a', opponentId: 'b', status: 'opponent_turn', players: { a: { score: 3 }, b: {} } };
  assert.equal(duelState(duel, 'a'), 'waiting');
  assert.equal(duelState(duel, 'b'), 'play');
  assert.equal(duelState({ ...duel, status: 'finished' }, 'a'), 'result');
  assert.equal(duelOutcome(duel, 'b', 3), 'draw');
  assert.equal(duelOutcome(duel, 'b', 0), 'a');
  assert.throws(() => duelOutcome(duel, 'a', 2), /DUEL_NOT_READY/);
  assert.throws(() => duelReward({ ...duel, winnerId: 'x' }, 'a'), /DUEL_NOT_READY/);
  assert.equal(duelReward({ ...duel, winnerId: 'draw' }, 'a').outcome, 'draw');
  assert.throws(() => chooseDuelQuestions([{ id: 1 }, { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]));
  const five = chooseDuelQuestions([1, 2, 3, 4, 5, 6].map((id) => ({ id })), 5, () => 0.9999);
  assert.equal(new Set(five.map((q) => q.id)).size, 5);
  const c = duelCandidates([null, { id: 'a', name: 'Eu' }, { id: 'b', name: '  ' }, { id: 'c', name: 'JOÃO Ávila' }, { name: 'semid' }], 'a', 'joão');
  assert.deepEqual(c.map((m) => m.id), ['c']);
  assert.equal(duelCandidates(undefined, 'a').length, 0);
  assert.equal(duelCandidates([{ id: 'b' }], 'a', 'sem nome')[0].name, 'Aluno sem nome');
});

test('ranking: vazio, nulos, empates por nome acentuado, pontos inválidos', () => {
  assert.deepEqual(rankingRows(null, 'x'), []);
  assert.deepEqual(rankingRows(undefined), []);
  const rows = rankingRows({ z: { name: 'Ana', points: 5 }, y: { name: 'Álvaro', points: 5 }, w: { points: 'abc' }, v: null, u: { name: 'x'.repeat(5000), points: -3 } }, 'w');
  assert.deepEqual(rows.slice(0, 2).map((r) => r.id), ['y', 'z']);
  assert.ok(rows.every((r) => r.points >= 0 && r.position > 0));
  assert.equal(rows.length, 5);
  assert.equal(rankingSummary(rows, 'nobody'), null);
  assert.equal(rankingSummary(rows, 'y').gap, 0);
  assert.deepEqual(rankingPodium([]), []);
  assert.deepEqual(rankingPodium([{ id: 1 }]).map((r) => r.id), [1]);
});

test('sala de aula: timer expirado, campos ausentes, nota zero', () => {
  assert.equal(roomIsOpen(null, 0), false);
  assert.equal(roomIsOpen({ active: true, quizId: 'q', endsAt: 100 }, 100), false);
  assert.equal(roomIsOpen({ active: true, quizId: 'q', endsAt: 100 }, 99), true);
  assert.equal(roomIsOpen({ active: true, quizId: 'q' }, 0), false);
  assert.throws(() => scoreQuiz([], []));
  assert.throws(() => scoreQuiz([{ answer: 0 }], [4]));
  assert.throws(() => scoreQuiz([{ answer: 0 }], [null]));
  assert.deepEqual(scoreQuiz([{ answer: 1 }, { answer: 2 }], [0, 0]), { correctCount: 0, total: 2 });
});

test('seeds: questões completas, trilhas apontam lições existentes, temas de duelo com >= 5', async () => {
  const questions = json('../seed/lessonQuestions.json');
  const trails = json('../seed/trails.json');
  const { TOPICS } = await import('../src/constants/topics.js');
  for (const [lessonId, lesson] of Object.entries(questions)) for (const [qid, q] of Object.entries(lesson)) {
    const where = `${lessonId}/${qid}`;
    assert.ok(q.text?.trim(), where);
    assert.ok(Array.isArray(q.options) && q.options.length >= 2 && q.options.every((o) => String(o).trim()), where);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, where);
    assert.ok(q.explanation?.trim(), where);
  }
  const perTopic = {};
  for (const grade of Object.values(trails)) for (const [uid, unit] of Object.entries(grade.units ?? {})) {
    assert.ok(TOPICS[unit.topic], `tema desconhecido ${uid}`);
    for (const [lessonId, lesson] of Object.entries(unit.lessons ?? {})) {
      assert.ok(questions[lessonId], `lição sem questões ${lessonId}`);
      assert.equal(Object.keys(questions[lessonId]).length, lesson.questionsCount, `questionsCount ${lessonId}`);
      perTopic[unit.topic] = (perTopic[unit.topic] ?? 0) + Object.keys(questions[lessonId]).length;
    }
  }
  for (const [topic, n] of Object.entries(perTopic)) assert.ok(n >= 5, `${topic} tem ${n}`);
});

test('regras: todo nó raiz escrito pelos serviços existe e toda consulta orderByChild tem indexOn', () => {
  const rules = json('../database.rules.json').rules;
  const dir = new URL('../src/services/', import.meta.url);
  const src = readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => readFileSync(new URL(f, dir), 'utf8')).join('\n');
  const roots = new Set([...src.matchAll(/ref\(db,\s*[`'"]([A-Za-z]+)/g)].map((m) => m[1]));
  for (const m of src.matchAll(/\[`([A-Za-z]+)\/\$\{/g)) roots.add(m[1]);
  for (const root of roots) assert.ok(rules[root], `sem regra para ${root}`);
  const hasWrite = (node) => node && typeof node === 'object' && Object.entries(node).some(([k, v]) => k === '.write' || hasWrite(v));
  for (const root of roots) assert.ok(hasWrite(rules[root]) || ['trails', 'lessonQuestions'].includes(root), `sem .write em ${root}`);
  const idx = (node, acc = []) => { if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) k === '.indexOn' ? acc.push(...v) : idx(v, acc); return acc; };
  for (const m of src.matchAll(/ref\(db,\s*`([A-Za-z]+)[^`]*`\),\s*orderByChild\('(\w+)'\)/g)) {
    assert.ok(idx(rules[m[1]]).includes(m[2]), `${m[1]} sem indexOn ${m[2]}`);
  }
});
