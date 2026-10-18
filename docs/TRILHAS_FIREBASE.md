# Ativar trilhas por turma no Firebase

A aba **Trilhas** lê `classTrails/{classId}`, `classTrailDrafts/{classId}` e
`trails/grade{grade}`. Editar e publicar também usa `classTrailQuestions/{classId}`.
Esses caminhos já estão definidos em `database.rules.json`, mas **alterar esse
arquivo local não publica as regras no Firebase**. Se o banco remoto ainda não
tem esses blocos, a aba recebe `permission-denied` mesmo quando a turma carrega.

1. Confira se `EXPO_PUBLIC_FIREBASE_DATABASE_URL` aponta para o banco esperado
   e se o login é do professor dono da turma.
2. No Console do Firebase, abra **Realtime Database → Regras** e compare as
   regras publicadas com `database.rules.json`. Preserve regras remotas que
   ainda não estejam no repositório; uma publicação substitui o conjunto inteiro.
3. Após reconciliar as diferenças, publique as regras com uma conta autorizada
   no projeto. Pelo Console, cole a versão reconciliada e clique em **Publicar**.
   Pela CLI, use `npx firebase-tools deploy --only database --project SEU_PROJECT_ID`
   (o ID está em `EXPO_PUBLIC_FIREBASE_PROJECT_ID`).
4. Reabra a aba **Trilhas**, crie um rascunho e publique um tópico. Verifique
   também com um aluno da turma se a trilha publicada aparece.

Não compartilhe a chave de serviço ou tokens de autenticação para diagnosticar
esse erro. Se continuar, anote a mensagem mostrada na aba e o código do erro
Firebase para separar falha de permissão de falha de rede.
