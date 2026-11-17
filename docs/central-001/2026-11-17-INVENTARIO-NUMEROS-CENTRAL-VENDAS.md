# Inventário de números — Central de Vendas

**Identificador:** CENTRAL-001 · **Projeto:** Central de Vendas (`central-receita`, cópia `.scratch\CENTRAL-001-paineis\app`)
**SHA inventariado:** `c9c78c91f0e1ffeedd47157a0f1e65b702ed19fe`
**Modo:** somente leitura no app. Nada alterado, nada publicado, nada enviado ao Copilot.
**Como foi feito:** texto renderizado de cada tela extraído por CDP do app que está no ar em `127.0.0.1:3012` (dumps em `inventario\`), cruzado com as fontes em código (`src/features/comercial-v3/`). Totais recalculados por script a partir dos arquivos de dados.

## Legenda de classificação

| Classe | Significado |
|---|---|
| **SINTÉTICO** | Valor fictício de cenário demonstrativo; declarado como tal na tela ou no código |
| **FIXTURE** | Valor derivado de carga, mas a carga do demo é um CSV de teste (`tests/fixtures/`), não export real |
| **CALCULADO** | Derivado por fórmula de valores acima; se a base é sintética, o resultado também é |
| **REAL EXPORTADO** | Valor de export real (`real-branches.json`, fonte `forecast mes.xlsx`, set/2026) |
| **BASE DECLARADA** | MRR e grupos do organograma 2027 (`org-2027.ts`), não medidos na carga |
| **NÃO VERIFICADO** | Sem fonte confirmada nesta rodada |

## Quadro de divergências (para a revisão de premissas)

| # | Achado | Evidência |
|---|---|---|
| D1 | **Dois universos no mesmo período.** Meta R$ 12,0 mi (mock) e meta R$ 119,0 mi (export real) na mesma tela, mesmo mês | `system-screen` exibe os dois blocos; `mock-data.ts:66-72` × `real-branches.json` (total) |
| D2 | **"Ganhos no CRM" com três semânticas**: Home diz "não é receita nem pedido integrado"; CSO/Território dizem "já integrado no ERP nesta competência" | `executive-page.tsx` (nota do card) × `cso-screen.tsx:241-243` e território (cards) |
| D3 | **Realizado 8,4 mi (15 negócios mock) × integrado 14,7 mi (22 filiais reais)** — populações distintas com nomes vizinhos | `mock-data.ts:48-62` × `real-branches.json` |
| D4 | **Três "bases" com ordens de grandeza diferentes**: organograma R$ 77,5 mi; cenário Base CSO R$ 362 mil (meta R$ 558 mil); export real meta R$ 119,0 mi | `org-2027.ts:42,141-149`; CSO `resultadoTotal`; `real-branches.json` |
| D5 | **13 filiais sintéticas × 22 filiais reais**, mas o filtro do topo lista as 22 reais | `regional-mock.ts` (13) × `real-branches.json` (22) × `commercial-v3-app.tsx:217` |
| D6 | **Quatro datas na mesma sessão**: filtro set/2026; CSO out/2026 (dados de 28/10); carga 22/10/2026; snapshot 19/09/2026 | dumps das telas; `mock-data.ts` (asOf) |
| D7 | **Os números do ZIP não aparecem em tela alguma** (90.984 históricas, 44.993 snapshot, 11.343 pedidos, 2.458 ausentes). O único dado real exibido é o agregado de 22 filiais | busca nos dumps; `real-branches.json` |
| D8 | **Com carga, o selo "dados fictícios" desaparece**, mesmo quando a carga é o CSV de fixture | `executive-page.tsx` (selo só no estado sem carga) |
| D9 | **Carteira abre em erro** sem nó na URL; **Forecast/New Name/Oportunidades** mostram a mesma Home executiva, não telas próprias | `sem-carga-carteira.txt`; dumps idênticos das três rotas |

---

## A. Home — leitura de MRR

Fonte do modelo: `COMMERCIAL_SNAPSHOT` (`mock-data.ts`), selecionado por `selectHomeModel` (`model.ts`). Todos os números do bloco são **SINTÉTICOS** e a tela declara "Cenário demonstrativo · dados fictícios".

| Número (rótulo) | Valor exibido | Unidade | Origem (arquivo:linha) | Filtros | Classe |
|---|---|---|---|---|---|
| Meta MRR | R$ 12,0 mi | R$ milhões | 8 metas de filial somadas: `mock-data.ts:66-72`; `model.ts:259-263` | período, solução, filial | SINTÉTICO |
| Realizado comercial | R$ 8,4 mi · 70% da meta | R$ milhões | soma de 15 negócios (recorrente+habilitação+serviço): `mock-data.ts:48-62`; `model.ts:257,273-280` | idem | SINTÉTICO |
| Forecast atual | R$ 10,2 mi · 85% da meta | R$ milhões | soma de 18 oportunidades: `mock-data.ts:104-128`; `model.ts:287-290` | idem | SINTÉTICO |
| Diferença para a meta | −R$ 3,6 mi · nota "forecast vs meta −R$ 1,8 mi" | R$ milhões | `resumoMrrMes` em `central-vendas-mrr.ts:244-315`; card em `mrr-reading.tsx:105-107` | idem | CALCULADO |
| Forecast congelado | R$ 11,0 mi · revisão −R$ 800 mil | R$ milhões | `forecastOfficial` das 18 opps; `mrr-reading.tsx:117-120` | idem | CALCULADO |
| Contas novas | 7 contas · R$ 5,1 mi em ganhos | contas / R$ milhões | `model.ts:441` (contas distintas New Name) e `:323` (valor New Name) | idem | SINTÉTICO |

**Estado sem carga:** bloco acima + selo + "Nenhuma carga importada." + nota de que as leituras são do cenário (`executive-page.tsx:285-325`).
**Estado carregando:** só o esqueleto de altura fixa; nenhum número (`executive-page.tsx:283`).
**Estado falha:** cartão "Não foi possível consultar a carga." + mensagem + "Tentar novamente"; nenhum número de MRR (`executive-page.tsx:303-324`; verificado nas capturas `12-...` e no SHA `c9c78c9`).
**Estado com carga:** bloco sintético sai; entram os números da carga (seção C).

## B. Home — Diretorias 2027

Fonte `org-2027.ts`. **BASE DECLARADA** no planejamento; a própria tela diz "Modelo em construção, sujeito a revisões orçamentárias".

| Número | Valor | Unidade | Origem | Classe |
|---|---|---|---|---|
| MRR da base | R$ 77,5 mi · 4.092 grupos | R$ / grupos | `MRR_TOTAL = 77.5e6` (`org-2027.ts:42`); soma das verticais | BASE DECLARADA |
| Demais Segmentos | R$ 38,0 mi · 49% · 1.634 grupos | R$ / % / grupos | `org-2027.ts:47` | BASE DECLARADA |
| Construção | R$ 15,0 mi · 19% · 1.299 grupos | idem | `org-2027.ts:67` | BASE DECLARADA |
| Indústria | R$ 14,5 mi · 19% · 752 grupos | idem | `org-2027.ts:83` | BASE DECLARADA |
| Agronegócio | R$ 10,0 mi · 13% · 407 grupos | idem | `org-2027.ts:96` | BASE DECLARADA |
| Território 01 | R$ 21,2 mi · 1.104 grupos · 27% | R$ / grupos / % | `org-2027.ts:141` | BASE DECLARADA |
| Território 02 | R$ 10,0 mi · 731 · 13% | idem | `org-2027.ts:143` | BASE DECLARADA |
| Território 03 | R$ 30,5 mi · 1.374 · 39% | idem | `org-2027.ts:145` | BASE DECLARADA |
| Território 04 | R$ 15,8 mi · 882 · 20% | idem | `org-2027.ts:147` | BASE DECLARADA |
| Território 05 | sem MRR · 0 grupos (Norte, novos via canais) | — | `org-2027.ts:149` | BASE DECLARADA |

## C. Home — seções de carga (Forecast, New Name, Oportunidades)

Todas alimentadas por `importDraft` (`commercial-v3-app.tsx:371`). No demo atual a carga é o par de CSVs de fixture (5 linhas cada; `tests/fixtures/*-20261022.csv`), então a classe é **FIXTURE** — números reais de carga real não foram vistos.

| Número | Valor exibido | Unidade | Origem | Classe |
|---|---|---|---|---|
| Carga | 22/10/2026 | data | data de referência informada na importação; `manual-import-client.ts` | FIXTURE |
| Previsto para o mês | R$ 14 mil | R$ | seção Forecast; componentes de forecast sobre a carga | FIXTURE |
| Ganhos no CRM | R$ 7 mil · 46% do previsto | R$ | idem | FIXTURE |
| Em aberto | R$ 8 mil | R$ | idem | FIXTURE |
| Contas novas | 3 contas · 3 pedidos | contas | seção New Name | FIXTURE |
| Pedidos conferidos | R$ 2 mil · 2 pedidos · 2 contas | R$ | manutenção dos pedidos; nota "não é fatia dos ganhos" | FIXTURE |
| Saldo do mês | — | R$ | aparece a partir da 2ª carga | FIXTURE |
| Trajetória | Previsto R$ 8 mil · Ganhos R$ 7 mil | R$ | gráfico da carga | FIXTURE |
| Resumo de hoje | 3 contas · 3 pedidos · 2 opps · R$ 8 mil até 01/2027 · 1 vencida | — | blocos da Home com carga | FIXTURE |
| Perdido no mês | R$ 900 | R$ | composição do previsto | FIXTURE |
| Forecast por filial | Unidade Sul R$ 8 mil · 100% · ganhos 87% | R$ / % | filial = unidade da oportunidade na carga | FIXTURE |
| Movimentos | Alfa +R$ 4 mil · Beta +R$ 3 mil · Gama −R$ 900 | R$ | "maior impacto primeiro" | FIXTURE |
| New Name | mensalidade nova R$ 3 mil · conferido R$ 2 mil · ganhou R$ 3 mil · saldo +R$ 2.500 | R$ | seção New Name | FIXTURE |
| Oportunidades | pipeline R$ 8 mil · 2 abertas · Negociação R$ 6 mil · Proposta R$ 2 mil · previsão R$ 8 mil Out/26 | R$ / contagem | seção Oportunidades | FIXTURE |

## D. Territórios — Visão CSO

Fonte `REGIONAL_SNAPSHOT` (`regional/regional-mock.ts`), 13 filiais e 136 oportunidades fictícias. **SINTÉTICO**, com selo "dados fictícios" e "Sem regra de atribuição por vigência".

| Número | Valor exibido | Unidade | Origem | Classe |
|---|---|---|---|---|
| Competência | Outubro/2026 · dados de 28/10/2026 · último dia útil 30/10 | data | `REGIONAL_SNAPSHOT.asOf/ultimoDiaUtil` | SINTÉTICO |
| T01–T05 BASE/meta/% | 75/144 · 52%; 143/172 · 83%; 49/96 · 51%; 81/116 · 70%; 14/30 · 46% | R$ mil / % | `regional-mock.ts` (metas por filial) + `regional-model.ts:208-221` | SINTÉTICO |
| Filiais por território | 3 / 4 / 1 / 3 / 2 | contagem | `regional-mock.ts` | SINTÉTICO |
| Pior filial | SC 0%; MS 20%; SP 26%; BA 27%; TO 29% | % | derivado das filiais | CALCULADO |
| Matriz T × V (20 células) | 97/92/99/93 … 104/98/93/101 | % | `central-vendas-mrr.ts:38-62` (tabelas) e `:111-124` (fórmula: meta = base × 1,10; realizado = meta × desempenho; forecast = meta × cobertura) | SINTÉTICO |
| Base da matriz | soma R$ 77,4 mi × R$ 77,5 mi declarados · diferença R$ 123 mil | R$ | `central-vendas-mrr.ts:197-211`; `org-2027.ts:42` | CALCULADO sobre BASE DECLARADA |
| Cenário Base MRR | 65% da meta · R$ 362 mil de R$ 558 mil | % / R$ mil | `regional-model.ts:217-221` sobre `regional-mock.ts` | SINTÉTICO |
| Ganhos no CRM | R$ 255 mil — "já integrado no ERP nesta competência" | R$ | `cso-screen.tsx:241-243`; valor de `resultadoTotal(...).ganho` | SINTÉTICO + rótulo em conflito (D2) |
| Territórios no alvo | 1 de 5 (cenário Base ≥ 70%) | contagem | contagem sobre os 5 territórios | CALCULADO |
| Filiais no recorte | 13 | contagem | `regional-mock.ts` (13) | SINTÉTICO (D5) |
| Comparação entre territórios | falta p/ 70%: R$ 7 / 18 / 26 / 0,5 / 0 mil | R$ mil | `cso-screen.tsx` tabela | CALCULADO |

## E. Território 01 — detalhe

Fonte `regional-mock.ts` / `regional-model.ts`. **SINTÉTICO**.

| Número | Valor | Unidade | Origem | Classe |
|---|---|---|---|---|
| Filiais (base/meta/%) | RS 29/62 · 47%; SC 10/38 · 27%; PR 35/44 · 79% | R$ mil / % | `regional-mock.ts` (rubricas) + `resultadoFilial` | SINTÉTICO |
| Cenário Base MRR | 52% · R$ 75 mil de R$ 144 mil | % / R$ mil | `resultadoTotal` recortado | SINTÉTICO |
| Ganhos no CRM | R$ 56 mil — "integrado no ERP nesta competência" | R$ | cards do território | SINTÉTICO + rótulo D2 |
| Falta para 70% | R$ 26 mil | R$ | `falta` do bloco | CALCULADO |
| Filiais | 3 · 4 executivos | contagem | organograma + mock | SINTÉTICO |
| Heatmap (5 colunas × 3 filiais) | RS 35/36/35/47/61; SC 0/22/28/27/50; PR 77/112/90/79/108 | % | `resultadoRubrica` e `resultadoFilial` | SINTÉTICO |

## F. Sistema de Receita

| Número | Valor | Unidade | Origem | Classe |
|---|---|---|---|---|
| Meta do mês | R$ 12,0 mi | R$ milhões | mock (`mock-data.ts:66-72`) | SINTÉTICO |
| Ganhos no CRM | R$ 8,4 mi · 70% | R$ milhões | mock (`mock-data.ts:48-62`) | SINTÉTICO |
| Forecast oficial | R$ 11,0 mi · 92% | R$ milhões | mock (`forecastOfficial`) | SINTÉTICO |
| Forecast atual | R$ 10,2 mi · 85% · −7,3% vs oficial | R$ milhões | mock (`forecastCurrent`) | SINTÉTICO |
| Δ vs meta | −R$ 1,8 mi · −15% | R$ milhões | cálculo | CALCULADO |
| Movimentos | Saiu 2 · −R$ 900 mil; Postergou 3 · −R$ 600 mil; Alterou 2 · −R$ 300 mil; Entrou 3 · +R$ 1,0 mi | R$/contagem | mock (`movement`, `delta`) | SINTÉTICO |
| **Agregado real por filial** | Meta R$ 119,0 mi · Integrado R$ 14,7 mi · Forecast R$ 10,3 mi | R$ milhões | `real-branches.json` (fonte `forecast mes.xlsx`, unidade `BRL_millions`, realizado = pedidos integrados); 22 filiais | **REAL EXPORTADO** |
| Filial (22 linhas) | ex.: Inside Sales 3,8/31,3/507 mil · 12%; SP 1,9/17,8/590 mil · 11%; MS 761 mil/1,9 mi/471 mil · 41% | R$ | idem; `test-data.ts:20-28` (`realBranches`) | REAL EXPORTADO |

O bloco real é ativado só no recorte mensal: `home.filiais = realBranches(branch)` (`commercial-v3-app.tsx:198`) e `filiaisReais={!visualPreviewEnabled && period === 'month'}` (`:397`).

## G. Carteira

Sem número por padrão: a rota `?view=carteira` abre com "Nó não encontrado na estrutura" (falta `idNo`). Com nó, os rótulos são "Previsto do mês", "Ganhos no CRM" (nota "Não é realizado de vendas"), "travadas" e "resíduo" (`carteira-screen.tsx:132-138,203`). **NÃO VERIFICADO nesta rodada** (sem nó na URL).

## H. Configurações

Não exibe números de negócio. Lista 8 colunas obrigatórias de oportunidades e 9 de pedidos; estado com carga mostra "5 linhas lidas", nome do arquivo, referência 22/10/2026 e horário de atualização (`import-screen.tsx:327-398`).

## I. Jornada, Cross e Contas

| Tela | Números | Origem | Classe |
|---|---|---|---|
| Jornada | volumes 2.400 → 541, conversões %, dias por etapa, indicadores de crescimento/cobertura/retenção | `journey-screen.tsx:14-35` (`ETAPAS_DEMO_BASE`), marcado "Demonstrativo fixo" | SINTÉTICO |
| Cross | nenhum número; "Classificação indisponível" | `cross-screen.tsx` | — |
| Contas | 18 clientes · 18 oportunidades | mock (`mock-data.ts`, 18 opps); "Cenário simulado" | SINTÉTICO |

## O que **não** aparece no app

As quatro populações informadas ao time — 90.984 oportunidades históricas, 44.993 no snapshot CRM, 11.343 pedidos integrados em 2026 e 2.458 ausentes da base V2.1 — **não são exibidas em nenhuma tela**. A única leitura de dado real é o agregado mensal de 22 filiais (meta/realizado/forecast) em Sistema de Receita.

## Limitações desta rodada

- Estado **com carga** usa os CSVs de fixture; uma carga real (planilhas do Bruno/CRM) não foi importada.
- Estado **de falha**: o cartão foi verificado em rodada anterior com captura; nesta rodada o dump saiu antes da propagação do erro.
- Telas com `?demo=1` (versões antigas de Forecast/New Name/Oportunidades) não foram inventariadas.
- Carteira sem nó não foi aberta com dados.
- A consistência semântica dos números reais (se "pedidos integrados" de set/2026 é a métrica correta de realizado) é **NÃO VERIFICADA** — depende da revisão de premissas com o Planejador.
