# Ecossistema da trilha e navegação por bordas

**Objetivo:** enriquecer a trilha do aluno com elementos de biologia, organizar o cabeçalho e oferecer troca de abas por gesto lateral nos dois perfis.

**Arquitetura:** o cenário fica isolado em `TrailScenery`, como SVG não interativo atrás dos nós. A navegação usa um componente compartilhado de borda nos layouts de abas; o cálculo de destino fica em uma função pura testável. O cabeçalho da trilha continua vinculado ao perfil e à turma reais.

**Tecnologias:** Expo SDK 57, Expo Router, React Native Gesture Handler compatível com o SDK, React Native SVG e Animated com driver nativo.

1. Escrever testes para cálculo de destino, limites de abas e posicionamento leve do cenário; confirmar falha.
2. Implementar a função de gesto e o componente de bordas; adicionar nos layouts do aluno e professor mantendo a tab bar.
3. Implementar cenário vetorial, movimento reduzido e cabeçalho responsivo; preservar nós, mascotes e dados existentes.
4. Executar testes, lint, typecheck e `git diff --check`; inspecionar conflitos com rolagem horizontal e formulários.

O gesto é complementar, limitado às bordas, e não altera navegação em telas internas. O cenário não captura toques e não depende de rede.
