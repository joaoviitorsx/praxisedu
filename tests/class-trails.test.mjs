import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPublishedUnit, preparePublishedUnit, selectClassTrail, validateTrailUnit } from '../src/features/teacher/classTrailModel.js';

const question = (text = 'O que é célula?') => ({ text, options: ['A', 'B', 'C', 'D'], answer: 0, explanation: 'Porque A.' });
const draft = (questions = [question()]) => ({ title: 'A vida celular', topic: 'Citologia', mascot: 'mito', lessons: [{ id: 'l1', title: 'Introdução', questions }] });

test('publicação exige tópico, etapa e questões completas; rascunho pode ser incompleto', () => {
  assert.equal(validateTrailUnit(draft()), null);
  assert.match(validateTrailUnit({ ...draft(), lessons: [] }), /etapa/);
  assert.match(validateTrailUnit(draft([{ ...question(), answer: null }])), /gabarito/);
});

test('primeira publicação preserva demais tópicos e identificadores da trilha do ano', () => {
  const base = { title: '1º Ano', units: { original: { title: 'Original', lessons: { old: { title: 'Antiga' } } } } };
  const updated = applyPublishedUnit(base, 'novo', { title: 'Novo', lessons: {} });
  assert.equal(updated.units.original.lessons.old.title, 'Antiga');
  assert.equal(updated.units.novo.title, 'Novo');
  assert.equal(base.units.novo, undefined);
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
