// Turns Firebase / app errors into friendly Portuguese messages
export function friendlyError(error) {
  const text = `${error?.code ?? ''} ${error?.message ?? ''}`;
  if (/PERMISSION_DENIED|permission-denied/i.test(text)) return 'Você não tem permissão para acessar estes dados.';
  if (/CLASS_CODE_UNAVAILABLE/.test(text)) return 'Não foi possível gerar o código. Tente de novo.';
  if (/CLASS_NOT_FOUND/.test(text)) return 'Código não encontrado. Confira com seu professor.';
  if (/AI_DAILY_LIMIT/.test(text)) return 'Você atingiu o limite diário de uso da IA. Volte amanhã.';
  if (/AI_NOT_CONFIGURED/.test(text)) return 'A IA ainda não foi configurada. Confira a chave no arquivo .env.';
  if (/AI_INVALID_RESPONSE/.test(text)) return 'A IA devolveu uma resposta inesperada. Tente de novo.';
  if (/AI_BUSY|429|503/.test(text)) return 'A IA está ocupada agora. Tente de novo em alguns instantes.';
  if (/network|offline|unavailable|fetch/i.test(text)) return 'Sem conexão com a internet. Confira sua rede e tente de novo.';
  return 'Algo deu errado. Tente novamente.';
}
