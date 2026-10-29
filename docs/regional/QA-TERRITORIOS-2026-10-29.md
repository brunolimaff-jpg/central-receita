# QA — tela de Territórios contra o visual oficial

Levantado em 29/10/2026, na branch `fix/regional-mapa-calor` (`237d363`),
worktree `regional-fix`, servidor em `127.0.0.1:3031`.

A régua é `docs/DESIGN-AURORA-GLASS.md` (status: em uso, revisão 2026-10-19) e a
comparação é com as telas oficiais do próprio app.

## Resumo

Bruno apontou: *"a tela nova de territórios tá mais vazia que a oficial"*.
**VERIFICADO — e é o achado principal deste QA.** A tela entrega metade da
densidade da Home, e o motivo não é falta de espaço: é que ela não usa nenhum dos
componentes visuais que o resto do app usa.

---

## 1. Densidade: Territórios entrega ~53% da Home

Medido no DOM, `main.innerText.length` e contagem de cartões/seções.

| Tela | Seções | Cartões | Caracteres | Tabelas | Linhas de tabela |
| --- | --- | --- | --- | --- | --- |
| Home (oficial) | 7 | 16 | 3.769 | 0 | 0 |
| **Territórios (CSO)** | **5** | **10** | **2.006** | 1 | 5 |
| Carteira | 1 | 1 | 248 | 0 | 0 |

`main.scrollHeight` voltou 0 em duas medições (aba em segundo plano), então a
densidade por altura não é confiável aqui; a contagem de caracteres, cartões e
seções é `VERIFICADO` e já mostra a diferença.

**O que a Home tem que Territórios não tem:**
- foto de fundo com a camada Aurora Glass (`.revenue-bg-faixa`)
- gráficos (Home tem 4 `<svg>` de dado; Territórios tem 0 próprios)
- texto de contexto por seção — a Home explica, Territórios só rotula

## 2. O que Territórios acerta

Tudo `VERIFICADO` por medição no navegador:

| Item do checklist oficial | Resultado |
| --- | --- |
| Fundo aurora + faixa | presente (`.revenue-bg-faixa`, `.revenue-grain`) |
| Sem barra verde `inset 3px 0 0` | nenhuma ocorrência |
| Fonte Public Sans | única família em uso |
| Pesos por tela | 4 pesos (400/600/700/800) — o guia pede no máximo 3 |
| Raios | 10px e 999px presentes — na lista permitida |
| Contraste de texto | 0 falhas reais (2 alertas eram texto branco sobre gradiente, que o medidor não lê) |

Contraste do texto branco no cabeçalho verde: **5,22:1** no início do gradiente
e **3,70:1** no fim. O fim do gradiente passa AA só para texto grande — e o
`h1` de 22px/700 está no limite (o guia exige negrito ≥19px para 3,66:1, então
passa por 0,04).

## 3. Onde Territórios diverge do guia

### D1 — Densidade: 2.006 caracteres contra 3.769 da Home
`src/features/comercial-v3/regional/cso-screen.tsx`, `territorio-screen.tsx`,
`filial-screen.tsx` · VERIFICADO · **alta**

As três telas de nível somam 4 cartões de KPI, 1 tabela e 2 cartões de texto. A
Home tem 16 cartões e 7 seções. A tela de território é a mais vazia das três:
4 KPIs, 1 tabela, 1 mapa de calor e 1 cartão de texto.

Não é problema de layout — é de **conteúdo**: a tela não responde as perguntas
que o cargo faz. "O que mudou desde a última carga?", "quem são os executivos
deste território?", "quais oportunidades sustentam este número?" não aparecem em
lugar nenhum do nível território.

### D2 — Quatro pesos tipográficos onde o guia pede três
`territorios-ui.tsx` e telas · VERIFICADO · baixa

O guia (`DESIGN-AURORA-GLASS.md` §8) diz "Public Sans, no máximo 3 pesos por
tela". A tela usa 400, 600, 700 e 800.

### D3 — Nenhum gráfico próprio
`cso-screen.tsx:53-90` · VERIFICADO · média

A Home usa `<svg>` para trajetória e diretorias. As telas oficiais de dado têm
representação visual. Territórios tem só tabela e barra de rubrica — nenhuma
série temporal, nenhuma comparação visual entre territórios além do número na
tabela.

### D4 — O fim do gradiente do cabeçalho fica no limite do AA
`territorios-screen.tsx:74-89` · VERIFICADO · baixa

`linear-gradient(to right bottom, #007a72, #00958b)`. Texto branco a 12px sobre
o fim do gradiente (#00958b) mede 3,70:1 — abaixo de 4,5:1 para corpo pequeno.
O rótulo "VISÃO CSO · CONSOLIDADO" (11px) e a linha da persona (12,5px) ficam
nessa faixa.

## 4. O que é impossível hoje (dado de origem, não código)

| Conceito | Dado que falta | De onde viria |
| --- | --- | --- |
| "Quem são os executivos deste território" | lista de executivos por filial | já existe em `snapshot.execs` — **dá para fazer** |
| "O que mudou desde a última carga" | histórico de cargas | não existe na demo; precisaria de 2 snapshots |
| "Quais oportunidades sustentam o número" | opps por território | já existe em `snapshot.opps` — **dá para fazer** |
| "Integrado no ERP" | campo de integração | não existe em `RegionalOpp` — **impossível sem outra planilha** |

## 5. Ordem de menor custo

1. **Encher a tela de território com o que já existe**: lista de executivos
   (`snapshot.execs`, filtrado por filial) e as principais oportunidades
   (`snapshot.opps`). O dado está no snapshot; falta a seção. É o que mais
   aproxima a densidade da Home.
2. **Um gráfico de barras por território** no CSO, comparando os cinco. Substitui
   a leitura linha-a-linha da tabela e usa o mesmo componente do resto do app.
3. **Reduzir para 3 pesos** (400/600/700) tirando o 800.
4. **Escurecer o fim do gradiente** do cabeçalho para `#007a72` puro, ou aplicar
   `color-mix` no texto de 11–12px.

---

# Parecer do Planejador (GPT web), 29/10/2026

Despachado pela staging em `127.0.0.1:3041`, transportado por `window.name`.
Hash conferido nas duas pontas: **2.081 caracteres, FNV-1a 3.773.090.655**,
idêntico em disco e no campo. Após injetar no ProseMirror, o campo tinha 2.134
caracteres com o **mesmo hash** (a diferença é formatação do editor).

## Veredito dele

> "o problema principal é o **recorte funcional** da tela, não o layout.
> Territórios foi reduzido a um navegador de filiais com indicadores básicos,
> enquanto a Home explica a operação."

E a conclusão que reorienta o aceite:

> "O objetivo de aceite não deve ser 'ter 3.769 caracteres'. Deve ser conseguir
> responder, na própria tela: qual território está distante, quais negócios
> explicam o resultado e onde a liderança precisa atuar."

## Conferência das citações contra o código real

O parecer avisou: *"o commit 237d363 não foi localizado no GitHub conectado; a
branch remota aponta para 7751cee"*. Isso procede — o commit nunca foi enviado.
Conferi cada citação no arquivo local:

| Citação | Resultado |
| --- | --- |
| `cso-screen.tsx:34-38` "Ganhos no CRM" + "já integrado no ERP" | **PASS** — texto literal |
| `cso-screen.tsx:40-44` "Territórios no alvo … cenário Base ≥ 70%" | **PASS** |
| `cso-screen.tsx:101-112` "Para onde ir daqui" | **PASS** |
| `territorios-ui.tsx:52-56` `Barra` existe e é reutilizável | **PASS** |
| `regional-model.ts:426-452` `flagsLimpeza` | **PASS** |
| `regional-model.ts:17-39` `RegionalOpp` sem campo de integração | **PASS** |
| `filial-screen.tsx:88-93` links genéricos | **PASS** |
| `territorios-model.ts:9-13` recorte funcional | **PASS** |
| `territorios-model.ts:164-178` / `219-233` | **linhas deslocadas** — o conteúdo existe, mas em 187-193 e 258-270 |
| `DESIGN-AURORA-GLASS.md:160-189` máx. 3 pesos | **PASS** |

**Um erro meu na conferência:** tentei `screens/cso-screen.tsx`, mas o arquivo
está em `regional/cso-screen.tsx`. As quatro falhas iniciais eram do meu caminho,
não do parecer.

## Achados dele que eu confirmei por conta própria

**VERIFICADO — nenhuma das três telas usa `opps`, `flags` ou `proximaAcao`.**
Contei as ocorrências nos três arquivos: todas zero. O snapshot tem as
oportunidades com valor, estágio, data, responsável, nota e próxima ação; a tela
não mostra nenhuma. É a causa medida do "vazio".

**VERIFICADO — a "pior filial" mistura critérios.** `territorios-model.ts:205-216`
monta `comparaveis` com `resultadoFilial(fil, fluxo).pct` — ganho ÷ meta — e a
tabela do CSO exibe `pctBase`. Já corrigi exatamente isso na tabela do território;
ficou aqui.

## Divergência dele com a minha leitura

Ele diz que a densidade "não é, por si só, um defeito". Discordo em parte, e
registro: para o Bruno, que comparou as duas telas lado a lado, **é** um defeito —
a Home tem 4 gráficos e a tela nova nenhum. Mas o argumento dele é melhor: o
aceite não pode ser contagem de caracteres, e sim a tela responder as perguntas
do cargo. Adoto o critério dele.

## Ordem de menor custo (dele, com a minha confirmação)

1. **Correção semântica** — "no alvo" → "acima do piso de 70%"; "Ganhos no CRM"
   não pode afirmar integração ao ERP sem comprovante. Compactar "Para onde ir
   daqui" e "Escopo desta tela".
2. **Dar visualidade à comparação** — barras Base/meta na tabela do CSO,
   reutilizando `Barra` de `territorios-ui.tsx:52`.
3. **Substituir um cartão genérico por "Onde agir agora"** — usar `snapshot.opps`
   e `flagsLimpeza` para pendências concretas.
4. **Revelar os dados no nível certo** — território: concentração e
   responsáveis; filial: as oportunidades que sustentam o número.
5. **Conferir a jornada completa** — CSO → território → filial → oportunidade.

## O que ele veta

> "Não voltar às sete abas. Não adicionar cartões só para alcançar a contagem da
> Home. Não reconstruir o painel."

Nada foi executado. Nenhum arquivo, issue ou PR alterado pelo parecer.
