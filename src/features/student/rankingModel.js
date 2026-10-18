export function rankingRows(raw = {}, uid) {
  return Object.entries(raw ?? {}).map(([id, value]) => ({
    id, name: value.name || 'Estudante', points: Math.max(0, Number(value.points) || 0),
    duelsWon: value.duelsWon ?? 0, isMe: id === uid,
  })).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'pt-BR') || a.id.localeCompare(b.id))
    .map((row, index) => ({ ...row, position: index + 1 }));
}

export function rankingSummary(rows, uid) {
  const index = rows.findIndex((row) => row.id === uid);
  if (index < 0) return null;
  const me = rows[index];
  const next = rows[index - 1];
  return { position: me.position, points: me.points, gap: next ? next.points - me.points : 0, nextName: next?.name ?? null };
}

// A visual podium reads naturally as runner-up, champion, then third place.
export function rankingPodium(rows = []) {
  return [rows[1], rows[0], rows[2]].filter(Boolean);
}
