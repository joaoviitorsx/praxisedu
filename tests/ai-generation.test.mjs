import assert from 'node:assert/strict';
import test from 'node:test';

process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'test-key';
delete process.env.EXPO_PUBLIC_GEMINI_MODEL;

const { generateQuestions } = await import('../src/services/aiService.js');
const { friendlyError } = await import('../src/utils/errors.js');

const sample = [{
  text: 'O que produz ATP?',
  options: ['Núcleo', 'Mitocôndria', 'Ribossomo', 'Lisossomo'],
  answer: 1,
  explanation: 'A mitocôndria realiza a respiração celular.',
}];

test('geração usa modelo disponível e recebe questões JSON válidas', async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl;
  globalThis.fetch = async (url) => {
    requestedUrl = url;
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(sample) }] } }] }) };
  };
  try {
    const questions = await generateQuestions('Citologia', 1);
    assert.match(requestedUrl, /models\/gemini-3\.5-flash-lite:generateContent$/);
    assert.equal(questions.length, 1);
    assert.equal(questions[0].answer, 1);
  } finally { globalThis.fetch = originalFetch; }
});

test('modelo removido produz erro específico em vez de mensagem genérica', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 404, json: async () => ({ error: { status: 'NOT_FOUND' } }) });
  try {
    await assert.rejects(generateQuestions('Citologia', 1), /AI_MODEL_UNAVAILABLE/);
  } finally { globalThis.fetch = originalFetch; }
});

test('resposta incompleta não adiciona questões inválidas', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '[{}' }] } }] }) });
  try {
    await assert.rejects(generateQuestions('Citologia', 1), /AI_INVALID_RESPONSE/);
  } finally { globalThis.fetch = originalFetch; }
});

test('erro de modelo indisponível orienta a configuração', () => {
  assert.match(friendlyError(new Error('AI_MODEL_UNAVAILABLE')), /modelo.*Gemini/i);
});
