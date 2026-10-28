# Parecer — Territórios (`fix/regional-mapa-calor` @ `7751cee`)

> **Atualização (28/10, após o parecer):** B1, T1 e T2 foram corrigidos e o teste
> que faltava foi escrito. Ver a seção 7, no fim, para o que mudou e como foi
> verificado. Os itens M1, M2 e o órfão da seção 5 continuam em aberto.

**Veredito original: não integrar como está.** A reestruturação está certa e o modelo é
sólido, mas a navegação de três níveis — que é a entrega — não funciona por
clique. O terceiro nível é inalcançável, e não há caminho de volta da filial para
o território. Cinco lentes independentes chegaram ao mesmo defeito, e três
refutações tentaram derrubá-lo sem sucesso.

O problema não é falta de cuidado com o mapa de calor nem com as regras: esses
estão bons e cobertos. É que a camada de URL ficou sem teste, e os 41 verdes
passam por cima do defeito.

---

## 1. O bloqueio

### B1 — O clique na filial não abre a filial
`src/features/comercial-v3/context.ts:97` e `:103` · VERIFICADO · alta

`CommercialHrefExtra` declara `branch?: string` (`nav.ts:40`), e `nav.href`
espalha `...extra` no terceiro argumento de `buildCommercialHref`
(`commercial-v3-app.tsx:247`). Mas o terceiro argumento de `buildCommercialHref`
**não declara `branch`**, e o corpo lê `branch` só de `context`.

O TypeScript não acusa porque a checagem de propriedade excedente não se aplica a
spread de objeto. Passa `tsc` e passa o build.

Prova na tela: em `?view=territorios&territorio=centro-oeste`, o link "DF" tem
`href="/?view=territorios&period=month&territorio=centro-oeste&from=home"`.
Sem `branch=DF`. Clicar recarrega a mesma URL.

E o inverso também falha: `?view=territorios&territorio=centro-oeste&branch=DF`
é o único jeito de chegar na filial. O botão "Todas" (`territorios-screen.tsx:134`)
não limpa o `branch`, então não há caminho de volta.

**Impacto:** a entrega inteira — "CSO → território → filial" — só funciona
digitando a URL. Os 17 testes de `territorios.test.mjs` passam porque testam
`nivelDe`, que está correto. Ninguém testou o `href`.

### B2 — O que sustenta B1 como verificado, não como hipótese
- Reprodução isolada do `buildCommercialHref`: com e sem `extra.branch`, a URL
  gerada é idêntica.
- Clique real no navegador em `127.0.0.1:3031`: após clicar em "DF", a URL não
  tem `branch`.
- Nenhum dos 34 arquivos de teste toca `buildCommercialHref` nem
  `parseCommercialContext`.

---

## 2. O que está errado no modelo

### M1 — Filial sem meta infla o percentual do território
`src/features/comercial-v3/regional/regional-model.ts:210` e `:219` · VERIFICADO · média

`resultadoTotal` e `resultadoFilial` somam `meta` e `ganho` de todas as filiais
separadamente. Uma filial com meta zero contribui com **todo o ganho** e **nada**
da meta.

Medido: zerando a meta de MT e mantendo o ganho, o cenário Base do Centro-Oeste
salta de **75% para 106%**. O total do CSO, de 74,6% para 99,4%.

A tela diz "1 de 4 filiais sem meta — não entram na comparação". Elas saem do
denominador, mas continuam no numerador. É a invariante "nulo propaga, nunca vira
zero" violada no número-manchete, e no sentido mais perigoso: **a tela fica mais
verde quanto menos meta existe.**

Hoje não dispara porque o mock tem todas as metas preenchidas. Dispara no primeiro
dado real com filial sem meta — que é a direção declarada do produto.

### M2 — A regra "Ganhas e integradas com ERP" não tem implementação
`regional-model.ts:786` (regra) contra `:540` (código) · VERIFICADO · **dado de origem**

A regra documentada diz: `Ganho = Σ valor das opps Ganhas e integradas com ERP no
mês`. O código filtra `status === 'Ganha'`. Não há filtro de integração, e
`RegionalOpp` (`:17-37`) **não tem campo de integração** para filtrar.

As telas afirmam "já integrado no ERP nesta competência". A afirmação não tem
lastro no dado. Este é o caso que não se corrige com código: precisa de outra
coluna na planilha de origem.

---

## 3. O que está errado na tela

### T1 — A tabela do território ordena por um número que não está nela
`src/features/comercial-v3/regional/territorio-screen.tsx:41` · VERIFICADO · média

O `sort` usa `a.r.pct` (ganho ÷ meta). A única coluna de percentual visível é
`ff.pctBase` (cenário Base). A dica diz "ordenado por quem está mais longe".

Centro-Oeste na tela: DF 59%, MT 80%, GO 77%, MS 86%. Parece desordenado. A ordem
real é por ganho: 24%, 44%, 52%, 60% — nenhum desses números aparece.

### T2 — O chip da rubrica é o total da filial, não a rubrica nem o Base
`src/features/comercial-v3/regional/filial-screen.tsx:62-77` · VERIFICADO · média

A dica diz "o chip é o cenário Base do fluxo". O chip renderiza
`P(bloco.pct)`, onde `bloco` é `resultadoFilial(filial, fluxo)` — o total no fluxo.

Em MRR, "Manutenção" mostra 24% e 24%. Em NRR, "Licença" 38% e "Serviço" 25%, com
o mesmo chip 34% nas duas linhas. O chip não informa nada e a dica descreve outra
coisa. A cor da barra também vem do farol do fluxo, não da rubrica.

### T3 — A "Pior filial do recorte" pode apontar a filial errada
`src/features/comercial-v3/regional/territorios-model.ts:224` · VERIFICADO · média

A frase pega a pior filial do **pior território que está abaixo de 70%**, não a
pior do recorte inteiro. Quando o pior território já passou do alvo, a frase não
sai — mesmo havendo filial em situação crítica dentro dele.

---

## 4. O que sobrevive e não deve ser mexido

- O modelo de fluxo (`regional-model.ts`) está correto nas regras que a entrega
  declara: `razaoDaMeta` propaga nulo, `conversaoExigida` devolve `null` sem Best
  case, tier D fica fora do conjunto em vez de zerado.
- O mapa de calor com uma escala só e cabeçalho de grupo resolve a issue #21. A
  rubrica lê ganho, o fluxo lê Base, e a separação está explicada.
- A documentação de 24 regras bate com o código nos pontos que conferi.
- O build de produção passa e o validador confirma que o pacote não tem backend
  nem referência à fonte comercial.
- A procedência fictícia está declarada nas telas.

---

## 5. O que a entrega deixa órfão

`RegionalScreen` (sete abas) não é importado por ninguém desde a renomeação, e
`'regional'` segue em `COMMERCIAL_VIEWS` (`types.ts:37` e `:90`). O ADR-0006
ainda descreve a view `regional` com sete abas e `REGRAS-E-CALCULOS.md` ainda
lista a escala de cinco faixas que esta entrega substituiu.

**Divirjo do comentário no código** que diz que a tela antiga "continua existindo
para link direto". Ela não tem link: `?view=regional` é traduzido para
`territorios` no parser. É código morto com um defeito dentro (`linhasExec` soma
MRR com NRR em `regional-model.ts:546`) que ninguém vê porque ninguém chega lá.
Manter código inalcançável que viola uma invariante é pior que apagá-lo.

---

## 6. Ordem de menor custo

1. **Corrigir B1** — declarar `branch` no `extra` de `buildCommercialHref` e
   usá-lo. É a menor mudança que destrava a entrega, umas 4 linhas.
2. **Escrever o teste que faltou** — `href` de filial sai com `branch`, e
   `nivelDe` devolve `'filial'`. É o teste que teria pego B1.
3. **Corrigir T1 e T2** — ordenar pelo número exibido; o chip deve mostrar o
   valor que a dica promete. Duas mudanças de uma linha cada.
4. **Corrigir M1** — excluir o ganho de filial sem meta do numerador, igual ao tier
   D. Precisa de teste com uma filial sem meta e as outras com meta.
5. **Apagar `RegionalScreen` e o valor `'regional'`, atualizar o ADR-0006 e a
   escala no doc de regras.** Remove o defeito oculto e alinha a documentação.
6. **Pedir o dado de integração** (M2) antes de qualquer tela afirmar "integrado no
   ERP". Enquanto não existir, a frase sai da tela.

Os itens 1 a 3 são o que separa esta branch de ser revisável. Os itens 4 a 6
podem vir depois, mas o 6 é promessa de interface que hoje não se sustenta.

---

## 7. O que foi corrigido (28/10, depois do parecer)

Autorizado por Bruno: itens 1 a 3 e o teste do href.

### B1 — corrigido
`context.ts:94-110`. O `extra` de `buildCommercialHref` passou a declarar
`branch?: string`, e a serialização virou:

```ts
const filial = extra?.branch ?? context.branch
if (filial && filial !== ALL_FILTERS) params.set('branch', filial)
```

`extra.branch` vence o do contexto, e `ALL_FILTERS` limpa o parâmetro. Isso é o
que permite **subir**: "Todas", a trilha e "Todos · CSO" passam `branch:
ALL_FILTERS` e não herdam mais a filial aberta.

Na tela, os quatro links que mudam o nível foram corrigidos:
`territorios-screen.tsx` (Todos · CSO, cada território, Todas, a trilha) e
`territorio-screen.tsx` (a linha da filial, que já passava `branch` e só passou a
funcionar).

### T1 — corrigido
`territorio-screen.tsx:39-46`. O `sort` passou de `a.r.pct` (ganho) para
`a.f.pctBase` (cenário Base), que é o percentual que a tabela mostra.

### T2 — corrigido
`filial-screen.tsx:62-86`. O chip e a cor da barra passaram a vir de
`resultadoRubrica` — a própria rubrica — em vez do total do fluxo. O percentual
repetido saiu da linha, e a dica diz uma vez qual é o cenário Base do fluxo,
explicando que ele não se abre por rubrica.

### Teste que faltava — `tests/navegacao-href.test.mjs`
Nove testes sobre `buildCommercialHref` e `parseCommercialContext`, cobrindo os
dois sentidos: descer para a filial, trocar de filial, subir para o território,
voltar ao CSO, e o comportamento herdado que não podia quebrar.

**Prova de que o teste pega o defeito:** revertendo `context.ts` para a versão
antiga, 6 dos 9 falham. Com a correção, os 9 passam.

Para importar `context.ts` sob `--experimental-strip-types`, o import de
`./types` virou `./types.ts` — a mesma convenção que `carteira-fila.ts` e
`carteira-arvore.ts` já usam e que o build aceita.

### Verificação
| Item | Resultado |
| --- | --- |
| `npm test` | 351 testes, 351 passam (eram 342; +9) |
| `npx tsc --noEmit` | exit 0 |
| `npm run build:visual` | passa; pacote sem backend e sem fonte comercial |
| Navegador: descer CSO → CO → DF | link carrega `branch=DF`; clique abre a filial |
| Navegador: subir DF → CO | "Todas" sem `branch`; volta ao território |
| Navegador: tabela do território | 68, 88, 93, 102 — crescente pelo exibido |
| Navegador: rubricas em NRR | Licença 38% e Serviço 25%, sem chip repetido |
| Mobile 375×812 | empilha sem overflow; seletores acessíveis |
| Console | sem erro da aplicação (só o HMR do dev server) |

### O que continua em aberto
- **M1** — filial sem meta ainda infla o percentual do território. Não corrigido
  nesta rodada porque a correção certa é uma decisão de produto: excluir o ganho
  do numerador (como o tier D) ou mostrar o percentual como indisponível. Tem
  teste a escrever junto.
- **M2** — o dado de integração com ERP continua não existindo na carga.
- **Seção 5** — `RegionalScreen` e o valor `'regional'` seguem órfãos; o ADR-0006
  e a escala de cinco faixas no doc de regras seguem desatualizados.
