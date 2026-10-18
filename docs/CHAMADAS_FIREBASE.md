# Ativar chamadas no Firebase

O app grava cada chamada em `attendance/{classId}/{AAAA-MM-DD}`. O arquivo
`database.rules.json` já contém a leitura e a escrita restritas ao professor
dono da turma. **Alterar esse arquivo local não publica as regras no Firebase.**

1. No Console do Firebase, abra Realtime Database → Regras e compare o conteúdo
   publicado com `database.rules.json`. Preserve qualquer regra remota que ainda
   não esteja no repositório: uma publicação via CLI substitui o conjunto inteiro.
2. Com uma conta autorizada no projeto, autentique-se na CLI: `npx firebase-tools login`.
3. Publique somente as regras: `npx firebase-tools deploy --only database --project SEU_PROJECT_ID`.
   Use o valor de `EXPO_PUBLIC_FIREBASE_PROJECT_ID` para `SEU_PROJECT_ID`.
4. Abra uma turma com alunos usando a conta do professor dono. Em Chamadas,
   marque todos, salve, volte para outra data e retorne para conferir a leitura.

Se a tela mostrar falta de permissão, confirme que a turma pertence ao usuário
logado e que o bloco `attendance` está publicado nas regras do banco usado pelo
valor de `EXPO_PUBLIC_FIREBASE_DATABASE_URL`.
