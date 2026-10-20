# 02 — Componente de trajetória

Status: pronto-pra-agente
Bloqueia: 04, 05
Bloqueado por: 01

## Objetivo

Desenhar a trajetória real no lugar do gráfico demonstrativo. Motion contido:
um traço único, 420ms, curva. Sem coreografia de entrada.

## ⚠️ `weekly-forecast-scene.tsx` não pode ser só apagado

A v2 mandava remover o arquivo. Ele exporta **duas** coisas, e uma delas é usada
por outro gráfico:

```tsx
// weekly-forecast-scene.tsx:17
export function suavizar(pontos: Array<[number, number]>): string

// month-evolution-chart.tsx:3 e :153, :159
import { suavizar } from './weekly-forecast-scene'
```

**Fazer:** mover `suavizar` para `chart-math.ts` (onde vivem `lineChartPath`,
`stepChartPath`, `nearestChartPoint`), ajustar o import em
`month-evolution-chart.tsx`, e só então remover `weekly-forecast-scene.tsx`.
Caso contrário o build quebra em `month-evolution-chart`.

O arquivo só tem dois consumidores: `agent-hero.tsx` (que sai) e
`month-evolution-chart.tsx` (que fica, pelo `suavizar`).

## O que construir

Novo `src/features/comercial-v3/components/trajectory-chart.tsx`.
`agent-hero.tsx` vira casca mínima (título, selo de cargas, legenda direta).
`weekly-forecast-scene.tsx` é removido junto com o import de `weeklyForecast`.

### Layout

Largura total do conteúdo. Sem coluna lateral de métricas — ela quebrava a curva
em três blocos. Os totais vão para uma linha de rodapé.

```
<section class="revenue-panel">
  <header>  título · legenda direta nos traços · selo de regime
  <svg>     a curva
  <footer>  totais + contagem de registros sem data
</section>
```

### Ordem de desenho

1. grade horizontal tracejada (`--hairline`, 3/5)
2. área sob o previsto (gradiente 28% → 1,5%)
3. traço do realizado (`--verde-escuro`)
4. traço do previsto (`--verde-institucional`)
5. traço "restante" (`--ink-subtle`, tracejado) — só se > 0
6. pontos
7. rótulos diretos (estáticos desde o primeiro quadro)

### Movimento

```tsx
const DESENHO = { duration: 0.42, ease: [0.2, 0, 0, 1] }
```

- A linha principal usa `motion.path` com `pathLength` 0→1 em 420ms.
- Área e pontos aparecem junto com o traço — sem stagger, sem cascata, sem
  delay encadeado.
- Rótulos não animam.
- A guia de inspeção usa `useSpring({ stiffness: 400, damping: 40 })` porque
  segue o ponteiro; é o único lugar com mola.

**Não fazer:** cascata de 5 etapas, mola em `scaleY`, delay de 0,85s nos
rótulos. Isso é coreografia de landing page e a disciplina de animação
classifica como defeito em ferramenta.

### Inspeção

Preservar o teclado que já existe em `weekly-forecast-scene.tsx:73-88`
(← → Enter Escape), incluindo `aria-pressed` e `aria-live`.

### Anti-sobreposição

- Dois rótulos a menos de 12px: o menor cede e aparece só no hover.
- Cartão de leitura no lado oposto à borda mais próxima.
- Nenhum rótulo sai da área do gráfico (`clamp`).

## Critério de aceite

- Nenhuma referência a `weeklyForecast` em código de produção.
- Com `prefers-reduced-motion: reduce`, a curva aparece pronta; só o hover anima.
- Em 1366, 1440 e 1920px, nenhum rótulo se sobrepõe ou é cortado.
- Teclado percorre todos os pontos; leitor de tela anuncia o valor.
