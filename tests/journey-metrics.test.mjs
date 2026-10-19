import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateJourneyConversion, calculateJourneyDaysChange, largestJourneyConversionDrop } from '../src/features/comercial-v3/screens/journey-metrics.ts'

test('calcula conversões das etapas pelos volumes adjacentes e trata denominador inválido', () => {
  assert.equal(calculateJourneyConversion(1900, 2400), 79)
  assert.equal(calculateJourneyConversion(1100, 1400), 79)
  assert.equal(calculateJourneyConversion(652, 850), 77)
  assert.equal(calculateJourneyConversion(0, 0), null)
  assert.equal(calculateJourneyConversion(Number.NaN, 100), null)
})

test('seleciona a maior queda entre taxas consecutivas e não inventa alerta quando não há queda', () => {
  assert.deepEqual(largestJourneyConversionDrop([
    { label: 'Conta', conversion: 79 },
    { label: 'Qualificação', conversion: 74 },
    { label: 'Oportunidade', conversion: 79 },
    { label: 'Proposta', conversion: 77 },
  ]), { from: 'Conta', to: 'Qualificação', fromRate: 79, toRate: 74, delta: -5 })
  assert.equal(largestJourneyConversionDrop([]), null)
  assert.equal(largestJourneyConversionDrop([{ label: 'Demanda', conversion: null }]), null)
  assert.equal(largestJourneyConversionDrop([{ label: 'Conta', conversion: 79 }, { label: 'Entrega', conversion: 95 }]), null)
})

test('compara dias sobre a fotografia anterior e trata referência inválida', () => {
  assert.equal(calculateJourneyDaysChange(40, 28), 43)
  assert.equal(calculateJourneyDaysChange(12, 16), -25)
  assert.equal(calculateJourneyDaysChange(2, 0), null)
  assert.equal(calculateJourneyDaysChange(Number.POSITIVE_INFINITY, 2), null)
})
