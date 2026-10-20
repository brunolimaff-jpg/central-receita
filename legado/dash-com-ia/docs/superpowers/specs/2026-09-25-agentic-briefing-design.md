# Briefing com fila de decisões

- Status: proposta de design para revisão do usuário
- Data: 2026-09-25
- Projeto: Central de Receita / Dash com IA

## Contexto

A Central reúne leituras executivas de receita, forecast, oportunidades e sinais de atenção. O usuário escolheu uma experiência de **Briefing com fila de decisões** e definiu que o agente deve **recomendar e pedir aprovação antes de agir**.

O checkout atual é um mock local com dados sintéticos. “Pergunte à Receita” responde por regras determinísticas; ações da agenda são simulações locais. Não existe conexão real com LLM ou CRM, nem escrita corporativa. Este design não altera esses limites.

## Objetivo

A liderança deve conseguir identificar o que merece atenção, entender a evidência e decidir o próximo passo sem percorrer várias telas para montar o contexto. O agente prepara a análise e a recomendação; a pessoa continua responsável pela aprovação.

## Direção de experiência

O Briefing começa com a pergunta operacional “O que precisa de decisão?”. O Forecast continua visível como contexto, mas não ocupa sozinho a primeira dobra. Uma fila priorizada organiza os sinais; cada item leva ao detalhe correspondente sem perder o filtro ou a origem da leitura.

Em telas largas, a fila ocupa a área principal e o painel do agente fica ao lado. Em telas estreitas, a fila aparece primeiro e o agente abre em um painel acessível por botão. A navegação existente permanece: Briefing, Pergunte à Receita, Explorar, Visões e Fontes & Regras. URLs, filtros e deep links atuais devem continuar válidos.

## Estrutura da tela

1. **Cabeçalho de contexto:** competência, data do snapshot, filtros ativos e identificação de dados sintéticos. A data deve indicar o tempo do cenário; não deve sugerir atualização em tempo real.
2. **Resumo executivo:** até três indicadores do recorte atual, com definições visíveis e valores diretamente rotulados.
3. **Fila de decisões:** sinais ordenados por impacto observável e urgência documentada. Cada linha mostra título, impacto, quantidade de oportunidades e responsáveis, motivo, data e ação disponível.
4. **Painel de evidência e recomendação:** fatos observados, regra aplicada, fontes, limitações, proposta do agente e a decisão pendente. A recomendação não deve ser apresentada como causa comprovada.
5. **Exploração:** Forecast completo, pipeline, oportunidades e regras permanecem acessíveis como aprofundamento, sem competir com a fila na primeira leitura.

## Fluxo do agente

`Sinal ou pergunta → reunir evidências → preparar recomendação → aprovação humana → simulação local → relatar resultado`

1. O agente recebe um sinal determinístico ou uma pergunta e herda apenas o contexto atual válido, como classificação e horizonte do Forecast.
2. Reúne leituras do snapshot local e apresenta a população afetada, a regra e a fonte usada.
3. Separa fatos, inferências e lacunas. Se a evidência for insuficiente ou conflitante, pede contexto ou bloqueia a recomendação; não preenche lacunas com um score inventado.
4. Propõe uma ação e explica o efeito esperado e a limitação. A pessoa pode aprovar, editar ou recusar.
5. No mock atual, aprovar executa somente uma simulação em memória e informa “nada foi salvo”. Não chamar a simulação de atualização do CRM.
6. A resposta final mostra o estado, os dados considerados e o próximo passo disponível.

## Limites de autonomia

- **Sem aprovação:** ler o snapshot, calcular métricas determinísticas, ordenar sinais segundo regras documentadas e preparar uma proposta.
- **Com aprovação explícita:** apenas registrar o resultado da simulação local prevista neste mock.
- **Fora deste design:** alterar CRM, enviar comunicações, criar compromissos reais ou permitir execução autônoma. Uma integração real exigirá contrato de dados, permissões, idempotência, auditoria e aprovação próprios.

Não exibir percentual de confiança sem calibração comprovada. Preferir estados claros de evidência: observada, parcial, não encontrada ou não verificada.

## Estados de interface

- **Carregando:** indicar recorte solicitado; valores ainda visíveis podem pertencer ao recorte anterior.
- **Sem itens:** explicar que nenhum sinal determinístico foi acionado; isso não comprova ausência de risco ou de trabalho.
- **Evidência insuficiente ou conflitante:** suspender a recomendação e mostrar o dado faltante ou divergente.
- **Aguardando aprovação:** descrever a ação exata e seu efeito antes dos comandos Aprovar, Editar e Recusar.
- **Simulada:** informar que o resultado é local, temporário e não foi gravado.
- **Falha:** manter contexto e evidências disponíveis, mostrar causa compreensível e oferecer nova tentativa quando aplicável.

## Direção visual

- Preservar a marca Senior e o verde institucional como destaque; usar tons neutros para conteúdo e azul para comparação. Âmbar e vermelho ficam reservados para atenção e perda.
- Reduzir a sensação de pilha de cartões: reservar superfícies enquadradas para decisões, propostas e detalhes que precisam de foco; usar divisores e agrupamento para o restante.
- Encurtar a área do gráfico de comparação e trazer resumo numérico, variação e população afetada para o mesmo bloco.
- Usar valores rotulados diretamente, contraste suficiente e rótulos textuais além da cor.
- Manter controles, foco e estados operáveis por teclado e toque; não depender de hover; respeitar `prefers-reduced-motion`.
- Em mobile, manter o primeiro sinal e a decisão acessíveis antes de conteúdo secundário, sem overflow horizontal.

## Critérios de sucesso

- Em até 30 segundos, uma pessoa da liderança consegue responder: o que mudou, por que o sinal apareceu, quem é afetado e qual decisão está pendente.
- Toda recomendação mostra população, fonte, regra e limitação antes da aprovação.
- Aprovar, editar e recusar são ações distintas e têm retorno visível.
- Nenhuma simulação é descrita como mudança persistente ou atualização do CRM.
- Em tela estreita, a fila continua utilizável e o painel do agente não oculta o contexto que motivou a análise.

## Fora de escopo e dependências

- Conectar LLM, CRM, fonte corporativa, writeback, notificações ou automações persistentes.
- Recalibrar métricas, redefinir regras de Forecast ou afirmar causalidade comercial.
- Substituir a navegação ou quebrar URLs existentes.
- Declarar cobertura visual de todas as telas: o mobile e várias rotas precisam de nova revisão visual após a integração de design estar disponível.

O Open Design não foi usado nesta sessão: sua integração local não está disponível e o executável indicado não tem assinatura digital válida. Este documento é um rascunho de design no repositório, não um artefato do canvas nem uma autorização para implementar.

## Referências

- [Microsoft Learn — generative orchestration](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/generative-orchestration): separa execução determinística, planos com checkpoints humanos e autonomia para tarefas de menor risco.
- [Microsoft Learn — autonomous agents](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/autonomous-agents): recomenda escopo e permissões mínimos, simulação inicial, supervisão humana para ações críticas e expansão gradual de autonomia.
