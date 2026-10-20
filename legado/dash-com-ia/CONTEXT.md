# CONTEXT — Central de Receita (Visão Comercial)

Glossário de domínio da feature `comercial-v3` e do incremento "revisão geral". Fontes: `../v3/REVISAO-GERAL-PLANO.md`, `../v3/VEREDITO-CONSOLIDADO.md` (fora do repo, pasta do projeto). Termos em UI sempre em pt-BR; nomes de contrato em inglês.

## Reconhecimento de receita

- **Assinado ≠ ganho.** Contrato assinado parado na fila **não vale** para o número do executivo. Só a integração conta.
- **Pedido assinado pendente de integração** — nunca dizer "pedido ganho que ainda não integrou".
- **Integrado** — fato explícito COM data; encerra a pendência e autoriza o **realizado**. Pedido integrado sai dos totais pendentes.
- **Fila de integração** — conjunto de pedidos assinados pendentes; exibida como **"R$ pendentes por estado"** (distribuição de estoque, NÃO funil de conversão).
- **Estados do pedido:** `na fila → subiu pra conferência → conferido | devolvido` (devolvido corrigido volta à conferência). `conferido` é pendente — nunca "quase seguro", nunca realizado.
- **Devolvido volta ao executivo dono** — "esse aí o executivo fica em cima". Motivo: campo livre ("motivo não informado" quando ausente).
- **Deadline** — último dia do mês. Não integrou → receita reconhecida **no mês seguinte**; no fim de trimestre, aquele valor desliza para o próximo trimestre (não arrasta o tri inteiro).
- **Idade no estado ≠ idade total** — `queuedAt` vs `stateEnteredAt`; cobrar pelo tempo certo.
- **Faixa de dependência** — dentro do card de forecast: "R$ X deste forecast dependem de integração · N pedidos". Fila NUNCA soma dinheiro sobre o forecast (o pedido é dependência, não acréscimo). % só com reconciliação na mesma base.
- **Gap para a meta** — forecast atual vs. meta (ex. −1,8 mi / −15%). A diferença atual vs. oficial (−0,8 mi / −7,3%) tem rótulo próprio; nunca o rótulo genérico "Δ".

## Classificação comercial

- **New Name** — classificação determinada por uma fonte própria, separada da classificação informada pela origem da oportunidade.
- **Cross** — classificação que depende de evidência conjunta da condição de cliente da empresa, de produto ou módulo novo e do representante executivo. Se faltar um desses elementos, mostrar **classificação indisponível**. **Upsell** é upgrade de licenças no módulo atual e permanece separado; regras específicas por produto serão definidas depois.
- **Canal de aquisição** — identifica o canal e o subcanal pelos quais a oportunidade chegou.
- **Etapa do funil** — posição atual da oportunidade no processo comercial.
- **Classificação informada pela fonte** — classificação proveniente da origem dos dados; por si só, não determina New Name nem Cross.
- **Classificação indisponível** — sem evidência suficiente para determinar a classificação, mostrar como indisponível; nunca atribuir New Name por padrão.
- **Loss** — perda de aquisição (prospect que não virou cliente; "perdemos e ainda não é cliente"). **Churn** — perda de base (cliente que saiu). Conceitos separados, blocos separados.

## Produto / navegação

- **Home semanal** — a Home é um fluxo contínuo percorrido por scroll; seu indicador de posição aponta para âncoras internas. O menu lateral também abre áreas próprias, incluindo Contas, New Name e Cross.
- **Composição da Home:** contexto do recorte → 4 KPIs → sinais compactos clicáveis → trajetória quando houver série → áreas comerciais. O consolidado mantém a grade de filiais; o recorte de uma filial não mistura seus KPIs demonstrativos com agregados reais.
- **Oportunidade primeiro** — a oportunidade conduz o acompanhamento e o aprofundamento. Conta é contexto complementar de relacionamento; não é uma etapa obrigatória antes da oportunidade.
- **Vida da oportunidade** — estado atual, ações registradas e compromissos são leituras distintas. Visitas, reuniões, ligações e compromissos de Cross pertencem ao acompanhamento; planejamento não comprova execução.
- **Relacionamento da conta** — CNPJ, contatos, histórico de Win/Loss e produtos contratados quando já é cliente apoiam a oportunidade em foco. Produto negociado não comprova contrato ativo; informação sem fonte vinculada fica indisponível.
- **Exige você / Intervenções sugeridas** — até 3 prioridades com responsável e impacto; não é "tudo atrasado".
- **Bloco-fala** — conclusão curta → evidência visual → uma ação. A narrativa explica por que olhar; não repete números da tabela.
- **Resposta em foco** — resposta contextual abaixo da abertura: conclusão → evidências → limites → próximo passo. No mock, **conjunto explícito de perguntas suportadas**; perguntas sem suporte recebem limitação específica.
- **Detalhe contextual** — conta/grupo/oportunidade/pedido abre em subtela e retorna à área de origem, preservando o recorte e a busca. A área Contas é distinta do detalhe de uma conta.
- **Hover-first** — passar o ponteiro/toque responde o essencial (métrica+tempo, valor, comparação nomeada, significado, base); clique FIXA inspeção e abre composição. Contrato de evidência único para tooltip/fala/card/detalhe.
- **Entra na semana** — fechamentos previstos E integrações previstas, separados; expectativa não vira realizado.

## Dados e honestidade

- **asOf** — instante de referência declarado no snapshot; mock reproduzível (data fixa), nunca relógio da máquina.
- **Cenário simulado** — identificação permanente e visível em todo o produto.
- **Estados honestos** — zero ≠ indisponível ≠ desatualizado; defasagem de fontes, reconciliação incompleta e atualização tardia têm copy própria.
- **Camadas** — Hunter OS é a ferramenta do coordenador; a Central é o pulso do diretor (Giovane) que DESCE ao detalhe com drill e volta. A Central não substitui o Hunter.
- **Usuário** — Giovane, diretor comercial. **Norte:** "o Giovane quer um Claude" — assistente premium em casa, visualmente melhor; sem dependência de IA externa.

## Vocabulário evitado

- "pedido ganho" (para pendente de integração) · "funil de conversão" (para a fila) · "Δ" genérico · "quase seguro" (conferido) · "probabilidade de deslize" · "risco" como sinônimo de pendente · somar fila ao forecast · "ainda dá tempo" (no corte do mês).
