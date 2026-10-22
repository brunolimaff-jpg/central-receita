import test from 'node:test'
import assert from 'node:assert/strict'
import { collapseInicial, lerPreferencia, gravarPreferencia } from '../src/features/comercial-v3/nav-collapse.ts'

test('tela larga começa expandida', () => {
  assert.equal(collapseInicial(1600), 'expandida')
})

test('tela estreita começa recolhida', () => {
  assert.equal(collapseInicial(900), 'recolhida')
})

test('preferência gravada vence o padrão da largura', () => {
  assert.equal(lerPreferencia('expandida', 900), 'expandida')
})

test('valor desconhecido cai no padrão da largura', () => {
  assert.equal(lerPreferencia('xyz', 900), 'recolhida')
  assert.equal(lerPreferencia('xyz', 1600), 'expandida')
})

test('ausência de preferência cai no padrão da largura', () => {
  assert.equal(lerPreferencia(null, 1600), 'expandida')
  assert.equal(lerPreferencia(null, 900), 'recolhida')
})

test('gravação preserva o estado na leitura, contra a largura', () => {
  assert.equal(lerPreferencia(gravarPreferencia('recolhida'), 1600), 'recolhida')
  assert.equal(lerPreferencia(gravarPreferencia('expandida'), 900), 'expandida')
})
