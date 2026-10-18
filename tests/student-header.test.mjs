import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/screens/student/TrailsScreen.js', import.meta.url), 'utf8');

test('cabeçalho da jornada reúne título e indicadores em uma linha compacta', () => {
  assert.match(source, /styles\.identityRow[\s\S]*styles\.identityText[\s\S]*styles\.headerStats/);
  assert.doesNotMatch(source, /styles\.statsRow/);
  assert.match(source, /Minha jornada/);
});

test('sequência, experiência e vidas mantêm ícone, número e nome acessível', () => {
  for (const [icon, label] of [['flame', 'Sequência'], ['zap', 'Experiência'], ['heart', 'Vidas']]) {
    assert.match(source, new RegExp(`icon="${icon}"[^>]*label="${label}"`));
  }
  assert.match(source, /accessibilityLabel=\{`\$\{label\}: \$\{fullValue\}`\}/);
  assert.doesNotMatch(source, /styles\.pillLabel/);
});

test('jornada e turma compartilham tipografia sobre o verde suave do app', () => {
  assert.match(source, /<Text style=\{styles\.headerCopy\}[^>]*>Minha jornada<\/Text>/);
  assert.match(source, /<Text style=\{\[styles\.headerCopy, styles\.headerClass\]\}[^>]*>\{classInfo\?\.name/);
  assert.match(source, /header: \{[\s\S]*?backgroundColor: colors\.greenSoft/);
  assert.match(source, /status: \{[^}]*backgroundColor: colors\.surface/);
});
