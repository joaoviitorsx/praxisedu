import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { placeStatPopover } from '../src/features/student/statPopoverLayout.js';

test('popover acompanha o centro do indicador e não ultrapassa bordas laterais', () => {
  const viewport = { width: 360, height: 720 };
  const left = placeStatPopover({ x: 4, y: 64, width: 44, height: 44 }, viewport);
  const right = placeStatPopover({ x: 312, y: 64, width: 44, height: 44 }, viewport);
  assert.equal(left.left, 12);
  assert.equal(right.left + right.width, 348);
  assert.ok(left.arrowLeft >= 14);
  assert.ok(right.arrowLeft <= right.width - 28);
  assert.equal(left.above, false);
});

test('popover sobe quando falta espaço abaixo do indicador', () => {
  const layout = placeStatPopover({ x: 170, y: 540, width: 44, height: 44 }, { width: 360, height: 720 });
  assert.equal(layout.above, true);
  assert.ok(layout.top + 190 < 540);
});

test('indicadores abrem explicações acessíveis com movimento opcional', () => {
  const screen = readFileSync(new URL('../src/screens/student/TrailsScreen.js', import.meta.url), 'utf8');
  const popover = readFileSync(new URL('../src/components/StudentStatPopover.js', import.meta.url), 'utf8');
  assert.match(screen, /onPress=\{\(\) => openStat\('streak'\)/);
  assert.match(screen, /onPress=\{\(\) => openStat\('xp'\)/);
  assert.match(screen, /onPress=\{\(\) => openStat\('lives'\)/);
  assert.match(popover, /onRequestClose=\{close\}/);
  assert.match(popover, /useReducedMotion/);
  assert.match(popover, /useNativeDriver: true/);
  assert.match(popover, /accessibilityRole="button"/);
});
