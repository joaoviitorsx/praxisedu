import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as attendanceModel from '../src/features/teacher/attendanceModel.js';

const screen = readFileSync(new URL('../src/screens/teacher/AttendanceTab.js', import.meta.url), 'utf8');

test('lista só vira grid quando há alunos e espaço suficientes', () => {
  const columns = attendanceModel.attendanceListColumns;
  assert.equal(columns?.(11, 390, 1), 1);
  assert.equal(columns?.(12, 390, 1), 2);
  assert.equal(columns?.(12, 320, 1), 1);
  assert.equal(columns?.(12, 390, 1.4), 1);
  assert.equal(columns?.(12, 620, 1), 3);
  assert.equal(columns?.(12, 768, 1), 4);
});

test('FlatList virtualizada troca colunas sem perder estado das presenças', () => {
  assert.match(screen, /numColumns=\{columns\}/);
  assert.match(screen, /key=\{`attendance-\$\{columns\}`\}/);
  assert.match(screen, /columnWrapperStyle=\{gridMode \? styles\.gridColumns : undefined\}/);
  assert.match(screen, /extraData=\{effectiveMarks\}/);
  assert.match(screen, /accessibilityRole="switch"/);
  assert.match(screen, /styles\.gridTile/);
});
