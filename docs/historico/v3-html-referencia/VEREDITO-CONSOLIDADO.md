# Veredito consolidado do debate (Astra × plano) — decisões vinculativas do corte 1

> Fonte: `v3/DEBATE-ASTRA.md` (turnos 1-2, 29/09/2026, gpt-6-astra xhigh). Este documento EMENDA a `SPEC-PEDIDOS-E-AGENTE.md` e o `PROXIMO-INCREMENTO-ESCOPO.md`; em conflito, prevalece o que está aqui.

## A aposta única (critério de tudo)

**"Transformar o forecast em uma leitura de dependências verificáveis, para o diretor saber quem cobrar antes que a receita atravesse o fechamento."**
Agente e gráficos são meios. Critério de fracasso: Giovane precisar de explicação verbal, ou voltar ao Hunter antes de entender o problema.

## Decisões travadas

### Domínio financeiro (emenda à spec)
1. **Integração é um fato explícito com data**, não um 5º estado da fila: pedido integrado **sai** dos totais pendentes e autoriza o realizado. `conferido` é pendente — nunca "quase seguro", nunca realizado.
2. **A fila nunca soma dinheiro sobre o forecast.** O pedido é **dependência** do forecast, não acréscimo. Ligação visível: **faixa de dependência DENTRO do card de forecast** ("R$ X deste forecast dependem de integração · N pedidos vinculados · [ver composição]"). Percentual só quando a contribuição ao forecast está reconciliada na mesma base e período (alocação que impede dupla contagem no N:N). Sem reconciliação: "**N pedidos vinculados. Impacto financeiro ainda não reconciliado.**" Nada de watermark.
3. **Modelo temporal explícito:** `asOf` declarado no snapshot (cenário com data fixa, ex. 29/09/2026 — demo reproduzível); distinguir mês esperado × corte aplicável × instante da análise × integração efetiva. Virada de mês **não apaga atraso**; setembro→outubro tira aquele valor de Q3, não arrasta o tri.
4. **Contrato de pedido:** `queuedAt`, `stateEnteredAt` (idade no estado ≠ idade total), motivo + data da última devolução, responsável (executivo dono, ADR-3), vínculo N:N com oportunidade (fixture com 1 oportunidade → 2 pedidos).
5. **NN/Cross (fecho do "mas não…", hipótese provisória):** grupo **já cliente antes da assinatura** → Cross; primeira venda do grupo → New Name; **sem evidência → "classificação indisponível"** (nunca NN por padrão; donut não redistribui o valor sem classificação).
6. **"Origem" = rastro** `oportunidade → assinatura → pedido → integração (quando existir)` em subtela de leitura com IDs, datas, valores e vínculos; lacunas aparecem como lacunas. Classificação comercial (NN/Cross) e rastreabilidade são contratos separados.
7. Vocabulário: **"pedido assinado pendente de integração"** (nunca "pedido ganho que ainda não integrou" — contradiz ADR-1); gráfico de estados = **"R$ pendentes por estado"** (estoque, não funil de conversão).
8. Histórias 11-14 reescritas: **leitura do diretor** com filtro por executivo/filial — sem workspace, sem mutação, sem reenvio (Central ≠ Hunter incompleto).

### Agente (resolução do rebate 1)
- Corte 1 = **agência de preparação**: delegação "preparar cobranças dos devolvidos deste recorte" → o agente executa o lote: agrupa por executivo, ordena por **prazo restante → valor → tempo devolvido** (sem score opaco), produz narrativa por executivo (pedidos, valores, motivos informados, prazo, pedido de ação), detecta **motivo repetido** entre pedidos distintos, gera **pacote local persistido com estado "não enviado"**, vinculado ao snapshot; dados mudaram → pacote marcado desatualizado (sem duplicar cobrança a cada abertura).
- Template fundamentado > prosa de LLM no corte 1.
- Nível 2 (dados reais + autorização): monitorar, preparar com dados atualizados, enviar após aprovação, registrar entrega/resposta, escalonamento por política. Exige trilha de auditoria; mudança posterior do pedido não prova que a cobrança a causou.

### Lente "3 meses" (resolução do rebate 2)
- Opção **visível e indisponível na Visão de Pedidos** com motivo acessível por foco ("A visão móvel de 3 meses ainda não está disponível para pedidos. Use mês ou trimestre."). Entrada com 3 meses selecionados: preservar seleção + painel explícito com [Escolher mês] [Escolher trimestre]; a volta restaura o contexto. Nunca troca silenciosa.

### Gráficos que explicam (Bloco D, resolvido)
- **Dois níveis compartilhados por todos os gráficos:** inspeção rápida (hover/foco: o quê e quando · quanto · comparação nomeada · significado em 1 frase · a qual card se relaciona) e inspeção persistente (clique/Enter: painel com definição, composição, base monetária, fonte/cenário, referência temporal, ressalvas, "Abrir composição"; Esc fecha e devolve o foco).
- **Card↔série com 3 verbos distintos:** inspecionar sem sair · selecionar sem alterar o universo · aprofundar preservando contexto. Card oferece "Localizar no gráfico"; ponto informa "Compõe/Decompõe/Explica a variação de".
- Por gráfico: hero (métrica, data, baseline), evolução (realizado acumulado × projeção × posição histórica), movimentos (evento, sinal, antes→depois — delta não é estoque), donut (base do % + valor sem classificação visível).
- Zero-teclado inaceitável (hover não é a única porta). Teste real de navegador para foco/seleção/fechamento/retorno — `node:test` não cobre isso sozinho.
- Referências (copiar mecanismo, não visual): Power BI (drill-through com retorno), Tableau (destaque entre visões sem filtrar), Grafana (inspeção temporal transportando contexto).

### Experiência por estado do período (ótica A)
- Síntese executiva muda conforme o estado: **em andamento** (posição vs referência, dependência, até 3 cobranças prioritárias) · **no corte** (pendente, devolvidos, conferidos sem integrar, frescor da fonte, pacote de cobrança pronto; nunca "ainda dá tempo") · **encerrado** (quanto realizou, contra qual referência, o que ficou pendente e virou dependência do mês seguinte, posição definitiva ou sujeita a revisão; sem countdown do mês novo).
- Fixtures dos 3 momentos + critério dos 30 segundos (Giovane responde sem ajuda).

### Honestidade com fonte (ótica D — 3 quebras com copy de interface)
1. **Defasagem entre fontes:** "Posição parcialmente atualizada — Forecast 7h45; integrações até 6h10…" → cobrança conclusiva vira pedido de confirmação.
2. **Reconciliação incompleta (N:N):** pedido sem alocação validada aparece na fila, não na parcela dependente; nunca multiplicar valor por vínculos.
3. **Atualização tardia de mês encerrado:** "Posição de setembro atualizada — R$ 150 mil de integração efetiva em 30/09 recebidos em 02/10. Anterior: 9,8 · Atual: 9,95 [Ver alteração]" — preservar versão anterior.

### Apresentação (ótica B)
- Demo de 90s com **um único caso**: promessa → dependência → impedimento → responsabilidade → preparação → consequência (cenário alternativo mostrando o corte atravessado, identificado como simulação). Valor conservado entre home/composição/pedido; dado ausente honesto > animação.

## Ordem de execução (tracer bullets)

| # | Entrega | Aceite |
|---|---------|--------|
| 0 | Exemplo financeiro fechado em papel (pedido integrado, conferido e devolvido; contas batendo por regra) antes de codar | totais conservados por regra explicável |
| 1 | Um problema completo: home → indicador de pendência → clique no devolvido (valor, responsável, motivo, relógio) → volta com contexto; cenário simulado identificado | diretor entende o número e acha quem age; sem dupla contagem; integrado sai da fila |
| 2 | Visão de Pedidos completa: 4 estados reconciliados, filtros filial/executivo, NN/Cross derivado + indisponível, idade total × idade no estado, fechamento mensal e impacto no tri | soma dos estados = total pendente; integração ≠ postergação |
| 3 | Rastreabilidade: subtela origem (rastro completo) incluindo 1 opp → 2 pedidos; volta inclusive pelo navegador, sem alterar recorte | chegar à origem e voltar sem perder contexto |
| 4 | Agente como consumidor: preparação de cobranças sobre os seletores validados, pacote local "não enviado", desatualização | todo número do agente rastreável ao mesmo pedido e asOf da fila |
| D | Camada transversal: contrato de explicação de métricas + painel de inspeção único, aplicado aos 4 gráficos (começando pelo hero) + browser test | explicar o número referenciado em hover E teclado |

## Cortados do corte 1
Workflows de coordenador/executivo e mutação · reconstrução histórica da fila (sem snapshot é ficção) · subtela por combinação de filtros · rascunho generativo/envio/alerta/matinal automático · taxonomia automática de motivos · cópia integral das colunas do Hunter · percentuais sem base reconciliada.
