# Regras de negócio — Central de Receita

Data: 16/10/2026. Fontes: mapeamento do Microsoft Copilot sobre documentos e reuniões internas (Fabi 05/10, Marlus 08/10, transcrição de 15/10, modelo de Filiais) e caderno "CRM Integrado Senior MG" (Nolasco). O Copilot citou fontes internas que não foram conferidas uma a uma aqui: tratar como **INFERÊNCIA com fonte indicada**, até a Fabi validar.

## New Name

| Estado | Regra |
|---|---|
| Congelada | Estava no forecast oficial capturado no início do mês. Fotografia imutável; a carga diária nunca reescreve o congelado. Referência corporativa: quinto dia útil. |
| Ganha | Etapa "Fechada e Ganha". Mostrar o substatus do pedido: integrado, em conferência ou devolvido. Ganha não é realizado oficial. |
| Perdida | Encerrada como perdida no período. Separar perda do congelado de perda de entrada do mês. |
| Postergada | Continua aberta, mas a previsão foi para mês posterior. É subtipo de saída, não perda. |
| Em negociação | Aberta, sem ganho, perda ou postergação. Mostrar a etapa real do CRM. |

Classificação "Novo" (provisória, a validar):

- **Novo confirmado:** CNPJ sem contrato ativo anterior e fora de grupo econômico já cliente.
- **Base confirmada:** conta com contrato ativo anterior ou enquadrada como base.
- **Novo a validar:** CNPJ novo em grupo já cliente, divergência entre CRM e auditoria ou classificação insuficiente. Fica fora do indicador principal.

## Forecast

- Critério do mês (Book PEX): etapa Proposta ou Negociação, probabilidade de 75% ou mais, previsão no mês corrente.
- Realizado no Forecast: "Fechada e Ganha" com efetivação no mês.

| Movimento | Regra |
|---|---|
| Entrou | Não estava na referência e passou a cumprir o critério do mês. |
| Saiu | Estava na referência e deixou o forecast aberto do mês. |
| Postergou | Subtipo de Saiu: continua aberta, com previsão em mês posterior. |
| Ganhou | Etapa de ganho com efetivação no período. |
| Perdeu | Etapa de perda com efetivação no período. |
| Excluída ou outro motivo | Sumiu da carga ou deixou o critério sem ganho, perda ou postergação. Aparece como exceção. |

## Realizado

| Situação do pedido | Realizado oficial | Exibição |
|---|---|---|
| Integrado | Não | "Ganha — pedido integrado" |
| Em conferência | Não | "Ganha — aguardando conferência" |
| Conferido | Sim | "Realizado" |
| Devolvido | Não | "Pedido devolvido", com alerta |
| Cancelado | Não | "Cancelado", com reversão se já contado |

Redução e ampliação ficam fora do reconhecimento (Book de Vendas). MRR é a rubrica da meta, não o evento de realização.

## Pipeline

- Quantidade e valor por etapa, com acesso às oportunidades da etapa.
- MRR bruto como medida principal; valor ponderado em coluna separada.
- Previsão de fechamento, tempo aberto e tempo na etapa.
- Travadas: sem previsão, com data vencida ou acima do ritmo esperado (mediana: Base 18 dias, New Name 31, Cross 58).
- Horizonte sugerido: mês corrente mais três meses. O Forecast continua restrito ao mês.

## Meta e atingimento

- Meta de MRR vem do Acordo de Metas, por competência e filial. Não está nos arquivos da carga: precisa de fonte separada.
- Atingimento = MRR realizado ÷ meta. Potencial do mês = realizado + forecast aberto, sem chamar de realizado.
- Realizado de FP&A (usado na AGM) deve ser reconciliado com os pedidos; divergência visível.

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
2. "Ganha" começa na integração ou só na conferência.
3. Tratamento de pedido devolvido depois de conferido.
4. Recorte Filiais versus Inside.
5. Colunas das listas.

Com o Giovanni:

1. Conteúdo final da Visão Executiva.
2. Horizonte do Pipeline.
3. MRR versus valor total no topo.
