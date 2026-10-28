# Visão Regional — regras e cálculos

Fonte única: `REGRAS` em `src/features/comercial-v3/regional/regional-model.ts` (este arquivo é gerado a partir dela). Decisão: [ADR-0006](../adr/0006-visao-regional.md). Testes: `tests/regional-model.test.mjs`.

Origem: Painel Centro-Oeste (artefato HTML de out/2026), em que os números chegavam pré-calculados. Aqui cada regra virou uma função pura e testada.

## Base

| Indicador | Fórmula | Regra de leitura |
|---|---|---|
| **Fluxos** | MRR = manutenção · NRR = licença + serviço | Toda análise roda separada por fluxo. Nunca somar MRR com NRR para farol. |
| **Ganho** | Ganho = Σ valor das opps Ganhas e integradas com ERP no mês | Assinar não é integrar. Só conta o que integra até o último dia útil (sábado não integra). |
| **Farol** | pct = Ganho ÷ meta · verde ≥ 100% · amarelo ≥ 70% · vermelho < 70% | Ler o valor absoluto além do %: meta menor faz o % parecer melhor. |

## Forecast

| Indicador | Fórmula | Regra de leitura |
|---|---|---|
| **Categorias** | Commit = A · Best case = B+ e B · Pipeline = C · Omitido = D | D não entra em nenhum cenário. |
| **Esperado** | Esperado = Σ (valor × pb) das opps em andamento | pb é a probabilidade calibrada por opp com o histórico de 2 meses. Em andamento não é previsão. |
| **Fora do congelado** | Fora = meta × média(fora_do_congelado ÷ meta dos meses fechados) × fração do mês útil restante | Reserva para o não planejado. Fração restante = (dias até o último dia útil + 1) ÷ 22. |
| **Cenário Base** | Base = Ganho + Esperado + Fora | Farol do Base usa a mesma régua do Ganho. |
| **Conversão exigida** | necessário = 0,7 × meta − Ganho · sem fora = (necessário − Commit esperado) ÷ Best bruto · com fora = (necessário − Commit esperado − Fora) ÷ Best bruto · assumida = Best esperado ÷ Best bruto | Verde até 35%, amarelo até 60%, vermelho acima. Se o Commit cobre o necessário, o foco é integrar. |
| **Rolagem** | Rola = 58% × (em andamento − esperado) · Perde = 42% × (em andamento − esperado) | 58% é a média de ago e set. Revisar a constante a cada mês fechado. |
| **Simulação** | Monte Carlo, 4.000 rodadas, semente fixa. Cada cliente é uma decisão (soma dos valores, pb da maior opp). Resultado = Ganho + Fora + decisões sorteadas. | P10/P50/P90 e chance de ≥ 70% e ≥ 100% da meta. |

## Calibração

| Indicador | Fórmula | Regra de leitura |
|---|---|---|
| **Cobertura** | Cobertura = congelado ÷ meta | Medida no início do mês. |
| **Conversão do congelado** | Conversão = ganho vindo do congelado ÷ congelado | Régua histórica de 21% a 28%. |
| **Rendimento** | Rendimento = (Ganho ÷ meta) ÷ cobertura · cobertura necessária para 100% ≈ 1 ÷ rendimento médio | O congelado explica só parte do Ganho final. |
| **Faixa de valor** | MRR: até 1k, 1–3k, 3–8k, acima de 8k · NRR: até 5k, 5–20k, 20–50k, 50–100k, acima de 100k · conversão = valor ganho ÷ valor total da faixa | Faixa fria = menor conversão entre faixas com 15+ opps. É alerta, não regra. |
| **Sinais de nota** | conversão com sinal vs sem sinal (contagem) nos meses fechados | Sinal indica direção, não causa. Exigir data e decisor em toda nota. |

## Qualidade

| Indicador | Fórmula | Regra de leitura |
|---|---|---|
| **Limpeza do forecast** | Flags: nota diz perdido · duplicidade (mesmo cliente, executivos diferentes, mesma nota) · mesma decisão em várias opps · valor zerado · sem atualização há 30+ dias · recuperação judicial · cliente indica 2027 · C sem próxima ação com data | Perdido, zerado, RJ e 2027 zeram a chance. C sem próxima ação vira Postergado com data e dono até quarta. |
| **Higiene do executivo** | Higiene = opps sem flag ÷ opps em andamento | Forecast sem próxima ação não é forecast. |

## Executivos

| Indicador | Fórmula | Regra de leitura |
|---|---|---|
| **Atingimento** | média(Ganho ÷ meta de ago, set, e (Ganho + Esperado) ÷ meta de out) | Eixo Y da nine box: baixo < 70%, médio < 100%, alto ≥ 100%. |
| **Cobertura de pipeline** | Cobertura = em andamento ÷ max(meta − Ganho, 10% da meta) | Eixo X da nine box: baixo < 1,5x, médio < 2,5x, alto ≥ 2,5x. |
| **Concentração** | Top 3 = (Ganho + Esperado) dos 3 maiores ÷ total | Acima de 50%: dar cobertura de liderança às contas desses executivos. |

## Plano

| Indicador | Fórmula | Regra de leitura |
|---|---|---|
| **Apostas da semana** | Até 15 opps A, B+ e B sem flag que zere a chance, ordenadas por (MRR × 6 + NRR) × pb, uma por cliente | Dia: A com assinatura → Seg; A → Ter; diretoria/decisor → Qua; aguarda retorno → Qui. Cobertura = esperado das apostas ÷ esperado total. |
| **Cadência** | Seg limpeza · Ter decisores · Qua diretoria · Qui segunda rodada · Sex integração e foto final | Toda reunião termina com data de assinatura ou motivo de perda. |

## Constantes

| Constante | Valor | Onde |
|---|---|---|
| FAROL_VERDE / FAROL_AMARELO | 1 / 0.7 | farolOf |
| ALVO_MINIMO | 0.7 | conversaoExigida, simular |
| TAXA_ROLAGEM | 0.58 | forecastFluxo |
| CONVERSAO_EXIGIDA_VERDE / AMARELA | 0.35 / 0.6 | conversaoExigida |
| DIAS_SEM_ATUALIZACAO | 30 | flagsLimpeza |
| NINEBOX_LIMITES | atingimento 0.7 / 1 · cobertura 1.5 / 2.5 | ninebox |

## Nine box: quadrantes e ação de liderança

| Atingimento × cobertura | Nome | Ação |
|---|---|---|
| médio × baixo | Pipeline curto | Plano de prospecção com meta semanal de oportunidades novas. |
| médio × médio | Núcleo estável | Manter cadência semanal e cobrar data de assinatura. |
| médio × alto | Potencial a converter | Revisar estágio e próxima ação das maiores opps; acompanhar assinatura. |
| alto × baixo | Entrega sem reserva | Risco de queda: dobrar geração de pipeline com BDR. |
| alto × médio | Entrega, pipeline justo | Abrir prospecção agora para não secar no próximo mês. |
| alto × alto | Referência | Dar casos difíceis e usar como par de outros executivos. |
| baixo × alto | Pipeline sem conversão | Liderança entra nas negociações; limpar opps sem decisor. |
| baixo × médio | Atenção | Plano de recuperação de 30 dias com metas de atividade. |
| baixo × baixo | Crítico | Conversa de desempenho e redistribuição de contas. |

## Limpeza do forecast: ação por pendência

| Pendência | Ação |
|---|---|
| Nota diz perdido | Reclassificar como perdida. |
| Duplicidade provável | Consolidar na menor opp e encerrar a outra. |
| Mesma decisão em várias opps | Tratar como uma decisão; não somar chances. |
| Valor zerado | Preencher valor ou retirar do forecast. |
| Sem atualização | Atualizar com data e decisor ou postergar. |
| Recuperação judicial | Retirar do forecast até aprovação de crédito. |
| Cliente indica 2027 | Postergar para 2027 com dono. |
| Sem próxima ação | Virar Postergado com data e dono até quarta. |

## Mapas de calor

- **Filial × rubrica:** Ganho ÷ meta por rubrica, mais o cenário Base de MRR e NRR. Escala: ≥ 100% verde escuro, ≥ 85% verde, ≥ 70% amarelo, ≥ 50% salmão, < 50% vermelho.
- **Filial × data prevista:** soma de valor × pb das opps em andamento por data. Escala sequencial no verde da marca. Mostra onde e quando o Ganho precisa aparecer.

## Pendências para dados reais

- pb por opp: hoje vem do mock. Com dados reais, calibrar por estágio e sinais com o histórico (régua acima).
- Mapa usuário → filiais no Worker, para o gerente regional ver só o próprio escopo. Hoje o recorte é só de tela.
- TAXA_ROLAGEM e régua de conversão: recalcular a cada mês fechado.
