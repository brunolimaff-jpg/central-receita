# ADR-0005: Honestidade com fonte — asOf declarado, estados honestos, sem dupla contagem

**Status:** aceita (vinculativa — debate Astra 29/09/2026)

## Contexto

Protótipo com mock verossímil que futuramente consumirá CRM/ERP reais. O risco maior é a tela ensinar leitura errada do negócio.

## Decisão

- **`asOf` declarado** no snapshot (data fixa, cenário reproduzível); identificação permanente de "cenário simulado".
- **Zero ≠ indisponível ≠ desatualizado**: defasagem entre fontes, reconciliação incompleta (N:N) e atualização tardia de mês encerrado têm estados de interface com copy própria.
- **Fila nunca soma dinheiro sobre o forecast**: ligação por **faixa de dependência** dentro do card de forecast; % só com contribuição reconciliada na mesma base e período.
- Semântica: sem "ainda dá tempo" no corte do mês; síntese muda por **estado do período** (em andamento / no corte / encerrado).

## Consequências

Fixtures adversariais obrigatórias (grupo desconhecido, vínculo ausente, 1 opp N pedidos, motivo ausente, fonte desatualizada, viradas). Comparativos ("piorou") só com referência comparável.
