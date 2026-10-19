// Turns Firebase / app errors into friendly Portuguese messages
export function friendlyError(error) {
  const text = `${error?.code ?? ''} ${error?.message ?? ''}`;
  if (/storage\/unauthorized/.test(text)) return 'O Storage bloqueou o arquivo. Confira as regras publicadas e a conta do professor.';
  if (/storage\/bucket-not-found|storage\/project-not-found/.test(text)) return 'O bucket de arquivos não está disponível. Confira a configuração do Firebase Storage.';
  if (/storage\/quota-exceeded/.test(text)) return 'O limite de armazenamento do Firebase foi atingido.';
  if (/storage\/object-not-found/.test(text)) return 'Este arquivo não está mais disponível no Storage.';
  if (/PERMISSION_DENIED|permission-denied/i.test(text)) return 'Você não tem permissão para acessar estes dados.';
  if (/CLASS_CODE_UNAVAILABLE/.test(text)) return 'Não foi possível gerar o código. Tente de novo.';
  if (/CLASS_NOT_FOUND/.test(text)) return 'Código não encontrado. Confira com seu professor.';
  if (/TRAIL_GRADE_CHANGED/.test(text)) return 'O ano da turma mudou. Reabra o tópico para publicar no ano correto.';
  if (/TRAIL_NOT_FOUND/.test(text)) return 'Este tópico já foi excluído. Atualize a lista de trilhas.';
  if (/QUIZ_ALREADY_ANSWERED/.test(text)) return 'Você já enviou sua resposta para este quiz.';
  if (/CLASSROOM_EXPIRED/.test(text)) return 'O tempo do Modo Sala terminou ou a atividade foi encerrada.';
  if (/DUEL_INVALID_OPPONENT/.test(text)) return 'Escolha um colega da sua turma para desafiar.';
  if (/DUEL_NOT_YOUR_TURN/.test(text)) return 'Este duelo não está no seu turno agora.';
  if (/DUEL_NOT_FOUND/.test(text)) return 'Este duelo não está mais disponível.';
  if (/AI_DAILY_LIMIT/.test(text)) return 'Você atingiu o limite diário de uso da IA. Volte amanhã.';
  if (/AI_NOT_CONFIGURED/.test(text)) return 'A IA ainda não foi configurada. Confira a chave no arquivo .env.';
  if (/AI_MODEL_UNAVAILABLE/.test(text)) return 'O modelo Gemini configurado não está disponível. Atualize EXPO_PUBLIC_GEMINI_MODEL e reinicie o app.';
  if (/AI_ACCESS_DENIED/.test(text)) return 'A chave Gemini não tem acesso a este modelo. Confira a chave e as permissões da API.';
  if (/AI_INVALID_REQUEST/.test(text)) return 'A IA rejeitou a solicitação. Tente outro tema ou confira a configuração do modelo.';
  if (/AI_INVALID_RESPONSE/.test(text)) return 'A IA devolveu uma resposta inesperada. Tente de novo.';
  if (/AI_BUSY|429|503/.test(text)) return 'A IA está ocupada agora. Tente de novo em alguns instantes.';
  if (/network|offline|unavailable|fetch/i.test(text)) return 'Sem conexão com a internet. Confira sua rede e tente de novo.';
  return 'Algo deu errado. Tente novamente.';
}
