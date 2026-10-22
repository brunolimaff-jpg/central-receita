# Evidência do realizado de vendas e pendências de definição

**Status:** registro documental, sem mudança de cálculo
**Data:** 21/10/2026
**Issues:** [#10](https://github.com/brunolimaff-jpg/central-receita/issues/10), [#1](https://github.com/brunolimaff-jpg/central-receita/issues/1), [#4](https://github.com/brunolimaff-jpg/central-receita/issues/4), [#8](https://github.com/brunolimaff-jpg/central-receita/issues/8)

Este documento existe para que uma implementação futura não adote por engano uma interpretação anterior. Ele separa **o que está comprovado**, **o que é desenho normativo**, **o que é fala operacional reportada**, **o que o código faz hoje** e **o que o usuário decidiu**.

## Fontes e status epistemológico

| Fonte | O que diz | Status |
|---|---|---|
| [ADR-0001](adr/0001-assinado-nao-e-ganho.md) | Integração é o fato que autoriza o realizado; conferido é pendente | VERIFICADO (decisão vigente) |
| [ADR-0002](adr/0002-pipeline-conferencia.md) | Conferência, devolução e integração são atividades distinguíveis; devolvido volta ao executivo | VERIFICADO (decisão vigente) |
| Decisão de produto de 20/10/2026 (issue #1) | Três marcos gerenciais: Ganhos no CRM, Fila de pedidos, Realizado de vendas | VERIFICADO (decisão do projeto) |
| Reunião "Apresentação Visões", 05/10/2026, com Fabiane Krause | Oportunidade só é ganha após a integração do pedido; distingue integrado, em conferência e devolvido | Fonte primária NÃO VERIFICADA; relato derivado do Copilot, fornecido pelo Bruno |
| Baseline AP02 / saída PO168 | Pedido conferido **e** integrado ao ERP | NÃO ENCONTRADO neste repositório e nas issues consultadas; citado na #10 como referência de projeto |
| Código atual (`src/features/comercial-v3/new-name-model.ts`) | Ver seção "Implementação atual" | VERIFICADO (leitura read-only) |
| Meta individual em MRR | Meta monetária do executivo é MRR | DECISÃO DO USUÁRIO (Bruno) |
| Rubrica elegível e competência do MRR | Regra formal do atingimento individual | NÃO VERIFICADO |
| Atribuição da regra oficial ao time do Fernando Rebonato | Titularidade da regra | HIPÓTESE; relato derivado do Copilot, não comprovado |

Nenhuma conclusão deste documento autoriza alterar fórmula, importador, UI ou snapshot.

## Conflito entre fontes

| Fonte | Evento que conclui o pedido | Data que define o mês | Situação |
|---|---|---|---|
| PO168 do baseline AP02 | Conferido **e** integrado | Não examinada (baseline não localizado) | Referência citada na #10, primária não auditada aqui |
| ADR-0001 | Integração | Data da integração | Normativo vigente; conferido isolado permanece pendente |
| ADR-0002 | Conferência e integração são etapas distintas | Não define | Normativo; compatível com o ADR-0001 |
| Decisão de produto 20/10 | Um único marco gerencial para conferido e integrado | `DATA CONFERENCIA` enquanto não houver data de integração | Gerencial; não prova equivalência operacional |
| Relato Copilot 05/10 | Integração | Não informada | Deriva da fala da Fabi; primária não auditada |
| Implementação atual | `DATA CONFERENCIA` preenchida vira `conferido`, inclusive para status "Integrado com ERP", exceto devolvido e cancelado | `DATA CONFERENCIA`, com `DATA FECHAMENTO` como fallback | Comportamento existente |

**Leitura correta:** os três marcos gerenciais não eliminam os estados operacionais do pedido. "Ganhos no CRM" é o status comercial; "Fila de pedidos" é o estoque pendente; "Realizado de vendas" demanda confirmação do gate oficial. Não descrever o marco final como "conferido ou integrado" como se a equivalência estivesse validada.

## Implementação atual (verificada, sem alteração)

- Agrupamento de pedidos: `new-name-model.ts:285` escolhe a primeira `conferenceDate`; `:294` usa conferência e fecha com fallback no fechamento; `:303-306` transforma em `conferido` todo pedido com `DATA CONFERENCIA` preenchida, exceto devolvido e cancelado.
- Realizado oficial: `new-name-model.ts:410` soma apenas `substatus === 'conferido'`. Pedido integrado **sem** `DATA CONFERENCIA` fica `integrado` e não entra no realizado de nenhum mês.
- Testes que fixam o comportamento: `tests/new-name-model.test.mjs:123` (só conferido conta) e `:266` (data de conferência marca conferido).
- A fonte de pedidos não traz data própria de integração (`manual-import.ts:52` mapeia apenas `DATA CONFERENCIA`).

**INFERÊNCIA** derivada do código: `DATA CONFERENCIA` preenchida faz o pedido contar como realizado independentemente do status bruto, **exceto** devolvido e cancelado, que preservam o próprio estado e ficam fora. É esse o ponto de risco, não um cálculo novo.

## Risco

- **HIPÓTESE:** se existirem pedidos conferidos sem integração efetiva, o realizado atual os conta como concluídos, superestimando o marco final.
- **NÃO VERIFICADO:** a ocorrência do caso e a magnitude do desvio na carga real. Não afirmar inflação, perda ou erro financeiro material sem reconciliação.
- **NÃO VERIFICADO:** que `DATA CONFERENCIA` seja a data de competência da apuração oficial.

## Perguntas discriminantes

1. Existem pedidos em que conferência e integração não coincidem na carga real?
2. Conferência concluída implica integração no processo da Fabi, ou são etapas independentes?
3. Qual evento (conferência, integração ou outro) e qual data entram no realizado oficial?
4. Pedido "Integrado com ERP" sempre tem `DATA CONFERENCIA` preenchida?
5. Rubrica MRR elegível: quais componentes recorrentes de `PRODUTO - VALOR MANUTENCAO` são elegíveis e quais exclusões ou ajustes oficiais existem?
6. Competência do atingimento: data do pedido, da conferência, da integração ou do faturamento?

## Pendências de definição no glossário

- [Realizado de vendas](../GLOSSARY.md#realizado-de-vendas): gate oficial ainda não comprovado para conferido isolado.
- [Conferido](../GLOSSARY.md#conferido): não é sinônimo de integrado.
- [Meta e atingimento](../GLOSSARY.md#meta-e-atingimento): MRR é decisão do Bruno; rubrica e competência são NÃO VERIFICADAS.

---

## Rascunhos de comentários (não publicados)

### Rascunho para #1

> Registro documental da spec #10: a decisão de 20/10/2026 continua valendo como desenho gerencial (Ganhos no CRM, Fila de pedidos, Realizado de vendas), mas o marco final não está comprovado como "conferido ou integrado". O gate documentado segue sendo a integração (ADR-0001). A decisão de produto não autoriza mudar fórmula enquanto a #4 estiver bloqueada. Ver [evidência do realizado](EVIDENCIA-REALIZADO-E-PENDENCIAS.md).

### Rascunho para #4

> Risco registrado, sem alterar código: o realizado atual do New Name conta pedido com `DATA CONFERENCIA` preenchida mesmo quando o status bruto é "Integrado com ERP" — exceto devolvido e cancelado, que ficam fora —, e deixa fora o integrado sem data de conferência.
> - A fonte não tem data própria de integração; a data usada é `DATA CONFERENCIA`.
> - O relato de 05/10/2026 (derivado do Copilot) diz que a apuração da Fabi só conclui após integração; a fonte primária não foi auditada.
> - Não há desvio medido: risco potencial, não inflação comprovada.
>
> Testes de discriminação necessários quando houver evidência autorizada: pedido conferido sem integração; pedido integrado sem data de conferência; pedido com os dois marcos em meses diferentes; pedido devolvido depois de conferido.
>
> Critérios para sair do bloqueio: responder as três perguntas do corpo da issue com fonte verificável, incluindo o evento e a data de competência.

### Rascunho para #8

> Item 2 atualizado: por decisão do Bruno, a meta monetária do executivo é MRR, não o valor total de licença e serviços. Isso não valida `PRODUTO - VALOR MANUTENCAO` como rubrica elegível oficial — a rubrica e a competência do atingimento individual continuam não comprovadas. Material AGM distingue recorrente, CDU/licenças e serviços.
> Itens 1 (filial por representante × unidade de negócio) e 3 (classificação do pedido) permanecem abertos.

### Rascunho de conclusão para #10

> Entrega documental concluída, sem mudança de código:
> - [GLOSSARY.md](../GLOSSARY.md): marco final e estados do pedido sem afirmar equivalência conferido/integrado; MRR como decisão do Bruno com rubrica pendente; `DATA CONFERENCIA` não prova integração.
> - [REGRAS-NEGOCIO.md](REGRAS-NEGOCIO.md): marcos gerenciais ≠ estados operacionais; conflito e risco potencial registrados; perguntas 6 e 7 em decisões em aberto.
> - [Evidência do realizado](EVIDENCIA-REALIZADO-E-PENDENCIAS.md): matriz fonte × status, implementação atual, risco, perguntas discriminantes e rascunhos de comentários.
>
> Fórmulas, importador, UI, testes e baseline permanecem idênticos. Nada publicado ou mesclado. A #4 continua bloqueada; não vira `pronto-pra-agente` para alterar fórmula.
