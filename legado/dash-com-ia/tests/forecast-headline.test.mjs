import assert from 'node:assert/strict'
import test from 'node:test'
import { mancheteMudancaForecast } from '../src/lib/domain/forecast-headline.ts'

const moeda = (valor) => `R$${valor}`

test('a manchete distingue projeção móvel e descreve a direção no horizonte escolhido', () => {
  assert.equal(mancheteMudancaForecast({ dias: 90, delta: -1200 }, moeda), 'Projeção móvel dos próximos 90 dias caiu R$1200 desde a leitura anterior')
  assert.equal(mancheteMudancaForecast({ dias: 60, delta: 700 }, moeda), 'Projeção móvel dos próximos 60 dias cresceu R$700 desde a leitura anterior')
  assert.equal(mancheteMudancaForecast({ dias: 30, delta: 0 }, moeda), 'Projeção móvel dos próximos 30 dias ficou estável desde a leitura anterior')
  assert.equal(mancheteMudancaForecast(null, moeda), 'O movimento da projeção móvel ainda não está disponível')
  assert.equal(mancheteMudancaForecast(null, moeda, true), 'Não foi possível carregar o movimento da projeção móvel')
})
