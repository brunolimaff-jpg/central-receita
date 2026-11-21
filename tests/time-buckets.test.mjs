import test from 'node:test'
import assert from 'node:assert/strict'
import { fatiasAFrente, fatiasDoPeriodo, somarPorFatia } from '../src/features/comercial-v3/time-buckets.ts'

test('semana: sete dias de segunda a domingo, com o dia da carga marcado', () => {
  const dias = fatiasDoPeriodo('2026-10-22', 'semana')
  assert.equal(dias.length, 7)
  assert.equal(dias[0].inicio, '2026-10-19')
  assert.equal(dias[0].rotulo, 'Seg 19')
  assert.equal(dias.find(d => d.atual).inicio, '2026-10-22')
})

test('mês: semanas 1–5, a última fecha no fim do mês', () => {
  const semanas = fatiasDoPeriodo('2026-10-22', 'mês')
  assert.deepEqual(semanas.map(s => s.rotulo), ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'])
  assert.equal(semanas.at(-1).fim, '2026-10-31')
  assert.equal(semanas.find(s => s.atual).rotulo, 'Sem 4')
  assert.equal(fatiasDoPeriodo('2026-02-10', 'mês').at(-1).rotulo, 'Sem 4')
})

test('tri: três meses do trimestre da referência', () => {
  assert.deepEqual(fatiasDoPeriodo('2026-10-22', 'tri').map(m => m.rotulo), ['out', 'nov', 'dez'])
  assert.deepEqual(fatiasDoPeriodo('2026-02-01', 'tri').map(m => m.rotulo), ['jan', 'fev', 'mar'])
})

test('à frente: 4 semanas, 4 meses e 4 trimestres, virando o ano', () => {
  assert.equal(fatiasAFrente('2026-10-22', 'semana')[1].inicio, '2026-10-26')
  assert.deepEqual(fatiasAFrente('2026-11-05', 'mês').map(m => m.rotulo), ["nov '26", "dez '26", "jan '27", "fev '27"])
  assert.deepEqual(fatiasAFrente('2026-10-22', 'tri').map(t => t.rotulo), ["4º tri '26", "1º tri '27", "2º tri '27", "3º tri '27"])
  assert.equal(fatiasAFrente('2026-10-22', 'tri')[1].fim, '2027-03-31')
})

test('somar por fatia: valor faltando contamina só a própria fatia', () => {
  const fatias = fatiasDoPeriodo('2026-10-22', 'tri')
  const itens = [{ d: '2026-10-03', v: 100 }, { d: '2026-11-10', v: null }, { d: '2026-12-31', v: 50 }]
  const somas = somarPorFatia(itens, fatias, i => i.d, i => i.v)
  assert.deepEqual(somas.map(s => s.valor), [100, null, 50])
})
