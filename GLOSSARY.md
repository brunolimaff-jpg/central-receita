# Glossário — Central de Receita

Vocabulário oficial do projeto. Onde o legado do Dash contradiz uma decisão posterior, vale a decisão posterior; a divergência fica em "Em aberto", no fim.

Ordem de autoridade: decisões de 20/10/2026 (issue #1), `docs/adr/*` e `docs/REGRAS-NEGOCIO.md`, depois `legado/dash-com-ia/`.

## Os três marcos

### Ganhos no CRM
Marco comercial: oportunidades na etapa "Fechada e Ganha" com efetivação no período. Antes de 20/10/2026 chamava-se "Realizado" no Forecast; o cálculo não muda, só o nome exibido.
Não é: realizado de vendas, nem receita reconhecida.
Código: rótulo em `src/features/comercial-v3/copy.ts:24`, régua em `src/features/comercial-v3/forecast-month.ts`, curva em `src/features/comercial-v3/trajectory-model.ts:150`.

### Fila de pedidos
Marco intermediário: pedidos vinculados a oportunidades ganhas ainda sem conclusão (em conferência). Não é uma etapa gerencial separada de conferência; a conferência acontece dentro da fila.
Não é: realizado de vendas, e nunca soma dinheiro sobre o forecast (ADR-0005).
Código: substatus `em conferência` em `src/features/comercial-v3/new-name-model.ts` (`DEFAULT_STATUS_MAPPING`). A fila como bloco de tela: ainda não implementado.

### Realizado de vendas
Marco final único: pedidos conferidos ou integrados com ERP. Um pedido conta uma vez, qualquer que seja o número de itens. Denominador do atingimento.
Não é: ganhos no CRM; faturamento ou reconhecimento contábil (ficam fora).
Código: ainda não implementado como marco único. No New Name de hoje (`src/features/comercial-v3/new-name-model.ts:409`), conta como realizado oficial todo pedido com substatus `conferido` — e, no agrupamento de pedidos (`new-name-model.ts:303-306`), `DATA CONFERENCIA` preenchida vira substatus `conferido`, inclusive pedidos "Integrado com ERP", salvo devolvido e cancelado. Ou seja: integrado com data de conferência já conta; só integrado sem data de conferência fica fora. O marco único explícito depende da confirmação da Fabi (issue #4).

## Situações do pedido

### Integrado (Integrado com ERP)
Fato com data que encerra a pendência e autoriza o realizado (ADR-0001). No ADR-0001 o integrado era o único autorizador; desde 20/10/2026 o conferido também conta no mesmo marco (ver "Em aberto").
Não é: um 5º estado da fila; sai dos totais pendentes.
Código: substatus `integrado` em `src/features/comercial-v3/new-name-model.ts` (`DEFAULT_STATUS_MAPPING`: `INTEGRADO`, `INTEGRADO COM ERP`).

### Conferido
Pedido cuja conferência foi concluída, com data registrada em `DATA CONFERENCIA`. Desde 20/10/2026 conta no realizado de vendas (mesmo marco do integrado). No Dash e no ADR-0001 era pendente — divergência registrada em "Em aberto".
Não é: "quase seguro" (vocabulário evitado); enquanto a mudança não entrar, segue fora do realizado no código.
Código: substatus `conferido` em `src/features/comercial-v3/new-name-model.ts`; hoje é o único que soma no realizado oficial do New Name (`new-name-model.ts:409`).

### Em conferência
Pedido na fila, ainda sem conclusão.
Não é: devolvido, nem cancelado.
Código: substatus `em conferência` em `src/features/comercial-v3/new-name-model.ts` (`EM CONFERENCIA`, `AGUARDANDO CONFERENCIA`).

### Devolvido
Pedido devolvido ao executivo dono para correção (ADR-0002). Preserva o status original, fica fora do realizado e recebe alerta.
Não é: perda; cancelamento.
Código: substatus `devolvido` em `src/features/comercial-v3/new-name-model.ts`. Pipeline de devolução e `queuedAt`/`stateEnteredAt`: ainda não implementado.

### Cancelado
Pedido cancelado; preserva o status original e fica fora da fila e do realizado.
Não é: devolvido.
Código: substatus `cancelado` em `src/features/comercial-v3/new-name-model.ts`.

### Não classificado
Substatus de pedido com status bruto fora do de-para. Nunca é encaixado à força em outro estado.
Código: `resolveOrderSubstatus` em `src/features/comercial-v3/new-name-model.ts`.

## Forecast

### Forecast (Book PEX)
Previsão do mês: etapa Proposta ou Negociação, probabilidade de 75% ou mais e previsão dentro da competência. Sempre restrito ao mês; semana é recorte dentro do mês.
Não é: realizado; o gap para a meta usa forecast atual contra meta.
Código: `src/features/comercial-v3/forecast-month.ts` (`FORECAST_MIN_PROBABILITY = 0.75`, `isForecastStage`).

### Movimentos do forecast
Entrei (não estava na referência e passou a cumprir o critério), Saiu (estava e saiu do forecast aberto), Postergou (subtipo de Saiu: segue aberto, previsão em mês posterior), Ganhou e Perdeu (etapas de encerramento no período), Excluída ou outro motivo (sumiu da carga ou saiu do critério sem ganho, perda ou postergação — aparece como exceção).
Código: campos `entered`, `exited`, `postponed`, `otherExited`, `won`, `lost` em `src/features/comercial-v3/forecast-month.ts`.

### Congelada (carga congelada)
Estado do New Name: fotografia do forecast oficial capturado no início do mês, imutável. A carga diária nunca reescreve o congelado. Referência corporativa: quinto dia útil.
Não é: perda nem postergação.
Código: ainda não implementado.

### Postergada
Oportunidade aberta cuja previsão foi para mês posterior. É subtipo de saída, não perda.
Código: movimento `postponed` em `src/features/comercial-v3/forecast-month.ts`; estado do New Name em `src/features/comercial-v3/new-name-model.ts` (derivado de oportunidades).

## Classificação comercial

### New Name
Classificação de venda nova, determinada por fonte própria, independente da classificação informada na oportunidade (ADR-0003, emenda de 30/09/2026). No New Name, a rubrica de valor é MRR (`PRODUTO - VALOR MANUTENCAO`).
Não é: qualquer "Novo" vindo da exportação sem confirmação.
Código: `src/features/comercial-v3/new-name-model.ts` (`classifyNewName`, `isNewNameOpportunity`).

### Novo confirmado / pela fonte / a validar
`confirmado`: sinal institucional de confirmação (`NOVO CONFIRMADO`, `NEW NAME`). `pela fonte`: "NOVO" que vem só da exportação, sem confirmação institucional. `a validar`: novo em grupo já cliente ou divergência; fica fora do indicador principal.
Não é: a classificação informada pela fonte determinando o indicador por si só.
Código: `classifyNewName` em `src/features/comercial-v3/new-name-model.ts:97-112`.

### Cross
Venda em conta de grupo já cliente, com evidência conjunta: condição de cliente + produto ou módulo novo + representante executivo. Faltando qualquer elemento, é classificação indisponível. Bloco separado de New Name e de Loss (ADR-0003, ADR-0004).
Não é: upsell, que é upgrade de licenças no módulo atual e permanece separado.
Código: bloco de tela em `src/features/comercial-v3/screens/cross-screen.tsx`; regra de evidência conjunta: ainda não implementado.

### Base
Conta com contrato ativo anterior ou enquadrada como base. No Dash era uma das naturezas do CRM Integrado MG.
Não é: New Name, Cross ou C4L.
Código: no projeto novo: ainda não implementado (leitura própria pendente, issue #8). No Dash: `legado/dash-com-ia/src/lib/domain/crm-taxonomy.ts` (mapa `NATUREZAS`).

### C4L
Natureza de venda do CRM Integrado MG registrada no Dash com estado "autorizado anterior" (briefing anterior, sem observação no PDF).
Não é: Base, New Name ou Cross.
Código: no projeto novo: ainda não implementado. No Dash: `legado/dash-com-ia/src/lib/domain/crm-taxonomy.ts` (mapa `NATUREZAS`).

### Classificação indisponível
Sem evidência suficiente para determinar New Name ou Cross. Nunca atribui New Name por padrão, nunca redistribui no donut.
Código: ainda não implementado (regra definida no ADR-0003).

### Loss / Churn
Loss é perda de aquisição (prospect que não virou cliente); churn é perda de base (cliente que saiu). Conceitos e blocos separados (ADR-0004).
Código: ainda não implementado.

## Funil e etapas (CRM Integrado MG)

### Funil privado e funil público
Tipos de oportunidade ("Vendas Instituição Privada" / "Vendas Instituição Pública"), cada um com seu conjunto de etapas. Privado: Primeiro Contato de Venda, Mapeamento da Necessidade, Defesa Técnica, Proposta, Negociação. Público: Primeiro Contato de Venda, Mapeamento da Necessidade, Análise de Documentos, Proposta, Negociação/Habilitação/Certame. Tipo não identificado vira `nao_identificado`, nunca encaixado à força.
Código: no projeto novo: ainda não implementado. No Dash: `legado/dash-com-ia/src/lib/domain/crm-taxonomy.ts` (`ETAPAS_PRIVADAS`, `ETAPAS_PUBLICAS`, `resolverEtapaOportunidade`).

### Estado de mapeamento
Qualidade da origem de um valor bruto da taxonomia: `observado` (PDF do CRM Integrado MG), `autorizado_anterior` (briefing anterior), `fixture`, `nao_mapeado`. Etapa não mapeada nunca entra em corte por critério de etapa.
Código: no projeto novo: ainda não implementado. No Dash: `legado/dash-com-ia/src/lib/domain/crm-taxonomy.ts` (`EstadoMapeamento`).

### Naturezas de venda (Base / New Name / Cross / C4L)
Taxonomia de natureza da venda do CRM Integrado MG, resolvida com estado de mapeamento por valor bruto.
Código: no projeto novo: ainda não implementado (leitura de natureza pendente, issue #8). No Dash: `legado/dash-com-ia/src/lib/domain/crm-taxonomy.ts` (`resolverNaturezaVenda`) e `legado/dash-com-ia/src/lib/domain/natureza-mes.ts` (`resumirNaturezasDoMes`).

## Pipeline

### Pipeline
Quantidade e valor por etapa da carteira aberta, com MRR bruto como medida principal e valor ponderado em coluna separada. Horizonte: mês corrente mais três meses.
Não é: forecast (que é só o mês) nem realizado.
Código: `src/features/comercial-v3/pipeline-model.ts` e `src/features/comercial-v3/components/pipeline-section.tsx`.

### Travada
Oportunidade aberta sem previsão, com previsão vencida ou acima do ritmo esperado (medianas de referência: Base 18 dias, New Name 31, Cross 58).
Código: `src/features/comercial-v3/pipeline-model.ts` (sem previsão ou previsão vencida; comparação por mediana: ainda não implementado).

## Meta e trajetória

### Meta e atingimento
Meta de MRR vem do Acordo de Metas, por competência e filial (fora da carga: fonte separada). Atingimento = realizado de vendas ÷ meta.
Não é: potencial do mês, que é ganhos no CRM + forecast aberto.
Código: campo `meta`, `atingimento` e KPIs em `src/features/comercial-v3/model.ts`; fonte externa da meta: ainda não implementado.

### Trajetória (regimes A/B/C)
Curva do mês montada com o que existe: regime A (primeira carga, sem anterior), regime B (anterior com snapshot resumido, menos de 3 pontos), regime C (histórico completo). A curva de ganhos no CRM não é renomeada para realizado de vendas.
Código: `src/features/comercial-v3/trajectory-model.ts` (`regime: 'vazio' | 'A' | 'B' | 'C'`).

### Ponte de R$ 0,01
Tolerância de reconciliação entre cargas: diferença de até R$ 0,01 é resíduo de arredondamento, não divergência. Nulo não vira zero.
Código: `TOLERANCIA_RECONCILIACAO` em `src/features/comercial-v3/trajectory-model.ts:59-60`.

## Honestidade de dados

### asOf
Instante de referência declarado no snapshot (data fixa, cenário reproduzível), nunca o relógio da máquina (ADR-0005).
Código: `snapshot.asOf` em `src/features/comercial-v3/model.ts`; cenário simulado em `src/features/comercial-v3/copy.ts:188`.

### Estados honestos
Zero ≠ indisponível ≠ desatualizado. Defasagem de fontes, reconciliação incompleta e atualização tardia têm copy própria; valor ausente não vira zero, situação desconhecida não vira pendente nem concluída.
Código: `sumKnown` propaga nulo em `src/features/comercial-v3/forecast-month.ts`; `Não classificado` em `src/features/comercial-v3/new-name-model.ts`.

### DATA CONFERENCIA
Única data de conclusão presente na fonte de pedidos; hoje é ela que define o mês do realizado. Mudar isso exige confirmação da Fabi (issue #4).
Código: coluna `conferenceDate` em `src/features/comercial-v3/manual-import.ts`; usada em `src/features/comercial-v3/new-name-model.ts:285-294`.

### Filial
Recorte por unidade de negócio da oportunidade (`UNIDADE NEGOCIO OPORTUNIDADE`). O Dash tirava a filial da conta; se essa leitura vale, é decisão pendente com a Fabi (issue #8).
Código: `src/features/comercial-v3/manual-import.ts` (campo `representative` dos pedidos).

## Vocabulário evitado

Vindo do Dash (`legado/dash-com-ia/CONTEXT.md`), ainda válido:

- "Pedido ganho" para pendente de integração.
- "Funil de conversão" para a fila de pedidos — a exibição é "R$ pendentes por estado" (estoque, não conversão).
- "Δ" genérico sem rótulo próprio.
- "Quase seguro" para conferido.
- "Probabilidade de deslize" e "risco" como sinônimo de pendente.
- Somar fila ao forecast — a fila é dependência, não acréscimo.
- "Ainda dá tempo" no corte do mês.

Acrescido nesta iteração: chamar o ganho comercial de "Realizado" — desde 20/10/2026 o nome é "Ganhos no CRM" e "Realizado de vendas" é só o marco final.

## Em aberto

Divergências entre o Dash (e ADRs antigos) e as decisões de 20/10/2026, pendentes de resolução no código:

1. **Conferido × integrado no realizado.** ADR-0001 e o Dash tratam só a integração como autorizadora do realizado; conferido era pendente. A decisão de 20/10/2026 (issue #1) faz conferido e integrado serem o mesmo marco único. No código atual, o realizado oficial do New Name já inclui integrado com `DATA CONFERENCIA` preenchida (`new-name-model.ts:303-306`: data preenchida vira substatus `conferido`), mas integrado sem data fica fora do realizado de qualquer mês (`new-name-model.ts:409`) — a resolução depende da confirmação da Fabi (issue #4).
2. **Data do realizado.** A fonte não tem data de integração; `DATA CONFERENCIA` segue definindo o mês. Se pedido integrado sem data de conferência aparecer, ele exibe "integrado" mas não entra no realizado de nenhum mês (issue #4).
3. **Nome do dashboard PEX.** O Dash chamava o total de "realizado PEX" (`legado/dash-com-ia/src/lib/domain/forecast-pex.ts`, campo `regra`). Vale a decisão posterior: o que ali é "Fechadas e Ganhas no mês" exibe "Ganhos no CRM".
4. **Filial: unidade de negócio versus conta.** O Dash derivava a filial da conta; o projeto novo usa `UNIDADE NEGOCIO OPORTUNIDADE`. Confirmar com a Fabi (issue #8).
5. **Naturezas Base/C4L.** O Dash tinha as quatro naturezas do CRM Integrado MG com estados de mapeamento; o projeto novo ainda não as leu, e os valores reais de `CLASSIFICACAO DO PEDIDO` seguem por confirmar com a Fabi (issue #8).
