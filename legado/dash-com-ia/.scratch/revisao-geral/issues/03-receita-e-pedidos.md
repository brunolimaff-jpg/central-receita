# 03: Receita auditável e integração — fila de pedidos com rastro

**What to build:** a seção Receita & Pedidos do fluxo: composição do **realizado auditável** (reconhecido, com origem), comparações do forecast (atual × oficial com rótulos próprios, "Gap para a meta"), **faixa de dependência** dentro do card de forecast ("R$ X deste forecast dependem de integração · N pedidos · [ver composição]" — % só com reconciliação na mesma base), e a **fila de pedidos** como "R$ pendentes por estado" (na fila → em conferência → conferido | devolvido; integrado sai da pendência) com idade no estado ≠ idade total, relógio mensal até o deadline e drill por pedido até o **rastro oportunidade → assinatura → pedido → integração** com volta. Estados honestos: defasagem de fontes, reconciliação incompleta (1 opp → N pedidos), atualização tardia.

**Blocked by:** 01 (casa do assistente)

**Status:** ready-for-agent

- [ ] Realizado auditável com composição e origem acessível
- [ ] Faixa de dependência no card de forecast; nenhum valor somado duas vezes (ADR-0001, ADR-0005)
- [ ] Fila como R$ pendentes por estado; conferido não é realizado; integrado sai dos totais
- [ ] queuedAt/stateEnteredAt: idade no estado ≠ idade total; devolvido aponta o executivo dono (ADR-0002)
- [ ] Relógio mensal; virada de mês/tri não apaga atraso; sem "ainda dá tempo"
- [ ] Rastro até a integração em subtela de leitura; volta à posição
- [ ] Fixtures adversariais (grupo desconhecido, vínculo ausente, 1 opp N pedidos, motivo ausente, fonte desatualizada); seletores + testes de conservação de totais; gates verdes
