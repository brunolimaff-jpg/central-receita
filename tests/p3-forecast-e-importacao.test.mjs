import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { calculateForecastMonth } from '../src/features/comercial-v3/forecast-month.ts'
import { fonteCarregada } from '../src/features/comercial-v3/manual-import.ts'

/**
 * Issue #18 — os dois P3 registrados no comentário da #16 depois que ela
 * fechou no merge da PR #17.
 *
 * P3-a: o rodapé do critério no Forecast lia `monthResult.period`, calculado
 * sempre no mês, e anunciava 01–31/10 mesmo com cartões recortados na semana.
 * P3-b: "O que já está carregado" lia `workspace`, que inclui a leitura
 * recém-feita — um arquivo com erros, nunca salvo, aparecia como carregado.
 */

const ler = (caminho) => readFileSync(new URL(caminho, import.meta.url), 'utf8')
const forecast = () => ler('../src/features/comercial-v3/screens/import-forecast-screen.tsx')
const importScreen = () => ler('../src/features/comercial-v3/screens/import-screen.tsx')

const rec = (overrides = {}) => ({
  row: 1, opportunityId: 'OP-1', orderId: '', accountId: 'C-1', account: 'Conta 1',
  stage: 'Proposta', status: '', classification: '', representative: 'Filial Sul', executive: 'Ana',
  ownerGroup: '', forecastDate: '2026-10-22', closingDate: null, conferenceDate: null,
  predictedValue: 1000, closedValue: null, maintenance: null, product: '', module: '', modality: '',
  probability: 0.9,
  ...overrides,
})

const batch = (overrides = {}) => ({
  kind: 'opportunities', records: [], issues: [], errorCount: 0, warningCount: 0,
  stats: { records: 0, opportunities: 0, orders: 0, accounts: 0, integratedOrders: 0, sourceNewOrders: 0 },
  ...overrides,
})

// ---------------------------------------------------------------------------
// P3-a — o rodapé segue a janela selecionada
// ---------------------------------------------------------------------------

test('P3-a: Semana mostra 19–25/10 e Mês mostra 01–31/10 — a janela que o rodapé deve anunciar', () => {
  const atual = [rec()]
  const semana = calculateForecastMonth(atual, null, '2026-10', '2026-10-22', 'semana')
  const mes = calculateForecastMonth(atual, null, '2026-10', '2026-10-22', 'mês')
  assert.deepEqual(semana.period, { start: '2026-10-19', end: '2026-10-25' })
  assert.deepEqual(mes.period, { start: '2026-10-01', end: '2026-10-31' })
})

test('P3-a: o rodapé de import-forecast-screen lê result.period, não monthResult.period', () => {
  const texto = forecast()
  const rodape = texto.match(/\{' '\}Previsão de \{[^}]+\} a \{[^}]+\}\./)
  assert.ok(rodape, 'o rodapé do critério continua na tela')
  assert.match(rodape[0], /dataCurta\(result\.period\.start\)/)
  assert.match(rodape[0], /dataCurta\(result\.period\.end\)/)
  assert.doesNotMatch(rodape[0], /monthResult\.period/)
})

// ---------------------------------------------------------------------------
// P3-b — "O que já está carregado" fala só do que foi salvo
// ---------------------------------------------------------------------------

test('P3-b: sem carga salva, a fonte não aparece como carregada', () => {
  assert.equal(fonteCarregada(null), null)
})

test('P3-b: carga salva expõe nome, referência e horário do retrato', () => {
  const salvo = batch({ filename: 'vendas.csv', referenceDate: '2026-10-22', savedAt: '2026-10-22T13:05:00.000Z' })
  assert.deepEqual(fonteCarregada(salvo), {
    filename: 'vendas.csv',
    referenceDate: '2026-10-22',
    quando: '2026-10-22T13:05:00.000Z',
  })
})

test('P3-b: horário inválido não vira data inventada', () => {
  const salvo = batch({ filename: 'vendas.csv', referenceDate: '2026-10-22', savedAt: 'ontem à tarde' })
  assert.equal(fonteCarregada(salvo).quando, null)
})

test('P3-b: sem savedAt nem importedAt, o horário fica nulo', () => {
  assert.equal(fonteCarregada(batch({ filename: 'vendas.csv' })).quando, null)
})

test('P3-b: um lote com erro não é fonte carregada — só o salvo conta', () => {
  // A função só aceita o estado persistido; um lote com erro nunca chega aqui
  // pela tela, e quando chega continua descrevendo o arquivo, não a gravação.
  const rejeitado = batch({ filename: 'errado.csv', errorCount: 8 })
  assert.equal(fonteCarregada(rejeitado).filename, 'errado.csv')
  assert.equal(fonteCarregada(rejeitado).quando, null)
})

test('P3-b: o painel lê draft, nunca workspace nem staged', () => {
  const texto = importScreen()
  const painel = texto.slice(texto.indexOf('O que já está carregado'), texto.indexOf('<div className="grid items-start gap-4 xl:grid-cols-2">'))
  assert.match(painel, /carregadas\[kind\]/)
  assert.doesNotMatch(painel, /workspace\[kind\]/)
  assert.match(texto, /fonteCarregada\(draft\?\.opportunities/)
  assert.match(texto, /fonteCarregada\(draft\?\.orders/)
})
