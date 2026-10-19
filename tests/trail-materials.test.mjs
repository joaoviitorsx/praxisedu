import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveVideoSource, validateMaterial } from '../src/features/trailMaterials.js';

test('vídeos conhecidos têm fonte incorporada no aplicativo', () => {
  assert.deepEqual(resolveVideoSource('https://youtu.be/dQw4w9WgXcQ?t=2'), {
    kind: 'youtube', uri: 'https://www.youtube.com/embed/dQw4w9WgXcQ?playsinline=1',
  });
  assert.deepEqual(resolveVideoSource('https://vimeo.com/123456'), {
    kind: 'vimeo', uri: 'https://player.vimeo.com/video/123456',
  });
  assert.deepEqual(resolveVideoSource('https://example.edu/video.m3u8'), {
    kind: 'direct', uri: 'https://example.edu/video.m3u8',
  });
});

test('materiais rejeitam links inseguros e campos vazios', () => {
  assert.equal(resolveVideoSource('http://youtu.be/dQw4w9WgXcQ'), null);
  assert.match(validateMaterial({ kind: 'video', url: 'https://example.edu/page' }), /link HTTPS/);
  assert.match(validateMaterial({ kind: 'file', name: 'Resumo', url: 'http://example.edu/x.pdf' }), /link HTTPS/);
  assert.match(validateMaterial({ kind: 'text', body: '  ' }), /conteúdo/);
});
