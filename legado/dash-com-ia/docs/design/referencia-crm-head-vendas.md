# Referência de dor real — CRM Integrado Senior MG (PDF do head de vendas)

**Origem:** `C:/Users/bruno.ferreira/Downloads/CRM_Integrado_Senior_MG_telas.pdf` (15 MB, 43 páginas, datado de 21/09/2026).
**Natureza:** DECISÃO DO USUÁRIO — "foi um head de vendas que fez, ou seja, é a dor real sendo aplicada. Está muito bagunçado, precisa evoluir."
**Método:** 43 páginas renderizadas em PNG (pdf.js + Chromium) e inspecionadas visualmente pelo agente principal (GLM-5.3) em 28/09/2026 — leitura página a página, em alto nível (densidade de screenshot impede leitura de todo texto pequeno; nomes exatos de colunas podem variar). Páginas em `C:/Users/bruno.ferreira/AppData/Local/Temp/crm-mg-pdf/pages/` (temporário).

## O que o documento é

Galeria de screenshots de um CRM operacional montado pelo próprio head de vendas (planilhas + telas de sistema), cobrindo todo o ciclo comercial: cadastro de contas, oportunidades, forecast, follow-up e fechamento. É interface de **quem opera**, não de quem apresenta.

## VERIFICADO — famílias de tela (com páginas exemplares)

| Família | O que aparece | Páginas |
|---|---|---|
| Listagem densa de oportunidades | Tabelas com muitas colunas por linha: conta, produto/serviço, estágio, valor, data prevista, responsável, probabilidade; dezenas de linhas visíveis por tela | p.1–8, p.13–18 |
| Forecast / previsão ponderada | Colunas calculadas manualmente (probabilidade × valor), totais por período e por vendedor, células pintadas à mão para marcar estado | p.2, p.5–6, p.9–12 |
| Pipeline por etapa | Visões tipo kanban/colunas de estágio (proposta, negociação, fechamento) com valor somado por coluna | p.19–24 |
| Acompanhamento por cliente | Histórico de interações por conta, próxima ação e datas de contato | p.25–30 |
| Funil e resumo gerencial | Gráficos de barras/funil, top clientes, comparativo período; é a minoria do documento | p.31–36 |
| Follow-up e cobrança | Painéis de "o que fazer", atividades vencidas e próximas ações por responsável | p.37–43 |

## VERIFICADO — padrões que se repetem na dor real

1. **Valor e data prevista em toda tabela** — os dois eixos "quanto" e "quando" aparecem em praticamente todas as páginas (p.1–18, p.37–43).
2. **Cor como sinal de estado** — vermelho/amarelo/verde pintado manualmente em células e linhas para marcar vencido/atenção/garantido (p.2, p.5–6, p.9–12).
3. **Responsável sempre presente** — agrupamento e cobrança por vendedor; a pergunta "quem deve o quê" atravessa o documento (p.9–12, p.37–43).
4. **Densidade alta deliberada** — o head de vendas empilha colunas e linhas para ver tudo de uma vez; nenhuma tela é "editorial" (todas as famílias).
5. **Previsão ponderada calculada à mão** — probabilidade × valor em colunas extras, com totais por mês (p.5–6, p.9–12).
6. **Filtro por vendedor/segmento e abas de navegação** como organização principal (transversal).
7. **Painéis de ação próxima** — follow-ups vencidos e agenda de contato têm telas próprias no fim do documento (p.37–43).

## INFERÊNCIA — bagunça vs sinal

**Bagunça (evoluir):** cálculo manual duplicado (probabilidade reconhecida à mão em vez de vir do domínio), cor sem legenda consistente entre telas, ausência de hierarquia (tudo tem o mesmo peso visual), dados de forecast e agenda separados quando a decisão junta os dois.

**Sinal (preservar):** o operário comercial quer, numa tela: o valor em jogo, quando vence, quem responde, e o que fazer a seguir. A bagunça é o custo de conseguir isso sem ferramenta; o redesign entrega o mesmo conteúdo com hierarquia e cálculo automático. Isso valida a direção "dinheiro em jogo + ação por risco" dos desenhos A/B de `docs/design/piloto/` e a trilha de execução (B) como tradução do painel de follow-up (p.37–43).

## Implicações para o replanejamento (plano v2)

1. A referência de dor real tem **prioridade sobre referência estética** — nenhuma direção visual pode remover valor/data/responsável da primeira camada.
2. Previsão ponderada manual (p.5–12) é a dor que a projeção móvel da Central já resolve — o Briefing deve explicitar essa substituição ("o que você calculava à mão, aqui vem calculado").
3. O painel "o que fazer hoje" (p.37–43) confirma a agenda de ações como superfície de primeira classe, não seção secundária do Briefing.
4. Densidade: executivos de operação toleram e pedem mais informação por tela que o desenho editorial assumia — a densidade "Completa" deve existir desde a primeira viewport, com hierarquia em vez de corte.
5. Cor semântica deve ser consistente e legenda única global (a dor real pinta à mão porque a ferramenta não pinta por regra).

## Lacunas

- NÃO VERIFICADO: texto pequeno e valores exatos das células (render em 1400px); nomes exatos de colunas podem diferir do descrito.
- NÃO VERIFICADO: sistema de origem dos screenshots (planilha vs produto interno) — irrelevante para o design, relevante se houver integração futura.
- As páginas renderizadas ficam em pasta temporária e podem ser re-geradas do PDF original com o mesmo método.
