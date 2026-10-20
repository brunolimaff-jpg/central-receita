import assert from 'node:assert/strict'
import test from 'node:test'
import { pontuarBuscaComando } from '../src/lib/domain/command-search.ts'

test('a busca GATec seleciona registros relacionados e exclui Pergunte contextual', () => {
  assert.ok(pontuarBuscaComando('Abrir oportunidade 339001 ERP GATec Agro Horizonte', 'GATec') > 0)
  assert.equal(pontuarBuscaComando('Perguntar à Receita', 'GATec', ['Contextual']), 0)
})

test('a busca combina termos em qualquer ordem e ignora acentos', () => {
  assert.ok(pontuarBuscaComando('Abrir oportunidade 339001 ERP GATec Agro Horizonte', 'horizonte gatec') > 0)
  assert.ok(pontuarBuscaComando('Abrir conta São José do Norte', 'sao jose') > 0)
  assert.equal(pontuarBuscaComando('Abrir conta São José do Norte', 'São Paulo'), 0)
})
