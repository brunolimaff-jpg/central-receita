# CENTRAL-001-HOME · ajuste focal no bloco da carga

Data: 17/11/2026 · Branch `central-001/home-giovanne` · SHA **`c954f94e1ba68f72cb6c3acfee027b47696b0b95`** (base `fe00eea`)
Escopo autorizado: exibir o valor com precisão adequada e corrigir a concordância singular/plural **no bloco de carga**. Sem tocar no formatador global nem nas regras de dados.

## RESULTADO

| Ponto | Antes | Agora |
|---|---|---|
| Valor pequeno | R$ 1.500 → **"R$ 2 mil"** (33% de distorção) | **"R$ 1.500"**; R$ 9.999 → "R$ 9.999"; a partir de R$ 10 mil segue compacto ("R$ 10 mil", "R$ 26 mil") |
| Concordância | "1 fechadas e ganhas", "1 abertas com previsão" | "1 fechada e ganha", "1 aberta com previsão"; plural correto em 2+ |

Como: `formatarRealPreciso` em `format.ts` — usada **só** pelo bloco da carga, com a mesma regra que `formatarSaldo` já documenta (abaixo de R$ 10 mil, reais exatos) e sem sinal; e `pluralizar(qtd, singular, plural)` em `home-giovanne.ts`. `formatarRealCompacto` e `formatarSaldo` não foram alterados.

## ALTERAÇÕES

`c954f94` · 5 arquivos · **+48 / −4**

| Arquivo | Mudança |
|---|---|
| `src/features/comercial-v3/format.ts` | `formatarRealPreciso` (aditiva, +17) |
| `src/features/comercial-v3/home-giovanne.ts` | `pluralizar` (+5) |
| `src/features/comercial-v3/components/home-resultado.tsx` | os dois cartões usam as duas funções (+4/−3) |
| `tests/format.test.mjs` | 9 casos do valor preciso, incluindo 999, 9.999, 10.000, 12.500, negativo e milhão (+13/−1) |
| `tests/home-giovanne.test.mjs` | singular/plural com 0, 1, 2, 3 (+9) |

Fora do commit: `next-env.d.ts` preservado (`B8B3A344…`), restaurado depois do build; `master` em `c9c78c9…`.

## VERIFICAÇÃO

| Comando | Saída bruta |
|---|---|
| `node --experimental-strip-types --test --test-isolation=none tests/*.test.mjs` | **383/383, 0 falhas** (381 + 2) — `logs\tests-etapa3-20261117.log` |
| `npx tsc --noEmit --incremental false` | **exit 0** |
| `npm run build:static` | **exit 0**, 3/3 páginas — `logs\build-etapa3-20261117.log` |
| `node etapa3-carga-precisao.mjs` (headless 9223, perfil isolado) | **12/12 PASS** — `logs\etapa3-carga-precisao-20261117.log` |

Dois imports pela tela de Configurações, com CSV próprio (`dados-teste\oportunidades-precisao-singular.csv` e `-plural.csv`):

| Carga | Bloco na tela |
|---|---|
| 1 ganha de R$ 1.500 + 1 aberta de R$ 9.999 | `R$ 1.500 · 1 fechada e ganha em out/2026` · `R$ 9.999 · 1 aberta com previsão em out/2026` · `2 oportunidades` |
| ganhos 9.000+1.000 + abertas 25.000+1.000 | `R$ 10 mil · 2 fechadas e ganhas em out/2026` · `R$ 26 mil · 2 abertas com previsão em out/2026` · `4 oportunidades` |

Regressão de A7 na mesma tela: "Competência out/2026 … Nenhum registro ficou fora da competência" e nenhum valor de outro mês entrou. A1 visível na captura: "97% · faltam R$ 1,2 mi". Capturas `15-carga-precisao-singular.png` e `16-carga-precisao-plural.png`.

## LIMITES

- O limiar de R$ 10 mil é o mesmo de `formatarSaldo`; acima dele o compacto arredonda para o milhar (12.500 → "R$ 13 mil"), por decisão de formato já existente no app.
- Data de referência inválida continua coberta só pelo teste unitário (o formulário recusa salvar).
- Nada além do bloco da carga foi tocado: A1 e A7 permanecem como no `fe00eea`.

## STATUS

Commit local `c954f94`; `master` intocado; sem push, merge, deploy ou publicação. Servidor 3012 e Chrome 9223 encerrados.

## PRÓXIMO PASSO

Verificação independente do `c954f94` pelo Explorer: valores na casa de R$ 10 mil, singular/plural e regressão de A1/A7.

## ADENDO — correção do comentário (`f2a80f8`)

O Explorer apontou, com razão, que o comentário de `formatarRealPreciso` dizia "a partir de R$ 10 mil o compacto erra menos de 0,5%": logo acima do limiar o erro chega a **4,76%** (10.500 → "R$ 11 mil"). Autorizado pelo Chief, corrigi **só o comentário** em `f2a80f828bdc14707da605b0200bb1da35dc03d3`.

Prova de que nada além do comentário mudou:

| Checagem | Resultado |
|---|---|
| `git diff --name-only c954f94..f2a80f8` | só `src/features/comercial-v3/format.ts` |
| `git diff c954f94..f2a80f8 -- . ':(exclude)…/format.ts'` | vazio — todos os outros arquivos byte a byte idênticos |
| linhas alteradas no arquivo | 2 removidas e 3 adicionadas, **todas** começando com ` *` (dentro do jsdoc) — nenhuma linha de código |
| `node` no formatador | `1234 → R$ 1.234`, `9999 → R$ 9.999`, `10000 → R$ 10 mil`, `10500 → R$ 11 mil`, `12500 → R$ 13 mil`, `99500 → R$ 100 mil`, `null → —` — idênticos ao medido no `c954f94` |
| testes | **383/383, 0 falhas** no `f2a80f8` (`logs\tests-f2a80f8.log`) |

O texto novo descreve o pior caso com precisão: ~5% logo acima de R$ 10 mil (4,76% em 10.500), 0,5% em R$ 100 mil. Comportamento, testes e telas do `c954f94` continuam valendo; `next-env.d.ts` preservado e `master` em `c9c78c9`.
