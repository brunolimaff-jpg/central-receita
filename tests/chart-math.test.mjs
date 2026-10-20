import test from 'node:test'
import assert from 'node:assert/strict'
import { nearestChartPoint, countAxisMaximum, dateChartPositions, escalaDeValores, lineChartPath, lineChartSegments, separarRotulos, stepChartPath, suavizar, thinAxisPositions } from '../src/features/comercial-v3/chart-math.ts'

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

test('curva suavizada mantém as âncoras e atravessa vazio sem inventar ponto', () => {
  assert.equal(suavizar([]), '')
  assert.equal(suavizar([[10, 20]]), 'M 10 20')
  assert.equal(
    suavizar([[10, 20], [40, 50], [70, 90]]),
    'M 10 20 C 20 20 30 50 40 50 C 50 50 60 90 70 90',
  )
})

test('segmentos cortam a linha em lacunas: nulo é ausência, não zero', () => {
  assert.deepEqual(lineChartSegments([[0, 10], [1, null], [2, 30]]), [[[0, 10]], [[2, 30]]])
  assert.deepEqual(lineChartSegments([[0, null], [1, null]]), [])
  assert.deepEqual(lineChartSegments([[0, 10], [1, 20]]), [[[0, 10], [1, 20]]])
  assert.deepEqual(lineChartSegments([]), [])
})

test('rótulos a menos de 12px: o de menor valor cede e fica só no hover', () => {
  const rotulos = [
    { id: 'a', x: 0, y: 40, valor: 100 },
    { id: 'b', x: 20, y: 10, valor: 30 },
    { id: 'c', x: 60, y: 80, valor: 90 },
  ]
  // `a` e `b` estão a 20px em x, mas a 30px em y: não colidem.
  assert.deepEqual(separarRotulos(rotulos, 12).sort(), ['a', 'b', 'c'])
  // Aproximação nos dois eixos: o menor valor cede.
  assert.deepEqual(
    separarRotulos([
      { id: 'a', x: 0, y: 40, valor: 100 },
      { id: 'b', x: 8, y: 45, valor: 30 },
    ], 12),
    ['a'],
  )
})

test('escala de valores vai do zero ao topo arredondado, com passo legível e cinco divisões', () => {
  assert.deepEqual(escalaDeValores([50_000]), { topo: 50_000, passo: 10_000, divisoes: 5 })
  assert.deepEqual(escalaDeValores([50_000, 120_000]), { topo: 125_000, passo: 25_000, divisoes: 5 })
  assert.deepEqual(escalaDeValores([1_300_000]), { topo: 1_500_000, passo: 500_000, divisoes: 3 })
})

test('marcas de eixo com mais de seis pontos mantêm primeiro, último e até seis posições', () => {
  assert.deepEqual(thinAxisPositions(0), [])
  assert.deepEqual(thinAxisPositions(4), [0, 1, 2, 3])
  assert.deepEqual(thinAxisPositions(7), [0, 1, 2, 4, 5, 6])
  assert.equal(thinAxisPositions(20).length, 6)
  assert.equal(thinAxisPositions(20)[0], 0)
  assert.equal(thinAxisPositions(20).at(-1), 19)
})

