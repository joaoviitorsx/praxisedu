import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const loading = readFileSync(new URL('../src/components/LoadingView.js', import.meta.url), 'utf8');
const logo = readFileSync(new URL('../src/components/Logo.js', import.meta.url), 'utf8');

test('loading global usa o símbolo da marca com elétron em órbita', () => {
  assert.match(loading, /<Logo[^>]+showElectron=\{reduceMotion\}/);
  assert.match(loading, /colors\.yellow/);
  assert.match(loading, /withRepeat\(withTiming/);
  assert.match(loading, /top: \(markSize - orbitSize\) \/ 2/);
  assert.doesNotMatch(loading, /ActivityIndicator/);
  assert.match(logo, /showElectron = true/);
});

test('loading aceita versão compacta, descreve o estado e encerra a animação ao desmontar', () => {
  assert.match(loading, /compact = false/);
  assert.match(loading, /accessibilityRole="progressbar"/);
  assert.match(loading, /accessibilityLabel=\{message \|\| 'Carregando'/);
  assert.match(loading, /useReducedMotion/);
  assert.match(loading, /showElectron=\{reduceMotion\}/);
  assert.match(loading, /cancelAnimation\(rotation\)/);
});
