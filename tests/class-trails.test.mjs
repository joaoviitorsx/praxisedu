import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPublishedUnit, normalizeDraftLessons, preparePublishedUnit, removePublishedUnit, selectClassTrail, validateTrailUnit } from '../src/features/teacher/classTrailModel.js';
import { normalizeTrailData } from '../src/features/student/trailModel.js';

const question = (text = 'O que é célula?') => ({ text, options: ['A', 'B', 'C', 'D'], answer: 0, explanation: 'Porque A.' });
const draft = (questions = [question()]) => ({ title: 'A vida celular', topic: 'Citologia', mascot: 'mito', lessons: [{ id: 'l1', title: 'Introdução', questions }] });

test('publicação exige tópico e etapa com material ou questão completa', () => {
  assert.equal(validateTrailUnit(draft()), null);
  assert.match(validateTrailUnit({ ...draft(), lessons: [] }), /etapa/);
  assert.match(validateTrailUnit(draft([])), /conteúdo ou uma questão/);
  assert.match(validateTrailUnit(draft([{ ...question(), answer: null }])), /gabarito/);
});

test('etapa ainda sem questões reabre do rascunho sem quebrar o editor', () => {
  assert.deepEqual(normalizeDraftLessons({ first: { id: 'l1', title: 'Introdução' } }), [{ id: 'l1', title: 'Introdução', questions: [], materials: [] }]);
});

test('etapa somente com leitura publica sem questões', () => {
  const reading = { id: 'm1', kind: 'text', title: 'Organelas', body: 'As organelas desempenham funções distintas.' };
  const unit = { ...draft([]), lessons: [{ ...draft([]).lessons[0], materials: [reading] }] };
  assert.equal(validateTrailUnit(unit), null);
  const published = preparePublishedUnit(unit, null, {}, () => 'new-reading');
  assert.equal(published.unit.lessons['new-reading'].questionsCount, 0);
  assert.equal(published.unit.lessons['new-reading'].materials[0].body, reading.body);
  assert.deepEqual(published.questions, {});
});

test('alterar material cria nova versão da etapa e preserva o publicado anterior', () => {
  const first = { id: 'm1', kind: 'text', title: 'Leitura', body: 'Versão 1' };
  const previous = { lessons: { l1: { title: 'Introdução', materials: [first] } } };
  const unit = { ...draft([]), lessons: [{ ...draft([]).lessons[0], materials: [{ ...first, body: 'Versão 2' }] }] };
  const published = preparePublishedUnit(unit, previous, { l1: [] }, () => 'l2');
  assert.ok(published.unit.lessons.l2);
  assert.equal(published.unit.lessons.l1, undefined);
  assert.equal(previous.lessons.l1.materials[0].body, 'Versão 1');
});

test('primeira publicação preserva demais tópicos e identificadores da trilha do ano', () => {
  const base = { title: '1º Ano', units: { original: { title: 'Original', lessons: { old: { title: 'Antiga' } } } } };
  const updated = applyPublishedUnit(base, 'novo', { title: 'Novo', lessons: {} });
  assert.equal(updated.units.original.lessons.old.title, 'Antiga');
  assert.equal(updated.units.novo.title, 'Novo');
  assert.equal(base.units.novo, undefined);
});

test('excluir tópico do modelo do ano oculta apenas na turma e mantém dados válidos mesmo se for o último', () => {
  const base = { title: '1º Ano', grade: 1, units: { original: { title: 'Original', lessons: { old: { title: 'Antiga' } } } } };
  const changed = removePublishedUnit(base, 'original');
  assert.deepEqual(changed.units.original, { hidden: true });
  assert.equal(base.units.original.title, 'Original');
  assert.deepEqual(normalizeTrailData(changed).units, []);
  assert.equal(applyPublishedUnit(changed, 'novo', { title: 'Novo', lessons: {} }).units.original.hidden, true);
  const withSibling = applyPublishedUnit(base, 'outro', { title: 'Outro', lessons: {} });
  assert.deepEqual(normalizeTrailData(removePublishedUnit(withSibling, 'original')).units.map((unit) => unit.id), ['outro']);
});

test('trilha de outro ano não substitui o conteúdo da turma', () => {
  const custom = { grade: 1, title: 'Primeiro ano' };
  const base = { title: 'Segundo ano' };
  assert.equal(selectClassTrail(custom, base, 2), base);
  assert.equal(selectClassTrail(custom, base, 1), custom);
});

test('perguntas alteradas criam outra etapa; perguntas iguais preservam progresso', () => {
  const previous = { lessons: { l1: { title: 'Introdução', order: 1 } } };
  const oldQuestions = { l1: [question()] };
  let n = 0;
  const allocate = () => `new-${++n}`;
  const unchanged = preparePublishedUnit(draft(), previous, oldQuestions, allocate);
  assert.ok(unchanged.unit.lessons.l1);
  assert.equal(n, 0);
  const changed = preparePublishedUnit(draft([question('O que mudou?')]), previous, oldQuestions, allocate);
  assert.ok(changed.unit.lessons['new-1']);
  assert.equal(changed.unit.lessons.l1, undefined);
  assert.equal(changed.questions['new-1'].q1.text, 'O que mudou?');
});

test('pergunta legada sem explicação não impede publicar uma versão corrigida', () => {
  const previous = { lessons: { l1: { title: 'Introdução', order: 1 } } };
  const oldQuestions = { l1: [{ text: 'Antiga', options: ['A', 'B', 'C', 'D'], answer: 0 }] };
  const result = preparePublishedUnit(draft(), previous, oldQuestions, () => 'versao-2');
  assert.ok(result.unit.lessons['versao-2']);
});
