# Escopo selado — Feed do Diretor v1 (Central de Receita)

**Decidido por Bruno em 28/09/2026 via grilling (3 rodadas), com reunião Nolasco (18/09) como fonte de dores.**

## O produto em uma frase

Feed contínuo e agêntico para o **diretor comercial** — proativo ("exige você"), conversando com os dados **em casa** (sem expor nada a chatbots externos) — não "mais um dashboard".

## Decisões (todas DECISÃO DO USUÁRIO)

| # | Decisão |
|---|---|
| 1 | **Usuário: DIRETOR primeiro.** Nolasco é head de vendas; a Central é a camada ACIMA da visão dele. A camada do executivo vem depois, sobre o mesmo domínio. |
| 2 | **Núcleo:** forecast · pipeline · new names · acompanhamento cross · ganhando/perdendo no mês — com **drill até o fundo da opp e volta ao ponto exato** (`IrPara(..., {de, foco})` já suporta). |
| 3 | Congelamento/fotografia oficial: **fase 2** (conceito mapeado; `estado_anterior` já suporta; não desenhar agora). |
| 4 | Orçamento/simulador/GPS-QIC: **outra frente** RevOps. Viabilidade/desconto: **fora — "esquece"** (dado de desconto não estruturado). |
| 5 | **Nada da base do Nolasco** — apenas as dores (são comuns). Mock sintético próprio continua. |
| 6 | **"Perdemos e ainda não é cliente"**: ENTRA no v1 — contas com ≥1 perda e 0 ganhos + valor perdido acumulado, com drill (peso para negociação). |
| 7 | **Win/loss histórico por conta**: ENTRA no v1, **só no drill** (relacionamento da conta para cross). Deriva de `/api/winloss` (conta/responsável/motivos já presentes). |
| 8 | **Filtros da topbar (v1): Unidade (29) · Conceito (público/privado) · Período** — os três já suportados pelo recorte global; zero backend novo. |
| 9 | **Metas/atingimento: FORA do v1** (sem fonte oficial); slot reservado no cartão de forecast. |
| 10 | **Pergunte à Receita LLM-first ANTECIPADO para o v1** ("com certeza"): o pitch é "não precisa conectar no Claude — fazemos em casa". Motor LLM sob controle (chave local/infra Senior), números sempre do domínio ("CRM → regra → indicador → decisão → agente"), fallback por regras sem chave. |
| 11 | **Ordem dos cartões do feed:** 1 Exige você · 2 Forecast do mês (PEX+projeção, slot de meta) · 3 Entra na semana · 4 Pipeline por etapa · 5 New Name do mês · 6 Cross + Perdas ("ainda não é cliente") · 7 Unidades (29). |

## Forma (decidida nas rodadas de design de 28/09)

- **Feed CONTÍNUO**: coluna única, o conteúdo flui no scroll como rede social; só o **indicador lateral** muda de posição — NÃO cartões-snap de tela cheia.
- **Identidade Senior real** (tokens do app): claro `#f6f9fe`, cards brancos, hairline, esmeralda `#00968c`, Public Sans, tabular-nums. Nada de dark/neon/"cara de IA".
- **Régua de beleza**: o GPT anterior "Central de Inteligência de Receita" (https://central-inteligencia-new-names.workspace-947623.chatgpt.site/ — aberto no IAB do Bruno) está "muito mais bonito": clareza generosa, tipografia grande, cards limpos estilo produto ChatGPT — nível de polish a igualar ou superar.

## Fontes de material

- Reunião Nolasco 18/09: `docs/design/reuniao-nolasco-2026-09-18.md` (dores e estrutura completas).
- PDF Senior MG 43 pág.: catálogo campo-a-campo em produção (`docs/design/material-senior-mg.md`, workflow em conclusão).
- Acervo essencial: `docs/design/acervo-copilot-sintese.md`.
- Estado técnico: `docs/design/harness-inventario-2026-09-28.md` + plano v2.

## Fora do v1 (registrar para o roadmap)

Congelamento (f2) · metas (sem fonte) · viabilidade/desconto (sem dado) · camada do executivo (agenda do dia, linha do tempo, espaço em branco detalhado) · orçamento/GPS (outra frente) · mapa territorial · NPS/churn · atas.
