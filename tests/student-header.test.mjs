import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/screens/student/TrailsScreen.js', import.meta.url), 'utf8');

test('cabeçalho da jornada mantém saudação, turma e acesso ao perfil', () => {
  assert.match(source, /Olá, \{firstName\}!/);
  assert.match(source, /classInfo\?\.name \?\? 'Trilhas de biologia'/);
  assert.match(source, /navigation\.navigate\('StudentProfile'\)/);
});

test('sequência, experiência e vidas mantêm ícone, número e nome acessível', () => {
  for (const [icon, label] of [['flame', 'Sequência'], ['zap', 'Experiência'], ['heart', 'Vidas']]) {
    assert.match(source, new RegExp(`icon="${icon}"[^>]*label="${label}"`));
  }
  assert.match(source, /accessibilityLabel=\{`\$\{label\}: \$\{fullValue\}`\}/);
  assert.match(source, /onPress=\{\(\) => openStat\('(streak|xp|lives)'\)\}/);
});
