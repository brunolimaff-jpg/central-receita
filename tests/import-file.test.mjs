import test from 'node:test'
import assert from 'node:assert/strict'
import {
  LIMITE_ARQUIVO_BYTES, avaliarArquivoSoltado, extensaoAceita, extensaoArquivo,
  formatarTamanhoArquivo, mensagemArquivoRecusado,
} from '../src/features/comercial-v3/import-file.ts'

/**
 * Contrato do helper alinhado ao leitor vigente (`manual-import-client.ts`):
 * `/\.csv$/i` e `/\.xlsx$/i`, arquivo não vazio e até 15 MB.
 * O helper só antecipa a mesma decisão para o arrasto; não cria regra nova.
 */

test('extensão reconhece CSV e XLSX sem diferenciar maiúsculas', () => {
  assert.equal(extensaoArquivo('Opp em andamento.csv'), 'csv')
  assert.equal(extensaoArquivo('Pedidos.XLSX'), 'xlsx')
  assert.equal(extensaoArquivo('arquivo'), '')
  assert.equal(extensaoArquivo('nome.com.pontos.csv'), 'csv')
  assert.equal(extensaoAceita('Opp.CSV'), true)
  assert.equal(extensaoAceita('Pedidos.xlsx'), true)
  assert.equal(extensaoAceita('relatorio.pdf'), false)
  assert.equal(extensaoAceita('planilha.csv.zip'), false)
})

test('nome terminado só na extensão continua aceito, como no leitor vigente', () => {
  // O leitor vigente testa `/\.csv$/i` no nome inteiro; `.csv` casa.
  // O helper não pode ser mais restritivo que o leitor.
  assert.equal(extensaoAceita('.csv'), true)
  assert.equal(extensaoAceita('.xlsx'), true)
  assert.equal(avaliarArquivoSoltado({ name: '.csv', size: 10 }).aceito, true)
})

test('entrada nula ou sem nome não derruba a avaliação', () => {
  assert.equal(avaliarArquivoSoltado(null).aceito, false)
  assert.equal(avaliarArquivoSoltado(undefined).aceito, false)
  assert.equal(avaliarArquivoSoltado({ name: '', size: 0 }).aceito, false)
  assert.equal(avaliarArquivoSoltado({}).aceito, false)
})

test('tamanho em KB e MB com vírgula decimal', () => {
  assert.equal(formatarTamanhoArquivo(0), '0,0 KB')
  assert.equal(formatarTamanhoArquivo(900), '0,9 KB')
  assert.equal(formatarTamanhoArquivo(1536), '1,5 KB')
  assert.equal(formatarTamanhoArquivo(1024 * 1024), '1,0 MB')
  assert.equal(formatarTamanhoArquivo(1536 * 1024), '1,5 MB')
  assert.equal(formatarTamanhoArquivo(15 * 1024 * 1024), '15 MB')
  assert.equal(formatarTamanhoArquivo(-1), 'Tamanho indisponível')
  assert.equal(formatarTamanhoArquivo(Number.NaN), 'Tamanho indisponível')
  assert.equal(formatarTamanhoArquivo(Number.POSITIVE_INFINITY), 'Tamanho indisponível')
})

test('arquivo solto com extensão errada é recusado com mensagem clara', () => {
  const avaliacao = avaliarArquivoSoltado({ name: 'relatorio.pdf', size: 2048 })
  assert.equal(avaliacao.aceito, false)
  assert.match(avaliacao.mensagem, /\.pdf/)
  assert.match(avaliacao.mensagem, /CSV UTF-8 ou um XLSX exportado pelo CRM/)
  assert.match(avaliacao.mensagem, /clique para escolher outro/)
  assert.doesNotMatch(avaliacao.mensagem, /inválid|culpa|errado/i)
})

test('mensagem de arquivo sem extensão não inventa um formato', () => {
  assert.match(mensagemArquivoRecusado('exportacao'), /^Este arquivo não é um CSV nem um XLSX/)
})

test('arquivo vazio, limite exato e acima do limite', () => {
  const vazio = avaliarArquivoSoltado({ name: 'Opp.csv', size: 0 })
  assert.equal(vazio.aceito, false)
  assert.match(vazio.mensagem, /está vazio/)

  const grande = avaliarArquivoSoltado({ name: 'Pedidos.xlsx', size: LIMITE_ARQUIVO_BYTES + 1 })
  assert.equal(grande.aceito, false)
  assert.match(grande.mensagem, /limite de 15 MB/)

  assert.equal(avaliarArquivoSoltado({ name: 'Opp.csv', size: 1200 }).aceito, true)
  // O leitor recusa `> 15 MB`; o valor exato do teto continua aceito.
  assert.equal(avaliarArquivoSoltado({ name: 'Pedidos.xlsx', size: LIMITE_ARQUIVO_BYTES }).aceito, true)
})

test('tamanho ausente não derruba a avaliação e nome nulo não lança', () => {
  // `File.size` é sempre número; a guarda é só para não lançar se outro
  // chamador passar um objeto incompleto. A decisão continua a do leitor.
  assert.equal(avaliarArquivoSoltado({ name: 'Opp.csv' }).aceito, true)
  assert.equal(extensaoArquivo(null), '')
  assert.equal(extensaoAceita(undefined), false)
  assert.match(mensagemArquivoRecusado(undefined), /^Este arquivo não é um CSV nem um XLSX/)
})
