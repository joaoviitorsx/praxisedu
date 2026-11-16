import test from 'node:test';
import assert from 'node:assert/strict';
import { NOTE_TOPICS, filterNotes, validateNote } from '../src/features/student/notesModel.js';

test('NOTE_TOPICS defines essential biology subjects with colors', () => {
  const ids = NOTE_TOPICS.map((t) => t.id);
  assert.ok(ids.includes('todos'));
  assert.ok(ids.includes('citologia'));
  assert.ok(ids.includes('genetica'));
  assert.ok(ids.includes('ecologia'));
  assert.ok(ids.includes('fisiologia'));
  assert.ok(ids.includes('evolucao'));
  assert.ok(ids.includes('geral'));

  for (const topic of NOTE_TOPICS) {
    assert.ok(topic.label, `Topic ${topic.id} missing label`);
    assert.ok(topic.color.startsWith('#'), `Topic ${topic.id} invalid color`);
  }
});

test('filterNotes behaves deterministically by topic and search term', () => {
  const sampleNotes = [
    { id: '1', title: 'Mitose e Meiose', content: 'Fases da divisão celular', topic: 'citologia' },
    { id: '2', title: 'Leis de Mendel', content: 'Genótipo e Fenótipo', topic: 'genetica' },
    { id: '3', title: 'Cadeia Alimentar', content: 'Produtores e consumidores', topic: 'ecologia' },
  ];

  // Filter by topic
  const citologiaOnly = filterNotes(sampleNotes, { topic: 'citologia' });
  assert.equal(citologiaOnly.length, 1);
  assert.equal(citologiaOnly[0].id, '1');

  // Search by query
  const searchResults = filterNotes(sampleNotes, { query: 'mendel' });
  assert.equal(searchResults.length, 1);
  assert.equal(searchResults[0].id, '2');

  // Filter with no match
  const none = filterNotes(sampleNotes, { topic: 'fisiologia' });
  assert.equal(none.length, 0);
});

test('validateNote rejects completely empty notes and sanitizes valid ones', () => {
  assert.equal(validateNote({ title: '   ', content: '  ' }).valid, false);
  const valid = validateNote({ title: ' Respiração Celular ', content: ' Glicólise e ciclo de Krebs ' });
  assert.equal(valid.valid, true);
  assert.equal(valid.title, 'Respiração Celular');
  assert.equal(valid.content, 'Glicólise e ciclo de Krebs');
});
