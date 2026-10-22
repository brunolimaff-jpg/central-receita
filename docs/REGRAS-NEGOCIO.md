# Regras de negócio — Central de Receita

Data: 16/10/2026. Fontes: mapeamento do Microsoft Copilot sobre documentos e reuniões internas (Fabi 05/10, Marlus 08/10, transcrição de 15/10, modelo de Filiais) e caderno "CRM Integrado Senior MG" (Nolasco). O Copilot citou fontes internas que não foram conferidas uma a uma aqui: tratar como **INFERÊNCIA com fonte indicada**, até a Fabi validar.

## New Name

| Estado | Regra |
|---|---|
| Congelada | Estava no forecast oficial capturado no início do mês. Fotografia imutável; a carga diária nunca reescreve o congelado. Referência corporativa: quinto dia útil. |
| Ganha | Etapa "Fechada e Ganha". É ganho no CRM, não realizado de vendas. Mostrar o substatus do pedido: integrado, em conferência ou devolvido. |
| Perdida | Encerrada como perdida no período. Separar perda do congelado de perda de entrada do mês. |
| Postergada | Continua aberta, mas a previsão foi para mês posterior. É subtipo de saída, não perda. |
| Em negociação | Aberta, sem ganho, perda ou postergação. Mostrar a etapa real do CRM. |

Classificação "Novo" (provisória, a validar):

- **Novo confirmado:** CNPJ sem contrato ativo anterior e fora de grupo econômico já cliente.
- **Base confirmada:** conta com contrato ativo anterior ou enquadrada como base.
- **Novo a validar:** CNPJ novo em grupo já cliente, divergência entre CRM e auditoria ou classificação insuficiente. Fica fora do indicador principal.

## Forecast

- Critério do mês (Book PEX): etapa Proposta ou Negociação, probabilidade de 75% ou mais, previsão no mês corrente.
- Ganhos no CRM no Forecast: "Fechada e Ganha" com efetivação no mês. O cálculo não muda; só o nome exibido.

| Movimento | Regra |
|---|---|
| Entrou | Não estava na referência e passou a cumprir o critério do mês. |
| Saiu | Estava na referência e deixou o forecast aberto do mês. |
| Postergou | Subtipo de Saiu: continua aberta, com previsão em mês posterior. |
| Ganhou | Etapa de ganho com efetivação no período. |
| Perdeu | Etapa de perda com efetivação no período. |
| Excluída ou outro motivo | Sumiu da carga ou deixou o critério sem ganho, perda ou postergação. Aparece como exceção. |

## Os três marcos

Decisão de produto de Bruno (20/10/2026), não processo operacional verificado: ganhou no CRM → entra na fila de pedidos → na fila é conferido e já integrado. Não existem etapas gerenciais separadas para conferência e integração. O ADR-0001 continua valendo: a integração é o fato que autoriza o realizado.

Os três marcos são gerenciais: não eliminam os estados operacionais do pedido (em conferência, conferido, integrado, devolvido, cancelado). "Ganhos no CRM" é o status comercial; "Fila de pedidos" é o estoque pendente; "Realizado de vendas" depende do gate oficial, ainda não comprovado para conferido isolado.

| Marco | Nome na Central | Significado |
|---|---|---|
| Comercial | **Ganhos no CRM** | Oportunidades Fechadas e Ganhas com efetivação no período. |
| Intermediário | **Fila de pedidos** | Pedidos vinculados ainda sem conclusão. |
| Final | **Realizado de vendas** | Pedido no marco final; o gate documentado é a integração (ADR-0001). A decisão de 20/10/2026 agrupa conferido e integrado no mesmo marco gerencial, sem validar a equivalência. |

Invariantes: ganho não é realizado; fila não é realizado; um pedido conta uma vez, qualquer que seja o número de itens; situação desconhecida não vira pendente nem concluída; indisponível nunca vira zero. Faturamento e reconhecimento contábil ficam fora.

## Pedidos na fila e realizado de vendas

| Situação do pedido | Marco | Exibição |
|---|---|---|
| Integrado | Realizado de vendas | "Ganha — pedido integrado" |
| Em conferência | Fila de pedidos | "Ganha — aguardando conferência" |
| Conferido | Marco proposto (gerencial) | "Pedido conferido"; reconhecimento oficial condicionado ao gate — conferência isolada não comprova integração |
| Devolvido | Fora da fila | "Pedido devolvido", com alerta; status original preservado |
| Cancelado | Fora da fila | "Cancelado", com status original preservado |

O status gerencial deriva dos campos já importados; não há nova tabela nem máquina de estados. Enquanto a data de integração não estiver na fonte, a data que define o mês continua sendo `DATA CONFERENCIA` — mudar isso exige confirmação da Fabi.

**Conflito registrado (issue #10).** `DATA CONFERENCIA` preenchida classifica o pedido como conferido mesmo quando o status bruto é "Integrado com ERP", e o realizado do New Name filtra esse substatus. Há risco potencial de tratar conferência como integração; nem a ocorrência nem o valor de um desvio foram demonstrados. A fonte primária é a reunião de 05/10/2026, conhecida por relato derivado do Copilot, não auditada. Matriz evidência × implementação e perguntas discriminantes: [evidência do realizado](EVIDENCIA-REALIZADO-E-PENDENCIAS.md) (issues #4 e #8).

Redução e ampliação ficam fora do reconhecimento (Book de Vendas). MRR é a rubrica da meta, não o evento de realização.

## Pipeline

- Quantidade e valor por etapa, com acesso às oportunidades da etapa.
- MRR bruto como medida principal; valor ponderado em coluna separada.
- Previsão de fechamento, tempo aberto e tempo na etapa.
- Travadas: sem previsão, com data vencida ou acima do ritmo esperado (mediana: Base 18 dias, New Name 31, Cross 58).
- Horizonte sugerido: mês corrente mais três meses. O Forecast continua restrito ao mês.

## Meta e atingimento

- Meta de MRR vem do Acordo de Metas, por competência e filial. Não está nos arquivos da carga: precisa de fonte separada.
- Atingimento = Realizado de vendas ÷ meta. Potencial do mês = ganhos no CRM + forecast aberto, sem chamar de realizado.
- Realizado de FP&A (usado na AGM) deve ser reconciliado com os pedidos; divergência visível.
- **DECISÃO DO USUÁRIO (Bruno):** a meta monetária do executivo é MRR, não o valor total de licença e serviços.
- **NÃO VERIFICADO:** a rubrica elegível e a competência do atingimento individual. `PRODUTO - VALOR MANUTENCAO` é leitura não validada, não a regra oficial (issue #8). Material AGM distingue recorrente, CDU/licenças e serviços.

## Quem vê o quê

| Público | Acesso |
|---|---|
| Giovanni (diretor de vendas) | Consolidado de todas as filiais, com detalhamento. Só leitura, sem ações. |
| Fabi (operação) | Importa, audita e vê qualidade dos dados e histórico de cargas. |
| Marlus (governança) | Leitura completa, regras, origem dos dados e divergências. |
| Filiais | Cada uma vê só o próprio recorte (fase futura). |

Cadência: carga diária; congelamento mensal no quinto dia útil; foto semanal às sextas; importação sob demanda no fechamento.

## Decisões em aberto

Com a Fabi:

1. Nomes reais das etapas e situações de pedido (ganha, perdida, integrado, conferido, devolvido).
2. Data de integração na fonte: hoje só existe `DATA CONFERENCIA`, que define o mês do realizado de vendas.
3. Tratamento de pedido devolvido depois de conferido.
4. Recorte Filiais versus Inside.
5. Colunas das listas.
6. Gate do realizado: conferência concluída implica integração? Existem pedidos conferidos sem integração efetiva? Qual evento e data entram na apuração oficial?
7. Rubrica MRR elegível por competência, executivo e pedido: quais componentes recorrentes de `PRODUTO - VALOR MANUTENCAO` são elegíveis e quais exclusões ou ajustes oficiais existem?

Com o Giovanni:

1. Conteúdo final da Visão Executiva.
2. Horizonte do Pipeline.
3. MRR versus valor total no topo.
