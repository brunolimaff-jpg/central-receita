# Revisão Geral — plano consolidado (turno 3 do debate, 29/09/2026)

> Fonte: turno 3 do Astra (xhigh) + rodada 3 do grill com Bruno. **Este plano suplanta a ordem dos tickets do `VEREDITO-CONSOLIDADO.md`** (cujas regras de domínio de pedidos seguem valendo: integração como fato, asOf, faixa de dependência, agência de preparação, honestidade com fonte).
>
> **EMENDA DO DONO (29/09, pós-turno 3 — prevalece sobre o Astra onde conflitar):**
> 1. **New Name, Cross e Loss são blocos SEPARADOS na home.** Cross é métrica importante com bloco próprio; Loss (perdas de aquisição) também não se mistura.
> 2. **Fluxo contínuo, não navegação por páginas de sidebar**: "a ideia não é eu clicar na sidebar para usar o scroll — eu posso tanto clicar como scroll down e passar por todas, assim é mais prático". Uma página-longa com scroll passando por TODAS as seções; o indicador lateral é âncora clicável que também indica posição (scrollspy — modelo do feed v1 selado). Drill/oportunidade/pedido/origem continuam subtelas com volta.

## Conceito-âncora

**A unidade da Central deixa de ser o card e passa a ser uma pergunta de gestão respondida com evidência.** "O Giovane quer um Claude, melhor": briefing executivo **navegável** + conversa contextual — não um chat que exige pergunta antes de mostrar valor, não um dashboard com campo de IA colado em cima.

A primeira entrega precisa provar duas coisas: **há vida além do forecast** e **o assistente sabe explicar o que mostra**.

## Home = fluxo contínuo (scroll) com indicador-âncora + conversa

```text
[Período] [Recorte organizacional] [Mais filtros]
Cenário simulado · posição em 29/set, 7h50 · base monetária

Bom dia, Giovane. [síntese do recorte]
[Pergunte sobre este recorte.........................] [O que exige minha atenção?] [O que mudou?] [Explique o gap]

── scroll down passa por TODAS as seções; indicador lateral clica e pula ──

1. Exige você       → onde a intervenção do diretor faz diferença (até 3 prioridades c/ responsável e impacto)
2. Forecast do mês  → posição + dependência de integração (10,2 atual · 12,0 meta · 8,4 realizado · 11,0 oficial · gap p/ meta −1,8)
3. Entra na semana  → fechamentos previstos E integrações previstas, separados (expectativa ≠ realizado)
4. Pipeline         → sustentação: etapas, concentração, ritmo (medianas 18d/31d/58d)
5. New Name         → resultado integrado + pipeline de grupos novos (derivado do grupo econômico)
6. Cross            → expansão da base instalada — BLOCO PRÓPRIO, métrica de primeira classe
7. Loss             → perdas de aquisição ("perdemos e ainda não é cliente") — BLOCO PRÓPRIO
8. Unidades         → comparação por filial c/ meta, resultado, dependências
9. Receita & Pedidos→ realizado auditável, dependência de integração, fila de pedidos, churn
```

- **Cada seção do fluxo é âncora**: clique no indicador lateral rola até ela; o indicador acompanha a posição durante o scroll (scrollspy). Nenhuma seção é uma "página" separada na sidebar.
- A ordem acima é a de leitura; mobile é a mesma ordem em 1 coluna.

- **Bloco-fala** ≠ balão de chat: conclusão curta → evidência visual embaixo → uma ação principal. A narrativa explica *por que olhar*, não repete os números da tabela.
- **Saem os 5 cards como objetos independentes** (os números permanecem reorganizados no bloco 2; "Δ" vira **"Gap para a meta"**; atual vs. oficial ganha rótulo próprio −0,8/−7,3%).
- **Movimentos do forecast** sai da home como gráfico solto — vira a resposta de "o que mudou?". **Top 10** vira seleção curta contextual (lista completa em Crescimento).
- **"Exige você" não é "tudo atrasado"**: copy "Intervenções sugeridas" até haver regra de escalonamento; devolução de pedido é do executivo, não do diretor.
- **Conversa**: "Resposta em foco" abaixo da abertura (resposta curta → evidências → limites → próximo passo); assume e explicita os filtros; perguntas sem suporte recebem limitação específica — **conjunto explícito de perguntas suportadas no mock**; zero Claude externo.
- Agente de cobranças **funde-se como identidade**: o mesmo assistente explica, localiza evidência, oferece "Preparar cobranças" e entrega artefato "Preparado — não enviado". Sem aba "Agente".

## Navegação: UM fluxo contínuo (emenda do dono — não 4 páginas de sidebar)

O produto inteiro é **uma página-longa por scroll**, com o indicador lateral como âncora clicável + marcador de posição (scrollspy). As antigas "visões" do Astra viram **faixas do fluxo**:

| Faixa do fluxo | Conteúdo |
|----------------|----------|
| **Abertura + Exige você** | Bom dia, síntese, pergunta contextual, prioridades |
| **Pulso do mês** | Forecast (c/ dependência), Entra na semana, Pipeline |
| **Aquisição** | New Name · Cross · Loss (três blocos separados) |
| **Organização** | Unidades: comparação, ranking por métrica, funil da filial |
| **Receita & Pedidos** | Realizado auditável, dependência de integração, fila, churn |

Conta, grupo econômico, oportunidade e pedido = **fichas contextuais** abertas de qualquer ponto do fluxo (subtela com volta, preservando a posição do scroll). **Pedidos é faixa de Receita** com 3 entradas (faixa de dependência, intervenção sugerida, pergunta) — o diretor vê o impacto antes da fila.

**Roadmap (fora deste corte):** white space com preço, Conta 360º completa/matriz com rateio, mapa de praças, orçamento da oportunidade, carteira por competência, linha do tempo exaustiva.

**Filtros:** período + recorte organizacional + "Mais filtros" com contador e chips ativos; base monetária sempre visível; nenhuma seção ignora filtro silenciosamente.

## Redesign (hover-first, responsivo, premium sem espetáculo)

- **Hover responde o essencial** (5 campos: métrica+tempo, valor, comparação nomeada, significado em 1 frase, base/relação); clique FIXA inspeção e abre composição; toque = estado persistente; um tooltip ativo por vez; destaque ≠ filtro automático.
- **Contrato de evidência único** consumido por tooltip, fala do agente, card e detalhe — nunca quatro versões do mesmo número.
- **Responsivo = a mesma Central em largura menor**: desktop grid 12 col assimétrico (7/5, 8/4, nada de fileira de 3 iguais); mobile 1 coluna com os 7 blocos na ordem, filtros em painel, narrativa antes da evidência, tabelas compactas com expansão de linha.
- **Tipografia**: número decisivo 32-40px (mobile 28-32), secundário 20-24, conclusão 16-18, tabelas 13-14; um número dominante por seção; abreviado na leitura, precisão na inspeção.
- **Identidade**: #f6f9fe, superfícies brancas só para agrupamento real, hairline, esmeralda #00968c acento único, atraso por texto+marcador (não paleta vermelha paralela), sombras tingidas, springs 100/20, respeitar reduced-motion.
- **Copiar do Claude**: pergunta evidente, resposta que começa pela conclusão, continuidade, evidência próxima, próximos passos, admitir limites. **Não copiar**: tela vazia esperando prompt, balões para tudo, saudação gigante, typewriter em número já calculado, avatar decorativo, chat como única forma de reencontrar análise.

## Nova sequência de tracer bullets (suplanta a ordem anterior)

| # | Entrega vertical | Aceite |
|---|------------------|--------|
| **01** | **Casa do assistente + primeira decisão não-forecast**: shell revisado responsivo, abertura narrativa, pergunta contextual inicial, "Exige você" com follow-up de oportunidade; caminho home → oportunidade → origem → volta; forecast atual compactado | Em desktop e mobile: entende uma prioridade não-pedido, inspeciona por hover/toque, volta sem perder contexto |
| **02** | **Crescimento e semana comercial**: Entra na semana, pipeline, ritmo, NN, Cross+perdas; visão Crescimento | Home cobre o feed v1 além do forecast; diferencia esperado × perdido × realizado |
| **03** | **Receita auditável e integração**: visão Receita, composição do realizado, dependência reconciliada, **fila de pedidos**, rastro até integração | Valores conservados entre home/composição/origem; nada somado duas vezes |
| **04** | **Unidades e fichas**: comparação filiais, ranking por métrica, funil da filial, ficha contextual conta/grupo | Sai de um desvio de unidade e chega à entidade sem refazer filtros |
| **05** | **Conversa transversal + trabalho preparado**: perguntas expandidas às visões, comparação de recortes, preparação de cobranças | Resposta coincide com seletores, cita evidências, explicita limites; pacote "não enviado" |
| **06** | **Churn + leitura de fechamento**: churn em Receita, narrativa de período encerrado, cenários de atualização tardia/defasagem/reconciliação incompleta | Em 1º/out entende setembro encerrado sem confundir com receita de outubro |

**Transversais em TODOS os bullets** (nada de "acabamento" no final): responsividade, hover/foco/toque, loading/empty/error, parse/build de navegação e volta, seletores puros + node:test, validação runtime de snapshot, smoke de navegador, identificação de cenário simulado.

## Teste final da revisão

Sem conversar, Giovane consegue: (1) identificar onde intervir, (2) entender a posição de receita, (3) ver o que está por entrar e a sustentação, (4) distinguir aquisição/expansão/perda, (5) localizar a unidade que merece aprofundamento. **Ao perguntar, ganha explicação + recorte + trabalho preparado — não prosa repetindo os cards.**
