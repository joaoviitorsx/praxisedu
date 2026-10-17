// Gemini through the REST API (generateContent). No extra SDK.
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash';
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const BIOBOT_PROMPT =
  'Você é o BioBot, tutor de Biologia para estudantes do Ensino Médio (15 a 17 anos). ' +
  'Responda sempre em português do Brasil, em até 3 frases curtas, com tom jovem e amigável. ' +
  'Use analogias do dia a dia para explicar. Se a pergunta não for de Biologia, ' +
  'diga gentilmente que você só ajuda com Biologia.';

async function callGemini(body) {
  if (!API_KEY) throw new Error('AI_NOT_CONFIGURED');
  const response = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(response.status === 429 || response.status === 503 ? 'AI_BUSY' : `AI_HTTP_${response.status}`);
  }
  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
  if (!reply.trim()) throw new Error('AI_INVALID_RESPONSE');
  return reply.trim();
}

// history: [{ role: 'user' | 'model', text }] (same roles as botChats). Send the last 20 messages.
export async function askBioBot(history) {
  const messages = history.slice(-20);
  // Gemini needs the conversation to start with a user message
  while (messages.length && messages[0].role !== 'user') messages.shift();

  return callGemini({
    systemInstruction: { parts: [{ text: BIOBOT_PROMPT }] },
    contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
  });
}

// Checks the standard question format (MODELAGEM_BANCO.md, section 6.5)
function isValidQuestion(q) {
  const filled = (v) => typeof v === 'string' && v.trim().length > 0;
  return (
    q && filled(q.text) && filled(q.explanation) &&
    Array.isArray(q.options) && q.options.length === 4 && q.options.every(filled) &&
    Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3
  );
}

// Returns [{ text, options: [4], answer: 0-3, explanation }]. Throws AI_INVALID_RESPONSE if the JSON is wrong.
export async function generateQuestions(topic, count = 3) {
  const prompt =
    `Crie ${count} questões de múltipla escolha de Biologia do Ensino Médio sobre o tema "${topic}". ` +
    'Cada questão deve ter 4 alternativas, apenas uma correta, e uma explicação curta da resposta. ' +
    'Responda SOMENTE com um array JSON, em português do Brasil, neste formato: ' +
    '[{"text":"enunciado","options":["A","B","C","D"],"answer":0,"explanation":"por que está correta"}]. ' +
    '"answer" é o índice (0 a 3) da alternativa correta.';

  const raw = await callGemini({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.8, responseMimeType: 'application/json' },
  });

  let questions;
  try {
    questions = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ''));
  } catch (e) {
    throw new Error('AI_INVALID_RESPONSE');
  }
  if (!Array.isArray(questions) || questions.length === 0 || !questions.every(isValidQuestion)) {
    throw new Error('AI_INVALID_RESPONSE');
  }
  return questions.map((q) => ({
    text: q.text.trim(),
    options: q.options.map((o) => o.trim()),
    answer: q.answer,
    explanation: q.explanation.trim(),
  }));
}
