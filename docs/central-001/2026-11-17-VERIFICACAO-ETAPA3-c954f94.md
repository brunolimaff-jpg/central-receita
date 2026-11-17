# Verificação independente — ajuste focal da carga · SHA `c954f94`

Data: 17/11/2026 · Verificador: Explorer (somente leitura no app)
Branch `central-001/home-giovanne` · HEAD `c954f94e1ba68f72cb6c3acfee027b47696b0b95`
Base `fe00eea36c8cc787a345ecefec21bf7962a7ad58` · `master` em `c9c78c91…` (intocado)
Cópia: `.scratch\CENTRAL-001-paineis\app`

## RESULTADO

**PASS.** As duas ressalvas do `fe00eea` estão fechadas: valor exato abaixo de R$ 10 mil, compacto a partir de R$ 10 mil, singular/plural corretos. A1 e A7 seguem íntegros. Nenhuma regressão encontrada.

| Ponto | Verdicto | Prova |
|---|---|---|
| Valor abaixo de R$ 10 mil sem arredondar milhar | PASS | `R$ 1.234`, `R$ 1.500`, `R$ 9.999` exatos (unitário e tela) |
| Limite de R$ 10 mil | PASS | `10.000 → "R$ 10 mil"` exato; `25.000 → "R$ 25 mil"` |
| Singular/plural | PASS | `1 fechada e ganha` / `2 fechadas e ganhas`; `1 aberta` / `2 abertas`; `0 abertas` |
| A1 (sinal) | PASS | tabela segue com `97% · faltam R$ 1,2 mi` nas 5 linhas |
| A7 (competência) | PASS | setembro fora e declarado; demais contagens intactas |
| Gates | PASS | 383/383 testes, `tsc` 0, build 0 (3/3) |

## DIFF — 5 arquivos · +48/−4

- `format.ts` (+17): `formatarRealPreciso` aditiva. **Nenhuma linha removida do arquivo** — `formatarRealCompacto` e `formatarSaldo` intactos (confirmado no diff).
- `home-giovanne.ts` (+5): `pluralizar(quantidade, singular, plural)`, pura.
- `home-resultado.tsx` (+7/−3): os dois cartões do bloco de carga passam a usar as duas funções.
- `tests/format.test.mjs` (+14/−1) e `tests/home-giovanne.test.mjs` (+9): 2 testes novos.

`next-env.d.ts` segue fora do commit, hash `B8B3A344…`; `master` em `c9c78c9`.

## EVIDÊNCIA — GATES (rodados por mim)

| Comando | Imprimiu |
|---|---|
| `npm test` | `tests 383 · pass 383 · fail 0`, exit 0 |
| `npx tsc --noEmit` | exit 0 |
| `npm run build:static` | 3/3 páginas, exit 0 |

## EVIDÊNCIA — TELA (meus três CSVs, importados pela Configurações, referência 22/10/2026)

Capturas `73`, `74` e `75` em `capturas-explorer\`. Resultado: **20/20 PASS**.

| Caso | Carga | Bloco mostrou |
|---|---|---|
| A | 1 ganho R$ 1.234 + 1 aberta R$ 9.999 | `R$ 1.234 · 1 fechada e ganha em out/2026`; `R$ 9.999 · 1 aberta com previsão em out/2026`; "Nenhum registro ficou fora da competência." |
| B | 2 ganhos de R$ 5.000 (total 10.000) + 2 abertas (12.000 + 13.000) + 1 ganho de setembro | `R$ 10 mil · 2 fechadas e ganhas`; `R$ 25 mil · 2 abertas com previsão`; `Fora dos totais: 1 com data em outro mês` |
| C | 1 ganho de R$ 0 | `R$ 0 · 1 fechada e ganha`; `R$ 0 · 0 abertas com previsão` |

Nos três, selo `Teste · out/2026 · carga de 22/10/2026`, bloco Demo fora, lateral "Dados carregados", e a tabela de Segmentos continuou em "faltam".

## OBSERVAÇÃO (não bloqueia)

- **Acima de R$ 10 mil o arredondamento continua**, por desenho e dentro do escopo autorizado: `10.500 → "R$ 11 mil"` (4,8% acima), `12.500 → "R$ 13 mil"`. O comentário novo diz que, a partir de R$ 10 mil, "o compacto erra menos de 0,5%" — isso **não** vale para valores logo acima do limite; só passa a valer perto de R$ 100 mil. A frase merece ajuste numa próxima passada; o comportamento é o mesmo de `formatarSaldo` e não foi pedido mudar.
- Os três primeiros dígitos do milhar continuam arredondando para o inteiro de mil: não há ressalva para valores com centavos (os totais são inteiros).

## LIMITES

- Importei CSVs sintéticos meus; não usei export real do CRM.
- Como nas rodadas anteriores, o input de arquivo nativo não pôde ser dirigido pelo CDP; entreguei o arquivo ao handler do componente, então validação, leitura, conferência e "Salvar prévia local" rodaram de verdade.
- Não reexecutei a matriz A1–A9/X1–X5 inteira: verifiquei A1 e A7, como o contrato da etapa pede.
- Nada foi commitado por mim; servidor 3013 e Chrome 9224 encerrados.

## PRÓXIMO PASSO

Se o Bruno aceitar, A1 e A7 estão fechados neste SHA e a etapa 3 pode ser encerrada com as pendências antigas registradas (A2, A3, A4, A5/persona, A6/Q2, A8, A9, X1 e o comentário acima).
