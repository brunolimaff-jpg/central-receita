# Verificação independente — etapa 2 (A1 e A7) · SHA `fe00eea`

Data: 17/11/2026 · Verificador: Explorer (somente leitura no app)
Branch `central-001/home-giovanne` · HEAD `fe00eea36c8cc787a345ecefec21bf7962a7ad58`
Base `01870470ff26a3730c0f66b1c62767caf5330f1f` · `master` em `c9c78c91…` (intocado)
Cópia: `.scratch\CENTRAL-001-paineis\app`

## RESULTADO

**PASS COM RESSALVAS.** A1 e A7 estão corrigidos e comprovados na fonte e na tela, inclusive com carga de meses misturados importada pela tela. As ressalvas são de exibição, não de regra.

| Item | Verdicto | Prova |
|---|---|---|
| A1 — sinal do atingimento | PASS | Tabela lê "faltam" nas 5 linhas abaixo da meta; "acima"/"na meta" cobertos por teste e por chamada direta |
| A7 — competência da carga | PASS | CSV meu com 3 meses: só outubro entra nos cartões; 3 fora, 2 sem data, 1 sem valor, declarados |
| A7 — "Em aberto" | PASS | Filtra por previsão; novembro ficou fora |
| A7 — data de referência inválida | PASS (unitário) | `mes: null`, cartões zerados, nenhum mês suposto |
| Gates | PASS | 381/381 testes, `tsc` 0, build 0 (3/3) |

## DIFF

3 arquivos · **+156/−33**

- `home-giovanne.ts`: `textoAtingimento` movido para o módulo puro; `linhasSegmento` passa a usar `atingimento()` (fonte única do sinal); `lerCargaTeste()` nova, com `mes`, `ganhos`, `emAberto`, `foraDoMes`, `semData`, `semValor`, `total`.
- `home-resultado.tsx`: bloco da carga usa `lerCargaTeste`; cartões mostram "—" quando a referência é inválida; linha de rodapé declara competência e exclusões.
- `tests/home-giovanne.test.mjs`: +52 linhas, dois testes (sinal e competência).

Nenhum outro arquivo tocado. `next-env.d.ts` segue fora do commit, com hash `B8B3A344…`.

## EVIDÊNCIA — GATES (rodados por mim)

| Comando | Imprimiu |
|---|---|
| `npm test` | `tests 381 · pass 381 · fail 0`, exit 0 |
| `npx tsc --noEmit` | exit 0 |
| `npm run build:static` | `Generating static pages (3/3)`, exit 0 |

## EVIDÊNCIA — LÓGICA (meus próprios registros, fora dos testes do Builder)

Rodei `lerCargaTeste` com 11 registros meus (valores diferentes dos do teste dele):

| Caso | Resultado |
|---|---|
| ganho em out, ganho em set, ganho em nov, ganho sem data, ganho com data inválida (`2026-02-30`), ganho sem valor, ganho com valor 0 | `ganhos 1234 · quantidade 2` (o zero conta como valor conhecido) |
| aberta em out, aberta em dez, aberta sem data, aberta sem valor | `emAberto 4321 · quantidade 1` |
| perdida em out | não entra em cartão nenhum |
| totais | `foraDoMes 3 · semData 2 · semValor 2 · total 11` |
| referência `22/10/2026` e `null` | `mes: null`, cartões zerados, `total 11` preservado |

Também chamei `textoAtingimento` direto: `92% · faltam 106000`, `103% · 42000 acima`, `100% · na meta`, `sem meta`.

## EVIDÊNCIA — TELA (meu Chrome headless, servidor 3013)

Capturas em `capturas-explorer\`: `70-etapa2-A1-tabela-faltam.png` e `72-etapa2-A7-carga-mista.png`.

- **A1:** "Demais Segmentos 97% · faltam R$ 1,2 mi", "Construção 98% · faltam R$ 446 mil", "Indústria 95% · faltam R$ 770 mil", "Agronegócio 93% · faltam R$ 828 mil", "Todos os segmentos 96% · faltam R$ 3,2 mi". Zero "acima".
- **A7:** importei pela tela de Configurações um CSV meu (9 linhas, 3 competências) com referência 22/10/2026. O bloco mostrou: `R$ 4 mil · 1 fechadas e ganhas em out/2026`, `R$ 2 mil · 1 abertas com previsão em out/2026`, `9 oportunidades`, `9 contas`, e `Competência out/2026 (data de referência da carga). Fora dos totais: 3 com data em outro mês · 2 sem data válida · 1 sem valor.`
- Setembro (R$ 9.000) e novembro (R$ 2.500, ganho e aberto) **não** entraram. A perdida de outubro também ficou fora.
- Selo `Teste · out/2026 · carga de 22/10/2026`, bloco Demo fora, lateral "Dados carregados · Carga de 22/10/2026".

Nota de método: o input de arquivo nativo não pôde ser dirigido pelo CDP neste ambiente (o `setFileInputFiles` não persistiu e o drop sintético não chegou ao React). Entreguei o arquivo ao handler `onSoltar` do próprio componente, o que percorre o mesmo caminho do usuário: validação de extensão/tamanho, leitura pelo importador, cartão de conferência e `Salvar prévia local`. O formulário acusou um erro real do meu primeiro CSV (`Pedido` vazio na linha 9) e só liberou o botão depois que corrigi — o caminho de validação está funcionando.

## RESSALVAS (não bloqueiam A1/A7)

1. **Arredondamento na exibição.** O cartão "Em aberto" soma **R$ 1.500** e mostra **"R$ 2 mil"**, porque `formatarRealCompacto` usa `maximumFractionDigits: 0` no milhar (`format.ts`). O Builder já declarou o achado e não corrigiu; é pré-existente, mas está no bloco que acabou de mudar e distorce 33% num valor dessa ordem. **Decisão do Bruno:** corrigir o formatador (ex.: manter 1 decimal abaixo de 10 mil) ou aceitar.
2. **Concordância.** "1 fechadas e ganhas" e "1 abertas com previsão" — plural fixo na nota nova.
3. **"Acima" e "na meta" não aparecem na tela** porque todas as linhas do mock estão abaixo da meta; a cobertura é por teste unitário e chamada direta, não por linha renderizada.
4. **Data de referência inválida** foi provada no unitário; a tela não foi exercitada nesse estado (o formulário não deixa salvar data inválida).

## LIMITES

- Não validei a importação com arquivo real; usei CSV sintético meu.
- O estado com carga real (XLSX do CRM) não foi exercitado.
- A3, A4, A8, A9, X1 e as decisões Q2/persona continuam intocados, como o Builder declarou.
- Nada foi commitado por mim; `HEAD` segue `fe00eea`, árvore só com `next-env.d.ts`.

## PRÓXIMO PASSO

Se o Bruno aceitar as ressalvas, a etapa 2 fecha para A1/A7. A ressalva 1 é a única que muda número na tela; a 2 é ajuste de uma linha de texto.
