# Debate Astra × Plano do Próximo Incremento


---

## Turno 1 (2026-09-29 18:22)

## Veredito

**Eu não transformaria esta spec em tickets sem corrigir três pontos: o que entra em cada número, como o pedido sai da fila e qual é a referência temporal da análise.** Hoje ela permite construir uma tela coerente visualmente, mas errada financeiramente.

O corte deve ser: **diretor identifica valor pendente, responsável e impedimento; chega à origem; volta sem perder contexto.** Não uma segunda ferramenta operacional, nem um agente que parece executar ações que não executa.

## 1. Furos e inconsistências específicos

### 1.1. A fila não tem saída — ADR-1; histórias 1, 2 e 14

`OrderPipelineState` tem quatro estados, todos anteriores à integração. Falta representar o fato que encerra a pendência e autoriza o realizado.

**Correção:**
- Manter os quatro estados na distribuição da fila.
- Representar integração explicitamente, com data efetiva.
- Pedido integrado sai dos totais pendentes.
- `conferido` continua pendente: não é realizado nem garantia de integração.

Também substituir **“pedido ganho que ainda não integrou”**, no Problem Statement, por **“pedido assinado pendente de integração”**. A expressão atual contradiz diretamente a ADR-1.

E chamar o gráfico de **“R$ pendentes por estado”**: com devolução e retrabalho, isso é distribuição de estoque, não um funil de conversão.

### 1.2. “R$ em risco pendurado sobre o forecast” pode duplicar receita — histórias 1, 4 e 17

A oportunidade provavelmente já participa do forecast. Seu pedido não pode aparecer como receita adicional por ter entrado na fila.

Além disso, há bases diferentes:
- Valor esperado da oportunidade, ponderado por probabilidade.
- Valor do pedido.
- Recorrência e não recorrência.
- Receita atribuída ao mês.

**Correção:** definir a base monetária comparável e a relação oportunidade→pedido antes de sobrepor números. Um pedido é uma dependência operacional do forecast, não necessariamente um acréscimo a ele.

Se essa reconciliação ainda não estiver definida, **mostrar a fila em cartão separado, sem soma ou percentual sobre o forecast**.

“Valores batendo com o fixture” não basta. Eles precisam bater por uma regra explicável, não por ajuste manual do mock.

### 1.3. “Pendente” está sendo confundido com “perda provável” — histórias 2, 4 e 17

Todo pedido não integrado depende de integração. Isso não significa que todos tenham a mesma chance de atraso — nem que exista informação para calcular essa chance.

**Correção:** apresentar:
- **R$ pendentes de integração no mês**.
- Dentro deles, **R$ devolvidos** e demais estados.
- Prazo restante e tempo parado.

Não criar probabilidade de deslize nem chamar `conferido` de “quase seguro”. Proximidade do fechamento aumenta urgência, não demonstra probabilidade estatística.

### 1.4. Falta um modelo temporal — ADR-2; histórias 3, 4 e 15

Receber `deadline` como dado não torna o seletor independente do relógio: ele também precisa de um `asOf` explícito.

Faltam distinguir:
- Mês em que a receita era esperada.
- Corte mensal aplicável.
- Instante da análise.
- Integração efetiva.
- Postergação em relação à expectativa original.

**Correção:** usar referência temporal explícita, calendário e fuso de negócio definidos. Ao virar o mês, não recalcular tudo apagando o atraso.

**Vencer o prazo não transforma o pedido em realizado no mês seguinte.** Ele continua pendente até integrar. E setembro→outubro desloca aquele valor de Q3 para Q4; não desloca toda a receita do trimestre.

### 1.5. A história 16 é impossível com os campos propostos

Data de entrada na fila permite calcular idade total, não idade no estado atual.

Um pedido devolvido ontem pode estar há vinte dias na fila. Mostrar vinte dias como “tempo devolvido” gera cobrança errada.

**Correção mínima:**
- `queuedAt`.
- `stateEnteredAt`.
- Data e motivo da última devolução.

Não precisa de event sourcing neste corte. Precisa parar de derivar fatos que o contrato não contém.

### 1.6. Grupo econômico existente não é necessariamente grupo já cliente — ADR-4; histórias 8 e 9

Ter um cadastro de grupo econômico não prova base instalada. Também falta o instante de referência: uma venda New Name não deveria virar Cross retroativamente apenas porque o grupo passou a ser cliente depois dela.

**Correção:** explicitar evidência comercial e referência temporal da derivação. Grupo ou evidência ausente deve produzir **“classificação indisponível”**, nunca New Name por padrão.

A história 9 precisa dizer **“conta nova de grupo já cliente”**, não apenas “grupo existente”.

### 1.7. “Origem” significa duas coisas diferentes — história 6; Implementation Decisions

Na spec, “origem” é tanto New Name/Cross quanto procedência CRM/ERP.

**Correção:** separar nomes e contratos:
- **Classificação comercial:** New Name/Cross, derivada.
- **Rastreabilidade:** oportunidade, pedido e evidências de assinatura/integração.

Também não presumir relação 1:1 entre oportunidade e pedido. Uma oportunidade com dois pedidos é um caso mínimo para testar duplicação.

### 1.8. As histórias ampliaram o público e o produto — histórias 11–14; ADR-5

“Ver meus pedidos”, “arrumar” e “devolver à conferência” sugerem autenticação por papel, área do executivo e operação do workflow.

Isso não está contratado e invade o espaço do Hunter.

**Correção:** reescrever essas histórias como capacidades de leitura do diretor, com filtro por executivo e filial. Sem edição, reenvio, atribuição ou workspace pessoal.

O vocabulário do coordenador deve estar no detalhe. Não implica copiar sua interface inteira.

### 1.9. Query string não garante a volta prometida — história 7

Preservar filtro e período é necessário, mas insuficiente para “exatamente onde eu estava”.

**Correção:** definir o contrato de retorno: view, filtros, período, ordenação e posição de navegação/rolagem. Testar também voltar do navegador, reload no detalhe e ID inválido.

Testes puros de parse/build não verificam restauração real da tela. É necessário ao menos um smoke test de navegação no navegador.

## 2. Os cinco pontos abertos

### 2.1. Fecho de “mas não…” — grupo econômico

**Recomendação:** não tentar adivinhar a frase. A ADR-4 permanece fechada; o que falta é a evidência usada na derivação.

Para o mock, adotar uma hipótese explícita: **grupo já cliente antes da assinatura → Cross; primeira venda do grupo → New Name**. Guardar a evidência temporal que permite calcular isso, não um campo NN digitado. Ausência de evidência fica indisponível.

Essa hipótese deve estar documentada como provisória, sem bloquear toda a exploração.

**Contra-argumento:** o processo real pode usar outro marco comercial, e reconstruir histórico pode custar caro. Por isso essa hipótese não pode ser apresentada como regra real já validada.

### 2.2. “Ir até a origem”

**Recomendação:** origem deve incluir **oportunidade e pedido**, ligados por um rastro curto:

`oportunidade → assinatura → pedido → integração, quando existente`

Não são quatro telas completas. É uma subtela de leitura com identificadores, datas disponíveis, valores e vínculo entre registros. Lacunas aparecem como lacunas; referências simuladas não viram links externos falsos.

**Contra-argumento:** dois sistemas ampliam o contrato e a manutenção. Ainda assim, escolher apenas CRM ou ERP deixa a pergunta central incompleta: como a promessa comercial chegou — ou não chegou — ao realizado.

### 2.3. Taxonomia de devolução

**Recomendação:** manter texto livre, com motivo da última devolução, data e executivo responsável conforme ADR-3. Quando ausente, mostrar **“motivo não informado”**.

Não inferir categorias automaticamente neste corte.

**Contra-argumento:** texto livre impede comparar causas e identificar problemas recorrentes. É uma limitação aceitável agora; inventar uma taxonomia antes de observar os motivos reais só produz análise artificial.

### 2.4. Proatividade do agente

**Recomendação:** primeiro corte com **ações sugeridas determinísticas**, agrupadas por executivo e sustentadas pelos mesmos seletores da fila.

Cada ação deve responder:
- Quem cobrar.
- Por qual pedido e motivo.
- Qual valor está pendente.
- Há quanto tempo está devolvido.
- Qual prazo resta.
- Onde abrir o detalhe.

Sem envio, rascunho generativo ou agendamento matinal. Localmente, recalcular ao abrir e informar a referência da análise. Não dizer “cobrança realizada”.

**Contra-argumento:** isso é recomendação operacional, não agência autônoma. Correto. O nome e a copy precisam admitir essa capacidade menor. Um texto que apenas repete o dashboard também não basta: precisa indicar ação e responsável.

### 2.5. Mês ou trimestre no relógio

**Recomendação:** **o relógio é sempre mensal; trimestre é agregação e consequência**, nunca um novo deadline.

Na lente trimestral, manter os cortes mensais visíveis. Atraso de agosto para setembro permanece em Q3; de setembro para outubro sai de Q3.

Cortaria “3 meses” neste incremento. A interface precisa explicitar a restrição, sem herdar um filtro global e silenciosamente ignorá-lo.

**Contra-argumento:** isso reduz a uniformidade com o restante da Central. É preferível uma restrição visível a uma lente aparentemente consistente, mas com semântica diferente.

## 3. A seam mock→real é suficiente?

**Como desenho de dependências, sim. Como garantia de troca de fonte sem problemas, não.** Contratos TypeScript e seletores puros também podem encapsular premissas erradas.

A fronteira deveria ser:

```text
Fonte bruta
  → adapter: validação, normalização e mapeamento
  → snapshot canônico + qualidade/frescor
  → seletores(snapshot, asOf, filtros)
  → UI
```

### Onde quebra

| Ponto | Quebra provável | Mínimo necessário agora |
|---|---|---|
| Identidade e cardinalidade | Duplicidade, uma oportunidade com vários pedidos, vínculo ausente | IDs estáveis, referências explícitas e fixture 1:N |
| Dinheiro | Somar bases incompatíveis ou repetir valor da oportunidade em cada pedido | Unidade monetária, base de receita e regra de reconciliação |
| Estados | CRM chama de ganho o que ERP ainda não integrou | Fato de integração separado do status comercial; mapeamento validado |
| Tempo | UTC muda o dia, mock envelhece, corte muda conforme a máquina | Datas normalizadas, fuso e `asOf` explícitos |
| Completude e frescor | ERP atrasado parece fila vazia; campo ausente vira zero | Distinguir zero, indisponível e dado desatualizado |
| Domínio real | Integração parcial, cancelamento ou divisão de pedido | Premissa explícita de integração integral no protótipo; não aceitar silenciosamente casos incompatíveis |

**Não criaria agora uma plataforma genérica de adapters.** Uma função de normalização com validação em runtime e fixtures adversariais resolve mais que interfaces abstratas vazias.

Também mudaria o mock de “deadline real do mês corrente” para **cenário com data de referência declarada**, por exemplo 29/09/2026, com variações de virada. Caso contrário, a demonstração muda sozinha e deixa de ser reproduzível.

Testes indispensáveis:
- `conferido` não entra no realizado.
- Integrado sai da fila.
- Instante final do mês versus início do seguinte.
- Virada de trimestre.
- Dois pedidos da mesma oportunidade sem duplicação.
- Devolução e reenvio com idades corretas.
- Grupo desconhecido sem fallback para NN.
- Reconciliação dos totais por estado.

## 4. Ordem em tracer bullets

**A lidera; B mínimo entra no primeiro bullet; C vem por último.** Fazer A inteiro, depois B inteiro, depois C não é execução vertical: adia a descoberta dos problemas de contexto e rastreabilidade.

### Bullet 1 — Um problema completo, da home ao pedido e de volta

Antes de codar, registrar um pequeno exemplo com contas fechadas: pedido integrado, pedido conferido e pedido devolvido.

Entregar:
- Contrato mínimo e seletor.
- Indicador de valor pendente na home.
- Clique para o pedido devolvido.
- Valor, responsável, motivo e relógio.
- Volta com contexto.
- Identificação explícita de cenário simulado.

**Por quê:** valida imediatamente se o diretor entende o número e encontra quem deve agir. Já testa a ausência de dupla contagem e a saída da fila.

### Bullet 2 — Completar A

Entregar os quatro estados, totais reconciliados, filtros de filial/executivo, classificação NN/Cross e idade total versus idade no estado.

Adicionar os cenários de fechamento mensal e impacto trimestral.

**Aceite:** soma dos estados igual ao total pendente do recorte; integração e postergação produzem resultados diferentes.

### Bullet 3 — Completar o B necessário

Adicionar a subtela de rastreabilidade, inclusive o caso de uma oportunidade com mais de um pedido.

Preservar navegação, filtros e período. Não construir telas completas para cada dimensão.

**Aceite:** chegar à origem e voltar, inclusive usando o navegador, sem alterar o recorte.

### Bullet 4 — C como consumidor, não como calculadora paralela

Montar as ações sugeridas sobre os seletores já validados.

**Aceite:** todo valor, responsável e prazo mostrado pelo agente é rastreável ao mesmo pedido e à mesma referência temporal da fila. Nenhuma regra financeira exclusiva dentro do briefing.

## 5. Top 3 riscos e mitigação no primeiro corte

### 1. Número convincente, mas financeiramente falso

**Risco:** duplicação com forecast, conferido tratado como realizado, ou postergação apagada na virada.

**Mitigação:** exemplo financeiro fechado antes dos tickets; separação entre realizado e pendente; testes de conservação dos totais e fronteiras de período. Sem reconciliação, não somar fila ao forecast.

### 2. Mock perfeito que esconde a quebra da fonte real

**Risco:** todos os vínculos presentes, todos os grupos conhecidos, estados impecáveis e dados sempre frescos. A seam parece funcionar porque não foi pressionada.

**Mitigação:** poucos fixtures adversariais: grupo desconhecido, vínculo ausente, oportunidade com dois pedidos, motivo ausente e fonte desatualizada. A UI deve mostrar limites, não converter tudo em zero.

### 3. A Central virar um Hunter incompleto

**Risco:** histórias de coordenador e executivo puxarem workflows, tabelas extensas e permissões; o diretor perde o pulso e o incremento perde prazo.

**Mitigação:** leitura somente, uma rota de investigação prioritária e nenhuma ação operacional. Validar o fluxo com três perguntas: **quanto está pendente, quem precisa agir e qual é a origem?**

## 6. O que eu cortaria

1. **Workspaces de coordenador e executivo e qualquer mutação de pedido.** Manter somente leitura e recortes úteis ao diretor.
2. **Lente móvel de “3 meses” e reconstrução histórica de “como estava a fila”.** Sem snapshots, a segunda seria ficção.
3. **Uma subtela própria para cada combinação de filial, solução e executivo.** Usar filtros e contexto; não multiplicar hierarquias de navegação.
4. **Rascunho generativo, envio, alertas e execução matinal automática do agente.** Manter ações sugeridas ao abrir.
5. **Taxonomia e análise automática de motivos.** Preservar o texto informado.
6. **Histórico exaustivo de eventos e cópia integral das colunas do Hunter.** Exibir apenas os fatos disponíveis e necessários à investigação.
7. **Overlay financeiro sobre o forecast enquanto a reconciliação não estiver definida.** Um cartão separado entrega valor sem sugerir adição de receita.

**Não cortaria:** fato de integração, semântica mensal, classificação derivada do grupo, responsável pela devolução, rastreabilidade mínima e volta com contexto. Esses elementos não são acabamento; são o que impede o protótipo de ensinar uma leitura errada do negócio.


---

## Turno 2 (2026-09-29 18:27)

## Rebate 1 — Agência: recuo na preparação, mantenho o limite da execução

Eu fui restritivo demais ao limitar o agente a recomendações ao abrir. **Ele pode executar trabalho de preparação já no corte 1.** Mas, com mock, não existe atuação comercial real sobre a operação. Chamar isso de cobrança executada seria ficção.

### Nível 1 — Agora: agência de preparação, com resultado verificável

Uma delegação: **“Preparar cobranças dos pedidos devolvidos deste recorte.”**

O agente executa o lote, sem exigir que o diretor monte cada mensagem:

- Identifica os devolvidos e agrupa pelo executivo responsável.
- Ordena por regra explícita: prazo restante → valor comparável no período → tempo devolvido. Sem “score de risco” opaco.
- Produz uma narrativa por executivo: pedidos, valores, motivos informados, prazo e pedido de ação.
- Detecta **texto de motivo repetido em pedidos distintos**. Isso não demonstra causa comum nem reincidência do mesmo pedido.
- Gera um pacote persistido localmente, vinculado ao snapshot usado, pronto para revisão e cópia.
- Se os dados mudarem, marca o pacote anterior como desatualizado. Não acumula cobranças duplicadas a cada abertura.

Exemplo de resultado:

> **Cobrança preparada para Ana — não enviada**  
> Dois pedidos devolvidos, com R$ X pendentes no período. Solicitar correção dos documentos apontados pela conferência e confirmação do reenvio antes do fechamento.  
> [Ver pedidos e motivos] [Revisar texto] [Copiar]

Isso é execução de uma tarefa delegada, não apenas uma recomendação. **Não é autonomia comercial externa.** Tampouco exige LLM: um template fundamentado é melhor que prosa inventada.

### Nível 2 — Com dados reais e autorização

- Monitorar mudanças em rotina agendada.
- Preparar cobranças com base em dados atualizados.
- Enviar após aprovação, inicialmente.
- Registrar entrega, resposta e mudança posterior do pedido.
- Aplicar lembretes e escalonamento conforme política explícita.

Dados reais são necessários, mas insuficientes: também entram autorização, destinatários verificados, prevenção de duplicidade e trilha de auditoria. Mudança posterior do pedido não prova que a cobrança a causou.

**MUDANÇA NO CORTE 1:** substituir “briefing estendido” por **“preparação de cobranças por executivo”**, com artefato local, evidências e estado “não enviado”. Não criar gestão operacional de tarefas nem sugerir que copiar uma mensagem significa enviá-la.

---

## Rebate 2 — “3 meses”: visível, indisponível e sem troca silenciosa

**Recuo sobre fazê-la desaparecer.** Em um seletor global, isso destrói consistência e parece defeito.

Mas “semântica pendente” é linguagem da equipe, não explicação ao usuário. E três meses não são impossíveis de analisar: esta versão simplesmente não implementou sua decomposição mensal.

O padrão é **disponibilidade contextual explícita**:

- A opção continua visível.
- Na Visão de Pedidos, fica indisponível com motivo acessível por foco e texto de apoio, não apenas hover.
- Copy: **“A visão móvel de 3 meses ainda não está disponível para pedidos. Use mês ou trimestre.”**
- Não desabilitar o seletor inteiro.
- Não substituir três meses por mês corrente silenciosamente.

Se o usuário chegar da home com três meses já selecionados, preservar a seleção e apresentar:

> **Este período ainda não está disponível nesta visão.**  
> [Escolher mês] [Escolher trimestre]

A escolha altera explicitamente o período aplicado. A volta restaura o contexto anterior.

**Contra-argumento:** um estado indisponível interrompe a investigação. Sim. A alternativa aceitável é implementar a decomposição mensal; não mostrar números de outro período sob o rótulo “3 meses”.

**MUDANÇA NO CORTE 1:** manter a opção global visível e tratar o caso de entrada com seleção incompatível. Registrar isso como limitação da versão, não como impossibilidade do domínio.

---

## Rebate 3 — Forecast e fila: relação visível, sem adição de dinheiro

Eu não proibiria o overlay relacional. Proibiria **somar ou calcular percentuais usando bases incompatíveis**.

O diretor precisa ver uma relação de composição:

```text
FORECAST ATUAL — SETEMBRO
R$ 10,2 mi                         −7,3% vs oficial congelado

└─ R$ 1,4 mi deste forecast dependem de integração
   13,7% do forecast • 7 pedidos vinculados • 2 devolvidos
   [Ver composição e responsáveis]
```

*Valores ilustrativos de um cenário simulado.*

### Regras do desenho

- A faixa dependente fica **dentro da representação do forecast**, não empilhada acima.
- O rótulo é **“parcela dependente de integração”**, não “probabilidade de perda”.
- Selecionar essa faixa destaca os pedidos vinculados.
- Selecionar um pedido mostra sua contribuição ao forecast, quando reconciliada.
- A fila continua tendo seu próprio total e sua base declarada. Não precisa ter o mesmo valor da parcela do forecast.

O percentual só existe quando o numerador é a **contribuição ao forecast atribuída aos pedidos pendentes**, na mesma base e período do denominador. No N:N, a alocação precisa impedir que a mesma contribuição seja atribuída integralmente a vários pedidos.

Sem reconciliação suficiente:

> **Parte deste forecast depende de pedidos pendentes.**  
> 7 pedidos vinculados. Impacto financeiro ainda não reconciliado.  
> [Inspecionar vínculos]

Se houver reconciliação parcial, mostrar o valor identificado e a cobertura incompleta — não um percentual com aparência de totalidade.

**Contra-argumento:** a versão sem percentual impressiona menos. Correto. Um percentual sem base defensável impressiona até a primeira pergunta do financeiro.

**MUDANÇA NO CORTE 1:** adicionar uma **faixa de dependência dentro do card de forecast**, com drill para a composição. Nada de watermark: ele não explica a relação, tem baixa legibilidade e não oferece caminho de investigação.

---

## Bloco D — Interatividade: aceitar a capacidade, rejeitar quatro sistemas de tooltip

“Todos os gráficos com tooltip” é um requisito de interação, não de entendimento. Pode produzir quatro gráficos mais movimentados e igualmente incompreensíveis.

O padrão deve ter **dois níveis**, compartilhados pelos quatro gráficos.

### 1. Inspeção rápida — hover ou foco

Conteúdo curto e estável:

1. **O quê e quando:** métrica, ponto e período.
2. **Quanto:** valor e unidade.
3. **Comparação:** referência nomeada, se houver.
4. **Significado:** uma frase.
5. **Relação:** qual indicador compõe ou explica.

Exemplo:

> **Forecast atual · 29/set**  
> **R$ 10,2 mi**  
> −7,3% frente ao oficial congelado de R$ 11,0 mi.  
> Estimativa de fechamento de setembro; não é realizado.  
> Relacionado ao card **Forecast atual**.

“Ponta do funil” não explica uma fórmula. A explicação precisa corresponder ao seletor que calculou o número.

### 2. Inspeção persistente — clique, toque ou Enter

Fixa um painel com:

- Definição e composição.
- Base monetária.
- Fonte ou cenário simulado.
- Referência temporal e atualização.
- Ressalvas.
- Ação **“Abrir composição”**.

Se houver botões e links, isso é um popover ou painel interativo, não um tooltip transitório. Esc fecha; o foco retorna ao ponto de origem.

### Ligação card↔série

- Hover/foco: destaque temporário.
- Seleção: destaque persistente.
- Ação explícita para filtrar ou navegar.
- Card oferece **“Localizar no gráfico”**.
- Ponto informa **“Compõe”, “Decompõe” ou “Explica a variação de”** determinado card.

Não transformar qualquer contato em filtro. Não inventar vínculo direto para um ponto que não tem equivalente legítimo em um card.

### Particularidades dos quatro gráficos

| Gráfico | O que a interação precisa explicar |
|---|---|
| Hero semanal | Métrica da série, data da posição e baseline da comparação |
| Evolução do mês | Se o ponto é realizado acumulado, projeção ou posição histórica do forecast |
| Movimentos | Evento, sinal e valor anterior→posterior; delta não é estoque |
| Donut NN×Cross | Base do percentual e valor sem classificação, sem redistribuí-lo entre NN e Cross |

Um donut sem classificação indisponível pode estar mentindo mesmo que some 100%.

### Limite de escopo

“Toque” exige seleção persistente e alvos utilizáveis, não uma reformulação mobile agora. Mas **zero teclado não é aceitável**: hover não pode ser a única porta para a explicação.

**MUDANÇA NO CORTE 1:** criar um contrato comum de explicação de métricas e um único painel de inspeção. Aplicar a interação básica aos quatro gráficos, começando pelo hero. Incluir um teste real de navegador para foco, seleção, fechamento e retorno; `node:test` não valida essa experiência sozinho.

---

## A) Ótica do Giovane — a tela precisa preparar decisões, não pedir exploração

### Segunda-feira, 7h50: preparar a fala da diretoria

Em 30 segundos, ele precisa conseguir dizer:

> “Estamos projetando X contra Y. Uma parcela depende de integração. Os principais impedimentos estão nestes pedidos, sob responsabilidade destes executivos.”

A ordem visual deve ser:

1. **Posição contra referência.**
2. **Dependência operacional relevante.**
3. **Até três cobranças prioritárias**, com acesso ao restante.
4. Evidência disponível um clique abaixo.

Quatro gráficos com o mesmo peso visual fazem o diretor trabalhar como analista antes da reunião.

### Sexta-feira, 17h50, no fechamento: concentrar atenção

A tela deve priorizar:

- Valor ainda pendente no período.
- Pedidos devolvidos e responsáveis.
- Pedidos conferidos, mas ainda sem integração.
- Atualização da fonte.
- Pacote de cobranças preparado.

“Hoje é o corte” é adequado. **“Ainda dá tempo” não é**, sem conhecer horário operacional, disponibilidade da conferência e condições de integração.

### Dia 1º de outubro, olhando setembro fechado em R$ 9,8 mi

A pergunta deixou de ser “o que cobrar para setembro?” e passou a ser:

- Quanto setembro realizou?
- Contra qual referência?
- O que permaneceu pendente e passou a depender de integração em outubro?
- Essa posição é definitiva ou ainda pode receber atualização de origem?

Não mostrar contagem regressiva de outubro dentro de uma análise de setembro. Não tratar o saldo pendente como realizado de outubro.

Se não existir snapshot histórico do forecast, não fabricar “o que prevíamos no fechamento”.

**MUDANÇA NO CORTE 1:** incluir uma síntese executiva orientada ao estado do período: **em andamento, no corte ou encerrado**. Criar fixtures específicas para os três momentos e testar se Giovane responde às perguntas em 30 segundos sem ajuda.

---

## B) Ótica de apresentação — a história é promessa, dependência, evidência e ação

O comitê não precisa assistir a um tour de funcionalidades. Precisa entender **qual erro de gestão essa frente de RevOps impede**.

A demonstração deve seguir um único caso:

1. **Promessa:** este é o forecast apresentado à diretoria.
2. **Dependência:** parte dele ainda exige integração.
3. **Impedimento:** um pedido relevante voltou da conferência.
4. **Responsabilidade:** este é o executivo que deve agir, com o motivo registrado.
5. **Preparação:** a cobrança foi montada a partir desses fatos.
6. **Consequência:** outro cenário mostra o que acontece se atravessar o corte.

A integração ou o atraso não devem acontecer “magicamente” durante a demo. A troca de cenário precisa estar identificada como simulação.

### O que constrói credibilidade

- O mesmo valor se conserva entre home, composição e pedido.
- A origem pode ser inspecionada.
- O sistema admite quando não sabe.
- Preparado, enviado e integrado são estados distintos.
- A volta funciona sem reconstruir a análise.

Um caminho feliz perfeito parece encenação. Um dado ausente tratado honestamente demonstra maturidade maior que uma animação.

**MUDANÇA NO CORTE 1:** preparar um roteiro local de 90 segundos, com cenário reproduzível e identificação permanente de dados simulados. Demonstrar **uma decisão com evidência**, não os quatro gráficos em sequência.

---

## C) Ótica de design de ponta — três referências e o que copiar

Não copiaria a aparência inteira de nenhuma delas. Copiaria mecanismos específicos.

### 1. Microsoft Power BI — tooltip contextual e drill-through

**Copiar:** a distinção entre inspecionar um número e abrir seu detalhe filtrado; contexto carregado no drill e retorno explícito.

**Não copiar:** mini-dashboards densos dentro de cada tooltip. Aqui, o detalhe rico deve ficar no painel persistente.

### 2. Tableau — ações de destaque entre visualizações

**Copiar:** uma marca selecionada destaca suas correspondências em outras visualizações, sem necessariamente filtrar o universo analisado. Ações separadas para destaque, filtro e navegação.

**Não copiar:** depender de menus escondidos para o caminho principal do diretor.

### 3. Grafana — inspeção temporal e navegação mantendo contexto

**Copiar:** referência temporal clara no ponto, comparação de séries no mesmo instante quando fizer sentido e links de detalhe que transportam período e variáveis.

**Não copiar:** densidade de console operacional ou cores demais disputando atenção.

A síntese para a Central é: **inspecionar sem sair, selecionar sem alterar o universo, aprofundar preservando contexto**.

**MUDANÇA NO CORTE 1:** especificar esses três verbos como comportamentos distintos em todos os gráficos. Uma cor semântica por função; o estado selecionado não deve introduzir uma nova paleta.

---

## D) Ótica de dados reais — três quebras e a resposta da interface

### 1. CRM e ERP contam histórias de horários diferentes

O forecast foi atualizado às 7h45; o ERP só tem posição das 6h10. O pedido pode parecer pendente apesar de ter integrado depois.

**Copy:**

> **Posição parcialmente atualizada**  
> Forecast atualizado às 7h45; integrações até 6h10. Integrações posteriores podem não estar refletidas.

**Comportamento:** manter a posição conhecida, explicitar sua limitação e trocar cobranças conclusivas por pedidos de confirmação quando a defasagem for relevante. Não apresentar apenas uma data global de atualização.

### 2. Os registros existem, mas não reconciliam financeiramente

Uma oportunidade está ligada a vários pedidos; um pedido cobre várias oportunidades; há identificação ambígua ou integração parcial.

**Copy:**

> **Reconciliação incompleta**  
> Dois pedidos ainda não têm alocação validada no forecast. Eles aparecem na fila, mas não no cálculo da parcela dependente.

**Comportamento:** não excluir silenciosamente esses pedidos da fila nem multiplicar seu valor pelos vínculos. Quando houver integração parcial sem representação suportada, sinalizar o registro como incompatível — não forçá-lo a “todo integrado” ou “todo pendente”.

### 3. Fatos chegam tarde e alteram a leitura de um mês encerrado

Uma integração efetiva em 30/09 só chega à Central em 02/10. Isso é diferente de uma integração que efetivamente ocorreu em outubro.

**Copy:**

> **Posição de setembro atualizada**  
> R$ 150 mil de integração efetiva em 30/09 foram recebidos em 02/10.  
> Posição anterior: R$ 9,8 mi. Posição atual: R$ 9,95 mi.  
> [Ver alteração]

**Comportamento:** preservar a versão anterior e explicar a revisão. “Mês encerrado no calendário” não significa automaticamente “fonte consolidada e imutável”.

**MUDANÇA NO CORTE 1:** acrescentar três cenários demonstráveis — defasagem entre fontes, reconciliação incompleta e atualização tardia — com esses estados de interface. Não basta deixar flags escondidas no contrato.

---

## E) Ótica do dono do produto — uma aposta, não quatro blocos

### A aposta única

**“Transformar o forecast em uma leitura de dependências verificáveis, para o diretor saber quem cobrar antes que a receita atravesse o fechamento.”**

O agente e os gráficos são meios. Se virarem apostas independentes, o incremento perde foco.

### O que precisa ser verdade em 30 dias

1. **Compreensão:** em pelo menos quatro de cinco cenários, Giovane identifica em até 30 segundos o valor dependente e a primeira ação, sem confundir assinado com realizado.
2. **Confiança:** consegue explicar a origem de um número e reconhecer uma posição incompleta sem ajuda do apresentador.
3. **Utilidade da preparação:** em uma rodada de avaliação, considera pelo menos quatro de cinco cobranças preparadas utilizáveis após revisão leve.
4. **Viabilidade da fonte:** comercial e responsáveis pelo ERP validam os campos necessários, os vínculos e a base monetária — ou deixam explícito o impedimento.

Sem dados reais, não dá para prometer redução de atraso, aumento de receita ou recuperação de vendas. O sucesso em 30 dias é validar decisão, compreensão e viabilidade.

**Critério de fracasso:** se ele precisa que alguém explique verbalmente cada número, ou continua abrindo o Hunter antes de entender o problema, a hipótese ainda não foi demonstrada.

**MUDANÇA NO CORTE 1:** atrelar cada entrega a esses critérios. Funcionalidade que só melhora a apresentação, sem melhorar uma dessas respostas, perde prioridade.

---

## F) Ótica adversarial final — a objeção que pode derrubar a apresentação

> **“Vocês pintaram pedidos de vermelho e chamaram isso de risco. Como sei que não vou cobrar a pessoa errada por uma pendência que já foi resolvida?”**

Essa é mais forte que “já temos isso no CRM”. Ela questiona o direito da Central de orientar uma ação.

A própria tela deve responder, antes de qualquer defesa verbal:

```text
DEPENDÊNCIA DE INTEGRAÇÃO — SETEMBRO
Não é uma estimativa de probabilidade de perda.

Pedido 1284
Valor no período: R$ 240 mil
Estado: devolvido em 28/09
Responsável pela correção: Ana
Motivo informado: “Documento contratual divergente”

Não consta integração na posição de referência.
Cenário simulado • referência: 29/09, 7h

[Ver origem e composição do valor]

Cobrança preparada — não enviada
“Solicitar correção do documento indicado e confirmação do reenvio.”
[Revisar evidências] [Copiar texto]
```

Com dados reais desatualizados, essa mesma tela deve dizer **“confirmar situação antes de cobrar correção”**, não esconder a incerteza atrás de um selo de urgência.

A defesa não é “temos seletores puros” nem “o agente usa IA”. É conseguir inspecionar o encadeamento **número → fato → responsável → ação**, inclusive seus limites.

**MUDANÇA NO CORTE 1:** fazer desse encadeamento o critério de aceite do caminho principal. Se ele não estiver completo, cortar uma camada de sofisticação visual antes de cortar evidência ou honestidade.


---

## Turno 3 (2026-09-29 18:40)

## Veredito

**A unidade principal da Central deixa de ser o card e passa a ser uma pergunta de gestão respondida com evidência.** Pedidos são uma dessas evidências, não o eixo da arquitetura.

Eu escolheria **um briefing executivo navegável, com conversa contextual integrada**. Não um chat que exige perguntar antes de mostrar valor; não um dashboard tradicional com um campo de IA colocado em cima.

A revisão precisa provar duas coisas já na primeira entrega: **há vida além do forecast e o assistente sabe explicar o que mostra.**

# A) Home como narrativa de agente

## Estrutura escolhida: briefing persistente + conversa contextual

A home tem uma estrutura estável. O agente muda a síntese, as prioridades e as evidências conforme período e filtros — não reorganiza a página arbitrariamente a cada abertura.

```text
CENTRAL DE RECEITA
Hoje | Receita | Crescimento | Unidades

[Período] [Recorte organizacional] [Mais filtros]
Cenário simulado · posição em 29/set, 7h50 · base monetária

Bom dia, Giovane.
[Uma síntese objetiva do que merece atenção neste recorte.]

[Pergunte sobre este recorte................................]
[O que exige minha atenção?] [O que mudou?] [Explique o gap]

┌───────────────────────────┬───────────────────────┐
│ 1. Exige você             │ 2. Forecast do mês    │
│ Decisões + evidências     │ Posição + dependência │
├───────────────────────────┴───────────────────────┤
│ 3. Entra na semana             │ 4. Pipeline      │
├───────────────────────────────┴───────────────────┤
│ 5. New Name             │ 6. Cross + Perdas       │
├───────────────────────────────────────────────────┤
│ 7. Unidades                                       │
└───────────────────────────────────────────────────┘
```

No mobile, essa é também a ordem de leitura em uma coluna.

### O que significa “bloco-fala”

Não é um balão de chat. Cada bloco contém:

1. **Uma conclusão curta**, sustentada pelos dados.
2. **Evidência visual imediatamente abaixo**.
3. **Uma ação principal** para aprofundar ou preparar trabalho.

Exemplo de estrutura:

> **Há oportunidades relevantes paradas antes da negociação.**  
> Tabela compacta com oportunidade, etapa, dias sem avanço, valor e executivo.  
> **Examinar oportunidades**

A narrativa não repete todos os números da tabela. Explica **por que olhar para ela**.

Comparações como “piorou”, “acelerou” e “aumentou” só aparecem quando existe uma referência comparável. Sem histórico, a síntese descreve a posição, não inventa movimento.

## Ordem e função dos sete blocos

| Bloco | Pergunta respondida | Evidência e próximo passo |
|---|---|---|
| **1. Exige você** | Onde a intervenção do diretor faz diferença? | Até três prioridades justificadas, com responsável e impacto. Não apenas pedidos: negociação relevante parada, desvio de unidade, problema de dado que compromete uma decisão. |
| **2. Forecast do mês** | Onde esperamos fechar e do que isso depende? | Forecast, meta, realizado e referência oficial em uma única composição. Parcela dependente de integração quando reconciliada. |
| **3. Entra na semana** | Que avanço concreto está previsto para os próximos dias? | Oportunidades com fechamento previsto e pedidos com integração prevista, claramente separados. Expectativa não vira realizado. |
| **4. Pipeline por etapa** | Temos sustentação para os próximos resultados? | Distribuição por etapa, concentração e ritmo. Aprofundamento em Crescimento. |
| **5. New Name do mês** | Estamos conquistando novos grupos clientes? | Resultado integrado e pipeline NN separados, derivados do grupo econômico. |
| **6. Cross + Perdas** | Onde expandimos e onde perdemos aquisição? | Expansão e oportunidades perdidas de prospects em subseções distintas. Churn não é renomeado como perda de oportunidade. |
| **7. Unidades** | Onde o diretor deve aprofundar a conversa? | Comparação compacta por filial, com contexto de meta, resultado e dependências. Acesso a executivos e funil da filial. |

**“Exige você” não pode virar “tudo que está atrasado”.** Sem uma regra de escalonamento validada, a copy será **“Intervenções sugeridas”**. Devolução é responsabilidade do executivo; não implica automaticamente intervenção do diretor.

## O que sai dos cinco cards atuais

Saem os **cinco cards como objetos independentes**. Os dados permanecem, reorganizados:

- **Forecast atual 10,2 mi:** número principal do bloco de forecast.
- **Meta 12,0 mi:** referência visual.
- **Realizado 8,4 mi:** progresso reconhecido, explicitamente distinto da projeção.
- **Oficial 11,0 mi:** baseline identificado, sem disputar protagonismo.
- **Δ −1,8 mi / −15%:** passa a ser **“Gap para a meta”**, junto do forecast.

A diferença entre atual e oficial é outra comparação: **−0,8 mi / −7,3%**. Não pode compartilhar o mesmo rótulo genérico “Δ”.

Dos elementos atuais:

- **Evolução do mês:** versão compacta dentro do bloco de receita; completa em Receita.
- **Movimentos do forecast:** sai da home como gráfico independente; entra na explicação de “o que mudou”.
- **Top 10:** deixa de ser uma lista fixa na home. Ela mostra poucas oportunidades relevantes para a pergunta; a lista completa fica em Crescimento.
- **Filiais:** vira o bloco Unidades, orientado a comparação e investigação.

## Como entra a conversa

Ao perguntar, o usuário recebe uma **“Resposta em foco”** abaixo da abertura, antes do briefing:

> **Por que estamos abaixo da meta?**  
> Resposta curta → evidências referenciadas → limites da análise → próximo passo.

O restante da home continua acessível. Não é substituído por um histórico infinito de mensagens.

Regras:

- A resposta assume os filtros atuais e os explicita.
- Se precisar ampliar o recorte, pede ou oferece essa alteração.
- Evidências abrem a visão ou entidade correspondente.
- Ao voltar, resposta, filtros e seleção continuam preservados.
- Perguntas sem suporte recebem uma limitação específica, não uma resposta plausível.

**A experiência de conversa entra no corte; a aparência não autoriza simular inteligência irrestrita.** Com mock, haverá um conjunto explícito de perguntas suportadas. Linguagem livre só promete compreensão ampla quando houver uma camada interna capaz de entregá-la. Nenhuma dependência de Claude externo.

## O agente de cobranças se funde?

**Sim como identidade e superfície; não como confusão de estados.**

O mesmo assistente:

- Explica uma situação.
- Localiza suas evidências.
- Oferece **“Preparar cobranças”** quando há pedidos devolvidos.
- Produz o artefato revisável já definido.

O pacote aparece como resultado de trabalho: **“Preparado — não enviado”**. A Central não ganha uma aba “Agente” separada nem mistura mensagem gerada com fato operacional.

---

# B) O que além de forecast entra

## Arquitetura de navegação: quatro destinos, não dezenove cartões

### Hoje
Briefing de sete blocos e conversa contextual.

### Receita
Forecast, realizado auditável, dependência de integração, fila de pedidos e perda de receita recorrente.

### Crescimento
Pipeline, oportunidades prioritárias, ritmo, New Name, Cross e perdas de oportunidades.

### Unidades
Comparação entre filiais, ranking contextual de executivos e funil da filial.

**Conta, grupo econômico, oportunidade e pedido são detalhes contextuais**, não quatro novas áreas de navegação. Uma mesma ficha pode ser aberta de qualquer visão, preservando o ponto de entrada.

## Seleção do catálogo para o corte

| Item do catálogo | Entrada no corte | Decisão que suporta |
|---|---|---|
| **Follow-up do dia** | Home, em Exige você e Entra na semana; lista completa em Crescimento. | Onde cobrar avanço e quem precisa agir. |
| **Top oportunidades** | Seleção curta na home; visão completa em Crescimento. | Onde concentrar atenção comercial. |
| **Ritmo do funil** | Resumo no Pipeline; medianas e distribuição no detalhe. | Onde o processo está parado, sem confundir negócio grande com negócio saudável. |
| **Funil da filial** | Unidades, reutilizando a visualização de pipeline com recorte. | Qual unidade tem problema de volume, estágio ou avanço. |
| **Ranking por executivo** | Unidades, com métrica explicitamente escolhida: valor reconhecido, contas ou grupos distintos. | Quem precisa de acompanhamento e em qual dimensão. |
| **Realizado auditável** | Receita; origem acessível também pelo número na home. | Por que esse valor conta como realizado e o que ficou fora. |
| **Qualidade do dado** | Conteúdo transversal, não página isolada. | Em quais números é possível apoiar uma decisão agora. |
| **Churn** | Resumo próprio em Receita, com MRR perdido, motivos disponíveis e origem. Sobe a Exige você quando relevante. | Se aquisição e expansão estão ocultando perda da base. |
| **Conta, grupo e linha do tempo — recorte mínimo** | Ficha contextual compartilhada. | Quem é o cliente, como se relaciona ao grupo e quais fatos sustentam a oportunidade/pedido. |
| **Trilha do dia** | Vira a própria sequência da home e seus próximos passos. | O que olhar e fazer depois, sem uma segunda jornada paralela. |

### Três limites necessários

**1. Ranking não é uma classificação universal de desempenho.**  
Não misturar MRR, licença e serviços para produzir um “melhor executivo”. Contagens de grupos são distintas e podem não ser aditivas entre executivos.

**2. Churn e perda de oportunidade ficam separados.**  
O bloco v1 “Cross + Perdas” mantém a perda de aquisição de quem ainda não é cliente. Churn é perda da base e tem sua própria evidência em Receita.

**3. A ficha contextual não será vendida como Conta 360º completa.**  
Ela entrega identificação, grupo, produtos conhecidos, oportunidades, pedidos e fatos disponíveis. Não promete uma visão total quando faltam fontes.

## Onde os pedidos ficam

A fila é **um módulo de Receita**, com três entradas:

- Pela parcela dependente de integração no forecast.
- Por uma intervenção sugerida.
- Pela pergunta ao assistente.

Não recebe uma grande seção adicional na home apenas por ser o domínio novo. O diretor vê seu impacto antes de ver sua fila.

## O que fica para roadmap

| Item | Por que não entra completo agora |
|---|---|
| **White space com preço** | Exige matriz de elegibilidade, preços e base instalada confiável. “Produto não identificado” não prova oportunidade de venda. |
| **Conta 360º completa e matriz conta×produto com rateio** | São produtos de investigação próprios. O corte entrega a ficha de evidência, não esse universo inteiro. |
| **Onde se vende — mapa de praças** | Geografia só merece um mapa quando existe uma decisão territorial definida. Neste corte, filtro/tabela resolve melhor. |
| **Orçamento da oportunidade** | Aproxima a Central de edição e operação comercial, fora do papel de leitura do diretor. |
| **Carteira por competência e transferências** | Exige semântica histórica de posse e movimentação. Não se deduz isso do dono atual. |
| **Linha do tempo exaustiva** | Mostrar os fatos disponíveis basta; reconstruir toda a atividade de CRM não é condição para a decisão inicial. |

## Filtros: o catálogo não vira uma barra com treze controles

Visíveis na home:

- Período/competência.
- Recorte organizacional.
- **Mais filtros**, com contador.
- Chips dos filtros ativos.
- Base monetária sempre identificada.

Executivo, grupo, Cliente/Prospect, segmento, produto e demais dimensões aparecem progressivamente conforme suporte real do módulo.

**Nenhuma seção pode ignorar silenciosamente um filtro global.** Quando não puder respeitá-lo, mostra a limitação. A mesma regra vale para “3 meses”, conforme o tratamento já acordado.

---

# C) Redesign visual e responsivo

## 1. Hover-first: a explicação principal já vem ao passar o ponteiro

**Reverto a hierarquia anterior:** o hover precisa responder o essencial. O painel é aprofundamento, não compensação por um tooltip pobre.

Cada ponto ou segmento apresenta:

1. Nome da métrica e referência temporal.
2. Valor e unidade.
3. Comparação com baseline nomeado.
4. Uma frase de significado.
5. Fonte/base resumida e relação com o indicador.

Exemplo:

> **Forecast atual · setembro**  
> **R$ 10,2 mi**  
> −7,3% frente ao oficial congelado de R$ 11,0 mi.  
> Projeção de fechamento; não é receita realizada.  
> Base: receita do período · cenário simulado.

O usuário não precisa clicar para descobrir “o que é esse número”.

### Comportamento comum a todos os gráficos

- Hover ou foco: explicação imediata e destaque relacionado.
- Clique: fixa a inspeção e oferece composição/origem.
- Toque: abre a mesma explicação em estado persistente.
- Esc ou ação explícita: fecha e devolve o foco.
- Um tooltip ativo por vez.
- Tooltip não contém uma tabela inteira nem fica fugindo do ponteiro.
- Destaque entre card e série **não altera filtros automaticamente**.

No mobile, o conteúdo cabe na largura disponível; nada de balão cortado nas bordas.

## 2. Um contrato de evidência para gráfico, narrativa e resposta

O maior risco do “assistente premium” é cada superfície contar uma versão diferente do número.

A UI deve consumir uma explicação comum com:

- Identificador da métrica.
- Valor, unidade e base.
- Período e posição temporal.
- Referência de comparação.
- Origem/composição.
- Limitações.
- Destino de aprofundamento.

**Tooltip, fala do agente, card e detalhe reutilizam esse contrato.** A narrativa não recalcula valores nem inventa razões para variações.

Isso não exige um framework genérico de métricas. Exige evitar quatro implementações da mesma verdade.

## 3. Responsividade sem criar outro produto

### Desktop
Grid de 12 colunas, combinando proporções como 7/5 e 8/4. Nada de fileiras repetidas de três cards equivalentes.

### Tablet
Dois blocos lado a lado apenas quando ambos continuam legíveis. Caso contrário, empilhamento na ordem semântica.

### Mobile
Uma coluna, preservando as sete seções:

- Filtros em painel de contexto.
- Narrativa antes da evidência.
- Tabelas compactas com colunas prioritárias e expansão de linha.
- Gráficos adaptam orientação e densidade, sem encolher texto até ficar ilegível.
- Detalhe ocupa a página, com retorno e contexto visíveis.
- Campo de pergunta acessível, mas sem sobrepor números ou consumir permanentemente a tela.

Não criar navegação de app, gestos proprietários ou uma experiência paralela. É a mesma Central em uma largura menor.

## 4. Hierarquia tipográfica e densidade

Com Public Sans e números tabulares:

- **Número decisivo da seção:** aproximadamente 32–40 px no desktop, 28–32 px no mobile.
- **Números secundários:** 20–24 px.
- **Conclusão narrativa:** 16–18 px, peso suficiente para leitura rápida.
- **Tabelas e explicações:** 13–14 px, sem sacrificar contraste.
- No máximo um número dominante por seção.

Valores abreviados na leitura principal; precisão completa na inspeção. Período e unidade ficam próximos do número, não escondidos em legenda distante.

**Densidade de diretor não é microtipografia.** É remover repetição, bordas desnecessárias e frases vazias.

## 5. Identidade visual: premium sem espetáculo

Aplicação concreta da identidade travada:

- Fundo `#f6f9fe`.
- Superfícies brancas apenas para agrupamentos reais.
- Hairlines para separar evidência e ações.
- Esmeralda `#00968c` como único acento cromático.
- Variações neutras, padrões, ícones e estilos de linha para distinguir séries e estados.
- Atraso expresso por texto e marcador — não por introduzir uma paleta vermelha paralela.
- Sombras tingidas discretas em superfícies elevadas, especialmente inspeção e detalhe.
- Springs `100/20` para expansão, foco e transição; respeitar movimento reduzido.
- Animação não interpola dados de modo que pareça uma mudança real.

“Números orgânicos” significa fixtures plausíveis e reconciliadas, não adicionar centavos aleatórios para parecer real.

## 6. O que copiar da sensação de assistente — e o que rejeitar

**Copiar:**

- Entrada de pergunta evidente.
- Respostas que começam pela conclusão.
- Continuidade contextual.
- Evidências próximas das afirmações.
- Próximos passos relevantes.
- Linguagem direta e capacidade de admitir limites.

**Não copiar:**

- Tela vazia esperando um prompt.
- Balões sucessivos para tudo.
- Saudação ocupando metade da dobra.
- Efeito de digitação em métricas já calculadas.
- Avatar decorativo competindo com o conteúdo.
- Histórico de chat como única forma de reencontrar uma análise.

O diferencial visual não é “Claude com cards”. É **resposta com representação analítica adequada e navegação confiável**.

Loading, vazio e erro também fazem parte da narrativa: “nenhum pedido devolvido” é diferente de “não foi possível carregar pedidos”. Uma falha parcial não derruba o briefing inteiro.

---

# D) Impacto nos tickets

## O redesign vem antes de pedidos — mas como primeira entrega vertical

**A estrutura geral entra no primeiro bullet. O antigo caminho de pedidos deixa de comandar o incremento e passa para o terceiro.**

Não faria duas fases, “desenhar tudo” e depois “ligar os dados”. Também não deixaria o redesign para maquiar o produto ao final.

Eu reescreveria a sequência 01–06 assim:

| Bullet | Entrega vertical | Critério de aceite |
|---|---|---|
| **01 — Casa do assistente e primeira decisão não-forecast** | Shell revisado, responsivo, abertura narrativa, pergunta contextual inicial e Exige você usando follow-up de oportunidade. Caminho home → oportunidade → origem → volta. Os dados atuais de forecast já são compactados, sem criar cinco novos cards. | Em desktop e mobile, o usuário entende uma prioridade não relacionada a pedidos, inspeciona a evidência por hover/toque e volta sem perder contexto. |
| **02 — Crescimento e semana comercial** | Entra na semana, pipeline, ritmo, NN, Cross e perdas de prospects. Visão Crescimento com oportunidades prioritárias e explicações compartilhadas. | A home passa a cobrir o feed v1 além do forecast. O usuário diferencia avanço esperado, oportunidade perdida e resultado realizado. |
| **03 — Receita auditável e integração** | Visão Receita, composição do realizado, comparações do forecast, dependência reconciliada, fila de pedidos e rastro até integração. | Valores conservados entre home, composição e origem; regras de integração e corte respeitadas; nenhum pedido somado novamente ao forecast. |
| **04 — Unidades e contexto de conta/grupo** | Comparação entre filiais, ranking por métrica, funil da filial e ficha contextual compartilhada de conta/grupo, com fatos disponíveis. | O diretor sai de um desvio de unidade, identifica o recorte responsável e chega à entidade sem reconstruir filtros. |
| **05 — Conversa transversal e trabalho preparado** | Expandir as perguntas suportadas para as visões já entregues; respostas com referências; comparação de recortes; preparação de cobranças por executivo. | A resposta coincide com os seletores, cita evidências e explicita limites. O pacote é revisável e permanece “não enviado”. |
| **06 — Perda da base e leitura de fechamento** | Churn em Receita; narrativa de período encerrado; cenários de atualização tardia, reconciliação incompleta e defasagem entre fontes. Perguntas sobre o fechamento usam apenas referências históricas disponíveis. | Em 1º de outubro, o usuário entende setembro encerrado, o que foi postergado, o que mudou na posição e o que ainda é incerto — sem confundir essas coisas com receita de outubro. |

### O que atravessa todos os bullets

Não deixar para um ticket final de “acabamento”:

- Responsividade.
- Hover/foco/toque.
- Estados loading/empty/error.
- Parse/build de navegação e retorno.
- Seletores puros e testes `node:test`.
- Validação runtime dos snapshots.
- Smoke tests de navegador para interação e restauração de contexto.
- Identificação dos dados simulados.

Cada bullet adiciona suas evidências ao mesmo mecanismo de narrativa e inspeção. Não nasce um assistente separado para cada módulo.

## O teste final da revisão geral

Ao abrir a Central, Giovane deve conseguir, sem começar uma conversa:

1. Identificar onde precisa intervir.
2. Entender a posição de receita.
3. Enxergar o que está por entrar e a sustentação do pipeline.
4. Distinguir aquisição, expansão e perdas.
5. Localizar a unidade que merece aprofundamento.

**Ao perguntar, ele deve ganhar explicação, recorte e trabalho preparado — não apenas receber em prosa os mesmos cards.** Essa é a diferença entre uma revisão geral da Central e uma tela de pedidos com uma camada de assistente por cima.
