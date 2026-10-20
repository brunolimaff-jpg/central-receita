# Revisão dos gráficos — 15/10/2026

Implementação: dois agentes Luna Max, com revisão e QA pelo agente principal. Foram alterados 15 arquivos de código/testes. VERIFICADO: versão 6 publicada pelo Sites; commit 12d7c160b254f9fa279977898ab142d43f8cd9a8; deployment appgdep_6ad11ec4a7cc8191ae568458256389d5, status succeeded.

## Inventário e conferência da informação

| Visual em uso | Fonte / unidade | Achado ou critério |
| --- | --- | --- |
| Home: trajetória semanal | Snapshot demonstrativo; R$ milhões | Hover precisa alcançar a área inteira; tooltip não deve cobrir o gráfico por padrão. Cortes pendentes não têm valor fechado. |
| Oportunidades: evolução semanal | Mesma série consolidada; R$ milhões | Mouse na área, teclado/toque, escala e rótulos sem colisão. Sem interpolar movimentos por oportunidade. |
| CSV: fechamento por data | Quantidade acumulada da carga | Espaçamento por data real, degraus e eixo inteiro; seleção deve abrir registros da data. |
| Oportunidades: anel de movimentos | Soma dos valores absolutos; centro = saldo líquido | Bases distintas devem estar explícitas. Zero precisa de fundo neutro. |
| Oportunidades: etapas | Contagem de oportunidades no estágio atual | Título não deve sugerir eventos de mudança. Soma do recorte padrão: 7 + 6 + 5 = 18. |
| Cartões de movimentos: minibarras | Decoração proporcional ao peso do grupo | Estão marcadas aria-hidden; não são uma série temporal. |
| Forecast: origem | Realizado por New Name e Cross | 5,1 + 3,3 = 8,4 milhões no cenário; total zero não pode desenhar 100% Cross; rótulo deve dizer período. |
| Home/Sistema: filiais | Integrado ou realizado / meta | Teto visual de 100%; percentual textual e ausência de fonte precisam continuar distinguíveis. |
| Sistema: barras de KPI | Valor / meta | Base da barra difere do caption atual / oficial. Deve ser identificada. |
| Detalhe: composição | Recorrente, habilitação e serviços / soma | Percentuais usam total da composição; unidades e valores devem caber. |
| Jornada: volume, conversão e dias | Fixtures demonstrativas fixas | Eixos não podem confundir percentuais e dias; conversões precisam concordar entre cartões e alertas. |
| Jornada: dias por fase | Dias atual e anterior | Comparativo deve expor os dois valores; variação usa (atual/anterior - 1). |

Conferência do cenário padrão: forecast atual 10,2 / meta 12 = 85%; gap = -1,8 milhões (-15%). Atual 10,2 / oficial 11 - 1 = -7,27%, arredondado para -7,3%. Recorrente 6,2 / realizado 8,4 = 73,81%, arredondado para 74%.

Não usados no runtime pesquisado: MonthEvolutionChart, HomeOriginSummary e ForecastMovementFlow. Não fazem parte da correção.

## Evidência e validação pendente

Capturas anteriores: `01-home-antes.png`, `antes-journey.png`, `antes-opportunities.png` e `antes-forecast.png`. A observação ocorreu no IAB a 1440 × 900.

Fixture de QA: `qa-datas.csv`, três oportunidades sintéticas com datas 01/10, 02/10 e 31/10. Usar somente na prévia local; não publicar a fixture nem gravá-la no D1.

## Resultado da revisão

- Home: área inteira inspecionável, marcador Motion com transição de 120 ms e detalhe em fluxo, sem cobrir a curva. Linha entre cortes medidos e sem área acumulada enganosa. Largura máxima 900 px; altura observada 259 px. Métricas inferiores/laterais usam o mesmo breakpoint.
- Evolução de Oportunidades: hover na plot area, teclado com setas/Enter/Escape, unidade fora dos ticks, dimensões proporcionais e largura máxima 680 px. A posição do mouse não domina a seleção feita por teclado.
- Forecast importado: datas em posição temporal real, acumulado em degraus e eixo inteiro. Corrigida a largura intrínseca da lista de datas: painel observado passou de 2.571 px para 1.022 px dentro de main de 1.063 px. A seleção continua abrindo os registros da data.
- Anel de movimentos e barras por etapa: explicações reutilizam MetricDetail com Motion. A base absoluta do anel e o saldo líquido estão identificados. Título alterado para contagem de oportunidades por etapa.
- Origem: total zero usa fundo neutro; sem base positiva não se inventa participação recorrente. Rótulo usa período.
- Filiais: valores sem quebra de unidade, dados ausentes preservados e métricas empilhadas no estreito. Barras mantêm percentual textual, limite visual e nomes acessíveis.
- KPIs: atingimento da meta e variação contra o oficial separados. Meta zero não aparece como 100%.
- Composição financeira: detalhe de cada componente informa sua participação sobre a soma; denominador zero fica indefinido.
- Jornada: volume e conversão separados, conversões calculadas a partir dos volumes, alertas sobre a mesma base e detalhes com a unidade da própria série. Dias atuais e anteriores têm barras separadas e variação explícita.
- Minibarras decorativas: mantidas aria-hidden; não representam trajetória histórica nem recebem interação artificial.

## Verificação executada

| Verificação | Resultado observado |
| --- | --- |
| Testes automatizados | PASS, 35/35, zero falhas |
| Typecheck | PASS pelos executores Luna e pelo build |
| Build final | PASS: build e empacotamento final concluídos; versão 6 publicada |
| Home, mouse nos quatro cortes | PASS: 7,4 / 9,1 / 10,2 milhões e corte pendente |
| Home, foco/Enter/Escape | PASS: foco não perde para mouse estacionado |
| Oportunidades, curva e teclado | PASS nos três cortes fechados e no pendente |
| Carga local existente, seleção por data | PASS: acumulado 612 e recorte do dia 378; Escape fecha o recorte |
| Origem, hover e total zero | PASS: detalhe abre e anel vazio tem background-image none |
| Jornada, volume e conversão | PASS: 2.400 registros / 3 dias; 74% = 1.400 / 1.900 arredondado |
| Jornada, dias | PASS: 40 atuais, 28 anteriores, +12 dias e +43% |
| Composição | PASS: recorrente 1,2 milhão sobre total 1,4 milhão, 86% arredondado |
| Meta do forecast | PASS: 85% da meta, com tolerância para ponto flutuante |
| Tela estreita | PASS: largura CSS observada 355 px, scrollWidth 341 px; rolagem interna dos gráficos; métricas de filial empilhadas |
| Redução de movimento | PASS: preferência reduce ativa e detalhe funcional; preferência restaurada |
| Toque real/emulado | NÃO VERIFICADO: Input.dispatchTouchEvent não é suportado no IAB; emulação de toque foi desativada após a tentativa |

O zoom do navegador fez a largura CSS observada diferir da largura solicitada pela ferramenta de viewport. A avaliação usou medidas reais do DOM. Capturas full-page com elementos sticky não servem para concluir sobre alinhamento do cabeçalho; as capturas de viewport/detalhes são a evidência preferida.

A prévia local já continha uma carga de usuário quando o acesso foi recuperado. A fixture sintética não foi anexada para não substituir esses dados. Nenhuma carga foi criada, substituída ou enviada ao D1 por esta revisão. Dados comerciais individuais não são reproduzidos neste relatório.

Limites: dados demonstrativos continuam demonstrativos; acessibilidade completa e toque em dispositivo real não foram certificados.

## Fechamento da publicação

VERIFICADO: Sites retornou succeeded para a versão 6 em https://central-vendas-visao-comercial.workspace-947623.chatgpt.site. Audiência e env revision 2 preservadas.
NÃO VERIFICADO: render após publicação; controle do IAB bloqueou a navegação final. QA visual descrito acima refere-se ao build local. Toque em aparelho real continua pendente.

