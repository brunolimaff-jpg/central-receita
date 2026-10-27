# Relatório para o planejador — 27/10/2026

Sessão de trabalho na branch `claude/gifted-mccarthy-odjru5`, que é a que publica a homologação visual. Três commits, todos no ar.

## O que mudou

**1. Tipografia da assinatura na sidebar** (`1ed4bac`)

A commit `52c920d` (sidebar escura de vidro) trocou "Central de Receita" por caixa alta, 10px e 0,16em de entreletra. O resultado lia como rótulo de seção e competia com "RECEITA" e "EM PRÉVIA" logo abaixo, que são os rótulos de grupo de verdade.

Voltou aos valores anteriores à sidebar escura: caixa normal, 11px, peso 500, 0,02em. Só a cor mudou — branco a 80% em vez do cinza, porque a coluna agora é escura e o contraste original não valeria.

**2. Fotos nos avatares** (`9fc8789`, `816f8ef`)

O avatar em `diretorias-section.tsx` só desenhava iniciais. Passou a pintar a foto oficial como camada de fundo sobre elas, lendo `public/pessoas/<slug>.jpg`. Quem não tem arquivo mostra as iniciais — sem lista de fotos em código, sem estado de erro.

A primeira tentativa usava `<img>` com `onError`. Foi descartada: o navegador travava o elemento em `naturalWidth: 0` depois de um 404 transitório e não reavaliava, mesmo com a rede entregando 200. A camada de fundo não tem esse estado.

Cinco fotos publicadas: Hermínio Gastaldi, Giovanne Farias, Fernando Silva, Alexandre Mancini e Marcos Paulo Malagola. Decisão do Bruno: parar aí por enquanto.

## O que descobrimos e vale registrar

**A busca da hierarquia está bloqueada para o usuário do Bruno.** Digitar no campo "Buscar por posto, pessoa" retorna o toast "Não autorizado. Usuário não autorizado.", e a consulta `searchHierarchyItem` volta 401. A árvore carrega só a cadeia da Diretoria de Mercado (~28 pessoas). As outras 23 do organograma 2027 não são acessíveis por essa via — é bloqueio de permissão, não de automação.

**Os nomes do organograma 2027 não batem com a plataforma.** Exemplos: "José Tavares" é *Jose Ricardo Porto Tavares*; "Elias Junior" é *Elias Leite Do Nascimento Junior*; "Vinnicius Gomes de Arruda" é *Alberty Vinnicius Gomes de Arruda*. Qualquer preenchimento automático precisa de conferência nome a nome.

**As URLs de foto da hierarquia são S3 assinadas e expiram em ~15 minutos.** Capturar e baixar precisa acontecer na mesma sessão.

## Estado técnico

- 264 testes PASS, typecheck limpo, build visual PASS.
- Deploys: `40511916157` (tipografia), `40515996627` (fotos), `40517850570` (camada de fundo) — todos success.
- Site: https://central-receita-visual.brunolimaff.workers.dev, HTTP 200, as cinco fotos respondendo 200.
- PR 19 segue OPEN/draft em `5dedd87`, intocada por esta sessão.
- Nada pendente no git.

## Pendências que continuam de antes

- Aceite visual das telas pela Fabi/Bruno — o Bruno aprovou o conjunto, mas o registro formal segue `NÃO VALIDADO`.
- Merge da PR 19: decisão do Bruno.
- Ativação corporativa: identidade Sites, allowlists, D1 real, retenção.
- Fotos das 23 pessoas restantes: bloqueadas pela permissão da busca.
