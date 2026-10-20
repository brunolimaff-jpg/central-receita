# Dashboards visuais e futuro agêntico — plano de organização

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a direção editorial por dashboards de leitura rápida, desenho de produto inovador e assistência agêntica contextual, começando pela exploração e por uma única tela piloto.

**Architecture:** Reutilizar métricas, endpoints e componentes existentes. Definir primeiro referências e critérios visuais; comparar dois desenhos da mesma tela; implementar e expandir somente após revisão do desenho. A assistência acompanha o contexto selecionado e diferencia proposta, simulação e execução real.

**Tech Stack:** Manifesto local declara Next 16, React 19, TypeScript, Tailwind, shadcn/Radix, Recharts e Framer Motion. Testes existentes usam Node `node:test`. Nenhuma dependência nova está prevista.

**Spec:** Pedido de Bruno em 28/09/2026: retirar editorial; foco em inovação, desenho e design futuro agêntico; dashboards fáceis de visualizar; explorar com máximo uso de Luna, sem implementar agora. `docs/briefing-visual-spec.md` continua referência de semântica das métricas; sua direção estética anterior não vincula esta proposta. `docs/superpowers/specs/2026-09-25-agentic-briefing-design.md` é uma proposta histórica, não aprovação desta execução.

**Status:** Plano proposto. Somente este documento foi criado nesta rodada. Não há novo desenho aprovado nem implementação autorizada nesta etapa.

## Escopo visual em uma leitura — atualizado com os cinco prints de Bruno

**DECISÃO DO USUÁRIO:** “isso ta texto DEMAIS”. Os cinco anexos foram abertos nesta sessão. São evidências da experiência rejeitada, não referências estéticas a copiar.

| Superfície | VERIFICADO nos prints | Mudança proposta |
|---|---|---|
| Briefing / Forecast | Um cartão alto contém duas barras, valores em blocos separados e várias linhas auxiliares. | Comparação compacta, valores nas barras, delta destacado; liberar espaço para outros sinais na primeira tela. |
| Riscos / agenda | Cartões dentro de cartões, explicações e ações repetidas; um risco usa uma frase longa como título. | Ranking visual: risco curto, valor, quantidade, severidade e uma ação; explicação no detalhe. |
| Pergunte à Receita | Título, subtítulo, cabeçalho de conversa, mensagem inicial e coluna de exemplos explicam repetidamente a mesma função. | Entrada direta com até três sugestões curtas; resposta orientada a gráfico, evidência e ação no contexto. |
| Pipeline | Duas linhas de abas, título, descrição e cartões com explicações precedem o gráfico; botões de fonte estão truncados. | Navegação compacta, faixa de indicadores e gráfico principal mais alto na página; fonte acessível com nome curto. |
| Visões | Quatro cartões grandes repetem descrições, ressalvas e “Abre uma análise da Central”, sem prévia gráfica. | Galeria compacta com título, prévia visual fiel à análise e ação de abrir; ressalvas no contexto pertinente. |

**Regras para os desenhos:**

- Primeira camada: nome curto, valor, unidade/período, comparação e ação. Sem parágrafos explicando como usar a tela.
- Remover repetição, não encolher tipografia para caber mais texto. Informação adicional abre por clique ou teclado; nunca apenas hover.
- Dados sintéticos identificados uma vez no contexto global. Limitações que mudam a interpretação continuam junto da métrica em forma curta; regras completas ficam acessíveis no detalhe.
- Sem cartões dentro de cartões por padrão; cada contorno deve separar uma interação ou grupo necessário.
- Assistência oferece ações contextuais curtas, como “Explicar variação” e “Ver oportunidades”; não transforma toda resposta em prosa.
- Meta proposta: reduzir pelo menos 50% das palavras de prosa auxiliar na primeira viewport de cada superfície comparada, mantendo viewport/estado iguais. Excluir da contagem nomes de entidades, rótulos dos dados, valores, unidades, períodos e mensagens necessárias de erro/limitação. O corte não foi medido nem executado.
- Nova ordem: começar pelo **Briefing**, que aparece nos dois primeiros prints e é a entrada principal rejeitada; Pipeline passa a ser o segundo alvo. O menor esforço técnico não deve deslocar o problema principal do usuário.

Anexos inspecionados em `C:/Users/BRUNO~1.FER/AppData/Local/Temp/`: `codex-clipboard-bc19c579-287b-44ac-b5e7-fd25f1fd8f15.png`, `codex-clipboard-e1fe7499-f219-4532-ae65-d11578142d45.png`, `codex-clipboard-564f7aaa-720f-45ad-8365-e50a2cf9de51.png`, `codex-clipboard-9b007d7c-dfb2-4cae-8027-e4716a3578b5.png`, `codex-clipboard-5cfb74a2-4522-4765-a773-bd03c4a4aafe.png`. São arquivos temporários; confirmar disponibilidade na retomada.

## Decisões, evidências e limites

- **DECISÃO DO USUÁRIO:** direção editorial rejeitada; planejamento e exploração agora, priorizando Luna e custo.
- **VERIFICADO:** projeto `Dash com IA`, branch `main`, índice com exclusões e arquivos presentes como não rastreados; preservar esse estado. `AGENTS.md` exige consultar documentação local Next antes de código.
- **VERIFICADO:** `agora.tsx` e `briefing-visuais.tsx` compõem o Briefing; `visao.tsx` concentra um dashboard menor; `agente.tsx` e `assistant-trigger.tsx` já oferecem assistência contextual.
- **VERIFICADO:** inspecionei o arquivo `screenshots/final/01-agora-1440x900.png`, de 22/09: manchete grande e listas ocupam a área principal. Esta imagem é histórica; os cinco anexos posteriores de Bruno têm prioridade para o diagnóstico desta rodada.
- **VERIFICADO:** scripts e testes verificam domínio, contratos e runtime; não foi encontrado comando de regressão visual no manifesto. QA anterior registra inspeção de navegador, não uma campanha reproduzível completa.
- **NÃO ENCONTRADO:** `central-receita-agentic.html` no root deste projeto; há menções em `docs/briefing-visual-spec.md:45` e `QA_VISUAL.md:157`. Diretório de visualizações desta sessão vazio. Isso não significa que Bruno não tenha fornecido referências em outras conversas.
- **INFERÊNCIA:** a falta de uma ligação verificável entre referência, decisão visual e critério de aceitação contribui para repetir uma direção que o usuário rejeitou.
- **NÃO VERIFICADO:** render atual, disponibilidade do servidor, compreensão por usuário e custo monetário desta rodada. Nenhum build/teste/runtime foi executado para este plano.

## Global Constraints

- Explorar e planejar agora; não editar aplicação, configurações globais, dependências ou integrações.
- Retirar editorial como direção: não organizar a experiência em manchetes dominantes, narrativa longa ou relatório que precede os gráficos. Preservar rótulos, explicações e acessibilidade necessários.
- Inovação deve aparecer na organização visual, exploração dos dados e assistência contextual. Aparência futurista não justifica reduzir contraste, esconder valores ou inventar autonomia.
- Manter dados sintéticos, regras de cálculo, filtros, URLs e proveniência. Sem CRM, LLM novo, publicação ou writeback neste escopo.
- Não exibir meta/atingimento sem fonte disponível; distinguir PEX mensal, projeção móvel e receita reconhecida.
- Usar as referências já fornecidas; identificar o que foi efetivamente aberto e o que é só menção.
- Nenhum reset, staging amplo ou commit automático sobre o checkout atual.

## Review Focus

1. Troca rápida de filtro/horizonte: mostrar carregamento e recorte dos valores anteriores; validar na tarefa 4.
2. Zero, nulo e fonte ausente: distinguir zero real de dado indisponível; validar na tarefa 4.
3. Nomes e valores extensos, tela estreita e zoom: evitar corte de informação principal e controles inacessíveis; validar nas tarefas 2 e 4.
4. Assistente aberto: preservar contexto, foco e acesso ao gráfico; validar nas tarefas 3 e 4.
5. Estado de ação: distinguir proposta/simulação de execução efetiva; validar nas tarefas 3 e 4.

## Harness e divisão do trabalho

Harness é o conjunto de instruções, ferramentas, limites e verificações que torna o trabalho dos agentes repetível.

- Nesta rodada: três Lunas em leitura, com contexto limpo, responsabilidades independentes e respostas curtas. Presets `cavecrew-investigator` não estão expostos na ferramenta atual; foi usado `explorer` com modelo `gpt-6-luna`, seguindo o contrato compacto da skill cavecrew.
- Próximas rodadas: até três frentes independentes simultâneas, normalmente duas; não preencher slots sem trabalho útil. Reutilizar o Luna da mesma responsabilidade em correções.
- Cada despacho informa objetivo, lista de arquivos permitidos, entradas, entrega, critério de término e limite de saída de 600 palavras. Não repassar histórico completo.
- Luna: inventário, localização, comparação documentada e depois tarefas pequenas aprovadas. Principal: resolver conflitos, escolher a proposta recomendada e validar evidência final.
- Até duas rodadas sobre o mesmo problema sem progresso verificável; depois consolidar a causa e ajustar a tarefa, sem multiplicar agentes.
- Separar análise de código e inspeção de imagem. Um agente só pode alegar observação visual se tiver aberto a captura; texto derivado de JSX não vale como inspeção. Caso imagem não funcione no Luna, a revisão visual fica com o principal.
- Registrar modelo, tarefas, rodadas, arquivos lidos, tokens/custo quando fornecidos pela ferramenta e retrabalho. Sem medidor, custo fica NÃO VERIFICADO; não prometer percentuais de economia.

## Tarefa 1 — Recuperar referências e fechar critérios

**Responsável:** Luna de referências; consolidação pelo principal.

**Arquivos futuros:** criar `docs/design/referencias-dashboard.md`; consultar `README.md`, `HANDOFF_AI.md`, `QA_VISUAL.md`, os dois specs existentes e conversas/artefatos específicos já identificados.

**Interfaces:** entrada = referências reais de Bruno; saída = tabela `origem | artefato aberto | característica observada | aplicação proposta | rejeição/conflito`.

- [ ] Recuperar os artefatos mencionados e localizar as referências em conversas anteriores por busca delimitada. Não trocar ausência local por pesquisa genérica de novos dashboards.
- [ ] Abrir cada imagem/HTML recuperado antes de descrevê-lo. Registrar localização e status de acesso.
- [ ] Extrair três a cinco características concretas: hierarquia, densidade, gráficos, navegação e interação do agente; relacionar cada uma à evidência.
- [ ] Consolidar o briefing visual em uma página: gráficos primeiro, controles compactos, valores e períodos legíveis, detalhes sob demanda, agente no contexto. Se uma referência não puder ser recuperada, expor a lacuna antes de alegar fidelidade.

**Gate:** referência → característica → decisão visual rastreáveis; nenhuma direção editorial herdada tratada como aprovação vigente.

## Tarefa 2 — Comparar dois desenhos da mesma tela

**Responsável:** Luna de estrutura propõe; principal inspeciona; Bruno escolhe a direção.

**Arquivos futuros:** criar `docs/superpowers/specs/2026-09-28-dashboard-piloto-design.md`; anexar os dois desenhos em `docs/design/piloto/`. Não editar `src/` nesta tarefa.

**Interfaces:** consome matriz da tarefa 1 e estrutura de `src/components/central/agora.tsx` e `briefing-visuais.tsx`; produz desenho aprovado, ordem dos blocos, estados e mapa de componentes.

- [ ] Usar Briefing como piloto, limitado à primeira viewport e à entrada do detalhe contextual. Preservar seções inferiores até expandir o padrão aprovado. Pipeline é o segundo alvo.
- [ ] Desenhar A: dashboard com área de dados predominante e assistente em painel contextual; B: dashboard com área de dados predominante e trilha lateral compacta de sinais/propostas. Mesmos dados, perguntas e viewport nas duas alternativas.
- [ ] Mostrar na primeira tela desktop os indicadores essenciais, período/filtros e o gráfico principal. Reservar detalhes e regras extensas à expansão acessível; não remover fonte/unidade/período.
- [ ] Comparar 1440×900 e 390×844. No mobile, prioridade ao indicador e gráfico principal, seguidos de detalhes e assistência.
- [ ] Apresentar as duas alternativas lado a lado com diferenças e trade-offs; recomendar uma com base nas referências. Não codificar as duas.

**Gate:** escolha explícita do desenho antes de produto. A é a hipótese inicial recomendada por reaproveitar o painel existente, não uma decisão já aprovada.

## Tarefa 3 — Especificar a interação agêntica do piloto

**Responsável:** Luna de estrutura; revisão do principal.

**Arquivos futuros:** complementar o spec da tarefa 2; consultar `src/components/central/agente.tsx`, `assistant-trigger.tsx`, `use-api.ts` e `src/app/page.tsx`.

**Interfaces:** manter `Visao({ irPara }: { irPara: IrPara })`, DTOs e POST `/api/agente`; documentar contexto realmente suportado antes de adicionar novos campos.

No primeiro piloto, preservar também os contratos atuais de `Agora`, `ControlesBriefing` e `DensidadeBriefing`; conferir as assinaturas no código antes de detalhar implementação. Nenhuma mudança de interface é necessária para o desenho exploratório.

- [ ] Descrever o fluxo: selecionar dado/população → pedir explicação → examinar evidência → receber proposta ou simulação claramente identificada.
- [ ] Definir estados observáveis: consultando, resposta, evidência insuficiente, falha e simulação local. Não desenhar execução autônoma como capacidade existente.
- [ ] Especificar fechamento, retorno de foco e comportamento mobile do painel; agente não deve bloquear os controles essenciais da leitura.

**Gate:** toda affordance tem ação e retorno definidos; o futuro agêntico aparece na interação, com capacidades atuais e futuras distinguidas.

## Tarefa 4 — Preparar campanha de clareza e regressão

**Responsável:** Luna de harness; revisão visual do principal e leitura com Bruno.

**Arquivos futuros:** criar `docs/design/qa-piloto.md`; usar `screenshots/piloto-dashboard/` para evidências sintéticas, preservando capturas antigas.

**Interfaces:** cenário = `URL, viewport, filtros, fixture/versão, estado, captura, esperado, observado, resultado`. Separar pontuação visual, precisão factual e verificação de código.

- [ ] Fixar perguntas antes de comparar desenhos: qual valor principal, de qual período, qual comparação, onde está a maior concentração e como aprofundar/pedir explicação.
- [ ] Usar gabarito extraído do fixture, com zero tolerância para erro material de valor, unidade, período ou semântica. Comparação inexistente recebe “indisponível”, nunca série inventada.
- [ ] Contar prosa auxiliar antes/depois com o mesmo viewport e estado; aplicar a meta de corte definida acima. Reprovar se o corte esconder significado material ou apenas reduzir tamanho de fonte.
- [ ] Inspecionar capturas dos dois tamanhos, teclado/zoom e estados de carregamento, vazio, nulo, falha/timeout e assistente aberto. Registrar observações, não apenas PASS.
- [ ] Gate proposto de clareza: Bruno/localmente um leitor responde pelo menos quatro das cinco perguntas em até 30 segundos. Tempo de resposta de Luna não mede compreensão humana; sua crítica visual é só triagem.
- [ ] Gate de integridade: nenhum valor principal cortado, nenhum overflow horizontal involuntário, rótulos sem depender apenas de hover/cor, foco visível e contexto preservado ao fechar assistência.
- [ ] Reutilizar controle de navegador disponível. Se não houver automação de captura persistente, registrar o roteiro manual reproduzível; não declarar automação existente nem instalar ferramenta só para este plano.

**Gate:** clareza comprovada separadamente dos testes técnicos. Repetir somente cenários afetados por correções; uma rodada aprovada é suficiente para avançar.

## Tarefa 5 — Implementar somente o piloto aprovado (futura)

**Arquivos candidatos:** `src/components/central/agora.tsx`, `briefing-visuais.tsx` e, se necessário, `controles-briefing.tsx`. Extrair componente local somente se necessário. `src/app/globals.css`, `primitivas.tsx` e `page.tsx` só entram se o spec comprovar necessidade e considerar todas as telas afetadas.

- [ ] Transformar o desenho escolhido em plano técnico com interfaces exatas; consultar documentação local Next e confirmar executáveis antes de alterar código.
- [ ] Implementar com Luna em lotes delimitados, preservando DTOs, métricas, URLs e dados. Não fazer refactor geral.
- [ ] Verificar `npx tsc --noEmit`, `npm run lint`, testes Node existentes e `npx next build`, usando executáveis locais confirmados. Não usar o script `build` com `cp` como se fosse Windows nativo.
- [ ] Para contratos HTTP, verificar identidade do servidor por `/api/meta` e usar `$env:CENTRAL_BASE_URL='http://127.0.0.1:3001'` antes de `node --test tests/*.test.mjs`. Não reutilizar totais históricos como resultado desta execução.
- [ ] Rodar tarefa 4 sobre o render real. Mudança em lógica exige teste comportamental executável; ajustes puramente visuais exigem evidência visual, não teste que apenas repete CSS.

**Gate:** desenho aprovado + dados íntegros + verificações técnicas pertinentes + clareza visual. Falha mantém piloto não concluído.

## Tarefa 6 — Expandir o padrão validado (futura)

**Arquivos candidatos:** restante de `agora.tsx`/`briefing-visuais.tsx`, `visao.tsx`, `agente.tsx`, `visoes.tsx`, `radar.tsx`, `oportunidades.tsx`, `winloss.tsx`, `detalhe-oportunidade.tsx`, sob `src/components/central/`.

- [ ] Completar o Briefing e seguir para Pipeline, Pergunte e Visões, aplicando as correções específicas dos prints. Depois priorizar as demais superfícies por uso e decisão atendida.
- [ ] Expandir uma superfície por lote com o mesmo harness. Incluir 1920×1080 quando mudar layout compartilhado; não recapturar telas intactas sem motivo.
- [ ] Atualizar contrato visual e handoff vigentes com a direção aprovada; preservar histórico, métricas e capturas anteriores.

**Gate:** consistência demonstrada por tela, sem afirmar cobertura de superfícies ainda não revistas.

## Próxima decisão e continuidade

Revisar este escopo de exploração. Primeiro resultado esperado da continuação: referências recuperadas e dois desenhos comparáveis do piloto, sem alteração da aplicação. O plano de execução detalhado só será fechado sobre o desenho escolhido; não há justificativa para pagar pela implementação antes disso.
