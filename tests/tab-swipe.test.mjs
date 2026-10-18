import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('abas usam pager nativo com barra inferior e carregamento de vizinhas', () => {
  for (const role of ['teacher', 'student']) {
    const layout = read(`../src/app/${role}/(tabs)/_layout.tsx`);
    assert.match(layout, /expo-router\/js-top-tabs/);
    assert.match(layout, /tabBarPosition="bottom"/);
    assert.match(layout, /swipeEnabled: true/);
    assert.match(layout, /lazyPreloadDistance: 1/);
    assert.doesNotMatch(layout, /reverseOrder/);
  }
});

test('arraste para a esquerda revela a aba à direita na ordem visual', () => {
  const teacher = read('../src/app/teacher/(tabs)/_layout.tsx');
  const student = read('../src/app/student/(tabs)/_layout.tsx');
  assert.ok(teacher.indexOf('name="classes"') < teacher.indexOf('name="create-quiz"'));
  assert.ok(teacher.indexOf('name="create-quiz"') < teacher.indexOf('name="attendance"'));
  assert.ok(teacher.indexOf('name="attendance"') < teacher.indexOf('name="profile"'));
  const studentOrder = [...student.matchAll(/<TopTabs\.Screen name="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(studentOrder, ['trails', 'classroom', 'biobot', 'duels', 'ranking']);
  assert.match(student, /featuredRoute="biobot"/);
  assert.doesNotMatch(read('../src/navigation/TabBar.js'), /\.reverse\(\)/);
});

test('BioBot recebe círculo central e animação de foco com movimento reduzido respeitado', () => {
  const bar = read('../src/navigation/TabBar.js');
  assert.match(bar, /featuredRoute/);
  assert.match(bar, /styles\.featuredCircle/);
  assert.match(bar, /Animated\.spring/);
  assert.match(bar, /reduceMotion/);
  assert.match(bar, /accessibilityRole="tab"/);
});

test('barra do aluno é compacta sem reduzir o alvo do BioBot', () => {
  const bar = read('../src/navigation/TabBar.js');
  assert.match(bar, /studentTab: \{ minHeight: 56/);
  assert.match(bar, /featuredTab: \{ height: 64, marginTop: -8/);
  assert.match(bar, /featuredCircle: \{ width: 54, height: 54/);
  assert.match(bar, /barWithFeatured: \{[^}]*paddingTop: 2/);
});

test('telas não usam o detector antigo que só navega ao soltar', () => {
  for (const [role, routes] of Object.entries({ teacher: ['classes', 'create-quiz', 'attendance', 'profile'], student: ['trails', 'duels', 'classroom', 'biobot', 'ranking'] })) {
    for (const route of routes) assert.doesNotMatch(read(`../src/app/${role}/(tabs)/${route}.tsx`), /TabSwipeScreen/);
  }
});

test('carrosséis internos mantêm rolagem horizontal sem um segundo detector de abas', () => {
  const scroll = read('../src/navigation/EdgeTabSwipe.js');
  assert.match(scroll, /<ScrollView/);
  assert.match(scroll, /horizontal/);
  assert.doesNotMatch(scroll, /Gesture\.Pan|router\.navigate|TabSwipeScreen/);
  for (const screen of ['student/TrailsScreen.js', 'teacher/AttendanceTab.js']) {
    assert.match(read(`../src/screens/${screen}`), /<TabSwipeProtectedScroll/);
  }
  assert.doesNotMatch(read('../src/screens/student/BioBotScreen.js'), /TabSwipeProtectedScroll/);
});
