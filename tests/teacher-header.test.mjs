import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/components/TeacherHero.js', import.meta.url), 'utf8');

test('cabeçalho do professor mantém voltar no fluxo do layout, separado do título', () => {
  assert.match(source, /styles\.navigationRow/);
  assert.doesNotMatch(source, /back: \{[^}]*position: 'absolute'/);
  assert.doesNotMatch(source, /<GradientBackdrop/);
});
