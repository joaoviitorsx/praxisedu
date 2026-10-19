import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { trailSceneryForRows, sceneryMotionTargets, trailSceneryHeight } from '../src/features/student/trailSceneryModel.js';

test('cenário é determinístico e cresce apenas com os trechos da trilha', () => {
  const motifs = trailSceneryForRows(5, 320);
  assert.equal(motifs.length, 5);
  assert.deepEqual(motifs.map((motif) => motif.kind), ['grass', 'tree', 'pond', 'grove', 'grass']);
  assert.ok(motifs.every((motif) => motif.x >= 0 && motif.x <= 320));
  assert.ok(motifs.every((motif, index) => motif.y >= index * 116));
});

test('paisagem maior fica no lado oposto ao rótulo da lição', () => {
  const motifs = trailSceneryForRows(3, 320, ['right', 'left', 'right']);
  assert.deepEqual(motifs.map((motif) => motif.x), [0, 210, 0]);
  assert.ok(motifs.every((motif) => motif.size >= 100));
  assert.ok(trailSceneryHeight(3, 116) >= motifs.at(-1).y + motifs.at(-1).size);
});

test('movimento decorativo se limita a duas etapas próximas da atual', () => {
  assert.deepEqual(sceneryMotionTargets(5, 2), [2, 3]);
  assert.deepEqual(sceneryMotionTargets(5, 4), [3, 4]);
  assert.deepEqual(sceneryMotionTargets(0, 0), []);
});

test('interface mantém o caminho tocável e o cenário passivo', () => {
  const path = readFileSync(new URL('../src/screens/student/TrailPath.js', import.meta.url), 'utf8');
  const scenery = readFileSync(new URL('../src/screens/student/TrailScenery.js', import.meta.url), 'utf8');
  assert.match(path, /<TrailScenery/);
  assert.match(path, /onPress=\{\(\) => onPlay\(lesson\)\}/);
  assert.match(scenery, /pointerEvents="none"/);
  assert.match(scenery, /reduceMotion/);
  assert.match(scenery, /useNativeDriver: true/);
  assert.match(scenery, /transform=\{`translate\(\$\{x\} \$\{y\}\)`\}/);
  assert.match(path, /useIsFocused\(\)/);
  assert.match(path, /import \{ useIsFocused \} from 'expo-router'/);
  assert.match(scenery, /!isFocused/);
});
