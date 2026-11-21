import test from 'node:test'
import assert from 'node:assert/strict'

/**
 * Rótulo da lateral: o rodapé precisa contar a mesma história do corpo.
 * A regressão que este teste guarda é "Dados carregados" sem carga ou em falha.
 */
const { rotuloDaLateral } = await import(
  new URL('../src/features/comercial-v3/sidebar-status.ts', import.meta.url).href
)

test('com carga: o rótulo mostra os dados e a data', () => {
  assert.deepEqual(rotuloDaLateral('com-carga', '22/10/2026', false), {
    titulo: 'Dados carregados',
    detalhe: 'Carga de 22/10/2026',
  })
  assert.deepEqual(rotuloDaLateral('com-carga', null, false), {
    titulo: 'Dados carregados',
    detalhe: 'Prévia local · importação',
  })
  assert.deepEqual(rotuloDaLateral('com-carga', null, true), {
    titulo: 'Dados carregados',
    detalhe: 'Carga compartilhada',
  })
})

test('sem carga, carregando ou erro nunca dizem "Dados carregados"', () => {
  for (const estado of ['sem-carga', 'carregando', 'erro']) {
    const rotulo = rotuloDaLateral(estado, '22/10/2026', false)
    assert.notEqual(rotulo.titulo, 'Dados carregados', `não pode anunciar carga em ${estado}`)
    assert.doesNotMatch(rotulo.detalhe, /Carga de/i, `não pode anunciar carga em ${estado}`)
  }
})

test('sem carga é demonstração; carregando e erro têm texto próprio', () => {
  assert.deepEqual(rotuloDaLateral('sem-carga', null, false), {
    titulo: 'Demonstração',
    detalhe: 'Cenário demonstrativo · set/2026',
  })
  assert.equal(rotuloDaLateral('carregando', null, false).titulo, 'Carregando dados')
  assert.equal(rotuloDaLateral('erro', null, false).titulo, 'Falha na carga')
})
