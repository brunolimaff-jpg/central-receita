# 01 — Modelo da trajetória a partir da carga

Status: pronto-pra-agente
Bloqueia: 02, 04
Bloqueado por: —

## Objetivo

Módulo puro que transforma a carga importada em pontos de trajetória. Sem JSX,
sem DOM, sem React.

## ⚠️ Duas decisões que a v2 desta spec errava

### Valores estão em REAIS, não em milhões

`parseImportNumber` devolve o número da planilha sem dividir por milhão
(`manual-import.ts:78-94`); `manual-import.test.mjs:86` confirma
`predictedValue: 1000` para a linha `1000`. Quem converte é `formatarRealCompacto`,
na apresentação.

**O modelo trabalha em reais.** Não dividir por 1e6. A tolerância de
reconciliação é **R$ 0,01**, não `0.000001` (que em reais é R$ 0,000001 —
tolerância impossível de satisfazer por arredondamento de planilha).

### "Realizado" usa a definição do card da mesma tela

Existem duas noções concorrentes:

| Módulo | Fonte | Data |
|---|---|---|
| `forecast-month.ts:75-77` | oportunidades ganhas, somando `closedValue` | `closingDate` |
| `new-name-model.ts:409` | pedidos, somando `maintenance` | `conferenceDate` |

O card "Realizado" logo acima da trajetória usa a **primeira**. A trajetória
usa a primeira também, senão os dois números com o mesmo rótulo divergem na
mesma dobra.

## O que construir

`src/features/comercial-v3/trajectory-model.ts`.

```ts
export type TrajectoryPoint = {
  date: string                    // ISO, sempre uma data real
  label: string                   // '05/10'
  forecast: number | null         // reais, acumulado
  realized: number | null         // reais, acumulado
}

export type TrajectorySeries = {
  kind: 'previsto' | 'realizado' | 'restante'
  rotulo: string
  tracejado: boolean
  points: TrajectoryPoint[]
}

export type TrajectoryModel = {
  regime: 'vazio' | 'A' | 'B' | 'C'
  series: TrajectorySeries[]
  ticks: string[]
  previsto: number | null         // reais
  realizado: number | null        // reais
  datado: number | null           // reais com data declarada
  semData: number                 // contagem
}
```

### Assinatura

```ts
export function buildTrajectory(args: {
  opportunities: ImportedRecord[]
  previous: ImportedRecord[] | null
  referenceDate: string
  history: Array<{ at: string; snapshot?: TrajectorySnapshot }>
}): TrajectoryModel
```

### Função de reconciliação

```ts
export function ponteReconcilia(args: {
  totalAnterior: number | null
  totalAtual: number | null
  entrou: number | null
  saiu: number | null
  alterou: number | null
}): boolean
```

Devolve `true` só quando todos os cinco valores são números e
`|(atual − anterior) − (entrou + saiu + alterou)| <= 0.01` (reais).

**Valor nulo contamina.** `sumKnown` em `forecast-month.ts:40` devolve `null` se
qualquer registro tiver valor nulo. Uma linha sem `predictedValue` derruba o
total. A função deve propagar `null` como "não reconcilia" — nunca tratar nulo
como zero.

### Regras

1. **Elegibilidade** vem de `calculateForecastMonth` com `period: 'mês'`. Não
   reimplementar a régua (Proposta/Negociação + prob ≥75% + mês).
2. **Previsto** acumula `predictedValue` por `forecastDate`.
3. **Realizado** acumula `closedValue` por `closingDate` das oportunidades em
   `Fechada e Ganha` — mesma base do card da tela.
4. **`regime`**:
   - `'vazio'` sem oportunidades;
   - `'A'` sem `previous`;
   - `'B'` com `previous` e <2 entradas de `history` com `snapshot`;
   - `'C'` com 2+ entradas.
5. **`semData`** conta elegíveis com data nula. Não vira ponto.
6. Lacuna é `null`, nunca zero.

## Reaproveitar

- `forecast-month.ts` — `calculateForecastMonth`
- `chart-math.ts` — `dateChartPositions`, `lineChartPath`
- `format.ts` — `formatarRealCompacto`

## Testes — `tests/trajectory-model.test.mjs`

Fábrica igual à de `movement-rows.test.mjs`: `const rec = (o = {}) => ({...})`.

| Cenário | Esperado |
|---|---|
| sem carga | `regime: 'vazio'`, `series: []` |
| uma carga, 3 oportunidades em datas distintas | regime A, acumulado crescente |
| uma de três sem `forecastDate` | `semData: 1`, ponto não criado |
| duas cargas | regime B |
| ponte fecha (valores em reais, diferença de R$ 0,00) | `ponteReconcilia` → `true` |
| ponte com diferença de R$ 0,02 | `false` |
| ponte com um componente `null` | `false` — nulo não vira zero |
| três cargas com snapshot | regime C, 3 pontos |

## Critério de aceite

`npm test` passa com os 8 cenários; typecheck limpo; nenhum import de
`mock-data.ts`.
