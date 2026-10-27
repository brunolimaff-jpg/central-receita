import test from 'node:test'
import assert from 'node:assert/strict'
import { agruparPor, filialDe, horizontalDe, horizontalOuSem, HORIZONTAIS, segmentoDe, SEGMENTOS, SEM_HORIZONTAL } from '../src/features/comercial-v3/forecast-towers.ts'

const rec = (over = {}) => ({ product: '', module: '', modality: '', representative: 'Unidade Sul', predictedValue: 100, closedValue: null, ...over })

test('segmento vem do produto/módulo e cai em Outros sem correspondência', () => {
  assert.equal(segmentoDe(rec({ product: 'ERP Indústria' })), 'Indústria')
  assert.equal(segmentoDe(rec({ module: 'Agronegócio' })), 'Agronegócio')
  assert.equal(segmentoDe(rec({ product: 'Gestão Construção' })), 'Construção')
  assert.equal(segmentoDe(rec({ product: 'ERP' })), 'Outros')
})

test('horizontal reconhece HCM, Logística, GRS e Wiipo', () => {
  assert.equal(horizontalDe(rec({ product: 'HCM' })), 'HCM')
  assert.equal(horizontalDe(rec({ product: 'TMS' })), 'Logística')
  assert.equal(horizontalDe(rec({ module: 'GRS' })), 'GRS')
  assert.equal(horizontalDe(rec({ product: 'Wiipo' })), 'Wiipo')
  assert.equal(horizontalDe(rec({ product: 'ERP' })), null)
  assert.equal(horizontalOuSem(rec({ product: 'ERP' })), SEM_HORIZONTAL)
})

test('agrupar mantém as torres fixas e soma previsto e ganhos', () => {
  const previstos = [rec({ product: 'HCM', predictedValue: 300 }), rec({ product: 'ERP Indústria', predictedValue: 200 })]
  const ganhos = [rec({ product: 'HCM', closedValue: 50 })]
  const seg = agruparPor(previstos, ganhos, segmentoDe, SEGMENTOS)
  assert.deepEqual(seg.map(l => l.rotulo), [...SEGMENTOS])
  assert.equal(seg.find(l => l.rotulo === 'Indústria').previsto, 200)
  assert.equal(seg.find(l => l.rotulo === 'Outros').ganho, 50)
  const hor = agruparPor(previstos, ganhos, horizontalOuSem, HORIZONTAIS)
  assert.equal(hor.find(l => l.rotulo === 'HCM').previsto, 300)
  assert.equal(hor.at(-1).rotulo, SEM_HORIZONTAL)
  // Total igual nas duas leituras.
  const soma = linhas => linhas.reduce((s, l) => s + l.previsto, 0)
  assert.equal(soma(seg), soma(hor))
})

test('valor faltando contamina o previsto da linha em vez de virar zero', () => {
  const [linha] = agruparPor([rec({ predictedValue: null }), rec()], [], filialDe)
  assert.equal(linha.previsto, null)
  assert.equal(linha.oportunidades, 2)
})
