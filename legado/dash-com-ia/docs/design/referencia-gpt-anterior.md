# Referência — GPT anterior "Central de Inteligência de Receita" (régua de beleza + material a aproveitar)

**Fonte:** https://central-inteligencia-new-names.workspace-947623.chatgpt.site/ (app privado ChatGPT; inspecionado em 28/09/2026 via IAB com a sessão do Bruno — snapshot DOM + capturas das 4 visões).
**Palavra de Bruno:** "tá muito mais bonito que esse [nosso]… a ideia é a gente evoluir o nosso, aproveita ali um pouco tb."

## Estrutura verificada (snapshot DOM)

- Sidebar Senior: **Gestão · Oportunidades New Names · Win/Loss e Auditoria · Investigações · Casos de Decisão · Metodologia**; usuário "Gabriel Moreira — Diretor Comercial".
- Header: Pesquisar · Notificações · Ajuda · Aplicações.
- H1 por visão + subtítulo de UMA linha ("Briefing executivo: resultado, concentração de atenção e decisões pendentes") + badge **"Simulado"**.
- **Filtros no topo: "Abrir filtros" · período explícito ("01 a 31 mai. 2025") · Atualizar · Mais opções.**
- **"Lente de trabalho": Diretoria (ativa) · Liderança · Inteligência de Vendas** — mesma tela, três perspectivas de leitura.

## O que aproveitar (com evidência do DOM/capturas)

1. **Lente de trabalho** (Diretoria/Liderança/Inteligência): troca a densidade e o vocabulário sem trocar de tela — resolve "diretor não precisa disso tudo" e prepara a camada do executivo SEM outra aplicação.
2. **Período explícito + delta "vs mês anterior" em TODO número** (2.183 opp · +12% vs abr/25 etc.) — comparação temporal é linguagem de primeira classe.
3. **Cards de decisão com dono e prazo**: severidade (Crítico/Alto/Médio) + título curto + uma frase + avatar com iniciais + responsável + data + ação ("Reativar e priorizar contas").
4. **Coluna "Evidência" com GRAU (Insuficiente · Parcial)** na fila de decisão — procedência em três níveis, igual ao Scout 360 (verde/dourado/azul) — convergência de duas referências independentes.
5. **"Populações que explicam o resultado"**: Sem ação >14d (412 · 19%) · Sem proposta · Previsão vencida · Baixa cobertura · Concorrente — linguagem de população, não de item.
6. **"Síntese para a reunião"**: 2 frases curtas geradas — o lugar certo de texto de IA (resumo executivo no fim da dobra, não prosa pelo meio).
7. **"Estado da qualidade do recorte"**: Completude 92% · Atualidade 76% · Reconciliação 89% — a qualidade do DADO como indicador visível do painel.
8. **Rodapé honesto**: recorte · "última atualização há 8 min" · limitação ("valores simulados, sem conexão com CRM").
9. **Estética** (régua de beleza): claro, canvas ChatGPT, tipografia grande e confortável, cards arredondados com sombra suave, muito respiro — polish acima dos meus protótipos.

## O que a Central JÁ cobre (não duplicar)

Decisões pendentes por valor (= "exige você"), populações/sinais (= radar R1–R7), funil por etapa (= pipeline), win/loss 90d, recorte por unidade/conceito, snapshot/limitação no rodapé.

## Como entra no nosso feed (ligação com escopo-feed-diretor-v1.md)

- **Lente de trabalho** na topbar ao lado dos filtros (v1: só "Diretoria" ativa; Liderança/Inteligência preparam a fase do executivo).
- Período explícito (o filtro que faltava) + delta temporal em todos os números do feed.
- Cards do "Exige você" ganham avatar+responsável+prazo (quando houver responsável no recorte).
- **Evidência com grau** (Insuficiente/Parcial/Comprovada) nos itens da fila — casar com a procedência 3-níveis do Scout.
- **Qualidade do recorte** como cartão final do feed (completude/atualidade) — a Central tem `/api/validacoes` (invariantes) como base.
- **Síntese para a reunião**: 2 frases geradas pela camada LLM "em casa" (D10 do escopo) fechando o feed.

## Diferenças a PRESERVAR no nosso (não copiar)

- Nosso: feed contínuo com scroll (o dele é página por visão com sidebar); macro por 29 unidades (o dele é um recorte New Name); números sempre do domínio determinístico; Pergunte à Receita como assistente de primeira classe (o dele não tem conversa).
