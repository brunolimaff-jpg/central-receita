import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeImport } from '../src/features/comercial-v3/manual-import.ts'

let csv
try { csv = await import('../src/features/comercial-v3/manual-import-csv.ts') } catch { /* feature is introduced by this change */ }

function parse(source) {
  assert.equal(typeof csv?.parseImportCsv, 'function', 'CSV parser is not implemented yet')
  return csv.parseImportCsv(source)
}

test('parses semicolon CSV with BOM, escaped quotes, quoted delimiter and empty trailing cell', () => {
  const source = '\uFEFFConta;Observação;Vazio\r\n"ACME; Sul";"Ele disse ""ok""";\r\n'
  assert.deepEqual(parse(source), [
    ['Conta', 'Observação', 'Vazio'],
    ['ACME; Sul', 'Ele disse "ok"', ''],
  ])
})

test('parses comma CSV with quoted line breaks and a final row without newline', () => {
  const source = 'ID,Descrição\r\n1,"linha 1,\r\nlinha 2"\r\n2,fim'
  assert.deepEqual(parse(source), [
    ['ID', 'Descrição'],
    ['1', 'linha 1,\r\nlinha 2'],
    ['2', 'fim'],
  ])
})

test('rejects malformed quotes with row and column but without echoing the cell value', () => {
  assert.throws(() => parse('A,B\n1,"valor"x'), error => {
    assert.match(error.message, /CSV inválido.*linha 2, coluna 2/i)
    assert.doesNotMatch(error.message, /valor/)
    return true
  })
})

test('rejects unclosed quoted fields and ambiguous delimiters', () => {
  assert.throws(() => parse('A,B\n1,"sem fim'), /CSV inválido.*aspas não fechadas.*linha 2, coluna 2/i)
  assert.throws(() => parse('A,B;C\n1,2;3'), /CSV inválido.*delimitador.*ambíguo/i)
})

test('decodes UTF-8 with BOM and rejects invalid UTF-8', () => {
  assert.equal(typeof csv?.decodeImportCsv, 'function', 'CSV decoder is not implemented yet')
  const bytes = new TextEncoder().encode('\uFEFFA;B\n1;2')
  assert.equal(csv.decodeImportCsv(bytes.buffer), 'A;B\n1;2')
  const invalid = new Uint8Array([0xc3, 0x28])
  assert.throws(() => csv.decodeImportCsv(invalid.buffer), /UTF-8/i)
})

test('CSV opportunity rows use the existing import normalization contract', () => {
  const rows = parse([
    'Oportunidade ID;Conta ID;Conta;Etapa;Previsão de Fechamento;Valor Previsto;Valor Fechado;Representante',
    '101;11;ACME;Negociação;31/10/2026;0;;Unidade teste',
  ].join('\r\n'))
  const batch = normalizeImport('opportunities', rows)
  assert.equal(batch.errorCount, 0)
  assert.equal(batch.records[0].account, 'ACME')
  assert.equal(batch.records[0].predictedValue, 0)
  assert.equal(batch.records[0].closedValue, null)
  assert.equal(batch.records[0].forecastDate, '2026-10-31')
})

test('CSV order rows preserve item grain and Brazilian decimal values', () => {
  const rows = parse([
    'NUMERO PEDIDO;ID OPORTUNIDADE;ID CONTA;NOME FANTASIA CONTA;STATUS OPORTUNIDADE;CLASSIFICACAO DO PEDIDO;DATA FECHAMENTO;PRODUTO - VALOR MANUTENCAO;UNIDADE NEGOCIO OPORTUNIDADE',
    '201;101;11;ACME;Integrado com ERP;Novo;30/09/2026;100,50;Unidade teste',
    '201;101;11;ACME;Integrado com ERP;Novo;30/09/2026;200,75;Unidade teste',
  ].join('\n'))
  const batch = normalizeImport('orders', rows)
  assert.equal(batch.errorCount, 0)
  assert.equal(batch.stats.records, 2)
  assert.equal(batch.stats.orders, 1)
  assert.equal(batch.stats.integratedOrders, 1)
  assert.equal(batch.stats.sourceNewOrders, 1)
  assert.equal(batch.records[0].maintenance, 100.5)
  assert.equal(batch.records[1].maintenance, 200.75)
})

test('rejects rows exceeding the existing 100-column limit', () => {
  assert.throws(() => parse(Array.from({ length: 101 }, (_, index) => `c${index}`).join(',')), /100 colunas/i)
})
