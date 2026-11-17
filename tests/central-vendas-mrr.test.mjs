import test from 'node:test'
import assert from 'node:assert/strict'

/**
 * Leitura de MRR e matriz Territórios × Verticais (Central de Vendas).
 *
 * O módulo é TypeScript puro, sem DOM, e importa com extensão `.ts` — o
 * type-stripping do Node resolve direto, como o `npm test` já faz.
 */
const { matrizMrr, resumoMrrMes, leituraSemanal, idDoTerritorio, estadoDaHome, mostraLeituraSintetica, mostraBlocoSemanal } = await import(
  new URL('../src/features/comercial-v3/central-vendas-mrr.ts', import.meta.url).href
)

const perto = (a, b, tolerancia = 1) => Math.abs(a - b) <= tolerancia

test('resumo do mês lê os quatro KPIs sem somar', () => {
  const resumo = resumoMrrMes([
    { key: 'meta', value: 12 },
    { key: 'realizado', value: 8.4 },
    { key: 'forecastOficial', value: 11 },
    { key: 'forecastAtual', value: 10.2 },
    { key: 'deltaMeta', value: -1.8 },
  ])
  assert.equal(resumo.meta, 12)
  assert.equal(resumo.realizado, 8.4)
  assert.equal(resumo.forecastAtual, 10.2)
  assert.equal(resumo.forecastCongelado, 11)
  assert.ok(perto(resumo.diferenca, -3.6))
  assert.ok(perto(resumo.diferencaDoForecast, -1.8))
  assert.ok(perto(resumo.atingimento, 0.7, 1e-9))
  assert.ok(perto(resumo.cobertura, 0.85, 1e-9))
})

test('resumo sem meta não inventa razão', () => {
  const resumo = resumoMrrMes([
    { key: 'meta', value: 0 },
    { key: 'realizado', value: 2 },
  ])
  assert.equal(resumo.atingimento, null)
  assert.equal(resumo.cobertura, null)
  assert.equal(resumo.diferenca, 2)
})

test('matriz tem 5 territórios e 4 verticais, com o território 05 sem base própria', () => {
  const matriz = matrizMrr()
  assert.equal(matriz.linhas.length, 5)
  assert.equal(matriz.colunas.length, 4)
  assert.equal(matriz.colunas.map((coluna) => coluna.nome).join(','), 'Demais Segmentos,Construção,Indústria,Agronegócio')

  const semBase = matriz.linhas.find((linha) => linha.semBasePropria)
  assert.equal(semBase?.numero, 5)
  assert.equal(semBase?.territorioId, 'territorio-05')
  for (const celula of semBase.celulas) {
    assert.equal(celula.porCorte.geral, null)
    assert.equal(celula.porCorte.base, null)
    assert.equal(celula.porCorte.novos, null)
  }
  assert.equal(semBase.totais.geral, null)

  for (const linha of matriz.linhas.filter((item) => !item.semBasePropria)) {
    assert.equal(linha.celulas.length, 4)
    for (const celula of linha.celulas) {
      assert.ok(celula.porCorte.base.base > 0)
    }
  }
})

test('a soma da matriz mantém o resíduo contra o total declarado', () => {
  const matriz = matrizMrr()
  assert.ok(perto(matriz.somaDaMatriz, 77_377_000))
  assert.ok(perto(matriz.totalDeclarado, 77_500_000))
  assert.ok(perto(matriz.diferencaDaMatriz, 123_000))
  // O resíduo não é redistribuído: a soma das células é a base, não o declarado.
  assert.ok(matriz.diferencaDaMatriz > 0)
})

test('geral é base mais novos, e os cortes fecham entre si', () => {
  const matriz = matrizMrr()
  const totalGeral = matriz.totais.geral
  const totalBase = matriz.totais.base
  const totalNovos = matriz.totais.novos
  assert.ok(perto(totalGeral.base, totalBase.base + totalNovos.base))
  assert.ok(perto(totalGeral.meta, totalBase.meta + totalNovos.meta))
  assert.ok(perto(totalGeral.realizado, totalBase.realizado + totalNovos.realizado))
  assert.ok(totalNovos.base < totalBase.base)
  assert.ok(totalBase.base > 0 && totalNovos.base > 0)
})

test('desempenho, cobertura e diferença são consistentes em toda célula', () => {
  const matriz = matrizMrr()
  for (const linha of matriz.linhas) {
    for (const celula of linha.celulas) {
      for (const corte of ['geral', 'base', 'novos']) {
        const leitura = celula.porCorte[corte]
        if (!leitura) continue
        assert.ok(leitura.meta > 0)
        assert.ok(perto(leitura.desempenho, leitura.realizado / leitura.meta))
        assert.ok(perto(leitura.cobertura, leitura.forecast / leitura.meta))
        assert.ok(perto(leitura.diferenca, leitura.meta - leitura.realizado))
        assert.ok(leitura.desempenho > 0 && leitura.desempenho < 1.5)
        assert.ok(leitura.cobertura > 0 && leitura.cobertura < 1.5)
      }
    }
  }
})

test('a matriz é determinística', () => {
  const primeira = matrizMrr()
  const segunda = matrizMrr()
  assert.deepEqual(primeira.totais, segunda.totais)
  assert.deepEqual(primeira.linhas.map((linha) => linha.totais), segunda.linhas.map((linha) => linha.totais))
})

test('leitura semanal usa previsão menos ritmo e marca a semana atual', () => {
  const semanas = leituraSemanal([
    { week: 1, label: 'Sem 1', rangeLabel: 'Sex, 02/10', forecast: 2.1, pace: 1.8, current: false, closed: true },
    { week: 2, label: 'Sem 2', rangeLabel: 'Sex, 09/10', forecast: 3.4, pace: 3.6, current: true, closed: false },
  ])
  assert.equal(semanas.length, 2)
  assert.ok(perto(semanas[0].diferenca, 0.3))
  assert.ok(perto(semanas[1].diferenca, -0.2))
  assert.equal(semanas[1].current, true)
})

test('o identificador do território é o mesmo da tela de Territórios', () => {
  assert.equal(idDoTerritorio(1), 'territorio-01')
  assert.equal(idDoTerritorio(5), 'territorio-05')
})

test('o estado da Home é único e a carga confirmada vence os demais', () => {
  assert.equal(estadoDaHome({ temCarga: true, carregando: true, falha: null }), 'com-carga')
  assert.equal(estadoDaHome({ temCarga: true, carregando: false, falha: 'falha' }), 'com-carga')
  assert.equal(estadoDaHome({ temCarga: false, carregando: true, falha: null }), 'carregando')
  assert.equal(estadoDaHome({ temCarga: false, carregando: true, falha: 'falha' }), 'carregando')
  assert.equal(estadoDaHome({ temCarga: false, carregando: false, falha: 'falha' }), 'erro')
  assert.equal(estadoDaHome({ temCarga: false, carregando: false, falha: null }), 'sem-carga')
})

test('dados fictícios aparecem só na Home sem carga', () => {
  for (const estado of ['carregando', 'erro', 'com-carga']) {
    assert.equal(mostraLeituraSintetica(estado), false, `não pode mostrar cenário em ${estado}`)
  }
  assert.equal(mostraLeituraSintetica('sem-carga'), true)
})

test('a série semanal não sobrevive ao erro nem ao carregamento', () => {
  for (const estado of ['carregando', 'erro']) {
    assert.equal(mostraBlocoSemanal(estado), false, `não pode mostrar série em ${estado}`)
  }
  assert.equal(mostraBlocoSemanal('sem-carga'), true)
  assert.equal(mostraBlocoSemanal('com-carga'), true)
})
