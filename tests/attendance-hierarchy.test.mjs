import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const screen = readFileSync(new URL('../src/screens/teacher/AttendanceScreen.js', import.meta.url), 'utf8');
const editor = readFileSync(new URL('../src/screens/teacher/AttendanceTab.js', import.meta.url), 'utf8');

test('seleção de turma não repete explicações antes da chamada', () => {
  assert.doesNotMatch(screen, /A presença fica salva separadamente em cada turma/);
  assert.match(screen, /styles\.selectedClass/);
});

test('chamada mostra estado compacto sem cartão de instrução redundante', () => {
  assert.doesNotMatch(editor, /Chamada ainda não salva/);
  assert.doesNotMatch(editor, /styles\.context/);
  assert.match(editor, /styles\.callStatusBadge/);
  assert.match(editor, /Alunos da chamada/);
});

test('ordem prioriza data, marcação, salvamento e deixa histórico por último', () => {
  const date = editor.indexOf('styles.dateCard');
  const heading = editor.indexOf('styles.attendanceHeading');
  const summary = editor.indexOf('styles.summary');
  const bulkActions = editor.indexOf('styles.bulkActions');
  const footer = editor.indexOf('ListFooterComponent=');
  const recent = editor.indexOf('styles.recentSection');
  assert.ok(date >= 0 && date < heading && heading < summary && summary < bulkActions && bulkActions < footer && footer < recent);
});
