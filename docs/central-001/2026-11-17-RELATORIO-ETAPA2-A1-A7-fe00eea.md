# CENTRAL-001-HOME · etapa 2 — A1 e A7

Data: 17/11/2026 · Branch `central-001/home-giovanne` · SHA **`fe00eea36c8cc787a345ecefec21bf7962a7ad58`** (base `0187047`)
Escopo: somente os achados confirmados **A1** (sinal da tabela) e **A7** (ganhos sem competência), conforme a matriz da etapa 1. Nada de B1–B6.

## RESULTADO

| # | Achado | O que foi feito | Prova |
|---|---|---|---|
| **A1** | A tabela de Segmentos gravava `meta − realizado` e o texto lia `absoluto < 0` como falta — toda linha abaixo da meta lia "acima" | O sinal virou um só: `atingimento()` (fonte única) passou a preencher `LinhaSegmento.percentual` e `.absoluto` como `realizado − meta`; `textoAtingimento` saiu do componente e virou função pura testável em `home-giovanne.ts` | Antes/depois abaixo; teste com abaixo, acima e na meta |
| **A7** | "Ganhos no CRM" somava o arquivo inteiro, sem olhar a competência; "Em aberto" idem | `lerCargaTeste(registros, referenceDate)` lê **só a competência da data de referência**: ganho pela data de fechamento (Efetivação), aberta pela previsão de fechamento. Registro de outro mês, sem data válida ou sem valor **não entra no total** — é contado e declarado na tela. Data de referência inválida não vira mês suposto: cartões em "—" e aviso | UI com CSV de 3 meses; teste unitário |

Antes/depois do A1 (`logs\prova-a1-sinal.log`), com os mesmos números:

```
linha                          | depois (realizado − meta)        | antes (meta − realizado)
Demais Segmentos               | 97% · faltam 1,2 mi              | 97% · 1,2 mi acima
Construção                     | 98% · faltam 446 mil             | 98% · 446 mil acima
Indústria                      | 95% · faltam 770 mil             | 95% · 770 mil acima
Agronegócio                    | 93% · faltam 828 mil             | 93% · 828 mil acima
Todos os segmentos             | 96% · faltam 3,2 mi              | 96% · 3,2 mi acima
```

**"Em aberto": o mesmo defeito se aplicava** — somava toda oportunidade aberta do arquivo, inclusive de novembro. Passou a usar a previsão de fechamento na competência, com a contagem de quem ficou fora.

## ALTERAÇÕES

`fe00eea` · 3 arquivos · **+156 / −33**

| Arquivo | Mudança |
|---|---|
| `src/features/comercial-v3/home-giovanne.ts` | `textoAtingimento` puro e exportado; `paraLinha` usa `atingimento()`; novo `lerCargaTeste` + `ResumoCarga` (+101/−10) |
| `src/features/comercial-v3/components/home-resultado.tsx` | importa `textoAtingimento`; `BlocoCargaTeste` passa a ler `lerCargaTeste` e declara competência e exclusões (+24/−12 líquidos) |
| `tests/home-giovanne.test.mjs` | dois testes: sinal (abaixo/acima/na meta + propriedade sobre a matriz) e competência (meses, datas ausentes/inválidas, valor ausente, perdida, referência inválida) (+52) |

Fora do commit: `next-env.d.ts` preservado (SHA-256 `B8B3A344…`), restaurado depois do build; `master` em `c9c78c9…`; sem remote.

## VERIFICAÇÃO

| Comando | Saída bruta |
|---|---|
| `node --experimental-strip-types --test --test-isolation=none tests/*.test.mjs` | **381/381, 0 falhas** — `logs\tests-etapa2-20261117.log` |
| `npx tsc --noEmit --incremental false` | **exit 0** |
| `npm run build:static` | **exit 0**, 3/3 páginas — `logs\build-etapa2-20261117.log` |
| `node etapa2-a1-a7.mjs` (headless 9223, perfil isolado) | **12/12 PASS** — `logs\etapa2-a1-a7-20261117.log` |

A checagem de tela cobre:

- **A1 sem carga, 1440:** as cinco linhas da tabela leem `faltam` (97%, 98%, 95%, 93%, 96%) e nenhuma lê "acima". A base de planejamento não tem linha acima de 100% — o caso "acima" é provado no teste unitário (`1,03 → 103% · 42000 acima`), não na tela. Captura `13-tabela-sinal.png`.
- **A7 com carga mista** (fixture alterada: 2 ganhas de outubro, 1 de setembro, 1 sem data, 1 de novembro, 1 sem valor, 1 aberta de outubro, 1 aberta de novembro, 1 perdida): `R$ 4 mil · 1 fechadas e ganhas em out/2026`; `R$ 2 mil · 1 abertas com previsão em out/2026`; `8 oportunidades`; `Competência out/2026 … Fora dos totais: 2 com data em outro mês · 2 sem data válida · 1 sem valor`. OS R$ 9.000 de setembro e os R$ 2.500 de novembro não aparecem em lugar nenhum. Captura `14-carga-mistas-competencia.png`.

CSV usado: `dados-teste\oportunidades-mistas-3-meses.csv` (fixture sintética alterada; não entrou no repositório).

## LIMITES E PENDÊNCIAS

- **Arredondamento do cartão (achado novo, fora do A7):** o cartão usa `formatarRealCompacto`, que arredonda milhar — R$ 1.500 aparece como **"R$ 2 mil"**. É comportamento antigo e global do app, não deste delta; os valores somados estão certos (provados no teste unitário). Não mexi para não ampliar escopo. Candidato a B-item.
- **A3 (Export/tabela no erro), A4 (escopo do filtro), A8 (tudo "Teste"), X1 (forecast abre a Home), A9 (sem teste de render):** intactos, como combinado — são decisão ou contrato à parte.
- **Matriz de Territórios:** continua usando `LeituraCorte.diferenca` com a convenção `meta − realizado` (positivo = falta) na tela de Territórios. Não toquei; só a Home foi unificada em `atingimento()`. Não é regressão, mas são duas convenções no repo.
- **Carga com data de referência inválida:** não é alcançável pela interface (o salvar valida), então só o teste unitário cobre.
- Q2, datas divergentes, "Giovanni"/"Giovanne" e B1–B6 seguem com o Bruno.

## STATUS

Commit local `fe00eea` na branch; `master` intocado; sem push, merge, deploy ou publicação. Servidor 3012 e Chrome 9223 encerrados.

## PRÓXIMO PASSO

Verificação independente do `fe00eea` pelo Explorer: sinal na tela e no teste, competência com CSV misto, `tsc`/testes/build.
