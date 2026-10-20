# Central de Receita — Visão Comercial V3
## Design spec congelado para implementação

**Status:** SPEC FINAL APROVADO PARA PLANO DE IMPLEMENTAÇÃO  
**Referência visual final:** `01_REFERENCIA_VISUAL_FINAL.png`  
**Público primário:** Giovanne — Diretoria Comercial  
**Objetivo:** transformar a Home em um cockpit executivo de previsibilidade comercial, com leitura rápida do mês, variação do forecast, composição New Names x Cross, leitura por filial e drill-down até oportunidade.

---

## 1. Tese do produto

A Home não é um painel de cobrança e não substitui a gestão diária feita pelos líderes.

Ela deve responder, em poucos segundos:

1. Estamos entregando a meta?
2. O forecast oficial continua de pé?
3. O que mudou desde a fotografia oficial?
4. Quais oportunidades mais explicam o movimento?
5. Como New Names e Cross participam do resultado?
6. Quais filiais exigem atenção visual?
7. Onde aprofundar sem perder o contexto da Home?

A experiência parte de **fato observado → explicação → aprofundamento**, sem transformar desvio em culpa por padrão.

---

## 2. Regras de negócio e linguagem congeladas

### Forecast
- O **forecast oficial** é a fotografia oficial do período na data de corte.
- A fotografia oficial não é reescrita.
- Alterações posteriores aparecem como movimentos/desvios em relação à fotografia.
- Entradas posteriores podem vir de qualquer posição anterior: pipeline do mês, pipeline do trimestre, futuro ou nova oportunidade.
- A Home não chama entrada tardia, postergação ou saída de “erro” por padrão.
- O Executivo movimenta as oportunidades.
- Coordenador acompanha a operação.
- HEAD consolida/explica movimentos quando necessário.
- A Central não cria workflow de cobrança para o Giovanne.

### Filtro organizacional
- O filtro executivo superior é **Filial**, não HEAD.
- Um HEAD pode estar relacionado a mais de uma filial.
- Portanto:
  - `FILIAL != HEAD`
  - não assumir relação 1:1;
  - não derivar filial de HEAD ou HEAD de filial por conveniência.

### New Names x Cross
- É dimensão executiva material.
- Deve aparecer na Home.
- Na V3, a leitura primária é **participação no realizado do período selecionado**.
- O card também deve expor, em nível secundário, a composição por tipo de receita quando houver mock disponível.

### Receita
- Mostrar os três valores quando o contexto pedir:
  - mensalidade / recorrente;
  - habilitação;
  - serviços.
- Receita recorrente recebe maior destaque visual.
- Não colapsar recorrente e não recorrente em um único valor sem rótulo.

### Top 10
- A Home mostra **Top 10 oportunidades que mais explicam o mês**.
- Ordenação do mock: maior impacto absoluto no valor do forecast, do maior para o menor.
- Incluir impactos positivos e negativos.
- Não transformar “Top 10” em população total.

---

## 3. Referência visual canônica

A imagem `02_REFERENCIA_VISUAL_HIGH_END.png` é a referência visual principal.

Ela define:
- densidade;
- proporção desktop;
- hierarquia;
- peso de tipografia;
- sidebar;
- header;
- card system;
- hero;
- paleta;
- raio;
- sombras;
- tabela;
- espaçamento;
- balanço visual.

Ela **não** congela números mock como fatos.

### Fidelidade esperada
A implementação deve se aproximar da referência por:
- composição;
- alinhamento;
- proporção;
- escala tipográfica;
- espaçamento;
- comportamento visual;
- iconografia;
- contraste;
- densidade de informação.

Não basta “seguir a ideia”. O objetivo é parecer a mesma interface implementada.

---

## 4. Estrutura desktop da Home

### 4.1 Sidebar
Itens principais:
- Visão Comercial
- Forecast
- Oportunidades
- Contas
- Relatórios
- Explorar

Regras:
- Visão Comercial ativa.
- Ícones discretos e consistentes.
- Nada de badges decorativos sem função.
- Não incluir “Pipeline” como item primário nesta referência V3; a leitura de pipeline pode viver em Forecast/Explorar caso o checkout existente já possua rota útil.

### 4.2 Header
Título:
- **Pulso Comercial**

Controles:
- mês selecionado;
- tabs: **Mês / Trimestre / 3 meses**;
- filtro de solução;
- filtro **Todas as filiais**;
- busca;
- perfil do Giovanne.

Nunca usar “Todos os HEADs” como filtro superior desta Home.

### 4.3 Hero — briefing do dia
Microcopy base:

**Seu briefing de hoje**

**O forecast mudou desde a fotografia oficial.**

“Hoje estamos R$ 0,8 mi abaixo do valor comprometido e 15% abaixo da meta. Três movimentos explicam a maior parte da variação do mês.”

CTA:
- **Ver o briefing completo**

Comportamento:
- o briefing é leitura executiva;
- não é chat;
- não traz linguagem de cobrança;
- não inventa causalidade;
- clique abre aprofundamento do briefing;
- retorno preserva filtro/período.

Visual:
- fundo de montanhas em baixa saturação;
- curva de forecast integrada ao cenário;
- callout de forecast atual;
- referência de meta;
- bastante respiro;
- texto nunca deve competir com o gráfico.

### 4.4 KPIs primários
Ordem:
1. Meta do mês
2. Realizado
3. Forecast oficial
4. Forecast atual
5. Δ versus meta

Regras:
- números com algarismos tabulares;
- valores em destaque;
- label sempre explícito;
- vermelho/verde usado apenas para direção/variação;
- forecast oficial não recebe linguagem de “definido pela diretoria”.

### 4.5 Linha analítica
Bloco A — **Evolução do mês**
- série Meta;
- série Realizado;
- série Forecast oficial;
- série Forecast atual;
- leitura simples;
- linhas legíveis e contraste suficiente.

Bloco B — **Movimentos do forecast**
Substituir waterfall visualmente confuso por fluxo sequencial legível:

`Forecast oficial → Saiu → Postergou → Alterou valor → Entrou → Forecast atual`

Cada etapa mostra:
- valor do impacto;
- quantidade de oportunidades;
- direção visual;
- rótulo humano.

Cores:
- saídas/postergações/reduções: coral/vermelho;
- entradas/aumentos: verde Senior;
- origem e destino: neutro/azulado.

Bloco C — **New Names x Cross**
Leitura principal:
- valor realizado New Names;
- % do realizado;
- valor realizado Cross;
- % do realizado.

Leitura secundária:
- mensalidade / recorrente;
- habilitação;
- serviços, quando mock disponível.

Não mostrar pipeline como terceiro bloco nesta linha.

### 4.6 Tabela — Top 10 oportunidades que mais explicam o mês
Colunas mínimas:
- #
- Conta
- Solução
- Executivo
- Filial
- Movimento
- Δ valor
- Receita recorrente
- Valor atual
- Previsão
- Estágio
- Origem

Regras:
- linha inteira clicável;
- movimento com tag discreta;
- positivo/negativo por cor sem depender só da cor;
- receita recorrente visualmente mais forte que os demais valores;
- habilitação e serviços aparecem no hover, expansão de linha ou tela de oportunidade;
- sem ações de cobrança na Home.

### 4.7 Rail direito
Bloco A — **Filiais no mês**
Não usar “HEADs” como agrupamento primário.

Para cada filial:
- realizado;
- meta;
- forecast atual;
- % da meta.

O mock pode ser ordenado estaticamente; a regra de ordenação de produção fica fora desta passagem.

Bloco B — **Destaques do mês**
Exemplos de leitura:
- New Names representa X% do realizado;
- N oportunidades saíram do forecast oficial;
- R$ X entraram no mês;
- Top 5 explica X% do desvio total.

Todos os destaques precisam ser derivados dos mocks da própria Home para não haver inconsistência interna.

---

## 5. Navegação e drill-down

A Home deve ser o ponto de retorno.

Vertical mínima a provar no pacote:

`Home → Forecast → Filial → Oportunidade → voltar`

Também:
`Home → Top 10 → Oportunidade → voltar`

Requisitos:
- preservar período;
- preservar solução;
- preservar filial;
- preservar origem da navegação;
- breadcrumb ou botão voltar explícito;
- nunca obrigar o usuário a “recomeçar” pela Home;
- sem modal para detalhe principal;
- oportunidade abre em tela completa dedicada.

Hover/tooltip:
- explicar métrica;
- mostrar drivers principais;
- mostrar composição;
- não esconder informação essencial exclusivamente no hover.

---

## 6. Tela de Forecast — escopo mínimo

Deve aprofundar:
- fotografia oficial;
- forecast atual;
- delta absoluto;
- delta percentual;
- movimentos por tipo;
- oportunidades que saíram;
- oportunidades postergadas;
- oportunidades que entraram;
- oportunidades com alteração de valor;
- visão por filial;
- visão New Names x Cross.

A tela deve permitir clicar nos volumes e chegar às oportunidades correspondentes.

---

## 7. Tela de Oportunidade — escopo mínimo

Mostrar:
- conta;
- solução;
- executivo;
- filial;
- HEAD, quando disponível no mock;
- estágio;
- origem;
- forecast na fotografia oficial;
- forecast atual;
- movimento observado;
- mensalidade / recorrente;
- habilitação;
- serviços;
- histórico mock de movimentos do período.

Não:
- inventar decisor;
- inventar causa;
- inventar ação de cobrança;
- fazer writeback.

---

## 8. Visual design system

### Base
- fundo geral: quase branco frio;
- cards: branco;
- bordas: cinza-azulado muito leve;
- accent principal: verde Senior;
- apoio analítico: azul;
- negativo: coral/vermelho;
- warning: âmbar;
- sombras tingidas e sutis;
- nenhuma estética “AI purple”.

### Tipografia
- preservar a tipografia já instalada no checkout, salvo incompatibilidade visual comprovada;
- títulos com tracking mais fechado;
- corpo com leitura confortável;
- números com `tabular-nums`;
- sentence case;
- evitar all caps decorativo.

### Superfícies
- cards só onde agrupamento ajuda;
- raio maior em containers;
- raio menor em controles internos;
- glass apenas no hero/callouts se melhorar a profundidade;
- evitar “cartão dentro de cartão” excessivo.

### Motion
- 180–280ms para hover/press/transições curtas;
- transform/opacity;
- respeitar `prefers-reduced-motion`;
- sem animação cinematográfica gratuita;
- não adicionar GSAP só para cumprir estética.

---

## 9. Responsividade

### Desktop
Referência principal: 1536 × 1024.

O layout precisa funcionar também em 1440p e 1920p sem esticar excessivamente.

### Tablet
- sidebar pode recolher;
- hero empilha texto e gráfico;
- tabela vira área horizontal controlada ou visão condensada.

### Mobile
- foco em leitura, não em replicar o desktop;
- KPI em carrossel/stack;
- Top 10 em lista;
- filtros em drawer/toolbar;
- não cortar valores;
- nada de overflow horizontal global.

O pacote será validado primeiro em desktop; mobile recebe gate funcional e visual proporcional.

---

## 10. Dados e mocks

Nesta passagem:
- dados locais;
- sem banco;
- sem migração;
- sem writeback;
- sem API real;
- sem agente LLM real.

O briefing usa os próprios mocks da Home.

Regra obrigatória:
**todo número citado no briefing, destaque, KPI, gráfico e tabela deve reconciliar com a mesma fonte mock.**

Exemplo:
- se o delta do forecast é `-R$ 0,8 mi`, todos os blocos que citam esse delta devem fechar no mesmo valor;
- se Top 5 explica 78% do desvio, esse percentual deve ser calculado a partir do mock, não digitado isoladamente.

---

## 11. Restrições técnicas

- usar o checkout atual;
- manter Next.js / React / Tailwind existentes;
- preservar identidade Senior já disponível;
- preservar arquivos locais fora do pacote anterior;
- não migrar framework;
- não mudar schema;
- não integrar banco;
- não remover legado fora da Home;
- não adicionar dependência sem necessidade comprovada;
- reutilizar componentes existentes apenas quando semântica e visual realmente servirem;
- criar componentes V3 focados quando reaproveitar o legado piorar fidelidade ou clareza.

---

## 12. Estratégia de implementação do pacote

O pacote final deve ser produzido em uma cópia isolada do checkout real.

Processo:
1. copiar o checkout preservando arquivos locais;
2. aplicar a V3 sobre a Home e vertical mínima;
3. adicionar mocks V3 centralizados;
4. adicionar navegação e preservação de contexto;
5. executar build/type/lint possíveis;
6. iniciar app local;
7. capturar screenshot no viewport de referência;
8. comparar com `02_REFERENCIA_VISUAL_HIGH_END.png`;
9. corrigir divergências;
10. repetir até agência-signoff;
11. gerar ZIP final.

Não entregar após “primeira versão que roda”.

---

## 13. Gate visual obrigatório

Comparar lado a lado:
- referência aceita;
- screenshot da implementação.

Auditar no mínimo:
1. sidebar e header;
2. proporção do hero;
3. tipografia e escala dos KPIs;
4. linha analítica;
5. New Names x Cross;
6. tabela Top 10;
7. rail de filiais;
8. espaçamento vertical;
9. bordas/raios/sombras;
10. copy acima da dobra.

Registrar:
- mismatch;
- evidência na referência;
- evidência no render;
- correção;
- desvio intencional, se houver.

O pacote só fecha quando não houver divergência material corrigível.

---

## 14. Fora do escopo desta passagem

- integração com banco real;
- definição do contrato físico das métricas;
- pipeline produtivo;
- score de previsibilidade;
- regra produtiva de ranking de filiais;
- automação de cobrança;
- agente que escreve/edita CRM;
- permissões corporativas;
- autenticação nova;
- migração de schema;
- poda geral do legado;
- deploy de produção.

---

## 15. Critérios de aceite

A V3 é aceita quando:

- o filtro superior diz **Todas as filiais**;
- não existe filtro superior “Todos os HEADs”;
- Home mantém foco em Meta, Realizado, Forecast oficial, Forecast atual e delta;
- movimentos do forecast são visualmente compreensíveis;
- New Names x Cross tem destaque material;
- receita recorrente aparece com maior ênfase;
- Top 10 usa impacto de valor e inclui positivos/negativos;
- filial aparece como dimensão executiva;
- Home → Forecast → Filial → Oportunidade funciona;
- voltar preserva contexto;
- nenhum botão crítico é inerte;
- mocks reconciliam;
- a referência visual é reconhecível na implementação;
- o pacote passa por QA visual e funcional;
- nenhuma integração real ou writeback foi introduzido.

---

## 16. Regra de linguagem

Usar:
- frases curtas;
- voz ativa;
- linguagem humana;
- números específicos;
- CTAs com verbos.

Evitar:
- jargão técnico;
- linguagem robótica;
- “situação crítica” sem régua;
- “erro do executivo”;
- “cobrar agora”;
- causalidade não comprovada.

O briefing mostra **o que mudou e por que merece atenção**, não atribui culpa.

---

## 17. Fonte visual e de conteúdo

- Referência visual: `02_REFERENCIA_VISUAL_HIGH_END.png`
- Tom de voz: `02_TOM_DE_VOZ_SENIOR_RESUMO.md`
- Contexto funcional: discovery realizado nesta conversa sobre forecast, fotografia oficial, New Names x Cross, recorrência, hierarquia e visão do Giovanne.


---

# 18. Adendo final aprovado — Agente Comercial + leitura semanal

> Esta seção **substitui a seção 4.3 (Hero)** e complementa Dados/Mocks, Fora de Escopo e Critérios de Aceite. Em caso de divergência, este adendo governa.

## 18.1 Papel do hero

O hero deixa de ser apenas um alerta de que o forecast mudou. Como o forecast pode variar diariamente, isso não é CTA forte o suficiente.

O hero passa a ser a **porta de entrada do Agente Comercial** e o resumo executivo do retrato diário.

Copy-base aprovada:

- pretitle: **Seu agente comercial de hoje**
- headline: **Seu retrato diário já está pronto.**
- apoio: **Consolidei o panorama do mês, os movimentos do forecast, os principais desvios e as oportunidades que mais explicam o resultado de hoje.**
- CTA primário: **Abrir agente**
- status secundário: **Resumo atualizado agora**

A mensagem deve permanecer curta, humana e executiva. O agente informa o que mudou; não atribui culpa nem cria workflow de cobrança.

## 18.2 Cartão de resumo do agente dentro do hero

Ao lado da copy, exibir **No briefing de hoje você encontra:** com até três sinais derivados da mesma fonte mock da Home. Exemplos do protótipo aprovado:

- mudanças no forecast que mais impactam o mês;
- oportunidades que explicam a maior parte do desvio;
- filiais que merecem atenção pelo efeito potencial sobre a meta.

Os números nunca podem ser strings independentes. Devem ser calculados a partir do mesmo snapshot usado pelos KPIs, movimentos, Top 10 e filiais.

## 18.3 Entrada do Agente Comercial

`Abrir agente` deve abrir a superfície contextual do Agente Comercial com o briefing atual já carregado.

Contrato mínimo:

- herdar período selecionado;
- herdar solução selecionada;
- herdar filial selecionada;
- carregar o snapshot que originou o hero;
- apresentar primeiro o briefing e depois aceitar aprofundamentos;
- preservar caminho de retorno à Home;
- não criar writeback nesta passagem;
- não enviar mensagens, alterar forecast, oportunidade ou CRM nesta passagem.

A UI do agente está em escopo. A integração com um modelo/serviço de IA real continua fora do escopo desta rodada. No protótipo, as respostas podem ser simuladas a partir dos mocks.

Não criar um item de menu genérico `IA`. O principal ponto de entrada do agente é o briefing da Home.

## 18.4 Leitura semanal integrada às montanhas

O gráfico cenográfico do hero também funciona como leitura temporal do mês.

Na visão mensal, dividir o período em faixas semanais visíveis:

- **Sem 1** — 1 a 7;
- **Sem 2** — 8 a 14;
- **Sem 3** — 15 a 21;
- **Sem 4** — 22 ao fim do mês.

Regras visuais:

- marcar a semana corrente;
- mostrar a trajetória do forecast atual;
- manter uma linha de referência de meta/ritmo apenas quando a regra usada estiver explícita;
- o marcador da semana atual deve ser legível sem bloquear a montanha;
- o gráfico não substitui o bloco analítico `Evolução do mês`; ele funciona como leitura rápida no briefing.

A divisão 1–7 / 8–14 / 15–21 / 22–fim é o contrato do mock atual. Não promover isso a regra corporativa sem validação posterior.

## 18.5 Relação agente ↔ dashboard

O dashboard continua sendo a fonte visual de contexto. O agente não concorre com os KPIs.

Fluxo esperado:

`Snapshot do dia -> KPIs e movimentos -> briefing sintetizado -> Abrir agente -> aprofundar -> voltar preservando contexto`

O agente deve responder prioritariamente perguntas como:

- o que mudou hoje?
- quais movimentos mais explicam a diferença para a fotografia oficial?
- quais oportunidades concentram o desvio?
- quais filiais mais mudaram?
- como New Names e Cross participam do resultado?
- o que mudou na semana atual?

Não responder como fato quando o mock não sustenta a resposta.

## 18.6 Ajuste de escopo

Substituir em `Fora do escopo` a leitura ampla `agente LLM real` por:

- **fora do escopo:** integração real com LLM, writeback, ações externas e automação de cobrança;
- **dentro do escopo:** entry point do agente, superfície de briefing, interação local simulada e navegação contextual.

## 18.7 Critérios de aceite adicionais

A V3 final só passa quando:

- o hero usa **Seu agente comercial de hoje**;
- a headline principal é **Seu retrato diário já está pronto.**;
- existe CTA **Abrir agente**;
- `Abrir agente` carrega o briefing do snapshot corrente;
- o resumo do hero reconcilia com KPIs e movimentos;
- o hero mostra semanas do mês e destaca a semana atual;
- o gráfico do hero não vira um segundo dashboard ilegível;
- `Todas as filiais` permanece o filtro organizacional;
- não existe filtro superior `Todos os HEADs`;
- New Names x Cross continua na primeira tela;
- receita recorrente continua com maior ênfase visual;
- nenhuma ação do agente realiza writeback;
- retornar do agente preserva período, solução e filial;
- o render desktop permanece reconhecível em relação a `01_REFERENCIA_VISUAL_FINAL.png`.

## 18.8 Fonte visual governante

A partir deste fechamento:

1. `01_REFERENCIA_VISUAL_FINAL.png` governa hero, entry point do agente e leitura semanal.
2. `02_REFERENCIA_VISUAL_HIGH_END.png` continua como referência secundária para densidade, tabela, rail de filiais e acabamento.
3. O spec textual governa semântica, filtros, navegação, reconciliação e limites.

**Estado final do design:** APROVADO PARA PLANO DE IMPLEMENTAÇÃO.
