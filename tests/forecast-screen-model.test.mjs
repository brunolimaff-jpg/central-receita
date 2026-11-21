import test from 'node:test'
import assert from 'node:assert/strict'
import { criarResumoForecast } from '../src/features/comercial-v3/forecast-screen-model.ts'
import { FORECAST_PROBABILITY_NOTICE } from '../src/features/comercial-v3/forecast-month.ts'

const registro = (valores = {}) => ({ row: 1, opportunityId: '1', orderId: '', accountId: '1', account: 'Conta fictícia', stage: 'Negociação', status: '', classification: '', representative: '', executive: '', ownerGroup: '', forecastDate: '2026-10-31', closingDate: null, conferenceDate: null, predictedValue: 100, closedValue: null, maintenance: null, product: '', module: '', modality: '', probability: 0.8, ...valores })
const carga = (valores = {}) => ({ kind: 'opportunities', records: [registro()], referenceDate: '2026-10-20', filename: 'cenario-ficticio.csv', importedAt: '2026-10-20T12:00:00Z', hash: 'abcdef1234567890', issues: [], errorCount: 0, warningCount: 0, stats: { records: 1, opportunities: 1, orders: 0, accounts: 1, integratedOrders: 0, sourceNewOrders: 0 }, ...valores })

test('sem carga é estado vazio, sem números demonstrativos', () => {
  const modelo = criarResumoForecast({ batch: null })
  assert.equal(modelo.estado, 'sem-carga')
  assert.match(modelo.mensagem, /Nenhuma carga/)
  assert.equal('resultado' in modelo, false)
})

test('carregamento não expõe números antigos', () => {
  const modelo = criarResumoForecast({ batch: carga(), carregando: true })
  assert.equal(modelo.estado, 'carregando')
  assert.equal('resultado' in modelo, false)
})

test('erro tem precedência sobre carga e carregamento', () => {
  const modelo = criarResumoForecast({ batch: carga(), carregando: true, erro: 'Não foi possível consultar a carga.' })
  assert.equal(modelo.estado, 'erro')
  assert.equal(modelo.mensagem, 'Não foi possível consultar a carga.')
  assert.equal('resultado' in modelo, false)
})

test('carga válida informa estimativa e corporativo indisponível, nunca zero', () => {
  const modelo = criarResumoForecast({ batch: carga() })
  assert.equal(modelo.estado, 'valida')
  assert.equal(modelo.resultado.estimado.valor, 100)
  assert.equal(modelo.resultado.estimado.quantidade, 1)
  assert.equal(modelo.resultado.corporativo.estado, 'indisponivel')
  assert.equal(modelo.resultado.corporativo.valor, null)
  assert.match(modelo.resultado.corporativo.motivo, /Proposta cadastrada e sinalizada/)
  assert.equal(modelo.selo.rotulo, 'Carga importada')
  for (const detalhe of ['cenario-ficticio.csv', '2026-10-20', '2026-10', '2026-10-20T12:00:00Z', 'abcdef12']) assert.ok(modelo.selo.referencia.includes(detalhe))
})

test('carga degradada mantém aviso e critérios efetivamente aplicados', () => {
  const modelo = criarResumoForecast({ batch: carga({ records: [registro({ probability: null })] }) })
  assert.equal(modelo.estado, 'degradada')
  assert.equal(modelo.resultado.estimado.estado, 'degradado')
  assert.equal(modelo.resultado.estimado.aviso, FORECAST_PROBABILITY_NOTICE)
  assert.equal(modelo.resultado.corporativo.valor, null)
})

test('sem valor previsto é indisponível mesmo em carga degradada', () => {
  const modelo = criarResumoForecast({ batch: carga({ records: [registro({ probability: null, predictedValue: null })] }) })
  assert.equal(modelo.estado, 'degradada')
  assert.equal(modelo.resultado.estimado.estado, 'indisponivel')
  assert.equal(modelo.resultado.estimado.valor, null)
  assert.equal(modelo.resultado.estimado.semValor, 1)
})

test('corporativo é válido somente com os quatro critérios conhecidos', () => {
  const modelo = criarResumoForecast({ batch: carga({ records: [registro({ proposalFlagged: true })] }) })
  assert.equal(modelo.resultado.corporativo.estado, 'valido')
  assert.equal(modelo.resultado.corporativo.valor, 100)
})

test('usa competência da carga de oportunidades, não a referência alternativa', () => {
  const modelo = criarResumoForecast({ batch: carga(), referenceDate: '2026-11-01' })
  assert.equal(modelo.resultado.competencia, '2026-10')
  assert.equal(modelo.resultado.estimado.valor, 100)
})

test('sem referência válida não inventa competência; metadados opcionais não quebram', () => {
  assert.equal(criarResumoForecast({ batch: carga({ referenceDate: undefined }) }).estado, 'erro')
  assert.equal(criarResumoForecast({ batch: carga({ referenceDate: '2026-13-01' }) }).estado, 'erro')
  const modelo = criarResumoForecast({ batch: carga({ filename: undefined, importedAt: undefined, hash: undefined }) })
  assert.equal(modelo.estado, 'valida')
  assert.match(modelo.selo.referencia, /Arquivo não informado/)
})

test('carga vazia continua distinta de ausência de carga', () => {
  const modelo = criarResumoForecast({ batch: carga({ records: [] }) })
  assert.equal(modelo.estado, 'degradada')
  assert.equal(modelo.resultado.estimado.quantidade, 0)
  assert.equal(modelo.resultado.estimado.valor, 0)
})
