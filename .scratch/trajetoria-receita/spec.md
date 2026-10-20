# Spec — Trajetória da Receita e navegação expansível

**Status:** pronto-pra-agente
**Feature slug:** `trajetoria-receita`
**Revisão:** 3 — corrigida após revisão adversarial contra o código
**Decisões do Bruno:** coluna colapsável **e** ícones de produto com nome; preferência persistida no navegador; teste em módulo puro novo.

> **Revisão 3 corrige quatro erros de fato da revisão 2**, todos verificados no
> código: (1) o histórico não pode ganhar campo sem mudar o worker; (2) os
> valores das planilhas estão em **reais**, não em milhões; (3) "realizado" tem
> duas definições concorrentes no sistema; (4) `weekly-forecast-scene` exporta
> `suavizar`, que outro gráfico consome. Os detalhes estão no corpo da spec,
> marcados com ⚠️.

---

## Problem Statement

A seção **Trajetória da Receita** é a última da página, a mais baixa na hierarquia
visual, e a única que ainda não vem da carga real: ela lê quatro pontos fixos de
`mock-data.ts` e carrega o selo "Demonstrativo". Para o diretor, é a peça que
responde "para onde o mês está indo" — e hoje ela responde com número inventado,
então ele aprendeu a ignorá-la.

O gráfico em si também está cru: grade de colunas verticais em todas as semanas,
faixa verde de "pendente" ocupando metade da área, rótulos de eixo distantes da
curva, e uma linha tracejada de "ritmo da meta" que **não existe na carga** — a
planilha da Fabi não traz meta. O resultado é um desenho que parece um
fluxograma, não uma curva de receita.

Em paralelo, a navegação lateral esconde o próprio conteúdo. Abaixo de 1180px ela
colapsa para 84px e **remove o texto sem oferecer caminho de volta**: ficam oito
ícones sem rótulo. Ninguém decora o significado de oito glifos, e os ícones
oficiais de produto (ERP, HCM, TMS, WMS…) ampliam o problema — o próprio guia da
Senior exige que eles apareçam sempre acompanhados do nome.

## Solution

**Trajetória.** Sai do rodapé e entra no corpo da Visão Executiva, logo depois do
movimento do forecast — onde o diretor já está lendo o mês. Passa a desenhar a
curva acumulada real, com datas que existem na planilha, e se adapta a uma, duas
ou três ou mais cargas sem inventar série em nenhum caso.

**Navegação.** A coluna ganha um controle explícito de expandir/recolher que
funciona em qualquer largura, não só no breakpoint. Recolhida, cada ícone mostra
o rótulo ao passar o mouse e ao receber foco de teclado. Ícones de produto passam
a vir sempre com o nome ao lado. A escolha é lembrada entre visitas.

---

## User Stories

### Trajetória — leitura

1. Como diretor nacional, quero ver a trajetória logo depois dos indicadores do mês, para não precisar rolar até o fim da página para entender a direção.
2. Como diretor nacional, quero que a curva use as datas reais da planilha, para poder conferir cada ponto contra o CRM.
3. Como diretor nacional, quero distinguir o que já aconteceu do que ainda pode mudar, para não tratar projeção como resultado.
4. Como diretor nacional, quero ver a inclinação da curva para saber se o mês está travando antes do dia 20 ou concentrando entrega no fim.
5. Como diretor nacional, quero que o eixo horizontal mostre dias do mês, não "Semana 1..5" inventada.
6. Como diretor nacional, quero que a área sob a curva reflita o volume acumulado, para perceber a proporção entre previsto e realizado.
7. Como diretor nacional, quero ver quantos registros vieram sem data, para saber se a curva representa a carteira inteira ou só uma parte.
8. Como diretor nacional, quero que a curva de realizado use a data de conferência, porque realizado oficial é o que foi conferido, não o que foi ganho.

### Trajetória — comparação entre cargas

9. Como diretor nacional, com duas cargas, quero ver a decomposição entre elas (entrou, saiu, alterou valor), para saber por que o previsto mudou.
10. Como diretor nacional, quero que a decomposição só apareça quando a conta fecha, para nunca ler componentes que não somam ao total.
11. Como diretor nacional, quero que a tela me diga quando a decomposição foi ocultada por inconsistência, em vez de simplesmente não mostrar nada.
12. Como diretor nacional, com três ou mais cargas, quero ver a evolução ponto a ponto na data de cada importação.
13. Como diretor nacional, quero que duas cargas no mesmo dia apareçam como dois pontos distintos com a hora, não como um ponto médio.
14. Como diretor nacional, quero que o subtítulo da seção diga com qual carga estou comparando, para não confundir a leitura.

### Trajetória — estados e confiança

15. Como diretor nacional, sem carga importada, quero ver um convite claro para importar, não um gráfico vazio.
16. Como diretor nacional, quero que o selo diga quantas cargas existem ("1 carga", "2 cargas"), para saber o quanto a curva está madura.
17. Como diretor nacional, quero que a palavra "Demonstrativo" nunca apareça nesta seção quando houver carga real, para não duvidar dos números.
18. Como diretor nacional, quero que a seção apareça mesmo sem carga, para saber que ela existe e o que ela vai me mostrar.
19. Como diretor nacional, quero que a linha de meta não seja desenhada enquanto não houver meta na fonte, para não ler um alvo inventado.

### Trajetória — inspeção

20. Como diretor nacional, quero passar o mouse sobre a curva e ver o valor exato daquele dia.
21. Como diretor nacional, quero uma guia vertical que acompanhe o ponteiro sem atraso perceptível, para mirar no dia certo.
22. Como diretor nacional, quero navegar pelos pontos com as setas do teclado, para inspecionar sem mouse.
23. Como usuário de leitor de tela, quero ouvir o valor de cada ponto ao navegar, para não depender do desenho.
24. Como usuário com sensibilidade a movimento, quero a curva aparecer pronta quando eu pedir menos movimento no sistema, sem deslocamentos.
25. Como diretor nacional, em tela de 1366px, quero que nenhum rótulo se sobreponha, para conseguir ler todos os valores.

### Navegação expansível

26. Como diretor comercial, quero poder recolher a coluna lateral para ganhar área de leitura no gráfico e nas tabelas.
27. Como diretor comercial, quero poder expandi-la de volta a qualquer momento, com um controle visível.
28. Como diretor comercial, quero que esse controle funcione em qualquer largura de tela, não só abaixo de um ponto de quebra.
29. Como diretor comercial, quero que a coluna recolhida mostre o rótulo de cada ícone ao passar o mouse, para não precisar decorar oito glifos.
30. Como usuário de teclado, quero que o rótulo também apareça ao focar o item com Tab, para navegar sem mouse.
31. Como usuário de leitor de tela, quero que o controle de expandir/recolher anuncie o estado atual, para saber o que vai acontecer ao acioná-lo.
32. Como diretor comercial, quero que a minha escolha de coluna expandida ou recolhida seja lembrada na próxima visita, para não repetir a ação toda vez.
33. Como diretor comercial, quero que a preferência de coluna não interfira no período, filial e solução selecionados, para não perder o recorte ao recolher.
34. Como diretor comercial, em tela pequena, quero que a coluna recolhida não ocupe espaço que o conteúdo precisa.

### Ícones de produto

35. Como diretor comercial, quero ver o ícone oficial ao lado do nome da solução, para reconhecer o produto mais rápido.
36. Como diretor comercial, quero que toda solução sem ícone correspondente mostre apenas o nome, sem um glifo inventado.
37. Como diretor comercial, quero que o ícone nunca apareça sozinho, conforme o guia da marca.
38. Como diretor comercial, quero que o filtro de solução mostre o ícone do produto ativo, para confirmar o recorte de relance.
39. Como usuário de leitor de tela, quero que o ícone seja decorativo, para não ouvir o nome do produto duas vezes.

---

## Implementation Decisions

### Fronteira de dados — um caminho só

A trajetória **não** lê `mock-data.ts`, `test-data.ts` nem `real-branches.json`.
Toda entrada vem do `ImportDraft` já carregado pelo aplicativo, mais `previous`
e o histórico de cargas. `weeklyForecast` e `weeklyTargetPace` saem de
`mock-data.ts` junto com o componente antigo.

### Módulo puro — `trajectory-model`

Novo módulo de domínio, sem React, no mesmo nível de `forecast-month` e
`pipeline-model`. Exporta:

- **Um construtor de modelo** que recebe oportunidades, pedidos, a carga
  anterior, a data de referência e o histórico, e devolve o modelo completo:
  regime, séries, marcas de eixo, totais e a contagem de registros sem data.
- **Uma função de reconciliação** que recebe dois totais e os componentes de
  movimento e responde se a decomposição pode ser publicada.

O modelo expõe `regime` como união fechada de quatro valores: `'vazio'`, `'A'`
(uma carga), `'B'` (duas cargas) e `'C'` (três ou mais). O componente **não
decide** regime — só desenha o que o modelo entrega.

Reaproveita `calculateForecastMonth` para a régua de elegibilidade. A régua não
é reimplementada: se a regra mudar no forecast, a trajetória acompanha.

### ⚠️ Unidade de valor — reais, não milhões

**Corrigido na revisão 3.** O parser devolve o número **como está na planilha**,
sem dividir por um milhão: `parseImportNumber` retorna `15000` para `"15.000"`, e
o teste `manual-import.test.mjs:86` confirma `predictedValue: 1000` para a
entrada `1000`. Quem converte é a camada de apresentação
(`formatarRealCompacto` recebe reais; `formatarMilhoes` é para o fixture).

Portanto:
- o modelo da trajetória trabalha em **reais**, não em milhões;
- a tolerância de reconciliação é **R$ 0,01**, não `0.000001`;
- nenhuma conversão de unidade acontece no módulo — ele repassa o que a carga
  traz, e a tela formata com `formatarRealCompacto`.

A v2 desta spec dizia "milhões" e "tolerância de centavo = 0.000001". As duas
frases estavam erradas: misturar as duas unidades produz erro de fator 1.000.000.

### ⚠️ Duas definições de "realizado" — escolher uma, explicitamente

**Descoberto na revisão 3.** O sistema tem hoje **duas** noções de realizado, e
elas não são a mesma coisa:

| Onde | Fonte | Campo de data |
|---|---|---|
| `forecast-month.ts:75-77` | oportunidades em `Fechada e Ganha`, somando `closedValue` | `closingDate` |
| `new-name-model.ts:409` | pedidos, somando `maintenance` | `conferenceDate` |

A tela de Forecast usa a primeira. A de New Name usa a segunda. A v2 desta spec
mandava a trajetória usar `conferenceDate`, o que **contradiz o card "Realizado"
que está logo acima dela na mesma tela** — dois números com o mesmo rótulo e
valores diferentes, na mesma dobra.

**Decisão:** a trajetória usa a **mesma definição do card "Realizado" da Visão
Executiva** — `calculateForecastMonth().realized`, ou seja, oportunidades ganhas
por `closedValue` na `closingDate`. O motivo é de leitura: o diretor compara a
curva com o número logo acima. Se a curva usasse outra base, ele concluiria que
um dos dois está errado.

A data de conferência continua correta para New Name, que fala de pedidos. Não é
incoerência: são populações diferentes, e cada tela declara a sua.

**Consequência para o modelo:** a série de realizado é `closedValue` por
`closingDate` de oportunidades ganhas, não `maintenance` por `conferenceDate`.
A spec não cria uma terceira definição.

### Datas — o eixo é sempre observação

- Previsto agrupa por **previsão de fechamento** (`forecastDate`).
- Realizado agrupa por **efetivação do fechamento** (`closingDate`), conforme a
  decisão acima.
- O eixo da comparação entre cargas usa **`importedAt`** de cada lote, com queda
  para `savedAt` quando o primeiro faltar. Sem nenhum dos dois, o eixo de cargas
  não é desenhado.
- Nenhum ponto é interpolado. Lacuna é ausência, não zero.

### ⚠️ Histórico de cargas — exige mudança no worker

**Corrigido na revisão 3.** A v2 dizia "sem migração". Isso é falso.

O histórico **não** é gravado a partir do cliente quando o modo compartilhado
está ativo. `backend/worker.js:267-274` reconstrói o histórico lendo a tabela
`import_versions`:

```js
const history = d1Rows(historyResult).map(entry => ({
  at: entry.saved_at, referenceDate: entry.reference_date, sources: JSON.parse(entry.sources_json),
}))
```

Não há onde um campo `snapshot` vindo do cliente sobreviva: o worker devolve
exatamente três campos. Além disso, `update()` valida o corpo com
`hasExactKeys(body, ['workspace', 'previousRevision', 'referenceDate'])`
(`worker.js:364`) — qualquer chave nova no corpo é rejeitada.

**O que o ticket 03 precisa fazer de verdade:**

1. Adicionar uma coluna `snapshot_json TEXT` em `import_versions` — nova
   migração Drizzle em `drizzle/`.
2. Gravar a coluna em `persist()` (`worker.js:326-336`).
3. Devolver o campo em `readVersion()` junto dos outros três.
4. Manter a leitura tolerante: linha antiga tem `snapshot_json` nulo.

Isso é mudança de **schema em banco de produção compartilhado**. Pela regra do
projeto, migração pede OK textual do Bruno antes de rodar. O ticket fica com
status `decisao-do-bruno` até essa aprovação, não `pronto-pra-agente`.

No modo local (IndexedDB), o campo entra direto em `saveImportDraft` — sem
schema fixo, sem migração.

**Alternativa mais barata, se a migração não for desejada agora:** o regime C
fica indisponível e a trajetória para no regime B. A spec funciona inteira sem
o ticket 03; só não evolui para três pontos. Registrado como decisão.

### Reconciliação

A ponte entre cargas só é publicada quando a soma dos componentes fecha com a
diferença entre os totais, **em reais, com tolerância de R$ 0,01** (⚠️ não
`0.000001` — ver seção de unidade).

Não fecha: os dois totais aparecem isolados, com um aviso curto no tom do
sistema ("Os movimentos não fecham com a diferença entre as cargas. O total de
cada carga continua correto; a decomposição fica oculta até a próxima
importação."). Nenhum valor de componente é exibido nesse estado.

⚠️ **Risco conhecido de a ponte quase nunca publicar.** `calculateForecastMonth`
trata valor nulo como contágio: `sumKnown` devolve `null` se **qualquer** registro
tiver `predictedValue` nulo (`forecast-month.ts:40`). Basta uma linha sem valor
previsto para o total virar desconhecido. Nesse caso a ponte cai no aviso, não
no número — comportamento correto, mas é bom o implementador saber que o estado
"não fecha" vai ser comum, não exceção.

### Meta

A meta não vem na planilha. A trajetória **não desenha linha de meta** e não
calcula atingimento. Isso é comportamento correto, não lacuna a preencher.

⚠️ **`semanas` não pode ser removido sem checar os consumidores.** A v2 mandava
remover `semanasDe()` e os campos de `HomeModel` "se ninguém mais usar". Usei a
palavra "verificar antes" — a verificação mostra que **eles são usados**:

- `month-evolution-chart.tsx` recebe `semanas` e desenha `s.ritmo`
- `opportunities-forecast-chart.tsx` recebe `semanas`
- `agent-briefing.tsx` e `agent.ts` consomem `briefing.semanas`
- `home-screen.tsx` usa `model.semanas`

**Portanto `semanasDe()` fica.** Só o que sai é a prop `demoWeeks` da
`ExecutivePage` e o `weeklyForecast` do mock usado por ela. Remover o seletor
quebraria quatro telas.

### Posição na página

A seção sai do fim e passa a ser renderizada **entre o movimento do forecast e
os blocos de detalhe** da Visão Executiva. Sai o selo "Demonstrativo"; entra um
selo com a contagem de cargas. O subtítulo varia por regime (vazio, 1, 2, 3+).

### Navegação expansível

- A coluna ganha **dois estados explícitos** — expandida e recolhida — dirigidos
  por um controle próprio, e não por um ponto de quebra fixo. O breakpoint
  existente continua valendo como padrão inicial em telas estreitas, mas deixa
  de ser a única fonte de verdade.
- O estado inicial é derivado da largura na primeira visita; depois disso, a
  preferência gravada manda.
- **Persistência no navegador.** A escolha é gravada localmente e lida antes da
  primeira pintura relevante, para não haver salto de layout. Falha ao ler ou
  gravar não impede o uso — cai no padrão por largura.
- Recolhida, cada item mostra o rótulo em **duas vias**: ao passar o mouse e ao
  receber foco de teclado. Não é só `title` nativo — precisa aparecer rápido e
  funcionar no foco.
- O controle é um `<button>` com `aria-expanded` e `aria-controls`, e um rótulo
  que nomeia a ação ("Recolher navegação" / "Expandir navegação").
- A transição de largura usa **curva**, não mola: é mudança de valor entre dois
  pontos conhecidos, e mola aqui produziria oscilação visível na coluna.

⚠️ **Três restrições do CSS atual, verificadas:**

1. **Abaixo de 780px a coluna deixa de ser coluna.** `globals.css:753-763` troca
   `.revenue-app` para `display: block` e prende a sidebar como **barra inferior
   fixa** de 62px. Largura não existe nesse modo. O controle de expandir/recolher
   **não se aplica** abaixo de 780px — ele é ocultado, e a barra inferior mantém
   o comportamento atual.
2. **`grid-template-columns` é animável, mas exige cuidado.** A transição
   funciona em navegadores modernos; em qualquer falha, a coluna troca de largura
   instantaneamente, o que é degradação aceitável, não erro. Não usar `width` na
   sidebar — ela é item de grid.
3. **O `@media (max-width: 1180px)` já esconde o rótulo por breakpoint**
   (`globals.css:757-760`). A regra passa a depender do **atributo de estado**,
   não da largura, senão o usuário que expandir em 1100px continuará sem rótulo.

### Ícones de produto

- O casamento entre o texto da solução e o ícone passa a ser **centralizado num
  mapa único**, consumido pelo filtro e pela tabela. Hoje a lógica vive dentro do
  componente de ícone; ela sobe para o mapa para poder ser testada.
- Toda exibição é **ícone + nome**, nunca o ícone só.
- Sem correspondência, nada é renderizado no lugar do ícone.
- O ícone é sempre decorativo (`aria-hidden`), porque o nome já está no texto.

### Movimento — revisado contra a disciplina de animação

A referência de disciplina classifica este produto como **cena contida**
(dashboard/ferramenta), não expressiva. Nessa classe, o orçamento de movimento
pertence ao micro-feedback funcional, não a coreografias de entrada.

**O que continua:** o desenho da curva é *reorientação temporal* — o único caso
que a literatura endossa para animação em dado. Ele mostra que o valor se
acumula ao longo do tempo, o que é informação real.

**O que sai da v1 desta spec:**

| Item da v1 | Problema | Correção |
|---|---|---|
| Cascata de 5 etapas com 0,85s de delay | passa de 500ms; coreografia de landing em ferramenta | some a cascata; o traço único carrega o efeito |
| Área com mola `scaleY` | mola em propriedade que deveria ser curva | curva |
| Pontos com `stagger 0.06` | decoração | aparecem junto com o traço |
| Rótulos entrando depois | decoração | estáticos desde o primeiro quadro |

**O que fica:** um único traço `pathLength` 0→1, com **curva**
`cubic-bezier(0.2, 0, 0, 1)` e duração de **420ms** — abaixo do teto de 500ms
para transição que não é de tela inteira. Opacidade e cor sempre por curva; mola
só onde há física real (a guia de inspeção, que segue o ponteiro).

A guia de inspeção mantém mola porque é movimento guiado por gesto — o caso em
que mola é apropriada. Duração não se aplica a ela: quem manda é o ponteiro.

`prefers-reduced-motion` remove o traço e mantém o hover; a curva aparece pronta.

⚠️ **Relação com `motion-primitives.tsx`.** Aquele arquivo já define
`SPRING = { stiffness: 260, damping: 28, mass: 0.9 }`, usado por `FadeUp` e
`Stagger` na entrada dos blocos. A trajetória **não usa** esse spring: ela usa
curva, porque o traço é valor entre dois pontos conhecidos. Os dois convivem —
spring na entrada do bloco, curva no desenho da linha. Não substituir um pelo
outro.

⚠️ **`pathLength` com `preserveAspectRatio="none"`.** O gráfico atual usa
`preserveAspectRatio="none"` (`weekly-forecast-scene.tsx:107`) para esticar o
SVG na largura. Isso distorce o traço quando o `viewBox` não casa com o
container — e `pathLength` normaliza o comprimento pelo caminho, não pelos
pixels finais. **Usar `preserveAspectRatio="xMidYMid meet"`** no gráfico novo, ou
calcular o `viewBox` a partir da largura real medida. O alongamento horizontal
também deforma a espessura da linha e o raio dos pontos.

---

## Testing Decisions

**O que faz um bom teste aqui:** exercitar a regra de negócio pelo contrato do
módulo, com registros de entrada e o modelo de saída. Nunca pelo desenho, nunca
por detalhe interno. O teste não deve saber se o módulo usa `Map`, `reduce` ou
`for` — só o que ele responde.

**Módulos testados:**

1. **`trajectory-model`** — o módulo novo, testado direto. Cobre: os quatro
   regimes, acumulação por data, registros sem data, reconciliação que fecha e
   que não fecha, e a escolha de eixo entre `importedAt`, `savedAt` e ausência.
2. **`product-icon`** — o mapa de casamento solução→produto. Cobre os nomes
   exatos da carga, os aliases, o texto que não casa (devolve nada) e o texto
   vazio. Não testa o PNG renderizado.
3. **Persistência da coluna** — uma função de leitura/gravação isolada do DOM,
   testada com armazenamento falso: valor válido, valor corrompido, ausência.

**Prior art:** `tests/pipeline-model.test.mjs` e `tests/movement-rows.test.mjs`
já fazem exatamente isso — importam o `.ts` diretamente e montam registros por
fábrica (`record(id, values)`). Os testes novos seguem a mesma fábrica e o mesmo
estilo de asserção sobre o modelo devolvido, não sobre a implementação.

**Não testado por unidade:** o SVG, a ordem de desenho e a largura da coluna.
Isso é verificação visual, feita no navegador em três larguras — 1366, 1440 e
1920 — conferindo ausência de sobreposição e de corte.

---

## Out of Scope

- Prever dias ou semanas futuras.
- Desenhar meta, atingimento ou ritmo de meta.
- Persistir o conteúdo completo das cargas (só o resumo numérico).
- Alterar a régua de elegibilidade do forecast.
- Trocar o gráfico das telas Forecast, New Name e Oportunidades.
- Reordenar ou renomear os destinos da navegação.
- Criar tema escuro.
- Escrever no cofre do Bruno ou em integrações externas.

---

## Further Notes

### Correção de rumo registrada

A v1 desta spec especificava uma coreografia de entrada em cinco etapas, com
mola na área e cascata nos pontos. A referência de disciplina de animação
(consultada depois) classifica este produto como cena contida e trata
coreografia de entrada em ferramenta como defeito de lint. A v2 corrige: um
traço único, 420ms, curva.

A justificativa para manter *algum* movimento: o desenho de traço comunica
acumulação temporal, que é a única classe de animação que a literatura endossa
para dado. Ele não decora — ele explica de onde o total vem.

### O que já existe e não deve ser refeito

- `calculateForecastMonth` — a régua está certa e testada.
- `movement-rows` — a classificação dos quatro movimentos está certa e testada.
- Ícones oficiais em `public/brand/produtos`, já extraídos sem redesenho.
- Tokens de cor e contraste — as correções de AA já foram medidas e validadas.

### Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| `forecastDate` vazia em muitas linhas | curva concentrada no fim | traço de "restante" cobre a lacuna; rodapé informa a contagem |
| `importedAt` ausente em cargas antigas | eixo de cargas sem base | cai para `savedAt`; sem ambos, esconde o eixo e mantém a ponte |
| Campo novo no histórico | exige migração D1 | ticket 03 fica em `decisao-do-bruno`; regime C é opcional |
| Preferência de coluna gravada de outra versão | estado inválido na abertura | leitura valida o valor; inválido cai no padrão por largura |
| Valor nulo em qualquer registro | total vira `null` e a ponte nunca publica | correto; o aviso explica. Não converter nulo em zero |

### Cenários de falha não cobertos pela v2 — agora cobertos

| Cenário | Decisão |
|---|---|
| Oportunidade com `predictedValue` nulo | `sumKnown` propaga `null`; ponte não publica; curva usa só os com data |
| Oportunidade com valor zero | conta como zero legítimo (`0` ≠ `null`) |
| Mês de referência diferente entre as duas cargas | `calculateForecastMonth` já usa o `month` da referência atual; a ponte compara populações de meses distintos — **se `referenceDate` mudar entre cargas, a comparação é bloqueada** com o mesmo aviso de qualidade |
| Importação parcial (só oportunidades, sem pedidos) | trajetória funciona; New Name fica sem carga, como hoje |
| Reimportação byte a byte idêntica | `isDuplicateImport` já barra o save (`manual-import.ts:147`); não gera ponto extra |
| Data no futuro além do fim do mês | excluída pela régua (`forecastDate.startsWith(month)`); não vira ponto |
| Fuso horário | datas são `YYYY-MM-DD` sem hora; `currentImportDate` usa `America/Cuiaba` (`manual-import.ts:96`). Comparação por string, sem `Date` — sem risco de virada |
| Pedido sem conferência | não afeta a trajetória (que usa oportunidades); afeta New Name, já tratado |

### Aberto para decisão do Bruno

A coluna recolhida hoje é o padrão abaixo de 1180px. Com o controle manual, essa
regra vira apenas o **valor inicial da primeira visita**. Se você preferir que
telas estreitas sempre comecem recolhidas mesmo para quem já escolheu expandir,
isso é uma exceção a registrar — a spec assume que a escolha do usuário sempre
vence o breakpoint.
