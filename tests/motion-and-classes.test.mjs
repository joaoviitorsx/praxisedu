import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('interações e navegação respeitam movimento reduzido', () => {
  assert.match(read('../src/hooks/useReducedMotion.js'), /isReduceMotionEnabled/);
  assert.match(read('../src/components/Button.js'), /onPressIn/);
  assert.match(read('../src/components/Button.js'), /Animated\.timing/);
  assert.match(read('../src/components/Toast.js'), /Animated\.timing/);
  assert.match(read('../src/navigation/TabBar.js'), /Animated\.timing/);
  assert.match(read('../src/app/_layout.tsx'), /animation: reduceMotion \? 'none'/);
  assert.match(read('../src/app/teacher/_layout.tsx'), /fade_from_bottom/);
  assert.match(read('../src/app/student/_layout.tsx'), /fade_from_bottom/);
});

test('contador de turmas mostra quantidade e rótulo inclusive no estado vazio', () => {
  const source = read('../src/screens/teacher/ClassesScreen.js');
  assert.match(source, /accessibilityLabel=\{`\$\{classes\.length\} \$\{classes\.length === 1 \? 'turma' : 'turmas'\}`\}/);
  assert.match(source, /styles\.countNumber/);
  assert.match(source, /styles\.countLabel/);
});
