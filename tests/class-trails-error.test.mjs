import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/screens/teacher/ClassTrailsTab.js', import.meta.url), 'utf8');

test('erro de permissão nas trilhas identifica a leitura bloqueada e orienta a configuração', () => {
  assert.match(source, /classTrails/);
  assert.match(source, /classTrailDrafts/);
  assert.match(source, /permission-denied/);
  assert.match(source, /regras.*Firebase/i);
  assert.match(source, /Tentar novamente/);
});
