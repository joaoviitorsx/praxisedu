import assert from 'node:assert/strict';
import test from 'node:test';
import { attendanceLoadMessage } from '../src/features/teacher/attendanceErrors.js';

test('negação do banco explica ao professor como recuperar a chamada', () => {
  const message = attendanceLoadMessage({ code: 'PERMISSION_DENIED' });
  assert.match(message, /permiss/i);
  assert.match(message, /professor/i);
});

test('falha de rede mantém orientação de reconexão', () => {
  assert.match(attendanceLoadMessage({ message: 'network unavailable' }), /conexão/i);
});
