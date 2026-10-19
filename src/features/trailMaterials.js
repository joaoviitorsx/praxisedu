export function isHttpsUrl(value) {
  try { return new URL(String(value).trim()).protocol === 'https:'; } catch { return false; }
}

export function resolveVideoSource(value) {
  if (!isHttpsUrl(value)) return null;
  const url = new URL(String(value).trim());
  const host = url.hostname.toLowerCase();
  let id;
  if (host === 'youtu.be') id = url.pathname.split('/')[1];
  else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(host)) {
    id = url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/]+)/)?.[1];
  }
  if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return { kind: 'youtube', uri: `https://www.youtube.com/embed/${id}?playsinline=1` };
  if (host === 'vimeo.com' || host === 'www.vimeo.com' || host === 'player.vimeo.com') {
    id = url.pathname.match(/\/(?:video\/)?(\d+)(?:\/|$)/)?.[1];
    if (id) return { kind: 'vimeo', uri: `https://player.vimeo.com/video/${id}` };
  }
  if (/\.(mp4|m4v|mov|m3u8)$/i.test(url.pathname)) return { kind: 'direct', uri: url.href };
  return null;
}

export function normalizeMaterials(raw) {
  return (Array.isArray(raw) ? raw : Object.values(raw ?? {})).filter(Boolean).map((item) => ({
    ...item,
    kind: item.kind || 'text',
  }));
}

export function cleanMaterials(raw) {
  return normalizeMaterials(raw).map((item) => {
    if (item.kind === 'text') return { id: item.id, kind: 'text', title: String(item.title ?? '').trim(), body: String(item.body ?? '').trim() };
    if (item.kind === 'video') return { id: item.id, kind: 'video', title: String(item.title ?? '').trim(), url: String(item.url ?? '').trim() };
    return { id: item.id, kind: 'file', name: String(item.name ?? '').trim(), url: String(item.url ?? '').trim(), storagePath: String(item.storagePath ?? '').trim(), mimeType: String(item.mimeType ?? '').trim(), size: Number(item.size) || 0 };
  });
}

export function validateMaterial(item) {
  if (item.kind === 'text') return item.body?.trim() ? null : 'Escreva o conteúdo do texto.';
  if (item.kind === 'video') return resolveVideoSource(item.url) ? null : 'Use um link HTTPS do YouTube, Vimeo ou de um vídeo MP4/HLS.';
  if (item.kind === 'file') return item.name?.trim() && (item.storagePath?.trim() || isHttpsUrl(item.url)) ? null : 'Anexe um arquivo ou informe seu nome e link HTTPS.';
  return 'Tipo de material não reconhecido.';
}
