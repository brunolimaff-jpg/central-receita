# ADR-0002: Pipeline de conferência e devolução ao executivo

**Status:** aceita (vinculativa — grill com o dono 29/09/2026)

## Contexto

Pedido assinado passa por conferência antes de integrar; a conferência pode devolver; quem resolve a devolução é o executivo que assinou ("fica em cima").

## Decisão

- Estados: `na fila → em conferência → conferido | devolvido` (devolvido corrigido volta à conferência).
- Contrato carrega `queuedAt` e `stateEnteredAt` + motivo e data da última devolução — **idade no estado ≠ idade total**.
- **Devolvido volta ao executivo dono**; o agente cobra o executivo, com valor e relógio.
- Motivo de devolução é texto livre; ausente = "motivo não informado". Sem taxonomia automática neste corte.

## Consequências

Cobranças usam idade no estado; fixtures precisam de caso devolvido-ontem-com-20-dias-de-fila.
