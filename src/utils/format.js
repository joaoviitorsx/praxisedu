// "Lucas Ferreira" -> "LF"
export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

// "Maurício Linhares" -> "Prof. Maurício"
export const teacherShortName = (name = '') => `Prof. ${name.trim().split(/\s+/)[0] || ''}`.trim();

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
