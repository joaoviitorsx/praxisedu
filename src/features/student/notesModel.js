/**
 * Notes domain logic and topics configuration.
 */

export const NOTE_TOPICS = [
  { id: 'todos', label: 'Todos', color: '#10B981' },
  { id: 'citologia', label: 'Citologia', color: '#0EA5E9' },
  { id: 'genetica', label: 'Genética', color: '#8B5CF6' },
  { id: 'ecologia', label: 'Ecologia', color: '#10B981' },
  { id: 'fisiologia', label: 'Fisiologia', color: '#F59E0B' },
  { id: 'evolucao', label: 'Evolução', color: '#EC4899' },
  { id: 'geral', label: 'Geral', color: '#6B7280' },
];

export function filterNotes(notes = [], { topic = 'todos', query = '' } = {}) {
  const q = String(query ?? '').trim().toLowerCase();
  return (notes || []).filter((item) => {
    if (!item) return false;
    const matchTopic = !topic || topic === 'todos' || item.topic === topic;
    const matchQuery =
      !q ||
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.content && item.content.toLowerCase().includes(q));
    return matchTopic && matchQuery;
  });
}

export function validateNote({ title, content } = {}) {
  const cleanTitle = String(title ?? '').trim();
  const cleanContent = String(content ?? '').trim();
  if (!cleanTitle && !cleanContent) {
    return { valid: false, error: 'A anotação precisa de ao menos um título ou conteúdo.' };
  }
  return { valid: true, title: cleanTitle || 'Sem título', content: cleanContent };
}
