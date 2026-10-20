# SPEC — Visão de Pedidos, Drill até a Origem e Agente Comercial

> Formato: skill to-spec (Matt Pocock). Fonte: grill rodadas 1-2 (29/09) + prints Hunter OS + ask-matt.
> Estado: rascunho para debate (Astra) antes de virar tickets.

## Problem Statement

O Giovane (head de vendas) vê hoje um pulso comercial que olha quase só forecast. Mas parte da receita "quase garantida" está parada como **pedido ganho que ainda não integrou** — e o contrato assinado que não integra até o último dia do mês não vale nada: a receita desliza para o mês seguinte (e, no fim do trimestre, para o trimestre inteiro). Essa fila hoje só é visível para o coordenador, em detalhe, na ferramenta dele (Hunter OS). O diretor não tem onde ver, num golpe de vista, **quanto está em risco de deslizar e quem tem que agir** — e o executivo dono de um pedido devolvido só "fica em cima" se alguém avisar.

## Solution

A Central de Receita ganha três capacidades, na mesma tela e no mesmo vocabulário operacional que o coordenador já usa:

1. **Visão de Pedidos** — funil de R$ por estado da fila de integração (na fila → em conferência → conferido / devolvido) com relógio até o deadline do mês, total em risco pendurado sobre o forecast, e drill por pedido.
2. **Drill-down até a origem com volta** — do pulso ao recorte (filial/executivo) ao pedido/oportunidade à origem, em subtela, voltando à tela inicial com o contexto preservado.
3. **Agente Comercial** — briefing matinal que aponta ação: pedidos devolvidos com valor, tempo parado e executivo dono para cobrar.

Mock fiel à estrutura operacional real (vocabulário Hunter OS); sem dados reais neste corte.

## User Stories

1. Como Giovane (diretor), quero ver o total de R$ em pedidos que ainda não integraram, para saber quanto do meu mês ainda depende de integração.
2. Como Giovane, quero ver esse total quebrado por estado (na fila, em conferência, conferido, devolvido), para distinguir "quase seguro" de "precisando de ação".
3. Como Giovane, quero um relógio de dias até o último dia do mês, para sentir a urgência do que está na fila.
4. Como Giovane, quero ver o R$ em risco de deslizar para o mês seguinte (e do trimestre, no fim do tri), para cobrar antes do deadline e não descobrir depois.
5. Como Giovane, quero ver os pedidos devolvidos com o executivo dono de cada um, para saber quem fica em cima de cada devolução.
6. Como Giovane, quero clicar num pedido e descer até a origem dele (oportunidade/assinatura), para entender a história sem sair da Central.
7. Como Giovane, quero voltar da subtela exatamente para onde eu estava, com filtros e período preservados, para não perder o contexto da análise.
8. Como Giovane, quero separar New Name de Cross em qualquer recorte (coluna, filtro, subtotal), para avaliar expansão vs. base instalada.
9. Como Giovane, quero que a classificação New Name/Cross venha do grupo econômico da conta, para confiar que conta nova de grupo existente é Cross.
10. Como Giovane, quero ler de manhã o que o agente comercial aponta (pedidos devolvidos, valor parado, dono), para começar o dia cobrando o certo.
11. Como coordenador, quero que a Central desça ao nível de detalhe que eu uso no Hunter (prob., valor esperado, congelada, status), para que o diretor e eu falemos a mesma língua.
12. Como coordenador, quero ver a Visão de Pedidos no recorte de cada filial e executivo, para localizar onde a integração está engasgando.
13. Como executivo, quero ver meus próprios pedidos devolvidos com o motivo, para arrumar e devolver à conferência antes do deadline.
14. Como executivo, quero saber quanto do meu número assinado ainda não vale (não integrou), para priorizar o que falta.
15. Como Giovane, quero a Visão de Pedidos sob a mesma lente de período (mês/trimestre/3 meses) do resto da Central, para cruzar com o forecast.
16. Como Giovane, quero ver o funil de conferência com idade dos pedidos em cada estado, para distinguir fluxo normal de engargo crônico.
17. Como Giovane, quero o total em risco destacado quando o mês está perto do fim, para a urgência escalar sozinha.
18. Como Bruno (dono do produto), quero contratos e seletores puros cobrindo o novo domínio, para trocar o mock pela fonte real (CRM/ERP) sem reescrever telas.

## Implementation Decisions

- O domínio novo entra nos **contratos** existentes da feature: `Order` (pedido) com valor, conta, filial, executivo dono, origem (New Name/Cross derivada do grupo econômico), estado do pipeline, data de entrada em fila, deadline; `OrderPipelineState` com os quatro estados (na fila, em conferência, conferido, devolvido) e a transição devolvido→conferência.
- A **conta** passa a carregar grupo econômico; New Name/Cross é derivado, nunca digitado (ADR-4).
- **Seletores puros** novos (visão de pedidos, risco de deslizar, briefing do agente estendido com devolvidos) no mesmo módulo de seleção existente — a UI continua consumindo só seletores.
- O **mock** é um adapter atrás dos contratos, engenheirado para ser verossímil: valores batendo com o fixture travado do forecast, pedidos coerentes com as oportunidades existentes, estados e idades plausíveis, deadline real do mês corrente.
- **Navegação** continua por query string na rota única existente: nova view de pedidos + profundidade de drill (pedido → origem) com parâmetro de "de onde vim" já usado hoje para a volta.
- **Agente** estende o briefing existente com o bloco de pedidos devolvidos (valor, tempo parado, dono) — mesmo tom de copy travado pelo spec do hero.
- ADRs 1-5 do documento de escopo são vinculativas: assinado≠ganho; último dia do mês desliza o reconhecimento; devolvido volta ao executivo; origin deriva do grupo econômico; Central desce ao detalhe, não substitui o Hunter.

## Testing Decisions

- Teste bom = comporta-se como seleção pura sobre contrato, sem tocar DOM/hora do sistema (deadline recebido como dado).
- Módulos testados: contratos/derivação de origem (grupo econômico), seletores da visão de pedidos (funil por estado, R$ em risco, relógio), estendeção do briefing do agente, navegação (parse/build de URL das novas views e do drill com volta).
- Prior art: as 7 suítes `node --test` existentes da feature (transpile TS + asserções puras) — mesmo padrão, mesmas pastas de teste.

## Experiência de ponta — gráficos que explicam ao toque (requisito do Bruno, 29/09)

> "Os gráficos precisam passar a mão e já explicar aquele número ali referenciado" + "quero coisa de ponta".

- Hover/touch **por ponto/segmento em todos os gráficos** (hero semanal, evolução do mês, movimentos do forecast, donut NN×Cross — e nos novos da Visão de Pedidos).
- O tooltip **explica o número, não só mostra**: o que é, de onde vem, e a qual card/relação aponta (ex.: "Forecast atual R$ 10,2 mi — ponta do funil de movimentos; −7,3% vs. o oficial de R$ 11,0 mi congelado no dia 1º").
- Ligação **card ↔ série**: interagir com a série destaca o card que a referencia (e vice-versa), para o leitor nunca perder a âncora do número.
- Diagnóstico da home (visão Flash, 29/09): zero interatividade; balão do hero é fixo; eixo X do hero em cinza claro de baixo contraste; datas "Sem 3 · atual" em vermelho ok. Polir contraste de eixos e rodapé da sidebar no mesmo passe.

## Out of Scope

- Dados reais (CRM/ERP) — só o desenho da seam que os receberá.
- Mobile/responsivo (segundo momento, decisão do Bruno).
- Integração/e-mail/mensagem real do agente (neste corte o agente só aponta; não envia).
- Taxonomia fechada de motivos de devolução (campo livre até o cliente informar a real).
- Substituir ou integrar o Hunter OS.

## Further Notes

- Pendências de grill: fecho da frase "mas não…" (grupo econômico); definição exata de "origem" no drill (oportunidade no CRM, pedido no ERP, ou trilha assinatura→pedido→integração); lente de trimestre na Visão de Pedidos.
- Fluxo de execução após o debate: spec → tickets tracer-bullet com blockers primeiro → implementação por ticket com TDD (fluxo to-spec/to-tickets do Matt).
