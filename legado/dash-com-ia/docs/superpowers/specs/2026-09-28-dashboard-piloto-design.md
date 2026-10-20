# Spec — Piloto Briefing: duas direções de dashboard agênico (Tarefa 2 do plano 28/09)

**Status:** desenhos criados, aguardando escolha de Bruno (gate da Tarefa 2). Nenhum arquivo de `src/` foi tocado.

## Contexto e evidência

- **DECISÃO DO USUÁRIO (28/09):** direção editorial rejeitada (“isso tá texto DEMAIS” / “tem que ajudar, não ser mais leitura”). O dashboard precisa ser **agênico e orientado a resultado** para diretoria e liderança.
- Mock antigo `central-receita-agentic.html` (`docs/mockups/`, referido em `QA_VISUAL.md:157` e `briefing-visual-spec.md:45`): **NÃO ENCONTRADO** — ausente do checkout, do histórico git (só exclusões staged preservadas), Desktop, Downloads, Documents e vault. Conforme instruções de Bruno: “se não achar, bora criar aqui”. Os desenhos abaixo foram criados novos.
- Valores do mock extraídos dos prints de 22/09 (validados em `/api/meta` v1.1.0-mock: 30 contas, 97 oportunidades). Etapas além das 3 visíveis no print aparecem agregadas como “Demais etapas” (R$ 11,2 mi = 18.330.500 − 2.248.000 − 2.426.500 − 2.450.500; 34 opp = 59 − 25) — substituir pela leitura real de `/api/pipeline` na implementação.
- **Resultados de simulação exibidos nos mocks (ex.: “R$ 3,42 mi recuperáveis em 9 de 16”) são ilustrativos** para demonstrar o estado de simulação; na implementação vêm do domínio local.

## Arquivos

| Arquivo | O que é |
|---|---|
| `docs/design/piloto/piloto-a-painel-agente.html` | Desenho A — Painel do Agente (self-contained, sem dependências externas) |
| `docs/design/piloto/piloto-b-trilha-execucao.html` | Desenho B — Trilha de Execução (self-contained) |
| `docs/design/piloto/index.html` | Comparação lado a lado + links tela cheia |
| `docs/superpowers/plans/2026-09-28-dashboards-visuais-agenticos.md` | Plano-mestre (não alterado) |

## Regras comuns aos dois desenhos (do plano, seção “Regras para os desenhos”)

1. Primeira camada: nome curto, valor, unidade/período, comparação e ação. Zero parágrafos de instrução.
2. Detalhe/fonte/regra abrem por **clique ou teclado** (`<dialog>` nativo e `<details>`), nunca só hover.
3. “Dados sintéticos” uma vez no contexto global (sidebar + topbar). Limitação que muda interpretação fica curta junto da métrica (ex.: rodapé do agente: “Execução real em CRM: futuro”).
4. Sem cartões dentro de cartões. Ranking de riscos substitui os cards aninhados.
5. **Proposta ≠ simulação ≠ execução real:** toda ação de simulação exibe selo “simulação · nada foi salvo”; execução real aparece como estado futuro (`tag futuro`).
6. Meta/atingimento não exibido (sem fonte na leitura) — resposta explícita “sem fonte de meta nesta leitura” na pergunta rápida.
7. Horizonte 30/60/90 e densidade compactos na topbar; contexto do agente acompanha a seleção.
8. Mobile: sidebar some (≤960px), trilha/agente empilham abaixo dos dados; KPIs 2×2 (≤1180px) e fonte reduzida (≤560px). Validação real em 390×844 pendente (ver Pendências).

## Desenho A — Painel do Agente (hipótese inicial recomendada)

- **Organização:** KPI strip (4) + área de dados (2/3: pipeline por etapa, dinheiro em jogo, concentração) + **painel do agente fixo à direita (1/3, sticky)**.
- **Agente conversacional contextual:** fila de propostas ordenada por valor (R$ 6,06 mi → 2,19 mi → 2,23 mi), cada proposta com ações curtas (“Simular recuperação”, “Explicar variação”). Resposta com estado observável: *analisando…* (spinner) → leitura + **evidência** (mini-gráfico/registros) + limitação + ações, com selo de simulação.
- **Por que recomendado:** reaproveita `agente.tsx`/`assistant-trigger.tsx` e o contrato POST `/api/agente` já existentes; delta técnico menor; o agente acompanha o contexto (horizonte) selecionado.

## Desenho B — Trilha de Execução

- **Organização:** mesmos KPIs e área de dados (com card extra “Movimento do mês”: +R$ 363 mil / 6 entraram / 4 saíram) + **trilha à direita sem chat**: “Desbloquear agora” (itens expansíveis por valor), “Decisões pendentes” (com ação futura “Aprovar em massa”), “Perguntas rápidas” (respostas inline em `<details>`).
- **Diferencial:** posiciona a tela como cockpit de execução — a UI é a fila de resultado, o agente aparece inline em cada item (simular/preparar). Aposta maior de produto e de reorganização dos componentes.

## Comparação

| Critério | A · Painel do Agente | B · Trilha de Execução |
|---|---|---|
| Reuso do código atual | Alto (painel do agente já existe) | Médio (nova superfície de fila) |
| Agência percebida | Alta — diálogo no contexto, propostas acionáveis | Alta — mas como fila, não conversa |
| Risco de virar “mais leitura” | Médio se respostas ficarem longas — respostas têm limite de 2 linhas + evidência | Baixo — tudo é ação ou decisão |
| Mobile | Painel vira seção abaixo dos dados | Trilha vira lista abaixo dos dados |
| Gate da Tarefa 3 | Estados: consultando → resposta/evidência insuficiente/falha/simulação já demonstrados no mock | Mesmos estados, por item da fila |

**Recomendação: A** (hipótese inicial do plano), com a seção “Dinheiro em jogo” de B mantida como ranking único de riscos — que já está nos dois desenhos.

## Estados e acessibilidade (base para a Tarefa 3)

- Observáveis no mock: `pronta` / `analisando…` (spinner + anúncio em `role="status"`) / resposta com evidência / selo de simulação. Falha, timeout e evidência insuficiente não estão renderizados no mock — especificar na Tarefa 3.
- Teclado: `<dialog>` nativo (Esc fecha, foco preso), `<details>`/`<summary>` nativos, segmented control com `aria-pressed`, foco visível (`outline` brand).
- **Verificação de render (Playwright 1.63.0 + Chrome do sistema):** capturas em `screenshots/piloto-dashboard/` — A/B em 1440×900 (primeira viewport + estados de resposta/simulação) e 390×844 (KPIs 2×2, sem overflow horizontal). Dois achados corrigidos: barra do agregado “Demais etapas” enganosa (virou barra cheia em cinza com nota) e total da trilha B corrigido para R$ 17,4 mi. Console do navegador não foi inspecionado.
