# Plano — Visão Comercial em página corrida

Data: 16/10/2026. Implementação: Luna. Orquestração e revisão: Claude.

## Objetivo

Uma página única com rolagem contínua. A sidebar leva a cada seção e marca a seção visível. Cada seção responde uma pergunta do mês corrente, com números da carga importada.

## Público (DECISÃO DO USUÁRIO)

O público principal é o Giovanni, diretor de vendas. Ele só lê:

- não age em oportunidade e não fala com executivo; a cadeia passa por head e às vezes por coordenador;
- a tela não tem botões de ação (congelar, salvar meta, corrigir no CRM);
- a fotografia congelada do mês é automática, sem botão; a referência corporativa é o quinto dia útil (ver docs/REGRAS-NEGOCIO.md). Nesta fase, Entrou e Saiu comparam com a carga anterior;
- agrupamentos preferem filial e head ao executivo; a lista de oportunidades serve como evidência, sem ação.

O caderno do Nolasco é referência de regra e estrutura. Ele atende um nível operacional abaixo do Giovanni, então suas ações não entram aqui.

## Padrão visual (DECISÃO DO USUÁRIO)

A tela Oportunidades é a referência. Forecast, New Name e Pipeline reutilizam os mesmos componentes: título em frase, quatro cartões de movimento com valor com sinal, anel de impacto com saldo líquido e tabela dos principais movimentos com selos coloridos.

A Visão Executiva é painel, não editorial: faixa compacta de indicadores, cartões de movimento e atalhos para as seções. Sem blocos de texto nem títulos longos.

## Navegação (DECISÃO DO USUÁRIO)

Seções da página, nesta ordem, cada uma com âncora na sidebar:

1. Visão Executiva
2. Forecast
3. New Name
4. Oportunidades (pipeline)

Configurações (importação) continua como tela separada. Jornada, Sistema de Receita, Contas e Cross ficam com "Em breve", sem link.

> **Decisão posterior (23/10/2026 — DECISÃO DO USUÁRIO, Bruno):** as quatro áreas acima foram **liberadas** na navegação, ainda como versão preliminar. Cada tela leva a faixa "em versão preliminar" no topo e o item do menu leva um ponto âmbar com texto acessível. O conteúdo segue sem aceite: o snapshot é demonstrativo, e o Sistema de Receita identifica a origem de cada bloco (KPIs e movimentos no snapshot; rail de filiais no agregado real de setembro). O aviso sai quando cada área passar pelo aceite. Esta nota prevalece sobre a linha anterior.

## Seção Forecast — somente o mês corrente (DECISÃO DO USUÁRIO)

Sai o gráfico "Previsão por data de fechamento" (escada acumulada de contagem).

Entra o retrato do mês, com seletor **Semana | Mês**:

1. **Previsto x realizado:** valor previsto da carteira do mês, valor realizado (ganho e fechado no período) e o quanto falta.
2. **Movimentação no período**, com quatro grupos, cada um com quantidade, valor e a lista de contas:
   - **Entrou:** passou a ter previsão no mês desde a carga anterior.
   - **Saiu:** deixou de ter previsão no mês (postergou, excluída ou perdida).
   - **Ganhou:** fechou como ganha no período.
   - **Perdeu:** fechou como perdida no período.
3. Lista das contas do grupo selecionado: conta, oportunidade, etapa, valor e data.

Ganhou e Perdeu saem de uma única carga (etapa e data de efetivação). Entrou e Saiu exigem comparar a carga atual com a anterior.

## Regras oficiais de referência

Fonte: caderno "CRM Integrado Senior MG — telas" (projeto do Nolasco, Filial Minas, set/2026), que segue o Book PEX Filiais e o Book de Vendas.

| Item | Regra |
|---|---|
| Forecast do mês | Etapa Proposta ou Negociação, probabilidade de 75% ou mais e previsão dentro do mês |
| Realizado no Forecast | "Fechada e Ganha" no mês |
| Realizado oficial | Pedido conferido no mês; cancelado e devolvido não somam; redução e ampliação ficam fora |
| Separação da venda | Base, New Name e Cross (é a leitura que o Acordo de Metas cobra) |
| Congelamento | O portão marcado como forecast alimenta a fotografia congelada |
| Ritmo de fechamento | Mediana: Base 18 dias, New Name 31, Cross 58 |
| Churn | Contrato perdido desconta MRR do dono da conta; pedido cancelado devolve a venda de quem vendeu |

Se a carga não trouxer a probabilidade, a tela avisa que o critério de 75% não foi aplicado.

### Estrutura de referência da tela "Forecast do mês" (Nolasco)

- Indicadores no topo: Vendido no mês, Congelado em aberto, Previsto para o mês (vendido + congelado em aberto), Meta da filial, Atingimento previsto, Cobertura do congelado.
- Linha de aviso: oportunidades do pipe fora da régua.
- Abas: Resumo do mês, Por executivo, Congelamento, Movimento do congelado, Assertividade, Versões e comparar, Histórico, Detalhe por oportunidade, Por módulo, Sem valor informado, Reconhecimentos.
- Cartões por time (Novos, Base, Filial, NN em quantidade) com meta, forecast, realizado e projeção.
- Ação "Congelar este forecast" (no caderno do Nolasco; na Central de Receita o congelamento é automático, sem botão).
- Tabela "Forecast por bloco": New Name + Cross, New Name puro, Cross-sell, Base, com não recorrente, recorrente e total.

Na Central de Receita entram primeiro: indicadores, movimento (entrou, saiu, ganhou, perdeu), forecast por bloco e lista por oportunidade. Abas por executivo, assertividade e por módulo ficam para depois.

## Seção New Name

Mesma lógica: pedidos novos no período (semana e mês), entraram e saíram desde a carga anterior. A classificação "Novo" continua marcada como "a validar com a Fabi".

## Seção Visão Executiva

Indicadores do mês: Forecast (previsto x realizado), New Name e Pipeline, e o resumo da movimentação. O gráfico "Trajetória da Receita" continua marcado como "Demonstrativo" até existir histórico de sextas acumulado.

## Comparação entre cargas

- Prévia local: ao salvar uma carga nova, guardar a anterior como "previous" no navegador.
- Site compartilhado: o servidor já guarda as versões anteriores. Falta uma consulta só de leitura que devolva a versão anterior. Sem alteração de tabela e sem apagar nada. Publicar depende de OK separado.
- Sem carga anterior: Entrou e Saiu mostram "A comparação começa na próxima importação". Nunca inventar números.
- A chave da comparação é o ID da oportunidade (Forecast) e o ID do pedido (New Name).

## Regra de dado

Seção sem carga real mostra "Demonstrativo" ou o estado vazio com a ação de importar. Nunca mistura número demonstrativo com número da carga sem aviso. A meta não vem na planilha: fica como "Meta indisponível" ou "Demonstrativo".

## Fases

1. Menu "Em breve" — feito.
2. Gráfico Trajetória da Receita — feito, falta conferência visual final.
3. Cálculos do mês (previsto, realizado, ganhou, perdeu, entrou, saiu) em funções puras com testes.
4. Seção Forecast nova.
5. Página corrida com âncoras na sidebar e marcação da seção visível.
6. Seções New Name e Visão Executiva com os mesmos cálculos.
7. Testes, typecheck, build e conferência visual no navegador local com a carga da Fabi.

## Riscos

- Os nomes exatos das etapas "ganha" e "perdida" precisam ser lidos da carga real antes de fixar a regra.
- `month-evolution-chart.tsx` importa `suavizar` do arquivo do gráfico; a função precisa continuar exportada.
