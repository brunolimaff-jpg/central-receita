import test from 'node:test'
import assert from 'node:assert/strict'
import { formatarMilhoes, formatarComSinal, formatarRealCompacto, formatarRealComSinal } from '../src/features/comercial-v3/format.ts'

test('valor compacto preserva ausente, zero, milhares e milhões', () => {
  assert.equal(formatarRealCompacto(null), '—')
  assert.equal(formatarRealCompacto(0), 'R$ 0')
  assert.equal(formatarRealCompacto(125_000), 'R$ 125 mil')
  assert.equal(formatarRealCompacto(1_250_000), 'R$ 1,3 mi')
  assert.equal(formatarRealCompacto(-2_000_000), '−R$ 2,0 mi')
})

test('valor pequeno nunca vira "R$ 0,00 mi" e 999.600 não vira "R$ 1.000 mil"', () => {
  assert.equal(formatarRealCompacto(80_000), 'R$ 80 mil')
  assert.equal(formatarRealCompacto(999_600), 'R$ 1,0 mi')
  assert.equal(formatarMilhoes(0.08), 'R$ 80 mil')
  assert.equal(formatarMilhoes(0), 'R$ 0')
  assert.equal(formatarMilhoes(1.2), 'R$ 1,2 mi')
})

test('deltas com sinal explícito, em milhões e em reais', () => {
  assert.equal(formatarComSinal(0.08), '+R$ 80 mil')
  assert.equal(formatarComSinal(-0.9), '-R$ 900 mil')
  assert.equal(formatarRealComSinal(null), '—')
  assert.equal(formatarRealComSinal(0), 'R$ 0')
  assert.equal(formatarRealComSinal(120_000), '+R$ 120 mil')
  assert.equal(formatarRealComSinal(-2_500_000), '−R$ 2,5 mi')
})
