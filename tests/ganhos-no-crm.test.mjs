import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { calculateForecastMonth } from '../src/features/comercial-v3/forecast-month.ts'
import { buildTrajectory } from '../src/features/comercial-v3/trajectory-model.ts'

/**
 * Issue #2: ganho no CRM deixa de se chamar "realizado" nos textos de interface.
 *
 * O teste trava dois contratos de uma vez:
 * 1. os VALORES do Forecast e da Visão Executiva não mudam com a renomeação;
 * 2. nenhuma superfície de ganho no CRM usa "Realizado" como rótulo.
 *
 * `copy.ts` importa `demo-display` sem extensão e não carrega no Node de teste,
 * por isso o texto é lido como arquivo — mesmo padrão dos demais testes de contrato.
 */

const ler = (caminho) => readFileSync(new URL(caminho, import.meta.url), 'utf8')

const record = (id, values = {}) => ({
  row: id, opportunityId: String(id), orderId: '', accountId: '1', account: `Conta ${id}`,
  stage: 'Negociação', status: '', classification: '', representative: '', executive: '',
  ownerGroup: '', forecastDate: '2026-10-12', closingDate: null, conferenceDate: null,
  predictedValue: 100, closedValue: null, maintenance: null, product: '', module: '', modality: '',
  ...values,
})

// ---------------------------------------------------------------------------
// Valores: idênticos antes e depois da troca de texto
// ---------------------------------------------------------------------------

test('Forecast: ganho no CRM mantém previsto, realizado e em aberto do contrato', () => {
  const current = [
    record(1),
    record(2, { stage: 'Fechada e Ganha', forecastDate: null, closingDate: '2026-10-13', predictedValue: null, closedValue: 250 }),
    record(3, { stage: 'Fechada e Perdida', forecastDate: null, closingDate: '2026-10-14', predictedValue: null, closedValue: 50 }),
    record(4),
  ]
  const result = calculateForecastMonth(current, [record(1), record(5)], '2026-10', '2026-10-14', 'mês')
  assert.equal(result.predicted.count, 2)
  assert.equal(result.predicted.value, 200)
  assert.equal(result.realized.count, 1)
  assert.equal(result.realized.value, 250)
  assert.equal(result.open, 200)
  assert.equal(result.projected, 450)
  assert.equal(result.won.value, 250)
  assert.equal(result.lost.value, 50)
})

test('Visão Executiva: trajetória soma os mesmos ganhos do CRM pela closingDate', () => {
  const rec = (overrides) => ({ ...record(1), row: 1, ...overrides })
  const model = buildTrajectory({
    opportunities: [
      rec({ opportunityId: '1', stage: 'Fechada e Ganha', forecastDate: null, predictedValue: null, closedValue: 4000, closingDate: '2026-10-03' }),
      rec({ opportunityId: '2', stage: 'fechada e ganha', forecastDate: null, predictedValue: null, closedValue: 6000, closingDate: '2026-10-15' }),
      rec({ opportunityId: '3', stage: 'Fechada e Perdida', forecastDate: null, predictedValue: null, closedValue: 9999, closingDate: '2026-10-16' }),
      rec({ opportunityId: '4', stage: 'Proposta', forecastDate: '2026-10-05', predictedValue: 10000, closedValue: null, closingDate: null }),
    ],
    previous: null,
    referenceDate: '2026-10-20',
    history: [],
  })
  assert.equal(model.realizado, 10000)
  assert.equal(model.previsto, 10000)
  assert.deepEqual(
    model.series.find((serie) => serie.kind === 'realizado').points.map((ponto) => ponto.realized),
    [4000, 10000],
  )
})

// ---------------------------------------------------------------------------
// Texto: ganho no CRM deixa de ser "Realizado"
// ---------------------------------------------------------------------------

test('copy de KPI e da narrativa chamam o ganho de "Ganhos no CRM"', () => {
  const copy = ler('../src/features/comercial-v3/copy.ts')
  assert.match(copy, /realizado: 'Ganhos no CRM'/)
  assert.match(copy, /realizado: 'Ganhos no CRM do recorte:/)
  assert.match(copy, /ganhos no CRM do recorte soma/)
  assert.match(copy, /'Ganhos no CRM e forecast atual são conjuntos distintos/)
  assert.match(copy, /filiaisSubtitulo: 'Ganhos no CRM, meta e forecast atual\.'/)
  assert.match(copy, /meta, ganhos no CRM, forecast atual e as oportunidades/)
})

test('superfícies de ganho no CRM não exibem o rótulo "Realizado"', () => {
  // Arquivo → motivo da classificação (ganho no CRM).
  const superficies = {
    '../src/features/comercial-v3/components/branch-rail.tsx': 'rail de filiais sobre as negociações fechadas',
    '../src/features/comercial-v3/components/branch-tiles.tsx': 'tiles de filial sobre as negociações fechadas',
    '../src/features/comercial-v3/components/branch-summary.tsx': 'resumo da filial sobre as negociações fechadas',
    '../src/features/comercial-v3/components/home-origin-summary.tsx': 'origem New Name/Cross sobre as negociações fechadas',
    '../src/features/comercial-v3/components/month-evolution-chart.tsx': 'série do mês sobre as negociações fechadas',
    '../src/features/comercial-v3/components/month-highlights.tsx': 'destaques do mês sobre as negociações fechadas',
    '../src/features/comercial-v3/components/origin-mix.tsx': 'participação New Name/Cross sobre as negociações fechadas',
    '../src/features/comercial-v3/components/agent-briefing.tsx': 'briefing do agente sobre as negociações fechadas',
    '../src/features/comercial-v3/components/kpi-strip.tsx': 'faixa de KPIs da Home',
    '../src/features/comercial-v3/components/trajectory-chart.tsx': 'legenda e rodapé da trajetória',
    '../src/features/comercial-v3/agent.ts': 'respostas do agente sobre as negociações fechadas',
    '../src/features/comercial-v3/screens/agent-screen.tsx': 'lista de filiais do agente sobre as negociações fechadas',
    '../src/features/comercial-v3/screens/system-screen.tsx': 'inventário do snapshot sobre as negociações fechadas',
    '../src/features/comercial-v3/screens/executive-page.tsx': 'Visão Executiva',
    '../src/features/comercial-v3/screens/import-forecast-screen.tsx': 'seção Forecast da página corrida',
  }
  // Nomes internos (`OrigemRealizado`, `realizado`) podem ficar; o que não pode
  // é o rótulo de tela. "Realizado de vendas" é o marco final e é permitido.
  for (const [caminho, motivo] of Object.entries(superficies)) {
    const texto = ler(caminho).replace(/Realizado de vendas/g, '')
    assert.doesNotMatch(texto, /['"`>]Realizado\b/, `${caminho} ainda chama de Realizado o que é ${motivo}`)
  }
  assert.match(ler('../src/features/comercial-v3/trajectory-model.ts'), /rotulo: 'Ganhos no CRM'/)
})

test('pedido conferido continua com o vocabulário de pedido, não vira ganho', () => {
  const newName = ler('../src/features/comercial-v3/components/new-name-section.tsx')
  assert.match(newName, /Realizado conferido/)
  assert.doesNotMatch(newName, /Ganhos no CRM/)
})

test('REGRAS-NEGOCIO alinha os três marcos ao ADR-0001', () => {
  const regras = ler('../docs/REGRAS-NEGOCIO.md')
  assert.match(regras, /Ganhos no CRM/)
  assert.match(regras, /Fila de pedidos/)
  assert.match(regras, /Realizado de vendas/)
  assert.doesNotMatch(regras, /Realizado no Forecast/)
})
