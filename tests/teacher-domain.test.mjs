import test from 'node:test';
import assert from 'node:assert/strict';
import { validateQuiz, summarizeQuizResults } from '../src/features/teacher/quizModel.js';
import { attendanceSummary, buildAttendanceRecord } from '../src/features/teacher/attendanceModel.js';
import * as attendanceModel from '../src/features/teacher/attendanceModel.js';
import { filterClassMembers } from '../src/features/teacher/classMembersModel.js';
import { activitiesViewState } from '../src/features/teacher/activitiesModel.js';
import { performanceSections } from '../src/features/teacher/performanceModel.js';

const question = {
  text: 'Qual organela produz ATP?',
  options: ['Núcleo', 'Mitocôndria', 'Ribossomo', 'Lisossomo'],
  answer: 1,
  explanation: 'A mitocôndria produz ATP na respiração celular.',
};

test('quiz exige turma, tema e questões completas antes de publicar', () => {
  assert.equal(validateQuiz({ classId: '', title: 'Células', topic: 'cytology', questions: [question] }), 'Selecione uma turma.');
  assert.equal(validateQuiz({ classId: 'a', title: 'Células', topic: 'cytology', questions: [{ ...question, options: ['', ...question.options.slice(1)] }] }), 'Preencha as quatro alternativas da questão 1.');
  assert.equal(validateQuiz({ classId: 'a', title: 'Células', topic: 'cytology', questions: [question] }), null);
});

test('resultados de quiz usam respostas reais e ignoram escolhas inválidas', () => {
  const result = summarizeQuizResults({ questions: { q1: { ...question, order: 1 } } }, {
    a: { picks: [1], correctCount: 1, total: 1 },
    b: { picks: [0], correctCount: 0, total: 1 },
    c: { picks: [], correctCount: 0, total: 1 },
  });
  assert.equal(result.responses, 3);
  assert.equal(result.accuracy, 33);
  assert.deepEqual(result.questions[0].counts, [1, 1, 0, 0]);
});

test('chamada preserva ausências explícitas e identifica quem falta marcar', () => {
  const members = [{ id: 'a', name: 'Ana' }, { id: 'b', name: 'Bia' }];
  const record = buildAttendanceRecord(members, { a: 'present', b: 'absent' }, '2026-10-17', 'teacher');
  assert.equal(record.entries.b.status, 'absent');
  assert.deepEqual(attendanceSummary(members, record.entries), { present: 1, absent: 1, unmarked: 0 });
  assert.deepEqual(attendanceSummary(members, { a: record.entries.a }), { present: 1, absent: 0, unmarked: 1 });
  assert.throws(() => buildAttendanceRecord(members, { a: 'present' }, '2026-10-17', 'teacher'), /Marque/);
});

test('aba de chamadas mantém turma válida e corrige seleções inexistentes', () => {
  const classes = [{ id: 'bio1' }, { id: 'bio2' }];
  assert.equal(attendanceModel.resolveAttendanceClassId(classes, 'bio2', 'bio1'), 'bio2');
  assert.equal(attendanceModel.resolveAttendanceClassId(classes, 'apagada', 'bio1'), 'bio1');
  assert.equal(attendanceModel.resolveAttendanceClassId(classes, '', 'apagada'), 'bio1');
  assert.equal(attendanceModel.resolveAttendanceClassId([], 'bio2', 'bio1'), null);
});

test('sincronização não apaga marcações locais ainda não salvas', () => {
  const remote = { entries: { a: { status: 'absent' } } };
  assert.equal(attendanceModel.attendanceSnapshotForEditor(remote, true), null);
  assert.deepEqual(attendanceModel.attendanceSnapshotForEditor(remote, false), {
    record: remote,
    marks: { a: 'absent' },
  });
});

test('chamada nova exibe falta por padrão sem criar registro salvo', () => {
  const members = [{ id: 'a', name: 'Ana' }, { id: 'b', name: 'Bia' }];
  const snapshot = attendanceModel.attendanceSnapshotForEditor(null, false, members);
  assert.equal(snapshot.record, null);
  assert.deepEqual(snapshot.marks, { a: 'absent', b: 'absent' });
  assert.deepEqual(attendanceSummary(members, Object.fromEntries(Object.entries(snapshot.marks).map(([id, status]) => [id, { status }]))), { present: 0, absent: 2, unmarked: 0 });
});

test('registro salvo prevalece sobre padrão e toque alterna presença', () => {
  const members = [{ id: 'a', name: 'Ana' }, { id: 'b', name: 'Bia' }];
  const record = { entries: { a: { status: 'present' } } };
  assert.deepEqual(attendanceModel.attendanceSnapshotForEditor(record, false, members).marks, { a: 'present', b: 'absent' });
  assert.equal(attendanceModel.toggleAttendanceMark('absent'), 'present');
  assert.equal(attendanceModel.toggleAttendanceMark('present'), 'absent');
});

test('datas recentes da chamada ignoram chaves inválidas e ficam da mais nova para a mais antiga', () => {
  const records = {
    '2026-10-15': { entries: {} },
    '2026-10-17': { entries: {} },
    '2026-10-16': { entries: {} },
    '2026-10-18': { entries: {} },
    '2026-02-31': { entries: {} },
    '2026-13-01': { entries: {} },
    outra: { entries: {} },
  };
  assert.deepEqual(attendanceModel.recentAttendanceDates(records, '2026-10-17'), ['2026-10-17', '2026-10-16', '2026-10-15']);
});

test('busca de alunos ignora acentos, maiúsculas e espaços sem alterar a ordem', () => {
  const members = [{ id: '1', name: 'Álvaro Lima' }, { id: '2', name: 'Beatriz' }, { id: '3', name: 'Alana' }];
  assert.deepEqual(filterClassMembers(members, '  al  ').map((member) => member.id), ['1', '3']);
  assert.deepEqual(filterClassMembers(members, 'BEA').map((member) => member.id), ['2']);
  assert.equal(filterClassMembers(members, ''), members);
});

test('atividades distinguem falha inicial de lista vazia e mantêm dados em falhas parciais', () => {
  assert.equal(activitiesViewState(null, ''), 'loading');
  assert.equal(activitiesViewState(null, 'Sem conexão'), 'error');
  assert.equal(activitiesViewState([], ''), 'empty');
  assert.equal(activitiesViewState([{ id: 'quiz-1' }], 'Sem conexão'), 'ready');
});

test('desempenho mantém apoio das lições visível sem respostas de quiz', () => {
  assert.deepEqual(performanceSections({ responses: 0, strugglingStudents: [{ id: 'a' }] }), { quizMetrics: false, lessonSupport: true });
  assert.deepEqual(performanceSections({ responses: 4, strugglingStudents: [] }), { quizMetrics: true, lessonSupport: false });
});
