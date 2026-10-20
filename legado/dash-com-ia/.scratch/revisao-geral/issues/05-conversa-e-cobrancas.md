# 05: Conversa transversal e trabalho preparado (agente de cobranças)

**What to build:** expande a conversa da abertura para as seções já entregues: mais perguntas suportadas com **Resposta em foco** que cita evidências navegáveis e explicita limites; comparação entre recortes; e a **preparação de cobranças** como agência de preparação — delegação "preparar cobranças dos devolvidos deste recorte" executa o lote: agrupa por executivo, ordena por prazo restante → valor → tempo devolvido, narrativa por executivo com pedidos/valores/motivos informados/prazo/pedido de ação, detecta motivo repetido entre pedidos distintos, gera **pacote local persistido com estado "não enviado"** vinculado ao snapshot; dados mudaram → pacote marcado desatualizado. Template fundamentado, sem LLM neste corte. Sem envio, sem agendamento, sem "cobrança realizada".

**Blocked by:** 02, 03

**Status:** ready-for-agent

- [ ] Perguntas suportadas expandidas às seções entregues; resposta coincide com os seletores e explicita filtros
- [ ] Comparação entre recortes quando há referência comparável
- [ ] Preparação de cobranças: agrupamento, ordenação explícita, narrativa com motivos reais, motivo repetido
- [ ] Pacote "Preparado — não enviado", persistido localmente, desatualiza com o snapshot; sem duplicar a cada abertura
- [ ] Todo número do agente rastreável ao mesmo pedido e asOf da fila; gates verdes
