# Matriz de achados do Copilot — CENTRAL-001-HOME · SHA `0187047`

Etapa 1 do goal "Home da Central pronta para avaliação de Bruno" · 17/11/2026
Verificador: Explorer (somente leitura) · Branch `central-001/home-giovanne` · HEAD `01870470ff26a3730c0f66b1c62767caf5330f1f`
Cópia: `.scratch\CENTRAL-001-paineis\app` · Nada foi alterado no app, no repo ou nos dados.

## Placar

| Classificação | Quantos | Quais |
|---|---|---|
| **CONFIRMADO** | 13 | A1, A2, A3, A4, A5, A6, A7, A8, A9, X1, X3, X4, X5 |
| **REFUTADO** | 1 | X2 |
| **INCONCLUSIVO** | 0 | — |

## A1 — Sinal de `linhasSegmento` × `textoAtingimento` · **CONFIRMADO**

- **Fato (código):** `home-giovanne.ts:109` grava `absoluto = meta − realizado` (positivo = falta). `home-resultado.tsx:65-70` lê `absoluto < 0` como "faltam" e `> 0` como "acima". `home-resultado.tsx:227` passa `linha.absoluto` para essa função. O sinal está invertido na tabela de Segmentos.
- **Fato (tela, 1440):** as 5 linhas estão abaixo da meta e **todas** leem "acima": `97% · R$ 1,2 mi acima`, `98% · R$ 446 mil acima`, `95% · R$ 770 mil acima`, `93% · R$ 828 mil acima`, `96% · R$ 3,2 mi acima`. Captura `67-etapa1-A1-tabela-atingimento-visivel.png`.
- **Impacto:** alto. A coluna "Atingimento" diz o contrário do que os números mostram. É defeito, não escolha comercial.
- **Correção mínima (fora do escopo desta etapa):** usar `realizado − meta` ao chamar a função, ou um formatador próprio da tabela.

## A2 — Meta/atingimento fictícios sob selo "Planejamento" · **CONFIRMADO**

- **Fato (código):** `central-vendas-mrr.ts:35` `META_MENSAL = 1.1`; `:38-44` `DESEMPENHO` fixo; `:111-113` `meta = base × 1,1` e `realizado = meta × desempenho`. Só a **base** vem do organograma (`org-2027.ts`). `home-resultado.tsx:174` põe selo `planejamento`; `:173` descreve apenas "base declarada, não é realizado".
- **Fato (tela):** selo "Planejamento · 2027 · base declarada (org-2027)" com coluna "Atingimento" cheia (97%, 98%, …). A frase que declara meta/realizado/forecast sintéticos (`central-vendas-mrr.ts:209`, `aviso`) **não** aparece na Home — só em Territórios/Carteira.
- **Impacto:** médio-alto. Número de cenário sob rótulo de planejamento. **Escolha comercial:** declarar que meta/realizado são sintéticos no bloco, ou tirar meta/atingimento da Home.

## A3 — Tabela e Export aparecem em carregamento/erro · **CONFIRMADO**

- **Fato (código):** `executive-page.tsx:171-175` (`BlocoExport`) e `:177-183` (`TabelaSegmentos`) são renderizados sem condição de estado. Só o bloco Demo (`:139`) e a série (`:185`) são condicionais.
- **Fato (tela):** em carregamento e em erro as seções `resultado-export` e `resultado-segmentos` existem no DOM; no erro, o texto mostra "Export real · 22 filiais", "Meta do mês (export)" R$ 119,0 mi e "Pedido integrado (ERP)". Capturas `62` e `63`.
- **Nuance:** não é dado velho da carga que falhou — são universos isolados, com selo próprio (Export / Planejamento). Mesmo assim, aparecem numa tela que acabou de dizer "Não foi possível consultar a carga".
- **Impacto:** médio. **Escolha comercial:** esconder no erro/carregamento ou manter com aviso explícito de que não dependem da carga.

## A4 — Filtro de segmento não atua nos blocos Demo/Carga/Export, não avisa e fica dentro do bloco da tabela · **CONFIRMADO** (com nuance no "quarto")

- **Fato (código):** `executive-page.tsx:96` lê `segmento`; `:179` só o entrega a `TabelaSegmentos`. `BlocoResultadoDemo` (`:140`), `BlocoCargaTeste` (`:168`) e `BlocoExport` (`:171`) não recebem o recorte.
- **Fato (tela):** com `?segmento=construcao` a tabela reduz a uma linha ("Construção") e o texto do bloco Demo fica **idêntico**. Não há frase dizendo que o filtro vale só para a tabela; as únicas menções a "recorte" são sobre o link para Territórios (`home-resultado.tsx:247-249`). Captura `61`.
- **Nuance:** em sem carga, o DOM tem `home → resultado-demo → resultado-export → resultado-segmentos` — o filtro está no **4º** bloco. Com carga, o Demo sai e ele passa a ser o 3º.
- **Impacto:** médio. O usuário muda um filtro e os outros números não se movem. **Escolha comercial:** aplicar o recorte aos demais blocos ou rotular o escopo do filtro.

## A5 — Nome "Giovanni" · **CONFIRMADO**

- **Fato (código):** `executive-page.tsx:110` `const nome = ... : 'Giovanni'`; `:126` usa `Bom dia, ${nome}` só quando há carga. Sem carga o título é "Visão Executiva" (confirmado na tela).
- **Fato (evidência do Builder):** a captura `12-home-com-carga-0187047.png` mostra "Bom dia, Giovanni". É observação do Builder; eu só li a imagem.
- **Impacto:** baixo (cosmético/persona). **Escolha do Bruno:** "Giovanni" × "Giovanne Farias" (o organograma em `org-2027.ts:48` diz "Giovanne Farias").

## A6 — Leitura MRR + NR contra a mesma meta · **CONFIRMADO** (declarado, não oculto)

- **Fato (código):** `home-resultado.tsx:99-101` calcula `atComNr = atingimento(mrr + nrTotal, meta)` e imprime as duas leituras.
- **Fato (tela):** "Atingimento de MRR 52% · faltam R$ 5,8 mi — conta só a recorrência. Somando a NR (R$ 2,2 mi) … 70% · faltam R$ 3,6 mi. A fonte não declara se a meta mede só recorrência ou a receita total; a definição segue pendente." Aritmética conferida: 6,2/12 = 51,67%; 8,4/12 = 70,00%.
- **Impacto:** depende de Q2. Hoje é uma **segunda leitura declarada**, não dupla contagem escondida. **Escolha do Bruno (Q2):** se a meta é só recorrência, a leitura com NR deve sair ou virar nota.

## A7 — Ganhos da carga sem filtro da data de fechamento por mês · **CONFIRMADO** (código)

- **Fato (código):** `home-resultado.tsx:114-116` soma **todos** os registros com `fechada e ganha` do lote, sem olhar `closingDate`. O campo existe no registro (`manual-import.ts:29`), e as outras telas filtram por mês: `manual-import.ts:341` filtra `forecastDate` pelo mês em `selectImportedForecast`.
- **Limite:** a fixture atual não tem dois meses no mesmo lote, então a tela não expõe o erro — a prova é o código.
- **Impacto:** alto quando o CSV trouxer mais de um mês: "Ganhos no CRM (teste)" passa a somar competências diferentes com o rótulo de um mês. Além disso, "Em aberto (teste)" (`:117`) também não filtra `forecastDate`.
- **Natureza:** defeito de regra de negócio, não escolha.

## A8 — Toda carga rotulada Teste/não real · **CONFIRMADO**

- **Fato (código):** `executive-page.tsx:109` usa `seloDoBloco(temCarga ? 'teste' : 'demo', …)`; `home-resultado.tsx:120-124` título "Carga de teste" e "Não é dado real nem cenário oficial".
- **Impacto:** qualquer planilha que o Bruno importe continua "Teste". **Escolha comercial:** manter a trava (seguro) ou criar caminho para a carga real com selo próprio.

## A9 — Testes apenas de funções, sem tela renderizada · **CONFIRMADO**

- **Fato:** 379 testes em 34 arquivos; todos importam `node:test` + módulos puros. Busca por `jsdom`, `happy-dom`, `react-dom`, `@testing-library`, `playwright`, `puppeteer` nos testes: **zero**. `executive-reading.test.mjs` lê fixtures CSV e funções de modelo, não componentes.
- **Impacto:** regressões de renderização (o A1 desta matriz, o hífen da barra) não aparecem na suíte; só na medição de tela. **Recomendação:** um teste de render/DOM mínimo para a Home.

## X1 — Rota forecast/gestão abre a própria Home · **CONFIRMADO**

- **Fato (código):** `commercial-v3-app.tsx:60` `PAGINA_CORRIDA` inclui `forecast`; `:144` `executiveView = view === 'home' || (PAGINA_CORRIDA.includes(view) && !demoRequested)`; `:408` o `ForecastScreen` só aparece no ramo de demo/sem carga.
- **Fato (tela):** `/?view=forecast` mostra `h1` "Visão Executiva" e os blocos `resultado-demo`, `resultado-export`, `resultado-segmentos` — a mesma Home. Captura `64`.
- **Impacto:** médio. O link "Gestão de vendas" da Home promete "a leitura completa" em Forecast, mas abre a própria Home. **Escolha do Bruno:** decidir o destino do link.

## X2 — Filtro de 22 filiais continua no topo da Home · **REFUTADO**

- **Fato (código):** `commercial-shell.tsx:121-133` renderiza `CommercialTopbar` só quando `!executiveMode`; a Home é `executiveMode` (`commercial-v3-app.tsx:144`). O `<select>` de filial vive no topbar (`commercial-sidebar.tsx:341-352`).
- **Fato (tela):** Home: `header.revenue-topbar` ausente e **0** selects com "Todas as filiais". Em `/?view=system`: o select existe, dentro de `header.revenue-topbar`, com **23 opções** (Todas + 22). Captura indireta nos logs da etapa 1.
- **Impacto:** nenhum na Home — o filtro nunca foi o que mudava os números dela (ver A4). **Escolha comercial:** nenhuma.

## X3 — Valores recorrente/habilitação/serviço no mock · **CONFIRMADO**

- **Fato (código):** `mock-data.ts:47-63` (15 negócios com `recurring`/`enablement`/`services`) e `:44` registra as somas travadas: total 8,4 · recorrente 6,2 · habilitação 1,1 · serviços 1,1.
- **Fato (tela):** bloco Demo mostra `R$ 6,2 mi`, `R$ 1,1 mi`, `R$ 1,1 mi`, `R$ 2,2 mi`, meta `R$ 12,0 mi`.
- **Impacto:** baixo, desde que o bloco continue rotulado "Demo".

## X4 — Sistema de Receita ainda exibe ganho 8,4 mi / 70% · **CONFIRMADO**

- **Fato (código):** `system-screen.tsx:57-60` renderiza `KpiStrip kpis={model.kpis}` — o mesmo modelo demonstrativo — com o aviso "Indicadores abaixo: snapshot demonstrativo, não são números fechados."
- **Fato (tela):** `/?view=system` contém "8,4 mi" e "70%", com o rótulo demonstrativo presente. Captura `65`.
- **Impacto:** médio. Os mesmos números aparecem em duas telas; se Q2 mudar a leitura, as duas precisam mudar juntas. **Escolha do Bruno:** Q2.

## X5 — Diferença 77,4 mi × 77,5 mi · **CONFIRMADO** (e já declarada)

- **Fato (conta):** soma das bases da matriz = **77,377 mi** (exibido como 77,4); `MRR_TOTAL = 77,5e6` (`org-2027.ts:42`); resíduo de **0,123 mi**.
- **Fato (tela):** em Territórios, o rodapé da matriz diz "Soma da matriz R$ 77,4 mi contra R$ 77,5 mi declarados — diferença de R$ 123 mil, mantida à vista e não redistribuída." Captura `66`.
- **Impacto:** baixo — o resíduo está declarado na tela e não foi redistribuído. **Escolha comercial:** reconciliar em outra rodada ou manter declarado.

## Limites desta matriz

1. **A7** está confirmado no código, mas não é observável na fixture atual (um mês só no lote).
2. **A5** foi observado em captura do Builder, não em execução minha com carga.
3. **A3** foi medido pela presença das seções e do texto; o cabeçalho da tabela está em caixa alta no DOM.
4. **A9** é inventário de testes, não julgamento de cobertura: pode haver teste de componente em outro repo/rótulo que eu não veja aqui.
5. Meu primeiro passe de medição (`logs\etapa1-achados-0187047.log`) teve 5 falhas **do meu medidor** (regex do mock, seletor do topbar dentro de `<aside>`, "recorte" no aviso, recorte de texto no erro, seletor do KpiStrip). Corrigi e refiz em `logs\etapa1-achados-0187047-parte2.log` e `68-...`; nenhuma mudou o veredito de um item.

## Resumo para decisão

- **Defeitos de regra, sem escolha comercial:** A1 (sinal invertido) e A7 (ganhos sem filtro de competência).
- **Rótulo/escopo que pedem decisão:** A2 (sintético sob "Planejamento"), A3 (blocos no erro), A4 (escopo do filtro), A8 (trava "Teste"), X1 (link que abre a Home).
- **Decisões do Bruno já mapeadas:** A5 (persona), A6/Q2 (meta), X4 (8,4/70% em duas telas).
- **Sem ação:** X2 (refutado) e X5 (já declarado).

Próximo passo, se o Chief autorizar a etapa 2: A1 e A7 são correções pequenas e independentes de decisão comercial; o resto precisa da palavra do Bruno ou de um contrato de rotulagem.
