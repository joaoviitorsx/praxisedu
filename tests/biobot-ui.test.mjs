import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const screen = readFileSync(new URL('../src/screens/student/BioBotScreen.js', import.meta.url), 'utf8');

test('BioBot prioriza a conversa e a dúvida escrita no campo', () => {
  assert.doesNotMatch(screen, /SUGGESTIONS|suggestionsBar|TabSwipeProtectedScroll/);
  assert.match(screen, /<TextInput[\s\S]*?placeholder="Digite sua dúvida"/);
  assert.doesNotMatch(screen, /AppTextInput/);
  assert.match(screen, /accessibilityLabel="Digite sua dúvida"/);
  assert.match(screen, /styles\.composer/);
});

test('enviar só fica ativo com mensagem válida e o aviso de IA é discreto', () => {
  assert.match(screen, /disabled=\{typing \|\| !!pendingQuestion \|\| !draft\.trim\(\)\}/);
  assert.match(screen, /styles\.sendDisabled/);
  assert.match(screen, /disclaimer: \{[^}]*fontSize: 12/);
  assert.match(screen, /Respostas geradas por IA podem conter erros\./);
});

test('botão de envio e campo usam a mesma altura; ícone tem moldura simétrica', () => {
  assert.match(screen, /sendEdge: \{ width: 52, height: 52/);
  assert.match(screen, /input: \{[\s\S]*?height: 52/);
  assert.doesNotMatch(screen, /translateY: 3/);
  assert.match(screen, /logoBox: \{[\s\S]*?borderWidth: 2/);
  assert.doesNotMatch(screen, /borderBottomWidth: 3, borderBottomColor: colors\.greenDark/);
});

test('nervura da folha não recebe preenchimento que deforma a parte inferior', () => {
  const icon = readFileSync(new URL('../src/components/Icon.js', import.meta.url), 'utf8');
  assert.match(icon, /name === 'leaf' && i > 0 \? 'none' : fill/);
});
