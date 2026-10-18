# Trilhas por turma — plano de implementação

**Objetivo:** permitir que o professor crie, edite e publique tópicos, etapas e questões exclusivos de sua turma, sem interromper o conteúdo atual dos alunos.

**Arquitetura:** modelo puro de validação/versionamento, serviço Firebase para rascunhos/publicação, aba e editor do professor, adaptação dos leitores do aluno e regras de acesso. React Native/Expo Router SDK 57 e Firebase Realtime Database existentes.

1. Escrever testes do modelo para publicação válida, rascunho incompleto, clonagem da trilha do ano e novo ID ao mudar questões; observar falha; implementar o modelo e observar testes verdes.
2. Criar serviço de trilhas por turma com leitura publicada/fallback, carga e salvamento de rascunhos e publicação atômica de mapa e perguntas. Ajustar o leitor do aluno, conclusão e exclusão de turma.
3. Acrescentar regras Firebase para os três nós, restritas a professor e membros; testar permissões declaradas no conjunto existente.
4. Criar aba **Trilhas** e editor em `src/app/teacher/class/[classId]/trail/[unitId].tsx`, com tópico, etapas, questões manuais/IA, estados de carregamento/erro e ações de rascunho/publicação. Manter **Atividades** para Modo Sala.
5. Executar `npm run test:teacher`, `npx expo lint`, `npx tsc --noEmit`, `npx expo export --platform all` e `git diff --check`; corrigir falhas e registrar limitações da verificação visual.
