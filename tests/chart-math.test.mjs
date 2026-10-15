import test from 'node:test'
import assert from 'node:assert/strict'
import { nearestChartPoint, countAxisMaximum, dateChartPositions, lineChartPath, stepChartPath } from '../src/features/comercial-v3/chart-math.ts'

test('inspeção seleciona o ponto mais próximo inclusive nas bordas e em séries vazias', () => {
  assert.equal(nearestChartPoint(10, []), -1)
  assert.equal(nearestChartPoint(NaN, [10]), -1)
  assert.equal(nearestChartPoint(-100, [20, 80, 140]), 0)
  assert.equal(nearestChartPoint(70, [20, 80, 140]), 1)
  assert.equal(nearestChartPoint(500, [20, 80, 140]), 2)
})
test('escala de contagens tem divisões inteiras sem cortar o maior valor', () => {
  for (const values of [[], [0], [1], [3, 5], [9, 41]]) {
    const maximum = countAxisMaximum(values)
    assert.ok(maximum >= Math.max(0, ...values))
    assert.equal(maximum % 4, 0)
  }
})
test('distribuição temporal preserva distâncias reais, virada de mês e ponto único', () => {
  assert.deepEqual(dateChartPositions([], 0, 300), [])
  assert.deepEqual(dateChartPositions(['2026-10-01'], 0, 300), [150])
  assert.deepEqual(dateChartPositions(['2026-10-01', '2026-10-02', '2026-10-31'], 0, 300), [0, 10, 300])
  assert.deepEqual(dateChartPositions(['2026-10-31', '2026-11-02'], 0, 300), [0, 300])
  assert.throws(() => dateChartPositions(['inválida'], 0, 300))
  assert.throws(() => dateChartPositions(['2026-02-30'], 0, 300))
})

test('linhas de snapshot ligam somente os pontos medidos', () => {
  assert.equal(lineChartPath([]), '')
  assert.equal(lineChartPath([[10, 20]]), 'M 10 20')
  assert.equal(lineChartPath([[10, 20], [30, 40], [50, 60]]), 'M 10 20 L 30 40 L 50 60')
})

test('acumulados por data usam degraus e preservam cada valor observado', () => {
  assert.equal(stepChartPath([]), '')
  assert.equal(stepChartPath([[10, 20]]), 'M 10 20')
  assert.equal(stepChartPath([[10, 20], [30, 40], [50, 60]]), 'M 10 20 H 30 V 40 H 50 V 60')
})

