import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/screens/teacher/AttendanceScreen.js', import.meta.url), 'utf8');

test('seletor de turma da chamada usa um resumo compacto e lista vertical em modal', () => {
  assert.match(source, /<Modal visible=\{selectorOpen\}/);
  assert.match(source, /Trocar turma/);
  assert.match(source, /<FlatList data=\{classes \?\? \[\]\}/);
  assert.doesNotMatch(source, /<FlatList[^>]*horizontal/);
});

test('troca de turma preserva confirmação de marcações pendentes', () => {
  assert.match(source, /if \(attendanceDirty\)/);
  assert.match(source, /Descartar chamada\?/);
});
