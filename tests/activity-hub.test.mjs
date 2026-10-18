import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveActivityClassId, activityDestination } from '../src/features/teacher/activityHubModel.js';

test('atividade só mantém uma turma que pertence à lista carregada', () => {
  const classes = [{ id: 'bio1' }, { id: 'bio2' }];
  assert.equal(resolveActivityClassId(classes, 'bio2', ''), 'bio2');
  assert.equal(resolveActivityClassId(classes, 'bio1', 'bio2'), 'bio2');
  assert.equal(resolveActivityClassId(classes, 'apagada', 'bio1'), 'bio1');
  assert.equal(resolveActivityClassId(classes, 'apagada', ''), '');
  assert.equal(resolveActivityClassId([{ id: 'unica' }], '', ''), 'unica');
});

test('trilha e quiz de sala abrem fluxos distintos na turma escolhida', () => {
  assert.deepEqual(activityDestination('trail', 'bio1'), {
    pathname: '/teacher/class/[classId]/trail/[unitId]', params: { classId: 'bio1', unitId: 'new' },
  });
  assert.deepEqual(activityDestination('trail-list', 'bio1'), {
    pathname: '/teacher/class/[classId]', params: { classId: 'bio1', tab: 'trails' },
  });
  assert.deepEqual(activityDestination('quiz', 'bio1'), {
    pathname: '/teacher/class/[classId]/quiz/new', params: { classId: 'bio1' },
  });
  assert.equal(activityDestination('quiz', ''), null);
});

test('aba Atividade apresenta escolha de turma antes dos dois formatos', () => {
  const tab = readFileSync(new URL('../src/app/teacher/(tabs)/_layout.tsx', import.meta.url), 'utf8');
  const hub = readFileSync(new URL('../src/screens/teacher/ActivityHubScreen.js', import.meta.url), 'utf8');
  assert.match(tab, /name="create-quiz" options=\{\{ title: 'Atividade' \}\}/);
  assert.match(hub, /Escolha a turma/);
  assert.match(hub, /Criar trilha/);
  assert.match(hub, /Quiz de sala/);
});
