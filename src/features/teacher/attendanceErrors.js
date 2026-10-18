import { friendlyError } from '../../utils/errors.js';

export function attendanceLoadMessage(error) {
  const detail = `${error?.code ?? ''} ${error?.message ?? ''}`;
  if (/PERMISSION_DENIED|permission-denied/i.test(detail)) {
    return 'Sem permissão para ler a chamada. Confirme que esta turma pertence ao seu perfil de professor. Se pertence, as regras de chamadas do banco precisam ser publicadas.';
  }
  return friendlyError(error);
}
