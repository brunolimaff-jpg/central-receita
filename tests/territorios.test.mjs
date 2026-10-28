import test from 'node:test'
import assert from 'node:assert/strict'
import * as T from '../src/features/comercial-v3/regional/territorios-model.ts'
import { REGIONAL_SNAPSHOT as S } from '../src/features/comercial-v3/regional/regional-mock.ts'
import { forecastFluxo, resultadoFilial, resultadoTotal } from '../src/features/comercial-v3/regional/regional-model.ts'

/* ------------------------------------------------------------------ */
/*  Nível derivado — nunca "filial sem território"                     */
/* ------------------------------------------------------------------ */

test('nível é derivado do que está aberto, não de um parâmetro', () => {
  assert.equal(T.nivelDe(null, null), 'cso')
  assert.equal(T.nivelDe('', null), 'cso')
  assert.equal(T.nivelDe('centro-oeste', null), 'territorio')
  assert.equal(T.nivelDe('centro-oeste', 'DF'), 'filial')
})

test('território inexistente cai no CSO em vez de tela vazia', () => {
  assert.equal(T.nivelDe('atlantida', null), 'cso')
  assert.equal(T.nivelDe('atlantida', 'DF'), 'cso')
  assert.equal(T.territorioPorId('atlantida'), null)
})

test('filial de outro território não abre nível filial', () => {
  // RO é do Norte. Pedir RO dentro do Centro-Oeste não é filial do CO.
  assert.equal(T.nivelDe('centro-oeste', 'RO'), 'territorio')
  assert.equal(T.nivelDe('norte', 'RO'), 'filial')
})

/* ------------------------------------------------------------------ */
/*  Recorte não vaza dado de outro território                          */
/* ------------------------------------------------------------------ */

test('recorte de território não deixa passar filial de fora', () => {
  const co = T.territorioPorId('centro-oeste')
  const r = T.recortarTerritorio(S, co)
  assert.deepEqual(r.filiais.map(f => f.sigla).sort(), ['DF', 'GO', 'MS', 'MT'])
  assert.ok(r.opps.every(o => co.filiais.includes(o.filial)), 'nenhuma opp de fora pode sobrar')
  assert.ok(r.execs.every(e => co.filiais.includes(e.filial)), 'nenhum executivo de fora pode sobrar')

  const norte = T.recortarTerritorio(S, T.territorioPorId('norte'))
  assert.deepEqual(norte.filiais.map(f => f.sigla).sort(), ['RO', 'TO'])
  // E os dois recortes não se sobrepõem.
  const a = new Set(r.filiais.map(f => f.sigla))
  assert.ok(norte.filiais.every(f => !a.has(f.sigla)))
})

test('território nulo é o consolidado inteiro', () => {
  const tudo = T.recortarTerritorio(S, null)
  assert.equal(tudo.filiais.length, S.filiais.length)
})

test('os territórios cobrem todas as filiais do snapshot, sem sobra nem repetição', () => {
  const contadas = T.TERRITORIOS.flatMap(t => t.filiais)
  const doSnapshot = S.filiais.map(f => f.sigla)
  assert.equal(new Set(contadas).size, contadas.length, 'nenhuma filial em dois territórios')
  assert.deepEqual([...contadas].sort(), [...doSnapshot].sort(), 'nenhuma filial de fora')
})

/* ------------------------------------------------------------------ */
/*  Linhas do CSO: mesma régua, sem inventar agregado                  */
/* ------------------------------------------------------------------ */

test('a linha de território usa a mesma régua do nível de baixo', () => {
  const co = T.territorioPorId('centro-oeste')
  const recorte = T.recortarTerritorio(S, co)
  const linha = T.linhasDeTerritorio(S, 'mrr').find(l => l.territorio.id === 'centro-oeste')
  const f = forecastFluxo(recorte, 'mrr')
  assert.equal(linha.base, f.base)
  assert.equal(linha.pctBase, f.pctBase)
  assert.equal(linha.ganho, resultadoTotal(recorte, 'mrr').ganho)
  assert.equal(linha.meta, resultadoTotal(recorte, 'mrr').meta)
})

test('MRR e NRR nunca se somam em taxa nem em farol', () => {
  // O CSO roda um fluxo por vez. Se somasse, o percentual de um fluxo seria
  // diferente do que a linha do território daquele fluxo mostra.
  const mrr = T.linhasDeTerritorio(S, 'mrr')
  const nrr = T.linhasDeTerritorio(S, 'nrr')
  for (let i = 0; i < mrr.length; i++) {
    assert.notEqual(mrr[i].meta, nrr[i].meta, 'metas de fluxos distintos não podem coincidir')
  }
  // E cada linha bate com o próprio fluxo.
  const co = T.territorioPorId('centro-oeste')
  assert.equal(
    T.linhasDeTerritorio(S, 'nrr').find(l => l.territorio.id === co.id).pctBase,
    forecastFluxo(T.recortarTerritorio(S, co), 'nrr').pctBase,
  )
})

test('a pior filial é a de menor percentual, e só entre as que têm meta', () => {
  const linha = T.linhasDeTerritorio(S, 'mrr').find(l => l.territorio.id === 'centro-oeste')
  const co = T.territorioPorId('centro-oeste')
  const percentuais = co.filiais
    .map(sigla => ({ sigla, pct: resultadoFilial(S.filiais.find(f => f.sigla === sigla), 'mrr').pct }))
    .filter(x => x.pct !== null)
    .sort((a, b) => a.pct - b.pct)
  assert.equal(linha.piorFilial.sigla, percentuais[0].sigla)
  assert.equal(linha.piorFilial.pct, percentuais[0].pct)
})

test('território sem meta não afirma farol nem "falta"', () => {
  const semMeta = JSON.parse(JSON.stringify(S))
  for (const f of semMeta.filiais) {
    for (const r of Object.keys(f.rubricas)) { f.rubricas[r].meta = 0 }
  }
  const linha = T.linhasDeTerritorio(semMeta, 'mrr')[0]
  assert.equal(linha.pctBase, null, 'sem meta não há percentual')
  assert.equal(linha.farolBase, null, 'sem meta não há farol')
  assert.equal(linha.faltaParaAlvo, null, 'sem meta não há falta')
})

test('filiaisComMeta conta só quem tem meta, e filiais conta todas', () => {
  const parcial = JSON.parse(JSON.stringify(S))
  const co = T.territorioPorId('centro-oeste')
  // `filiais[0]` é a assinatura de TO, que não é do CO — tem de buscar pela sigla declarada.
  const alvo = parcial.filiais.find(f => f.sigla === co.filiais[0])
  assert.ok(alvo, `a filial ${co.filiais[0]} precisa existir no snapshot`)
  for (const r of Object.keys(alvo.rubricas)) alvo.rubricas[r].meta = 0
  const linha = T.linhasDeTerritorio(parcial, 'mrr').find(l => l.territorio.id === co.id)
  assert.equal(linha.filiais, co.filiais.length)
  assert.equal(linha.filiaisComMeta, co.filiais.length - 1)
})

/* ------------------------------------------------------------------ */
/*  Visão CSO                                                          */
/* ------------------------------------------------------------------ */

test('CSO ordena por quem está mais longe, e sem meta vai para o fim', () => {
  const cso = T.visaoCso(S, 'mrr')
  const comMeta = cso.territorios.filter(t => t.pctBase !== null)
  for (let i = 1; i < comMeta.length; i++) {
    assert.ok(comMeta[i - 1].pctBase <= comMeta[i].pctBase, 'ordem crescente de percentual')
  }
  const sem = cso.territorios.filter(t => t.pctBase === null)
  if (sem.length > 0) {
    const ultimoComMeta = cso.territorios.findIndex(t => t.pctBase === null)
    assert.ok(cso.territorios.slice(ultimoComMeta).every(t => t.pctBase === null), 'sem meta só no fim')
  }
})

test('CSO não afirma escopo real', () => {
  const cso = T.visaoCso(S, 'mrr')
  assert.equal(cso.escopoReal, false)
  assert.match(cso.avisoEscopo, /tela/i)
  assert.match(cso.avisoEscopo, /não é controle de acesso/i)
})

test('atenção do CSO sai dos números da tela, sem indicador inventado', () => {
  const cso = T.visaoCso(S, 'mrr')
  assert.ok(cso.atencao.length > 0)
  // Cada frase precisa citar um número ou um nome que está na própria visão.
  for (const frase of cso.atencao) {
    const citaTerritorio = cso.territorios.some(t => frase.includes(t.territorio.nome))
    const citaPercentual = /\d+%/.test(frase)
    assert.ok(citaTerritorio || citaPercentual, `frase sem lastro: ${frase}`)
  }
})

/* ------------------------------------------------------------------ */
/*  Nível filial                                                       */
/* ------------------------------------------------------------------ */

test('filial do território só abre se pertencer a ele', () => {
  assert.ok(T.filialDoTerritorio(S, 'centro-oeste', 'DF'))
  assert.equal(T.filialDoTerritorio(S, 'centro-oeste', 'RO'), null, 'RO não é do Centro-Oeste')
  assert.equal(T.filialDoTerritorio(S, 'norte', 'DF'), null)
  assert.ok(T.filialDoTerritorio(S, 'norte', 'RO'))
})

test('só o Centro-Oeste tem desenho próprio', () => {
  const comDesenho = T.TERRITORIOS.filter(t => t.desenhoProprio)
  assert.equal(comDesenho.length, 1)
  assert.equal(comDesenho[0].id, 'centro-oeste')
})

test('todo território declara procedência e não se apresenta como divisão oficial', () => {
  for (const t of T.TERRITORIOS) {
    assert.ok(t.procedencia.length > 0, `${t.id} sem procedência`)
    assert.match(t.procedencia, /fictício|não é divisão corporativa/i, `${t.id} afirma estrutura real`)
  }
})
