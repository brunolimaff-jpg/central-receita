# Brief — auditoria da implementação de Territórios (28/10/2026)

Documento de apoio da convocação do Planejador. Registra o que **já foi verificado**
antes de chamá-lo, para que o parecer se concentre no que falta e para que a
auditoria sobreviva a uma queda do agente.

## Objeto

- Branch: `fix/regional-mapa-calor`, commit `7751cee`
- Worktree: `.claude/worktrees/regional-fix`
- Base da homologação: `claude/gifted-mccarthy-odjru5` @ `7b5ae9d`
- Relação: `7b5ae9d` é ancestral de `7751cee` — o merge é **fast-forward**, sem conflito.
- Diff: 20 arquivos, +2935 / −5.

## O que já foi verificado nesta sessão

| Item | Marca | Resultado |
| --- | --- | --- |
| Suíte `tests/regional-model.test.mjs` + `tests/territorios.test.mjs` | VERIFICADO | 41 testes, 41 passam, 0 falham |
| `npx tsc --noEmit` | VERIFICADO | exit 0, sem erro |
| HEAD da homologação é ancestral do commit | VERIFICADO | `git diff 7b5ae9d..7751cee` só adiciona |
| `RegionalScreen` é importado por alguém | VERIFICADO | **Não.** Código morto desde a renomeação |
| `'regional'` ainda em `COMMERCIAL_VIEWS` | VERIFICADO | `types.ts:37` e `types.ts:90` |
| Regras documentadas | VERIFICADO | 24 regras em `REGRAS-E-CALCULOS.md` |

## O que ainda não foi verificado

- Build de produção (`npm run build:visual`) — não rodado após o último commit.
- Comportamento em navegador real: mobile, foco de teclado, leitor de tela.
- O deploy de homologação (`homologacao-visual.yml`) — depende do merge.
- Se a tela antiga de sete abas precisa ser removida ou mantida como link direto.

## A pergunta em jogo

A implementação de Territórios reorganiza o que existe e não constrói outro
dashboard — mas deixa `RegionalScreen` inteiro como código morto e mantém
`'regional'` no enum de views. **Isso é aceitável como entrega de homologação, ou
a branch está pronta para revisão só depois de remover o obsoleto?**

## Limite de escopo desta rodada

Não redesenhar a tela nem propor territórios novos. Auditar o que está no diff:
modelo, testes, navegação, o que ficou órfão, e se as invariantes do produto
(nulo propaga, MRR ≠ NRR, marcos não se somam, nada de meta inventada) valem na
implementação — não só no comentário.

## Achados meus, na tela renderizada (o workflow lê código, não a tela)

Estes dois só aparecem no navegador. Verificados em `http://127.0.0.1:3031`, mobile e desktop.

### V1 — Tabela do território ordena por um número que não está na tabela
- Marca: VERIFICADO · severidade: alta
- Arquivo: `src/features/comercial-v3/regional/territorio-screen.tsx:41`
- O `sort` usa `a.r.pct` (ganho ÷ meta). A coluna de percentual exibida é
  `ff.pctBase` (cenário Base). A dica diz "Ordenado por quem está mais longe".
- Na tela, Centro-Oeste: DF 59%, MT 80%, GO 77%, MS 86% — desordenado para
  quem lê. A ordem real é por ganho: 24%, 44%, 52%, 60%.
- Cenário: qualquer território com mais de uma filial. A leitura "quem está mais
  longe" aponta para a filial errada.

### V2 — O chip da rubrica repete o percentual da própria rubrica, e a dica mente
- Marca: VERIFICADO · severidade: média
- Arquivo: `src/features/comercial-v3/regional/filial-screen.tsx:62-77`
- A dica diz: "o chip é o cenário Base do fluxo, que é onde ela deve aterrissar".
- O chip renderiza `<Chip farol={bloco.farol}>{P(bloco.pct)}</Chip>`, e `bloco`
  é `resultadoFilial(filial, fluxo)` — o total da filial no fluxo, não a rubrica
  e não o cenário Base.
- Resultado na tela: em MRR a linha "Manutenção" mostra 24% e 24%; em NRR
  "Licença" mostra 38% e "Serviço" 25%, com o mesmo chip 34% nas duas.
- Cenário: toda filial, todo fluxo. O chip não informa nada e a dica descreve
  outra coisa.

### V3 — BLOQUEANTE: o clique na filial não abre a filial
- Marca: VERIFICADO · severidade: alta · **bloqueia a entrega**
- Arquivo: `src/features/comercial-v3/context.ts:94-110` (assinatura) e
  `src/features/comercial-v3/commercial-v3-app.tsx:239-252` (chamada)
- `CommercialHrefExtra` declara `branch?: string` (nav.ts:40), e `nav.href`
  espalha `...extra` no 3º argumento de `buildCommercialHref`. Mas o 3º
  argumento (`extra`) de `buildCommercialHref` **não declara `branch`**, e o
  corpo lê `branch` só de `context` (2º argumento) — nunca de `extra`.
- O TypeScript não acusa: spread não sofre checagem de propriedade excedente.
- Prova na tela: em `?view=territorios&territorio=centro-oeste`, o link "DF"
  tem `href="/?view=territorios&period=month&territorio=centro-oeste&from=home"`.
  Sem `branch=DF`. Clicar não muda nada — continua no território.
- Reprodução isolada: com e sem `extra.branch`, a URL gerada é idêntica.
- Impacto: o terceiro nível (Filial) é **inalcançável por clique**. Só abre
  digitando `&branch=DF` na barra de endereço. Os 17 testes de
  `territorios.test.mjs` passam porque testam `nivelDe`, não o href.
