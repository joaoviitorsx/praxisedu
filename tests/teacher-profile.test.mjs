import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { teacherProfileSummary } from '../src/features/teacher/teacherProfileModel.js';

const screen = readFileSync(new URL('../src/screens/teacher/TeacherProfileScreen.js', import.meta.url), 'utf8');

test('resumo do perfil soma as turmas sem inventar valores', () => {
  assert.deepEqual(teacherProfileSummary([]), { classes: 0, students: 0, quizzes: 0 });
  assert.deepEqual(teacherProfileSummary([
    { studentsCount: 12, quizzesCount: 3 },
    { studentsCount: 8, quizzesCount: 2 },
  ]), { classes: 2, students: 20, quizzes: 5 });
  assert.deepEqual(teacherProfileSummary([{ studentsCount: null }]), { classes: 1, students: 0, quizzes: 0 });
});

test('perfil separa identidade, resumo, turmas e dados profissionais', () => {
  assert.match(screen, /styles\.identityCard/);
  assert.match(screen, /styles\.stats/);
  assert.match(screen, /Minhas turmas/);
  assert.match(screen, /Dados profissionais/);
  assert.match(screen, /Criar primeira turma/);
});

test('avatar sai dos cabeçalhos de Turmas e Meu perfil', () => {
  const classesScreen = readFileSync(new URL('../src/screens/teacher/ClassesScreen.js', import.meta.url), 'utf8');
  assert.doesNotMatch(classesScreen, /accessibilityLabel="Abrir perfil"/);
  assert.doesNotMatch(classesScreen, /styles\.avatar/);
  assert.doesNotMatch(screen, /styles\.heroAvatar/);
});

test('avatar com iniciais fica dentro do cartão Perfil docente', () => {
  assert.match(screen, /style={styles\.identityAvatar}><Text style={styles\.identityAvatarText}>{initials\(teacherName\)}/);
  assert.match(screen, /identityAvatar: \{ width: 56, height: 56/);
  assert.doesNotMatch(screen, /styles\.identityIcon/);
});

test('indicadores de ensino compartilham um painel com leitura acessível', () => {
  assert.match(screen, /stats: \{[^\n]*borderRadius: 20/);
  assert.match(screen, /styles\.statDivider/);
  assert.match(screen, /accessible accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(screen, /summary\.students === 1 \? 'aluno' : 'alunos'/);
});

test('saída da conta pede confirmação', () => {
  assert.match(screen, /Alert\.alert\('Sair da conta\?'/);
  assert.match(screen, /style: 'cancel'/);
  assert.match(screen, /style: 'destructive', onPress: signOut/);
});
