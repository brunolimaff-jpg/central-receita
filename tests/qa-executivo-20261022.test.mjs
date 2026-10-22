import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateForecastMonth } from '../src/features/comercial-v3/forecast-month.ts'
import { forecastMovementRows, groupMovements } from '../src/features/comercial-v3/movement-rows.ts'
import { buildTrajectory, ponteReconcilia } from '../src/features/comercial-v3/trajectory-model.ts'
import { formatarValorExato, formatarRealCompacto } from '../src/features/comercial-v3/format.ts'

/**
 * Regressões do QA executivo de 22/10 (issue #16). Cada teste reproduz um
 * defeito observado na tela com dados sintéticos antes da correção:
 * A) o modo Semana aplicava a janela a Ganhou/Perdeu e não a Entrou/Saiu;
 * B) "Saldo do mês" somava os quatro cartões e contradizia a Trajetória,
 *    porque quem fechou aparecia em Saiu e também em Ganhou/Perdeu.
 */

const CARTOES = [
  { key: 'Entrou', labels: ['Entrou'] },
  { key: 'Saiu', labels: ['Saiu', 'Postergou'] },
  { key: 'Ganhou', labels: ['Ganhou'] },
  { key: 'Perdeu', labels: ['Perdeu'] },
]

const rec = (overrides = {}) => ({
  row: 1, opportunityId: 'OP-1', orderId: '', accountId: 'C-1', account: 'Conta 1',
  stage: 'Proposta', status: '', classification: '', representative: 'Filial Sul', executive: 'Ana',
  ownerGroup: '', forecastDate: null, closingDate: null, conferenceDate: null,
  predictedValue: null, closedValue: null, maintenance: null, product: '', module: '', modality: '',
  probability: 0.9,
  ...overrides,
})

const somaDaPonte = (bridge) => (bridge.entrou ?? 0) + (bridge.saiu ?? 0) + (bridge.alterou ?? 0)

test('A: no modo Semana, Entrou respeita a janela da semana (antes vinha do mês)', () => {
  const anterior = [rec({ opportunityId: 'P', forecastDate: '2026-10-30', predictedValue: 1000, stage: 'Negociação' })]
  const atual = [
    rec({ opportunityId: 'P', forecastDate: '2026-10-30', predictedValue: 1000, stage: 'Negociação' }),
    // passou a cumprir o critério, mas com previsão fora da semana (19–25/10)
    rec({ opportunityId: 'FORA', forecastDate: '2026-10-30', predictedValue: 7000, stage: 'Proposta' }),
    // passou a cumprir o critério dentro da semana
    rec({ opportunityId: 'DENTRO', forecastDate: '2026-10-22', predictedValue: 3000, stage: 'Proposta' }),
  ]
  const semana = calculateForecastMonth(atual, anterior, '2026-10', '2026-10-22', 'semana')
  assert.deepEqual(semana.period, { start: '2026-10-19', end: '2026-10-25' })
  assert.equal(semana.entered.count, 1)
  assert.equal(semana.entered.value, 3000)
  assert.deepEqual(semana.entered.records.map(r => r.opportunityId), ['DENTRO'])

  const mes = calculateForecastMonth(atual, anterior, '2026-10', '2026-10-22', 'mês')
  assert.equal(mes.entered.value, 10000)
  assert.equal(mes.entered.count, 2)
})

test('A: no modo Semana, Saiu responde à janela da semana nas duas cargas', () => {
  const anterior = [
    rec({ opportunityId: 'SAI_SEMANA', forecastDate: '2026-10-22', predictedValue: 2000, stage: 'Negociação' }),
    rec({ opportunityId: 'SAI_MES', forecastDate: '2026-10-30', predictedValue: 5000, stage: 'Negociação' }),
  ]
  const atual = [
    // as duas deixaram o previsto aberto
    rec({ opportunityId: 'SAI_SEMANA', stage: 'Fechada e Perdida', closingDate: '2026-10-23', predictedValue: 2000, closedValue: 2000 }),
    rec({ opportunityId: 'SAI_MES', stage: 'Fechada e Perdida', closingDate: '2026-10-31', predictedValue: 5000, closedValue: 5000 }),
  ]
  const semana = calculateForecastMonth(atual, anterior, '2026-10', '2026-10-22', 'semana')
  assert.equal(semana.exited.count, 1)
  assert.deepEqual(semana.exited.records.map(r => r.opportunityId), ['SAI_SEMANA'])
})

test('A: oportunidade que muda de 30/10 para 22/10 entra no recorte semanal sem sair do mês', () => {
  const anterior = [
    rec({ opportunityId: 'M', forecastDate: '2026-10-30', predictedValue: 1000, stage: 'Negociação' }),
    rec({ opportunityId: 'Z', forecastDate: '2026-10-30', predictedValue: 400, stage: 'Negociação' }),
  ]
  const atual = [
    rec({ opportunityId: 'M', forecastDate: '2026-10-22', predictedValue: 1000, stage: 'Negociação' }),
    rec({ opportunityId: 'Z', forecastDate: '2026-10-30', predictedValue: 400, stage: 'Negociação' }),
  ]
  const semana = calculateForecastMonth(atual, anterior, '2026-10', '2026-10-22', 'semana')
  assert.deepEqual(semana.predicted.records.map(r => r.opportunityId), ['M'])
  assert.equal(semana.entered.count, 1)
  assert.deepEqual(semana.entered.records.map(r => r.opportunityId), ['M'])
  /*
   * Z nunca esteve na semana anterior (previsão 30/10 nas duas cargas), então
   * não há saída a registrar: o comparativo é de quem era elegível naquela
   * semana em cada fotografia. Zero aqui é ausência de movimento, não omissão.
   */
  assert.equal(semana.exited.count, 0)

  const mes = calculateForecastMonth(atual, anterior, '2026-10', '2026-10-22', 'mês')
  assert.equal(mes.predicted.value, 1400)
  assert.equal(mes.entered.count, 0)
})

test('B: a ponte reconcilia com a variação do previsto, mesmo com fechamento no período', () => {
  const anterior = [
    rec({ opportunityId: 'A', stage: 'Negociação', forecastDate: '2026-10-20', predictedValue: 10000 }),
    rec({ opportunityId: 'B', stage: 'Negociação', forecastDate: '2026-10-28', predictedValue: 5000 }),
  ]
  const atual = [
    rec({ opportunityId: 'A', stage: 'Fechada e Ganha', closingDate: '2026-10-23', predictedValue: 10000, closedValue: 11000 }),
    rec({ opportunityId: 'B', stage: 'Negociação', forecastDate: '2026-10-28', predictedValue: 5000 }),
    rec({ opportunityId: 'C', stage: 'Proposta', forecastDate: '2026-10-29', predictedValue: 8000 }),
  ]
  const r = calculateForecastMonth(atual, anterior, '2026-10', '2026-10-22', 'mês')
  assert.equal(r.bridge.totalAnterior, 15000)
  assert.equal(r.bridge.totalAtual, 13000)
  assert.equal(r.bridge.entrou, 8000)
  assert.equal(r.bridge.saiu, -10000)
  assert.equal(r.bridge.alterou, 0)
  assert.equal(r.predicted.value - r.bridge.totalAnterior, -2000)
  assert.equal(somaDaPonte(r.bridge), -2000)
  assert.equal(ponteReconcilia({ totalAnterior: r.bridge.totalAnterior, totalAtual: r.bridge.totalAtual, entrou: r.bridge.entrou, saiu: r.bridge.saiu, alterou: r.bridge.alterou }), true)
})

test('B: Saiu inclui quem fechou, e o saldo não soma Ganhou/Perdeu de novo', () => {
  const anterior = [
    rec({ opportunityId: 'A', stage: 'Negociação', forecastDate: '2026-10-20', predictedValue: 10000 }),
    rec({ opportunityId: 'B', stage: 'Negociação', forecastDate: '2026-10-28', predictedValue: 5000 }),
  ]
  const atual = [
    rec({ opportunityId: 'A', stage: 'Fechada e Ganha', closingDate: '2026-10-23', predictedValue: 10000, closedValue: 11000 }),
    rec({ opportunityId: 'B', stage: 'Negociação', forecastDate: '2026-10-28', predictedValue: 5000 }),
    rec({ opportunityId: 'C', stage: 'Proposta', forecastDate: '2026-10-29', predictedValue: 8000 }),
  ]
  const r = calculateForecastMonth(atual, anterior, '2026-10', '2026-10-22', 'mês')
  const grupos = Object.fromEntries(groupMovements(forecastMovementRows(r, atual), CARTOES).map(g => [g.key, g]))
  // o cartão Saiu volta a mostrar o que saiu do previsto aberto
  assert.equal(grupos.Saiu.count, 1)
  assert.equal(grupos.Saiu.value, -10000)
  // o desfecho continua visível, mas não entra na conta do saldo
  assert.equal(grupos.Ganhou.value, 11000)
  // somar os quatro cartões daria 9000; o saldo correto é a ponte
  const somaIngenua = grupos.Entrou.value + grupos.Saiu.value + grupos.Ganhou.value + grupos.Perdeu.value
  assert.equal(somaIngenua, 9000)
  assert.notEqual(somaIngenua, -2000)
  assert.equal(somaDaPonte(r.bridge), -2000)
})

test('B: a Trajetória publica a mesma ponte do Forecast, sem recálculo próprio', () => {
  const anterior = [
    rec({ opportunityId: 'A', stage: 'Negociação', forecastDate: '2026-10-20', predictedValue: 10000 }),
    rec({ opportunityId: 'B', stage: 'Negociação', forecastDate: '2026-10-28', predictedValue: 5000 }),
  ]
  const atual = [
    rec({ opportunityId: 'A', stage: 'Fechada e Ganha', closingDate: '2026-10-23', predictedValue: 10000, closedValue: 11000 }),
    rec({ opportunityId: 'B', stage: 'Negociação', forecastDate: '2026-10-28', predictedValue: 5200 }),
    rec({ opportunityId: 'C', stage: 'Proposta', forecastDate: '2026-10-29', predictedValue: 8000 }),
  ]
  const forecast = calculateForecastMonth(atual, anterior, '2026-10', '2026-10-22', 'mês')
  const trajetoria = buildTrajectory({ opportunities: atual, previous: anterior, referenceDate: '2026-10-22', previousReferenceDate: '2026-10-22', history: [] })
  assert.ok(trajetoria.ponte)
  assert.equal(trajetoria.ponte.publicada, true)
  assert.equal(trajetoria.ponte.totalAnterior, forecast.bridge.totalAnterior)
  assert.equal(trajetoria.ponte.totalAtual, forecast.bridge.totalAtual)
  assert.deepEqual(trajetoria.ponte.lances, [
    { movimento: 'Entrou', valor: 8000 },
    { movimento: 'Saiu', valor: -10000 },
    { movimento: 'Alterou valor', valor: 200 },
  ])
  assert.equal(trajetoria.ponte.totalAtual - trajetoria.ponte.totalAnterior, -1800)
})

test('B: sem carga anterior não há ponte nem saldo — nunca zero', () => {
  const atual = [rec({ opportunityId: 'A', stage: 'Fechada e Ganha', closingDate: '2026-10-23', predictedValue: 1000, closedValue: 1200 })]
  const r = calculateForecastMonth(atual, null, '2026-10', '2026-10-22', 'mês')
  assert.equal(r.bridge, null)
  assert.equal(r.entered, null)
  assert.equal(r.exited, null)
})

test('B: valor ausente na carga contamina a ponte em vez de virar zero', () => {
  const anterior = [rec({ opportunityId: 'A', stage: 'Negociação', forecastDate: '2026-10-20', predictedValue: 5000 })]
  const atual = [
    rec({ opportunityId: 'A', stage: 'Negociação', forecastDate: '2026-10-20', predictedValue: null }),
    rec({ opportunityId: 'N', stage: 'Proposta', forecastDate: '2026-10-21', predictedValue: 2000 }),
  ]
  const r = calculateForecastMonth(atual, anterior, '2026-10', '2026-10-22', 'mês')
  assert.equal(r.bridge.alterou, null)
  assert.equal(r.bridge.entrou, 2000)
  assert.equal(r.bridge.saiu, 0)
  assert.equal(ponteReconcilia({ ...r.bridge, entrou: r.bridge.entrou, saiu: r.bridge.saiu, alterou: r.bridge.alterou }), false)
})

test('B: postergação conta como saída do recorte, com o valor anterior', () => {
  const anterior = [
    rec({ opportunityId: 'POS', stage: 'Negociação', forecastDate: '2026-10-28', predictedValue: 4000 }),
    rec({ opportunityId: 'FICA', stage: 'Negociação', forecastDate: '2026-10-28', predictedValue: 3000 }),
  ]
  const atual = [
    rec({ opportunityId: 'POS', stage: 'Negociação', forecastDate: '2026-12-02', predictedValue: 4000 }),
    rec({ opportunityId: 'FICA', stage: 'Negociação', forecastDate: '2026-10-28', predictedValue: 3000 }),
  ]
  const r = calculateForecastMonth(atual, anterior, '2026-10', '2026-10-22', 'mês')
  assert.equal(r.exited.count, 1)
  assert.equal(r.bridge.saiu, -4000)
  assert.equal(r.bridge.totalAnterior, 7000)
  assert.equal(r.bridge.totalAtual, 3000)
  assert.equal(somaDaPonte(r.bridge), -4000)
  const grupos = Object.fromEntries(groupMovements(forecastMovementRows(r, atual), CARTOES).map(g => [g.key, g]))
  assert.equal(grupos.Saiu.count, 1)
  assert.equal(grupos.Saiu.value, -4000)
})

// ---------- Revisão remota da PR #17: S1, S2, S3 ----------

test('S1: carga anterior de outro mês não produz saldo comparável', () => {
  const setembro = [rec({ opportunityId: 'A', stage: 'Negociação', forecastDate: '2026-09-20', predictedValue: 10000 })]
  const outubro = [rec({ opportunityId: 'A', stage: 'Negociação', forecastDate: '2026-10-20', predictedValue: 5000 })]
  const r = calculateForecastMonth(outubro, setembro, '2026-10', '2026-10-22', 'mês', '2026-09-30')
  assert.equal(r.bridge.comparavel, false)
  // os totais de cada mês continuam corretos
  assert.equal(r.bridge.totalAtual, 5000)
  assert.equal(r.bridge.totalAnterior, 0)
  // e o movimento não é inventado: nulo, nunca zero
  assert.equal(r.bridge.entrou, null)
  assert.equal(r.bridge.saiu, null)
  assert.equal(r.bridge.alterou, null)
  assert.equal(ponteReconcilia({ totalAnterior: r.bridge.totalAnterior, totalAtual: r.bridge.totalAtual, entrou: r.bridge.entrou, saiu: r.bridge.saiu, alterou: r.bridge.alterou }), false)
})

test('S1: mesmo mês continua comparável e a referência ausente herda o mês', () => {
  const anterior = [rec({ opportunityId: 'A', stage: 'Negociação', forecastDate: '2026-10-10', predictedValue: 10000 })]
  const atual = [rec({ opportunityId: 'A', stage: 'Negociação', forecastDate: '2026-10-10', predictedValue: 9000 })]
  const mesmoMes = calculateForecastMonth(atual, anterior, '2026-10', '2026-10-22', 'mês', '2026-10-10')
  assert.equal(mesmoMes.bridge.comparavel, true)
  assert.equal(mesmoMes.bridge.alterou, -1000)
  const semReferencia = calculateForecastMonth(atual, anterior, '2026-10', '2026-10-22', 'mês')
  assert.equal(semReferencia.bridge.comparavel, true)
  assert.equal(semReferencia.bridge.alterou, -1000)
})

test('S1: a Trajetória concorda com o Forecast sobre a competência', () => {
  const setembro = [rec({ opportunityId: 'A', stage: 'Negociação', forecastDate: '2026-09-20', predictedValue: 10000 })]
  const outubro = [rec({ opportunityId: 'A', stage: 'Negociação', forecastDate: '2026-10-20', predictedValue: 5000 })]
  const trajetoria = buildTrajectory({ opportunities: outubro, previous: setembro, referenceDate: '2026-10-22', previousReferenceDate: '2026-09-30', history: [] })
  assert.equal(trajetoria.ponte.publicada, false)
  assert.deepEqual(trajetoria.ponte.lances, [])
})

test('S2: a variação exata não arredonda acima de R$ 10 mil', () => {
  assert.equal(formatarValorExato(12_500), '+R$ 12.500')
  assert.equal(formatarValorExato(-12_500), '−R$ 12.500')
  assert.equal(formatarValorExato(2_500), '+R$ 2.500')
  assert.equal(formatarValorExato(0), 'R$ 0')
  assert.equal(formatarValorExato(null), '—')
  // o compacto continua compacto para os demais indicadores
  assert.equal(formatarRealCompacto(12_500), 'R$ 13 mil')
})

// ---------- Segundo ciclo da revisão: tabela e centavos ----------

test('S1b: entre competências, a tabela não recebe Entrou/Saiu (só Ganhou/Perdeu)', () => {
  const setembro = [rec({ opportunityId: 'SET', stage: 'Negociação', forecastDate: '2026-09-20', predictedValue: 10000 })]
  const outubro = [
    rec({ opportunityId: 'OUT', stage: 'Proposta', forecastDate: '2026-10-20', predictedValue: 5000 }),
    rec({ opportunityId: 'GANHA', stage: 'Fechada e Ganha', closingDate: '2026-10-15', predictedValue: 1000, closedValue: 1200 }),
  ]
  const r = calculateForecastMonth(outubro, setembro, '2026-10', '2026-10-22', 'mês', '2026-09-30')
  assert.equal(r.entered, null)
  assert.equal(r.exited, null)
  assert.equal(r.postponed, null)
  assert.equal(r.otherExited, null)
  // o desfecho da carga atual continua disponível
  assert.equal(r.won.count, 1)
  assert.equal(r.won.value, 1200)
  // e a tabela não inventa movimento
  const linhas = forecastMovementRows(r, outubro)
  assert.deepEqual(linhas.map(linha => linha.movement), ['Ganhou'])
})

test('S1b: no mesmo mês, a tabela continua recebendo os movimentos', () => {
  const anterior = [rec({ opportunityId: 'A', stage: 'Negociação', forecastDate: '2026-10-10', predictedValue: 10000 })]
  const atual = [
    rec({ opportunityId: 'A', stage: 'Negociação', forecastDate: '2026-10-10', predictedValue: 9000 }),
    rec({ opportunityId: 'N', stage: 'Proposta', forecastDate: '2026-10-12', predictedValue: 3000 }),
  ]
  const r = calculateForecastMonth(atual, anterior, '2026-10', '2026-10-22', 'mês', '2026-10-10')
  assert.equal(r.entered.count, 1)
  assert.equal(r.bridge.comparavel, true)
  assert.deepEqual(forecastMovementRows(r, atual).map(linha => linha.movement).sort(), ['Entrou'])
})

test('S2b: a variação exata preserva centavos', () => {
  assert.equal(formatarValorExato(12_500.25), '+R$ 12.500,25')
  assert.equal(formatarValorExato(-12_500.25), '−R$ 12.500,25')
  assert.equal(formatarValorExato(1_234.5), '+R$ 1.234,50')
  // inteiro continua sem centavos
  assert.equal(formatarValorExato(12_500), '+R$ 12.500')
})
