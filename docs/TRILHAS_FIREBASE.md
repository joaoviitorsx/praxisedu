# Ativar trilhas por turma no Firebase

A aba **Trilhas** lê `classTrails/{classId}`, `classTrailDrafts/{classId}` e
`trails/grade{grade}`. Editar e publicar também usa `classTrailQuestions/{classId}`.
Esses caminhos já estão definidos em `database.rules.json`, mas **alterar esse
arquivo local não publica as regras no Firebase**. Se o banco remoto ainda não
tem esses blocos, a aba recebe `permission-denied` mesmo quando a turma carrega.

No painel da turma, **Editar** abre o tópico e suas etapas. **Excluir** pede
confirmação, remove o rascunho e oculta o tópico publicado apenas naquela turma.
Se o tópico veio de `trails/grade{grade}`, o app grava um marcador `hidden: true`
em `classTrails/{classId}/units/{unitId}` para que o conteúdo compartilhado do
ano continue disponível para outras turmas. As questões da versão publicada
da turma e os arquivos ainda vinculados ao tópico são removidos; o progresso
dos alunos não é alterado. Se a remoção de um arquivo falhar, o app avisa o
professor para conferir o Storage.

1. Confira se `EXPO_PUBLIC_FIREBASE_DATABASE_URL` aponta para o banco esperado
   e se o login é do professor dono da turma.
2. No Console do Firebase, abra **Realtime Database → Regras** e compare as
   regras publicadas com `database.rules.json`. Preserve regras remotas que
   ainda não estejam no repositório; uma publicação substitui o conjunto inteiro.
3. Após reconciliar as diferenças, publique as regras com uma conta autorizada
   no projeto. Pelo Console, cole a versão reconciliada e clique em **Publicar**.
   Pela CLI no PowerShell, use `npx.cmd firebase-tools deploy --only database --project SEU_PROJECT_ID`
   (o ID está em `EXPO_PUBLIC_FIREBASE_PROJECT_ID`).
4. Reabra a aba **Trilhas**, crie um rascunho e publique um tópico. Verifique
   também com um aluno da turma se a trilha publicada aparece.

Não compartilhe a chave de serviço ou tokens de autenticação para diagnosticar
esse erro. Se continuar, anote a mensagem mostrada na aba e o código do erro
Firebase para separar falha de permissão de falha de rede.

## Materiais das etapas

Textos e links de vídeo/arquivo ficam no Realtime Database junto da etapa. Um
arquivo selecionado pelo professor é enviado para o Cloud Storage no caminho
`trailMaterials/{teacherId}/{classId}/{unitId}/{lessonId}/{uploadId}`. Cada envio
ganha um identificador novo, para um rascunho não substituir o arquivo da versão
publicada. Arquivos enviados têm limite de 15 MB; PDF, imagem, texto, Word e
PowerPoint são aceitos.

1. Confirme que o bucket do Cloud Storage está ativo no projeto e que
   `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` no `.env` aponta para ele.
2. Compare as regras remotas do Storage com `storage.rules`. Reconcile quaisquer
   regras remotas que não estejam no arquivo: publicar o arquivo substitui o
   conjunto inteiro de regras do Storage.
3. Publique as regras reconciliadas pelo Console do Firebase ou execute
   `npx.cmd firebase-tools deploy --only storage --project SEU_PROJECT_ID`.
4. Com uma conta de professor, anexe um arquivo a uma etapa, salve o rascunho,
   publique o tópico e abra o arquivo com uma conta de aluno da turma.

O app incorpora links HTTPS do YouTube e Vimeo em uma visualização interna.
Vídeos MP4/HLS diretos usam o player do aparelho. O produtor do vídeo pode
impedir incorporação, e links de arquivos externos dependem de permissão no
servidor de origem. A tela oferece abertura externa como alternativa ao vídeo
incorporado no celular.
