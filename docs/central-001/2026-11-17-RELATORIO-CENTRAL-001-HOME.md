# CENTRAL-001-HOME — Home como raio-X do resultado mensal

**Branch:** `central-001/home-giovanne` (local, a partir de `c9c78c9`)
**SHA final:** `cf9a42639c3d405019fce5acebfaf7a2543e6349`
**Diff:** 12 arquivos, +789/−403 (um escritor; sem tocar em `main`, sem push, deploy ou dado real)

## P0 — obrigatório, na ordem do contrato

| # | Item | O que foi feito | Evidência |
|---|---|---|---|
| 1 | Selo de origem em todo bloco (Demo/Teste/Planejamento/Export, com período e referência) | `SeloOrigem` + `seloDoBloco` em cada bloco; selo do topo e do bloco de carga usam a referência da importação | prints 01/02; `medicoes-home.json` (selos `Demo` e depois `Teste · out/2026 · carga de 22/10/2026`) |
| 2 | “Ganhos no CRM” com um significado só | removido “já integrado no ERP nesta competência” de `regional/cso-screen.tsx` e `regional/territorio-screen.tsx`; textos de ajuda de `territorio-screen.tsx` e `regional-screen.tsx` agora dizem “Ganho no CRM — não é receita nem pedido integrado” | `git diff c9c78c9 cf9a426` nesses arquivos |
| 3 | MRR só recorrência; NR em linha separada | `separarMrrNr` (recorrente×habilitação×serviço) e bloco “Resultado do mês” com 4 cartões: MRR ganho, Habilitação (NR), Serviço (NR), Total NR | print 01 (R$ 6,2 mi · R$ 1,1 mi · R$ 1,1 mi · R$ 2,2 mi); teste “MRR é só recorrência…” |
| 4 | Forecast fora da Home | removidos da Home: cartões de previsto/ganhos/em aberto/pipeline, trajetória, “Resumo de hoje”, composição e impacto; sobra o link “Gestão de vendas” | medida `temForecastNaHome: false`; print 01 |
| 5 | Filtros na entrada (Segmento/vertical e Todos/Novos/Base) sem o filtro de 22 filiais | `TabelaSegmentos` com `select` de segmento + botões Todos/Base/Novos; estado em `segmento`/`corte` na URL; pill “todos os segmentos” no consolidado; a topbar de filiais não aparece na Home | prints 03/04; medidas `?corte=novos`, `?corte=novos&segmento=construcao` |
| 6 | Nunca juntar universos no mesmo bloco | blocos isolados: Demo (cenário), Teste (carga da sessão), Export (22 filiais) e Planejamento (2027), cada um com selo próprio; nenhum total soma blocos | prints 01/02; medidas `temDemo:false` com carga de teste |

## P1 — conforme fonte disponível

| # | Item | O que foi feito |
|---|---|---|
| 1 | Números por segmento | tabela com MRR base, meta, atingimento (% + absoluto) e peso no MRR. Clientes, ticket médio e novos clientes aparecem como **sem fonte** (a base de planejamento não tem essas contagens) |
| 2 | Evolução semanal (semanas 1–5) | `BlocoEvolucaoSemanal` com previsão e ritmo do cenário; com carga de teste, “sem fonte” explícito, sem estimativa |
| 3 | Diretorias 2027 sai da Home | `DiretoriasSection` movida para Territórios, na seção “Planejamento 2027” com selo próprio |
| 4 | Detalhe do território mantendo filtros | `segmento`/`corte` entram no contexto de navegação; o link da tabela leva o recorte; a matriz de Territórios abre já filtrada e o clique na célula preserva o recorte | print 05 (`Recorte vindo do painel: Construção · corte Novos`, 1 coluna) |
| 5 | Percentual sempre com absoluto | atingimento do Demo, do Export e de cada segmento mostra `% · faltam R$ X` (ou `R$ X acima`) |

## Diff arquivo a arquivo

| arquivo | P0/P1 | mudança |
|---|---|---|
| `src/features/comercial-v3/home-giovanne.ts` (novo) | P0.1/3/5/6, P1.1/2/5 | regras puras: selo, MRR×NR, atingimento, linhas por segmento, export, semana, filtros |
| `src/features/comercial-v3/components/home-resultado.tsx` (novo) | P0.1/3/6, P1.1/2/5 | selos, blocos Demo/Teste/Export, tabela de segmentos e evolução semanal |
| `src/features/comercial-v3/screens/executive-page.tsx` | P0.1–6, P1.1/2/4 | Home reescrita como raio-X; remove forecast/trajetória/pipeline; filtros; links |
| `src/features/comercial-v3/commercial-v3-app.tsx` | P0.5, P1.4 | leva `segmento`/`corte` ao montador de href |
| `src/features/comercial-v3/context.ts` / `types.ts` | P0.5, P1.4 | lê e serializa `segmento`/`corte` na URL |
| `src/features/comercial-v3/screens/territorios-screen.tsx` | P1.3/4 | recebe o recorte, passa à matriz e recebe a seção Planejamento 2027 |
| `src/features/comercial-v3/components/matriz-territorios-verticais.tsx` | P1.4 | inicia corte/segmento do painel, filtra coluna e avisa o recorte; células preservam via nav |
| `src/features/comercial-v3/regional/cso-screen.tsx` | P0.2 | “Ganho no CRM — não é receita nem pedido integrado” |
| `src/features/comercial-v3/regional/territorio-screen.tsx` | P0.2 | mesmo rótulo nos cards e na ajuda |
| `src/features/comercial-v3/screens/regional-screen.tsx` | P0.2 | ajuda do mapa alinhada |
| `tests/home-giovanne.test.mjs` (novo) | aceite 6 | 10 testes: selo pós-importação, MRR×NR, percentual+absoluto, total por soma, filtros na navegação |

## Verificação (saídas brutas)

| comando | resultado | log |
|---|---|---|
| `node --experimental-strip-types --test --test-isolation=none tests/*.test.mjs` | **377/377, exit 0** (367 anteriores + 10 novos) | `logs/tests-home-20261117.log` |
| `npx tsc --noEmit --incremental false` | **exit 0** | `logs/tsc-home-20261117.log` |
| `npm run build:static` (next build --webpack) | **exit 0**, 3/3 páginas geradas | `logs/build-home-final-cf9a426.log` |

**Sobre o antigo `spawn EPERM`:** ele não se reproduz nesta sessão com acesso amplo ao processo; o build compila, roda TypeScript e gera as páginas. O log anterior (`logs/build.log`, 16/11) registrava a falha; a diferença é o sandbox que bloqueava a abertura de workers — não uma regra de negócio ou erro de código. O build do SHA entregue é **verde e comprovado**.

## Prints

Em `evidencias/central-001-home/` (headless, dados sintéticos, perfil isolado; servidor encerrado):

1. `01-home-sem-carga.png` — Demo, MRR×NR, Export, Segmentos, Evolução semanal
2. `02-home-carga-teste.png` — Teste com data da carga; MRR/NR “sem fonte”
3. `03-home-filtro-novos.png` — corte Novos
4. `04-home-filtro-construcao.png` — segmento Construção
5. `05-territorios-com-filtros.png` — matriz já no recorte, com aviso
6. `06-home-mobile.png` — 390/390 sem overflow
7. `07-home-erro.png` — erro sem bloco Demo

Medições: `evidencias/central-001-home/medicoes-home.json` (selos por estado, URLs, colunas, largura).

## Sem fonte (declarado na tela)

- MRR e NR da **carga de teste** — o CSV não separa recorrência, habilitação e serviço.
- Clientes, ticket médio e novos clientes **por segmento** — a base de planejamento não traz essas contagens.
- **Série semanal** da carga de teste — a planilha não tem evolução semanal.
- **Data de referência do export** — a fonte não declara; o bloco diz isso.
- **Cobertura da meta por segmento** — exigiria forecast, que o P0 removeu da Home; o atingimento (realizado ÷ meta) é mostrado no lugar.

## Limites e pontos para decisão

- Os números por segmento são **planejamento 2027** (org-2027), não realizado; estão no bloco com selo Planejamento e não se comparam aos demais.
- O bloco Export usa o agregado real das 22 filiais; pedido integrado não é receita nem MRR.
- A Home cumprimenta “Giovanni”; o diretor no organograma é “Giovanne Farias”. Não alterei o nome da persona (fora do P0/P1) — fica para decisão.
- Nada de Carteira, Jornada, Cross, Contas ou Configurações foi alterado.

## Estado do `next-env.d.ts`

Continua **modificado** com os caminhos de desenvolvimento (`.next/dev/types`), exatamente como estava antes do lote. **Não foi revertido nem incluído no commit**; o `git status` da branch mostra só ele como alteração não rastreada no commit.

## Operações externas

Nenhuma: sem push, merge, deploy, publicação ou importação de dado real. A branch existe só na cópia local; o repo original segue em `bd1dfe9`.
