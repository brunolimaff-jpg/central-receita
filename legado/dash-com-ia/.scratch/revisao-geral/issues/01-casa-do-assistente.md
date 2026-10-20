# 01: Casa do assistente — fluxo contínuo, narrativa e primeira decisão não-forecast

**What to build:** a Central abre como um briefing de agente em fluxo contínuo (uma página-longa por scroll com indicador lateral âncora/scrollspy): saudação com síntese do recorte, campo de pergunta com atalhos ("O que exige minha atenção?", "O que mudou?", "Explique o gap") e **Resposta em foco** (perguntas suportadas explícitas); bloco **Exige você** (intervenções sugeridas a partir de oportunidades paradas antes da negociação: dias sem avanço, valor, executivo); as seções seguintes do fluxo (Forecast do mês com os números atuais compactados + Entra na semana + Pipeline + New Name + Cross + Loss + Unidades + Receita & Pedidos) existem como âncoras com conteúdo compacto atual onde já há dado, ou estado "chega nas próximas entregas" honesto; caminho de drill home → oportunidade (origem) → **volta à posição exata do scroll**; hover-first nos gráficos existentes (hero e evolução: passar o ponteiro responde o essencial — métrica+tempo, valor, comparação nomeada, significado em 1 frase, base/relação); responsivo (mobile 1 coluna na mesma ordem); identificação permanente de cenário simulado e asOf.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Fluxo contínuo com scrollspy: scroll passa por todas as seções; clique no indicador pula; posição indicada durante o scroll (ADR-0004)
- [ ] Abertura narrativa (Bom dia + síntese do recorte com filtros explícitos) e pergunta com atalhos; Resposta em foco com conclusão → evidências → limites → próximo passo; perguntas não suportadas recebem limitação específica
- [ ] Exige você com até 3 prioridades reais (opp paradas antes da negociação: dias sem avanço, valor, executivo) e ação de drill
- [ ] Drill oportunidade → volta à posição exata (incluindo botão voltar do navegador); contexto/filtros preservados
- [ ] Hover-first no hero e na evolução do mês com o contrato de evidência (5 campos); um tooltip ativo por vez
- [ ] Responsivo: mobile 1 coluna, mesma ordem, sem balão cortado
- [ ] Estados loading/empty/error nos pontos novos; "cenário simulado · asOf" visível
- [ ] Seletores puros com testes `node --test` (abertura, prioridades, perguntas suportadas); suites existentes verdes; tsc e eslint limpos

## Comments

**2026-09-29 — Implementação entregue (dupla flash supervisionada pelo principal):**
- Fundação: `SupportedQuestion/Intervention/AgentOpening/EvidenceRef/FocusAnswer` em types.ts; `selectAgentOpening`, `selectInterventions` (pré-Negociação, ordenação valor desc, máx 3), `selectFocusAnswer` (null = não suportada), `AGENT_SUPPORTED_QUESTIONS`; mock com follow-ups (daysIdle 3-9d); 12 testes novos em `tests/comercial-v3-agent.test.mjs`.
- UI: `agent-flow-rail` (âncoras + scrollspy IntersectionObserver + aria-current), `agent-opening/question/interventions`, `agent-flow-section` (+FlowComingSoon honesto), `agent-chart-evidence` + `agent-evidence-tooltip` (hover-first 5 linhas, portal fixed, toque persistente, Esc); `home-screen` reescrito como fluxo contínuo de 9 seções (ADR-0004); "Δ vs. meta" → "Gap para a meta".
- Supervisão: `comercial-v3-hero-contract` atualizado para travar a composição do fluxo contínuo; dev server reiniciado (watcher OneDrive não invalidava).
- Gates VERIFICADOS: 140/140 testes (CENTRAL_BASE_URL=127.0.0.1:3001), tsc exit 0, eslint exit 0, home SSR servindo strings novas.
- Aceites pendentes de validação humana: scrollspy/toque/375px ao vivo com o dono; drill volta-à-posição no navegador.
