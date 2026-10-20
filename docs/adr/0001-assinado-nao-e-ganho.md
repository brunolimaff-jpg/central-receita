# ADR-0001: Assinado não é ganho — integração é o fato que autoriza realizado

**Status:** aceita (vinculativa — debate Astra 29/09/2026, validada pelo dono)

## Contexto

No processo real da Senior, contrato assinado fica numa fila até integrar no faturamento. A receita só é reconhecida na integração; se não entrar até o último dia do mês, é reconhecida no mês seguinte — no fim de trimestre, desliza o trimestre.

## Decisão

- `integrado` é um **fato com data**, não um 5º estado da fila: encerra a pendência e autoriza o realizado.
- Vocabulário de UI: "pedido **assinado pendente de integração**"; gráfico de estados é "**R$ pendentes por estado**" (estoque), nunca "funil de conversão".
- `conferido` é pendente: não é realizado nem "quase seguro".
- Deadlines: relógio sempre **mensal**; trimestre é consequência (set→out tira AQUELE valor de Q3).

## Consequências

Todo total de "pendente" exclui integrados; virada de mês não apaga atraso; testes precisam dos cenários de fronteira (último dia, virada de mês, virada de tri).
