import test from 'node:test'
import assert from 'node:assert/strict'

/**
 * Regras do painel de resultado da Home (CENTRAL-001-HOME):
 * selo por origem, MRR separado de NR, percentual com absoluto, totais por
 * soma (nunca média de percentuais) e filtros preservados na navegação.
 */
const {
  seloDoBloco,
  separarMrrNr,
  atingimento,
  textoAtingimento,
  lerCargaTeste,
  pluralizar,
  linhasSegmento,
  resumoExport,
  evolucaoSemanal,
  hrefComFiltros,
  normalizarCorte,
  normalizarSegmento,
  rotuloExport,
  referenciaPlanejamento,
  filtrosMensaisDaHome,
} = await import(new URL('../src/features/comercial-v3/home-raio-x.ts', import.meta.url).href)
const { matrizMrr } = await import(new URL('../src/features/comercial-v3/central-vendas-mrr.ts', import.meta.url).href)

test('a Home mantém o mês mesmo ao retornar de outro período', () => {
  for (const period of ['month', 'quarter', 'threeMonths']) {
    const filtros = { period, branch: 'Filial Alfa', solution: 'ERP' }
    assert.deepEqual(filtrosMensaisDaHome(filtros), { ...filtros, period: 'month' })
    assert.equal(filtros.period, period)
  }
})

test('o selo carrega origem, período e referência; teste não vira demo', () => {
  const teste = seloDoBloco('teste', 'outubro/2026', 'carga de 22/10/2026')
  assert.equal(teste.rotulo, 'Carga de teste')
  assert.match(teste.texto, /Carga de teste/)
  assert.match(teste.texto, /outubro\/2026/)
  assert.match(teste.texto, /22\/10\/2026/)
  assert.doesNotMatch(teste.texto, /Demo/)

  const demo = seloDoBloco('demo', 'set/2026', 'fotografia 19/09/2026')
  assert.equal(demo.rotulo, 'Demo')
  assert.match(demo.texto, /Demo · set\/2026 · fotografia 19\/09\/2026/)

  const planejamento = seloDoBloco('planejamento', '2027', referenciaPlanejamento(false))
  assert.equal(planejamento.rotulo, 'Planejamento')
  assert.match(planejamento.texto, /base declarada/)
})

test('MRR é só recorrência; habilitação e serviço ficam em NR separado', () => {
  const resumo = separarMrrNr({ realizado: 10, newNames: 2, cross: 8, recorrente: 7, habilitacao: 2, servicos: 1 })
  assert.equal(resumo.mrr, 7)
  assert.equal(resumo.nrHabilitacao, 2)
  assert.equal(resumo.nrServicos, 1)
  assert.equal(resumo.nrTotal, 3)
  assert.equal(resumo.mrr + resumo.nrTotal, 10)
})

test('percentual vem com o absoluto do mesmo par e não divide por meta zero', () => {
  const at = atingimento(7, 10)
  assert.equal(at.percentual, 0.7)
  assert.equal(at.absoluto, -3)
  assert.deepEqual(atingimento(7, 0), { percentual: null, absoluto: null })
  assert.deepEqual(atingimento(null, 10), { percentual: null, absoluto: null })
})

test('o bloco Demo mostra as duas leituras contra a mesma meta, com absoluto', () => {
  // Mesmo par do cenário: MRR 6,2 e NR 2,2 (habilitação 1,1 + serviço 1,1).
  const { mrr, nrTotal } = separarMrrNr({ realizado: 8.4, newNames: 0, cross: 0, recorrente: 6.2, habilitacao: 1.1, servicos: 1.1 })
  const soMrr = atingimento(mrr, 12)
  const comNr = atingimento(mrr + nrTotal, 12)
  assert.ok(Math.abs(soMrr.percentual - 6.2 / 12) < 1e-9)
  assert.ok(Math.abs(soMrr.absoluto - (6.2 - 12)) < 1e-9)
  assert.ok(Math.abs(comNr.percentual - 0.7) < 1e-9)
  assert.ok(Math.abs(comNr.absoluto - (8.4 - 12)) < 1e-9)
  assert.notEqual(soMrr.percentual, comNr.percentual)
})

test('o sinal do absoluto é o mesmo na tabela e no texto: negativo falta, positivo passou', () => {
  const numero = (valor) => `${valor}`
  assert.equal(textoAtingimento(0.92, -106000, numero), '92% · faltam 106000')
  assert.equal(textoAtingimento(1.03, 42000, numero), '103% · 42000 acima')
  assert.equal(textoAtingimento(1, 0, numero), '100% · 0 de diferença · na meta')
  assert.equal(textoAtingimento(null, 0, numero), 'sem meta')

  const linhas = linhasSegmento('todos', 'geral')
  for (const linha of linhas) {
    assert.ok(Math.abs(linha.absoluto - (linha.realizado - linha.meta)) < 1e-9, `${linha.nome}: absoluto é realizado − meta`)
    if (linha.meta <= 0) continue
    if (linha.realizado < linha.meta) assert.match(textoAtingimento(linha.percentual, linha.absoluto), /^.* · faltam /, `${linha.nome} abaixo da meta lê "faltam"`)
    else if (linha.realizado > linha.meta) assert.match(textoAtingimento(linha.percentual, linha.absoluto), / acima$/, `${linha.nome} acima da meta lê "acima"`)
    else assert.match(textoAtingimento(linha.percentual, linha.absoluto), /na meta$/, `${linha.nome} na meta lê "na meta"`)
  }
})

test('a carga lê só a competência da referência e declara o que ficou fora', () => {
  const registro = (extra) => ({ stage: 'Fechada e Ganha', closingDate: null, forecastDate: null, closedValue: null, predictedValue: null, ...extra })
  const registros = [
    registro({ closingDate: '2026-10-14', closedValue: 4000 }),
    registro({ closingDate: '2026-09-30', closedValue: 9000 }),
    registro({ closingDate: null, closedValue: 500 }),
    registro({ closingDate: '2026-13-40', closedValue: 700 }),
    registro({ closingDate: '2026-10-20', closedValue: null }),
    registro({ stage: 'Negociação', forecastDate: '2026-10-21', predictedValue: 1500 }),
    registro({ stage: 'Negociação', forecastDate: '2026-11-02', predictedValue: 2500 }),
    registro({ stage: 'Proposta', forecastDate: null, predictedValue: 800 }),
    registro({ stage: 'Fechada e Perdida', closingDate: '2026-10-13', closedValue: 900 }),
  ]
  const leitura = lerCargaTeste(registros, '2026-10-22')
  assert.equal(leitura.mes, '2026-10')
  assert.deepEqual(leitura.ganhos, { total: 4000, quantidade: 1 })
  assert.deepEqual(leitura.emAberto, { total: 1500, quantidade: 1 })
  assert.equal(leitura.foraDoMes, 2, 'setembro e novembro ficam fora e são contados')
  assert.equal(leitura.semData, 3, 'duas ganhas sem data válida e uma aberta sem previsão')
  assert.equal(leitura.semValor, 1, 'ganha de outubro sem Valor Fechado')
  assert.equal(leitura.total, 9)

  const perdida = lerCargaTeste([registro({ stage: 'Fechada e Perdida', closingDate: '2026-10-13', closedValue: 900 })], '2026-10-22')
  assert.deepEqual(perdida.ganhos, { total: 0, quantidade: 0 })
  assert.equal(perdida.semValor, 0, 'perdida não entra em cartão nenhum nem conta como sem valor')

  const semReferencia = lerCargaTeste(registros, '22/10/2026')
  assert.equal(semReferencia.mes, null, 'data fora do ISO não vira mês suposto')
  assert.deepEqual(semReferencia.ganhos, { total: 0, quantidade: 0 })
  assert.deepEqual(semReferencia.emAberto, { total: 0, quantidade: 0 })
  assert.equal(semReferencia.total, 9)
})

test('carga sem etapa não entra no total em aberto', () => {
  const registro = { stage: '', forecastDate: '2026-10-21', predictedValue: 900, closingDate: null, closedValue: null }
  for (const registros of [[], [registro], [{ ...registro, stage: '  ' }]]) {
    const leitura = lerCargaTeste(registros, '2026-10-22')
    assert.deepEqual(leitura.emAberto, { total: 0, quantidade: 0 })
  }
  const leitura = lerCargaTeste([registro, { ...registro, stage: 'Proposta', predictedValue: 100 }], '2026-10-22')
  assert.deepEqual(leitura.emAberto, { total: 100, quantidade: 1 })
})

test('a contagem concorda no singular e no plural', () => {
  assert.equal(pluralizar(1, 'fechada e ganha', 'fechadas e ganhas'), '1 fechada e ganha')
  assert.equal(pluralizar(0, 'fechada e ganha', 'fechadas e ganhas'), '0 fechadas e ganhas')
  assert.equal(pluralizar(3, 'fechada e ganha', 'fechadas e ganhas'), '3 fechadas e ganhas')
  assert.equal(pluralizar(1, 'aberta com previsão', 'abertas com previsão'), '1 aberta com previsão')
  assert.equal(pluralizar(2, 'aberta com previsão', 'abertas com previsão'), '2 abertas com previsão')
})

test('o total por segmento soma os valores e não faz média de percentuais', () => {
  const linhas = linhasSegmento('todos', 'geral')
  const verticais = linhas.slice(0, -1)
  const total = linhas.at(-1)
  assert.equal(total.id, 'todos')
  assert.equal(verticais.length, 4)
  const somaBase = verticais.reduce((soma, linha) => soma + linha.base, 0)
  assert.ok(Math.abs(total.base - somaBase) < 1e-9, 'base do total deve ser a soma das verticais')
  assert.ok(total.base > 1_000_000, 'a matriz de planejamento mede reais, não milhões')
  assert.ok(Math.abs(total.percentual - total.realizado / total.meta) < 1e-12, 'percentual do total = realizado ÷ meta')
  const media = verticais.reduce((soma, linha) => soma + (linha.percentual ?? 0), 0) / verticais.length
  assert.ok(Math.abs(total.percentual - media) > 1e-4, 'total não pode ser média de percentuais')
})

test('o corte Novos usa os valores do mesmo corte da matriz', () => {
  const linhas = linhasSegmento('todos', 'novos')
  const total = linhas.at(-1)
  const matriz = matrizMrr()
  assert.ok(Math.abs(total.base - matriz.totais.novos.base) < 1e-9)
  const unico = linhasSegmento('agro', 'novos')
  assert.equal(unico.length, 1)
  assert.equal(unico[0].id, 'agro')
  assert.ok(unico[0].base > 0)
})

test('dado sem fonte aparece marcado, nunca como zero', () => {
  const [linha] = linhasSegmento('agro', 'geral')
  assert.deepEqual([...linha.semFonte], ['clientes', 'ticket médio', 'novos clientes'])
})

test('export calcula atingimento com absoluto do mesmo agregado', () => {
  const resumo = resumoExport({ meta: 20, realizado: 8 }, 3)
  assert.equal(resumo.filiais, 3)
  assert.equal(resumo.percentual, 0.4)
  assert.equal(resumo.absoluto, -12)
})

test('export distingue modo visual e real com a quantidade carregada', () => {
  assert.equal(rotuloExport(true, 3), 'Export sintético (modo visual) · 3 filiais')
  assert.equal(rotuloExport(false, 7), 'Export real · 7 filiais')
  assert.equal(rotuloExport(true, 0), 'Export sintético (modo visual) · 0 filiais')
  assert.equal(rotuloExport(false, 1), 'Export real · 1 filial')
  assert.doesNotMatch(rotuloExport(true, 7), /real/)
})

test('planejamento declara a base e os valores fictícios sem expor arquivo', () => {
  assert.equal(referenciaPlanejamento(false), 'base declarada no planejamento')
  assert.equal(referenciaPlanejamento(true), 'base declarada no planejamento · valores fictícios')
})

test('export sem meta não inventa atingimento', () => {
  assert.equal(resumoExport({ meta: 0, realizado: 0 }, 0).percentual, null)
})

test('o recorte do painel segue para o território e o consolidado limpa a URL', () => {
  const comFiltro = hrefComFiltros('/?view=territorios&period=month&territorio=territorio-01', 'agro', 'novos')
  assert.match(comFiltro, /view=territorios/)
  assert.match(comFiltro, /territorio=territorio-01/)
  assert.match(comFiltro, /segmento=agro/)
  assert.match(comFiltro, /corte=novos/)

  const limpo = hrefComFiltros('/?view=territorios&segmento=agro&corte=novos', 'todos', 'geral')
  assert.doesNotMatch(limpo, /segmento=/)
  assert.doesNotMatch(limpo, /corte=/)
})

test('valores fora do vocabulário caem no consolidado', () => {
  assert.equal(normalizarSegmento('industria'), 'industria')
  assert.equal(normalizarSegmento('inexistente'), 'todos')
  assert.equal(normalizarSegmento(null), 'todos')
  assert.equal(normalizarCorte('base'), 'base')
  assert.equal(normalizarCorte('novos'), 'novos')
  assert.equal(normalizarCorte('qualquer'), 'geral')
})

test('evolução semanal expõe semana, previsão e ritmo', () => {
  const semanas = evolucaoSemanal([
    { week: 1, label: 'Sem 1', rangeLabel: 'Sex, 04/set', current: false, forecast: 2, pace: 1, cutoffDay: 4, closed: true },
  ])
  assert.deepEqual(semanas[0], { week: 1, label: 'Sem 1', forecast: 2, pace: 1 })
  assert.deepEqual(semanas.map((semana) => semana.week), [1, 2, 3, 4, 5])
  assert.deepEqual(semanas[4], { week: 5, label: 'Sem 5', forecast: null, pace: null })
})

test('semanas sem fonte não viram zero nem previsão estimada', () => {
  assert.equal(evolucaoSemanal([]).length, 5)
  assert.ok(evolucaoSemanal([]).every((semana) => semana.forecast === null && semana.pace === null))
})
