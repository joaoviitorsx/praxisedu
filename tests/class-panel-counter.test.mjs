import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/screens/teacher/ClassPanelScreen.js', import.meta.url), 'utf8');
const students = readFileSync(new URL('../src/screens/teacher/ClassStudentsTab.js', import.meta.url), 'utf8');

test('cabeçalho do painel não duplica o contador de alunos', () => {
  assert.match(source, /subtitle=\{cls \? cls\.code/);
  assert.doesNotMatch(source, /styles\.studentCount/);
  assert.doesNotMatch(source, /action=\{cls && members/);
});

test('contador junto ao título mantém hierarquia e informa o filtro', () => {
  assert.match(students, /<Text style=\{text\.h2\}>Alunos da turma<\/Text>/);
  assert.match(students, /styles\.countBadge/);
  assert.match(students, /styles\.countNumber/);
  assert.match(students, /styles\.countLabel/);
  assert.match(students, /isFiltering \? `DE \$\{members\.length\}`/);
  assert.match(students, /accessibilityLabel=\{isFiltering \?/);
});

test('título e contador continuam visíveis quando a turma está vazia', () => {
  assert.match(students, /ListHeaderComponent=\{<View style=\{styles\.listHeader\}>/);
  assert.match(students, /\{members\.length > 0 \? <View style=\{styles\.searchBox\}>/);
});
