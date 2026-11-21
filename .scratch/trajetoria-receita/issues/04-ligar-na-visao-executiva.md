# 04 — Trajetória no corpo da Visão Executiva

Status: ready-for-agent
Bloqueia: —
Bloqueado por: 01, 02

## Objetivo

A seção hoje é a última da página e some quando não há carga. Ela passa a ser
renderizada **logo depois do movimento do forecast**, aparece sempre, e perde o
selo "Demonstrativo".

## O que mudar

`src/features/comercial-v3/screens/executive-page.tsx`.

### Posição

A seção sai do fim (depois de Oportunidades) e entra **entre o bloco de
movimento do forecast e os detalhes que vêm abaixo**. Ordem final da página:

1. saudação e indicadores
2. movimento do forecast
3. **Trajetória da Receita** ← nova posição
4. Forecast (detalhe)
5. New Name
6. Oportunidades

### Renderização

Passa a ser incondicional — inclusive sem carga:

```tsx
<PanelSection id="trajectory" titulo="Trajetória da Receita"
  contexto={contextoTrajetoria(model)}
  acao={model.regime === 'vazio' ? undefined : <SeloRegime regime={model.regime} />}>
  <TrajectoryChart model={model} />
</PanelSection>
```

Hoje a seção desaparece sem carga. O diretor não sabe que ela existe — e é
justamente a peça que vai querer quando houver dado.

### Contexto por regime

| Regime | Subtítulo |
|---|---|
| vazio | "Importe a planilha de oportunidades para acompanhar o mês." |
| A | "Acumulado do mês pela data de fechamento e de conferência." |
| B | "Comparado à carga de {data da anterior}." |
| C | "Evolução em {n} cargas, de {primeira} a {última}." |

### Selo

Substitui "Demonstrativo":

| Regime | Selo |
|---|---|
| A | "1 carga" |
| B | "2 cargas" |
| C | "{n} cargas" |
| vazio | nenhum |

Tom `tone-marca` para A e B, `tone-info` para C (mais cargas = leitura mais
madura).

### Remover

- Props `demoWeeks`, `demoWeek`, `demoKpis`, `demoAsOf` de `ExecutivePage` e do
  call site em `commercial-v3-app.tsx:275`.
- Import de `AgentHero` neste caminho.
- `weeklyForecast` e `weeklyTargetPace` de `mock-data.ts`.

### ⚠️ NÃO remover `semanasDe()` nem `HomeModel.semanas`

A v2 dizia "verificar antes de remover". A verificação mostra **quatro
consumidores ativos**:

| Arquivo | Uso |
|---|---|
| `month-evolution-chart.tsx:38,49` | desenha `s.ritmo` |
| `opportunities-forecast-chart.tsx:11` | recebe `semanas` |
| `agent-briefing.tsx:88,110` e `agent.ts:172` | `briefing.semanas` |
| `home-screen.tsx:38` | `model.semanas.length` |

Remover `semanasDe()` ou os campos de `HomeModel` quebra essas quatro telas.
**Eles ficam.** Só a prop `demoWeeks` da `ExecutivePage` sai.

## Critério de aceite

- A seção aparece sem carga, com o convite.
- A palavra "Demonstrativo" não aparece na trajetória quando há carga.
- A seção fica acima do detalhe de Forecast na ordem do DOM.
- Nenhum dado de `mock-data.ts` alimenta a seção.
- Typecheck e testes limpos.
