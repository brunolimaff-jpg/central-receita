# 06: Churn e leitura de fechamento

**What to build:** **Churn** como perda de base na seção Receita (MRR perdido vs. período anterior, motivos disponíveis, origem; distinto de Loss); **narrativa por estado do período** — em andamento, no corte, encerrado — com a síntese da abertura mudando conforme o estado (no corte: pendente, devolvidos, conferidos sem integrar, frescor da fonte, pacote pronto; nunca "ainda dá tempo"); e os **cenários de atualização** — atualização tardia de mês encerrado (posição anterior preservada e explicada), defasagem entre fontes e reconciliação incompleta com copy honesta. Fixtures dos três momentos do período.

**Blocked by:** 03 (receita e pedidos)

**Status:** ready-for-agent

- [ ] Churn em Receita com MRR perdido, motivos e origem; nunca renomeado como Loss
- [ ] Síntese por estado do período (em andamento / no corte / encerrado) na abertura e no bloco de receita
- [ ] Cenário de fechamento: em 1º/out entende setembro encerrado, o que postergou, o que ainda é incerto — sem tratar saldo pendente como realizado de outubro
- [ ] Cenários de defasagem, reconciliação incompleta e atualização tardia com copy própria (ADR-0005)
- [ ] Fixtures dos 3 momentos; critério dos 30s do Giovane testável; gates verdes
