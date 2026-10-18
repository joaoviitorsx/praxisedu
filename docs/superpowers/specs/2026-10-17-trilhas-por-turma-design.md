# Trilhas por turma — desenho aprovado

O professor gerencia trilhas da própria turma em uma aba **Trilhas** do painel. Cada trilha tem tópicos, cada tópico tem etapas ordenadas e cada etapa contém questões de quatro alternativas com gabarito e explicação. O editor permite escrever questões ou gerar um rascunho com Gemini, sempre revisável. **Atividades** continua dedicada aos quizzes de Modo Sala, sem misturar o progresso das trilhas com as respostas ao vivo.

## Publicação e continuidade

Até a primeira publicação personalizada, o aluno vê a trilha padrão do ano de sua turma. A primeira publicação cria uma cópia dessa trilha para a turma e substitui apenas o tópico publicado; os demais tópicos e identificadores permanecem. Rascunhos não aparecem para o aluno. O professor pode salvar um tópico incompleto, mas a publicação exige ao menos uma etapa e uma questão válida por etapa. Questões de uma etapa publicada que forem alteradas recebem novo identificador de etapa na publicação; o progresso da versão antiga permanece no histórico, sem ser associado às novas perguntas.

## Dados e acesso

- `classTrails/{classId}`: mapa publicado, sem enunciados ou gabaritos.
- `classTrailDrafts/{classId}/{unitId}`: tópico em edição, incluindo suas questões; apenas o professor acessa.
- `classTrailQuestions/{classId}/{lessonId}`: questões publicadas por etapa; professor e alunos da turma acessam.
- Conteúdo legado em `trails/gradeN` e `lessonQuestions/{lessonId}` continua como fallback.
- Regras Firebase restringem escrita ao professor da turma e leitura publicada a seus membros. A exclusão da turma remove os três novos nós.

## Interfaces

O painel da turma ganha a aba **Trilhas**, com cartões de tópicos publicados/rascunhos, contagem de etapas e ações claras para editar ou criar. O editor tem hierarquia progressiva: 1. tópico, 2. etapas, 3. questões da etapa selecionada; ações fixas de salvar rascunho e publicar. O aluno segue usando o mapa existente, agora alimentado pela trilha publicada da turma.

## Verificação

Testes cobrem validação, cópia inicial, preservação de IDs, versionamento de questões e fallback. Verificar lint, TypeScript, testes e bundle Expo nas plataformas suportadas. Conferência visual em dispositivo autenticado depende de ambiente Firebase.
