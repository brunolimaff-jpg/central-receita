# 05 — Ponte entre cargas

Status: ready-for-agent
Bloqueia: —
Bloqueado por: 01, 02

## Objetivo

Com duas cargas, mostrar a decomposição do movimento entre elas como degraus,
não como curva. É o que responde "o mês melhorou ou piorou, e por quê".

## O que construir

Dentro de `trajectory-chart.tsx`, um bloco condicional ao `regime === 'B'`.

### Estrutura de degraus

```
previsto anterior ─┬─ + Entrou   ▇▇▇▇
                   ├─ − Saiu     ▇▇
                   ├─ ± Alterou  ▇
                   └─ = previsto atual
```

Cada lance com rótulo direto e valor. A cor segue a semântica que já existe em
`top-opportunities-table.tsx`:

| Movimento | Cor |
|---|---|
| Entrou | `--dado-positivo` |
| Saiu | `--dado-negativo` |
| Alterou valor | `--dado-info` |

### Reconciliação

⚠️ **Corrigido na revisão 3.** A v2 dizia tolerância `0.000001` "em milhões".
Os valores estão em **reais** (`parseImportNumber` não divide por milhão;
`manual-import.test.mjs:86` confirma `1000`). A tolerância correta é **R$ 0,01**:

```
|(atual − anterior) − (entrou + saiu + alterou)| <= 0.01
```

Usar `0.000001` em reais equivale a R$ 0,000001 — nenhum arredondamento de
planilha satisfaz isso, e a ponte nunca publicaria.

A função `ponteReconcilia` do ticket 01 já implementa essa regra. **Não
reimplementar** aqui.

### Valor nulo

`sumKnown` (`forecast-month.ts:40`) devolve `null` quando **qualquer** registro
tem valor nulo. Se algum dos cinco valores da ponte for `null`, a função
devolve `false` — nulo nunca vira zero. O aviso de qualidade é o mesmo.

Se não fechar: o bloco mostra os dois totais isolados e um aviso:

> "Os movimentos não fecham com a diferença entre as cargas. O total de cada
> carga continua correto; a decomposição fica oculta até a próxima importação."

Sem números de movimento no aviso — não publicar componentes que não reconciliam.

### Movimento de entrada

Os degraus crescem da esquerda para a direita em cascata, cada um com
`SPRING_SUAVE` e `staggerChildren: 0.08`. O total final entra por último com
`opacity` + `scale` 0.97→1.

## Reaproveitar

- `src/features/comercial-v3/movement-rows.ts` — classificação dos quatro grupos
- `src/features/comercial-v3/forecast-month.ts` — totais anterior e atual
- `src/features/comercial-v3/format.ts` — `formatarComSinal`

## Testes

| Cenário | Esperado |
|---|---|
| deltas consistentes | ponte publicada, soma fecha |
| delta forjado | aviso, sem lances |
| uma carga | bloco não renderiza |
| movimento zero | lance omitido, total ainda aparece |

## Critério de aceite

- A ponte aparece só com `regime === 'B'` ou `'C'`.
- Nenhum valor de movimento é exibido quando a conta não fecha.
- Com movimento reduzido, os degraus aparecem prontos.
