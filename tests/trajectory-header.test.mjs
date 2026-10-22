import test from 'node:test'
import assert from 'node:assert/strict'
import { cabecalhoTrajetoria } from '../src/features/comercial-v3/trajectory-model.ts'

const ponto = label => ({ date: '2026-10-01', label, forecast: 1, realized: null })
const modelo = (regime, labels = []) => ({
  regime, ticks: [], previsto: null, realizado: null, datado: null, semData: 0,
  series: regime === 'vazio' ? [] : [{ kind: 'previsto', rotulo: 'Previsto', tracejado: false, points: labels.map(ponto) }],
})

test('sem carga: convite para importar e nenhum selo', () => {
  assert.deepEqual(cabecalhoTrajetoria(modelo('vazio'), null),
    { contexto: 'Importe a planilha de oportunidades para acompanhar o mês.', selo: null })
})

test('uma carga: acumulado do mês e selo "1 carga" no tom da marca', () => {
  assert.deepEqual(cabecalhoTrajetoria(modelo('A', ['05/10']), null),
    { contexto: 'Acumulado do mês pela previsão e pela efetivação do fechamento.', selo: { texto: '1 carga', tom: 'marca' } })
})

test('duas cargas: subtítulo nomeia a data da anterior', () => {
  assert.deepEqual(cabecalhoTrajetoria(modelo('B', ['05/10']), '2026-10-13T14:00:00.000Z'),
    { contexto: 'Comparado à carga de 13/10.', selo: { texto: '2 cargas', tom: 'marca' } })
})

test('duas cargas sem data da anterior: não inventa data', () => {
  assert.equal(cabecalhoTrajetoria(modelo('B'), null).contexto, 'Comparado à carga anterior.')
})

test('três ou mais cargas: evolução da primeira à última, tom info', () => {
  assert.deepEqual(cabecalhoTrajetoria(modelo('C', ['01/10', '08/10', '15/10 09:00']), null),
    { contexto: 'Evolução em 3 cargas, de 01/10 a 15/10 09:00.', selo: { texto: '3 cargas', tom: 'info' } })
})

test('nenhum regime diz "Demonstrativo"', () => {
  for (const regime of ['vazio', 'A', 'B', 'C']) {
    const { contexto, selo } = cabecalhoTrajetoria(modelo(regime, ['01/10', '02/10', '03/10']), null)
    assert.doesNotMatch(`${contexto} ${selo?.texto ?? ''}`, /Demonstrativo/)
  }
})
