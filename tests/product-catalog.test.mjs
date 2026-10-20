import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { iconeDoProduto, produtoDaSolucao, PRODUTOS } from '../src/features/comercial-v3/product-catalog.ts'

/*
 * O catálogo decide qual produto oficial representa o texto de solução da carga.
 * Os nomes vêm livres na planilha, então o contrato cobre maiúsculas, acentos e
 * o texto que não corresponde a nenhum produto — que precisa devolver `null`
 * para a interface mostrar só o nome, sem inventar um ícone.
 */

test("'ERP' corresponde ao produto erp", () => {
  assert.equal(produtoDaSolucao('ERP'), 'erp')
})

test("'erp' minúsculo também corresponde a erp", () => {
  assert.equal(produtoDaSolucao('erp'), 'erp')
})

test("'Gestão de Pessoas' corresponde a hcm", () => {
  assert.equal(produtoDaSolucao('Gestão de Pessoas'), 'hcm')
})

test("'Logística' corresponde a logistica", () => {
  assert.equal(produtoDaSolucao('Logística'), 'logistica')
})

test("'Serviços' corresponde a servicos", () => {
  assert.equal(produtoDaSolucao('Serviços'), 'servicos')
})

test("'Consultoria Avulsa' não corresponde a nenhum produto", () => {
  assert.equal(produtoDaSolucao('Consultoria Avulsa'), null)
})

test('texto vazio não corresponde a nenhum produto', () => {
  assert.equal(produtoDaSolucao(''), null)
})

test('solução nula não corresponde a nenhum produto', () => {
  assert.equal(produtoDaSolucao(null), null)
})

test('texto só com espaços não corresponde a nenhum produto', () => {
  assert.equal(produtoDaSolucao('   '), null)
})

test('o ícone do erp aponta para o PNG oficial em /brand/produtos', () => {
  assert.match(iconeDoProduto('erp').src, /\/brand\/produtos\/erp\.png$/)
})

test('todo produto do catálogo tem arquivo em public/brand/produtos', () => {
  const pasta = new URL('../public/brand/produtos/', import.meta.url)
  for (const id of PRODUTOS) {
    const arquivo = fileURLToPath(new URL(`${id}.png`, pasta))
    assert.ok(existsSync(arquivo), `falta public/brand/produtos/${id}.png`)
  }
})
