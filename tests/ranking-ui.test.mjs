import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ranking = readFileSync(new URL('../src/screens/student/RankingScreen.js', import.meta.url), 'utf8');

test('ranking mantém dados reais, lista virtualizada e posição pessoal visível', () => {
  assert.match(ranking, /<FlatList/);
  assert.match(ranking, /listenWeeklyRanking/);
  assert.match(ranking, /rankingPodium\(rows/);
  assert.match(ranking, /summary\.position/);
  assert.match(ranking, /ListHeaderComponent/);
});

test('ranking usa hierarquia clara e animações acessíveis', () => {
  assert.match(ranking, /LIGA SEMANAL DE BIOLOGIA/);
  assert.match(ranking, /Pódio da turma/);
  assert.match(ranking, /Classificação completa/);
  assert.match(ranking, /useReducedMotion/);
  assert.match(ranking, /FadeInDown/);
});
