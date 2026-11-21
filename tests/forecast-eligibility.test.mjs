import test from 'node:test'
import assert from 'node:assert/strict'
import { avaliarElegibilidadeForecast, calcularElegibilidadeForecast } from '../src/features/comercial-v3/forecast-eligibility.ts'
import { FORECAST_PROBABILITY_NOTICE } from '../src/features/comercial-v3/forecast-month.ts'

const registro = (valores = {}) => ({ row: 1, opportunityId: '1', orderId: '', accountId: '1', account: 'Conta fictícia', stage: 'Negociação', status: '', classification: '', representative: '', executive: '', ownerGroup: '', forecastDate: '2026-10-12', closingDate: null, conferenceDate: null, predictedValue: 100, closedValue: null, maintenance: null, product: '', module: '', modality: '', probability: 0.75, proposalFlagged: true, ...valores })
const avaliar = valores => avaliarElegibilidadeForecast(registro(valores), '2026-10')
const calcular = registros => calcularElegibilidadeForecast(registros, '2026-10')

for (const [criterio, campo, positivo, negativo] of [
  ['etapa', 'stage', 'Proposta', 'Defesa Técnica'],
  ['propostaSinalizada', 'proposalFlagged', true, false],
  ['probabilidade', 'probability', 0.75, 0.749],
  ['previsaoFechamento', 'forecastDate', '2026-10-31', '2026-11-01'],
]) {
  test(`${criterio}: atende independentemente dos demais critérios`, () => {
    const resultado = avaliar({ [campo]: positivo })
    assert.equal(resultado.criterios[criterio], 'atende')
    assert.equal(resultado.classificacao, 'elegivel')
  })
  test(`${criterio}: não atende independentemente dos demais critérios`, () => {
    const resultado = avaliar({ [campo]: negativo })
    assert.equal(resultado.criterios[criterio], 'nao-atende')
    assert.equal(resultado.classificacao, 'inelegivel')
  })
  test(`${criterio}: ausência não vira reprovação`, () => {
    for (const ausente of [null, undefined]) {
      const resultado = avaliar({ [campo]: ausente })
      assert.equal(resultado.criterios[criterio], 'indisponivel')
      assert.equal(resultado.classificacao, 'indeterminado')
    }
  })
}

test('corporativo não soma um subconjunto quando falta sinalização, mesmo com Pedido', () => {
  const resultado = calcular([registro(), registro({ proposalFlagged: undefined, orderId: '123' })])
  assert.equal(resultado.corporativo.valor, null)
  assert.equal(resultado.corporativo.estado, 'indisponivel')
  assert.deepEqual(resultado.corporativo.criteriosIndisponiveis, { propostaSinalizada: 1 })
  assert.match(resultado.corporativo.motivo, /Proposta cadastrada e sinalizada para fechamento indisponível em 1 registro/)
  assert.equal(resultado.estimado.valor, 200)
  assert.equal(resultado.indeterminados.length, 1)
  assert.deepEqual(resultado.contagens, { elegivel: 1, inelegivel: 0, indeterminado: 1 })
})

test('corporativo calcula quatro critérios com sinalização e ignora lacunas já inelegíveis', () => {
  const resultado = calcular([registro(), registro({ proposalFlagged: false }), registro({ stage: 'Defesa Técnica', proposalFlagged: undefined })])
  assert.equal(resultado.corporativo.valor, 100)
  assert.equal(resultado.corporativo.estado, 'valido')
  assert.equal(resultado.corporativo.criteriosAplicados.length, 4)
  assert.equal(resultado.indeterminados.length, 0)
})

test('corporativo informa todas as lacunas e suas quantidades', () => {
  const resultado = calcular([registro({ stage: '', probability: null, forecastDate: null, proposalFlagged: null })])
  assert.deepEqual(resultado.corporativo.criteriosIndisponiveis, { etapa: 1, propostaSinalizada: 1, probabilidade: 1, previsaoFechamento: 1 })
  for (const nome of ['Etapa', 'Proposta', 'Probabilidade', 'Previsão']) assert.ok(resultado.corporativo.motivo.includes(nome))
})

test('estimado degrada sem qualquer probabilidade e aplica somente etapa e mês', () => {
  const resultado = calcular([registro({ probability: undefined }), registro({ probability: null, proposalFlagged: false })])
  assert.equal(resultado.estimado.estado, 'degradado')
  assert.equal(resultado.estimado.valor, 200)
  assert.equal(resultado.estimado.aviso, FORECAST_PROBABILITY_NOTICE)
  assert.deepEqual(resultado.estimado.criteriosAplicados, ['etapa', 'previsaoFechamento'])
})

test('estimado reporta candidatos sem probabilidade sem contá-los quando existe probabilidade na carga', () => {
  const resultado = calcular([registro(), registro({ probability: null }), registro({ probability: undefined, forecastDate: '2026-11-01' })])
  assert.equal(resultado.estimado.estado, 'valido')
  assert.equal(resultado.estimado.valor, 100)
  assert.equal(resultado.estimado.semProbabilidade, 1)
  assert.equal(resultado.elegiveisEstimados.length, 1)
  assert.equal(resultado.estimado.aviso, null)
  assert.deepEqual(resultado.estimado.criteriosAplicados, ['etapa', 'probabilidade', 'previsaoFechamento'])
})

test('probabilidade em registro fora do mês também ativa o corte', () => {
  const resultado = calcular([registro({ forecastDate: '2026-11-01' }), registro({ probability: null })])
  assert.equal(resultado.estimado.estado, 'valido')
  assert.equal(resultado.estimado.valor, 0)
  assert.equal(resultado.estimado.semProbabilidade, 1)
})

test('valor ausente contamina o total em vez de virar zero', () => {
  for (const probability of [0.8, null]) {
    const resultado = calcular([registro({ predictedValue: null, probability }), registro({ probability })])
    assert.equal(resultado.estimado.valor, null)
    assert.equal(resultado.estimado.estado, 'indisponivel')
    assert.equal(resultado.estimado.semValor, 1)
  }
  const resultado = calcular([registro({ predictedValue: null })])
  assert.equal(resultado.corporativo.valor, null)
  assert.equal(resultado.corporativo.semValor, 1)
  assert.equal(resultado.corporativo.estado, 'indisponivel')
  assert.equal(calcular([registro({ predictedValue: 0 })]).corporativo.valor, 0)
})

test('último dia entra, primeiro do próximo mês e último do anterior ficam fora', () => {
  const resultado = calcular(['2026-10-31', '2026-11-01', '2026-09-30'].map(forecastDate => registro({ forecastDate })))
  assert.equal(resultado.corporativo.valor, 100)
  assert.equal(resultado.estimado.quantidade, 1)
})

test('carga vazia preserva zero conhecido e nenhuma classificação', () => {
  const resultado = calcular([])
  assert.equal(resultado.corporativo.valor, 0)
  assert.equal(resultado.corporativo.estado, 'valido')
  assert.equal(resultado.estimado.valor, 0)
  assert.equal(resultado.estimado.estado, 'degradado')
  assert.deepEqual(resultado.contagens, { elegivel: 0, inelegivel: 0, indeterminado: 0 })
})

test('rejeita competência inválida mesmo em carga vazia', () => {
  for (const competencia of ['', '2026-13', '2026-1']) {
    assert.throws(() => calcularElegibilidadeForecast([], competencia), /Competência inválida/)
    assert.throws(() => avaliarElegibilidadeForecast(registro(), competencia), /Competência inválida/)
  }
})
