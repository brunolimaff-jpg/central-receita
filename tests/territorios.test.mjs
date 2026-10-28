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
  assert.equal(T.nivelDe('territorio-02', null), 'territorio')
  assert.equal(T.nivelDe('territorio-02', 'DF'), 'filial')
})

test('território inexistente cai no CSO em vez de tela vazia', () => {
  assert.equal(T.nivelDe('atlantida', null), 'cso')
  assert.equal(T.nivelDe('atlantida', 'DF'), 'cso')
  assert.equal(T.territorioPorId('atlantida'), null)
})

test('filial de outro território não abre nível filial', () => {
  // RO é do Território 05. Pedir RO dentro do 02 não é filial dele.
  assert.equal(T.nivelDe('territorio-02', 'RO'), 'territorio')
  assert.equal(T.nivelDe('territorio-05', 'RO'), 'filial')
})

/* ------------------------------------------------------------------ */
/*  Recorte não vaza dado de outro território                          */
/* ------------------------------------------------------------------ */

test('recorte de território não deixa passar filial de fora', () => {
  const t2 = T.territorioPorId('territorio-02')
  const r = T.recortarTerritorio(S, t2)
  assert.deepEqual(r.filiais.map(f => f.sigla).sort(), ['DF', 'GO', 'MS', 'MT'])
  assert.ok(r.opps.every(o => t2.filiais.includes(o.filial)), 'nenhuma opp de fora pode sobrar')
  assert.ok(r.execs.every(e => t2.filiais.includes(e.filial)), 'nenhum executivo de fora pode sobrar')

  const t5 = T.recortarTerritorio(S, T.territorioPorId('territorio-05'))
  assert.deepEqual(t5.filiais.map(f => f.sigla).sort(), ['RO', 'TO'])
  // E os dois recortes não se sobrepõem.
  const a = new Set(r.filiais.map(f => f.sigla))
  assert.ok(t5.filiais.every(f => !a.has(f.sigla)))
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
  const t2 = T.territorioPorId('territorio-02')
  const recorte = T.recortarTerritorio(S, t2)
  const linha = T.linhasDeTerritorio(S, 'mrr').find(l => l.territorio.id === 'territorio-02')
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
  const t2 = T.territorioPorId('territorio-02')
  assert.equal(
    T.linhasDeTerritorio(S, 'nrr').find(l => l.territorio.id === t2.id).pctBase,
    forecastFluxo(T.recortarTerritorio(S, t2), 'nrr').pctBase,
  )
})

test('a pior filial é a de menor percentual, e só entre as que têm meta', () => {
  const linha = T.linhasDeTerritorio(S, 'mrr').find(l => l.territorio.id === 'territorio-02')
  const t2 = T.territorioPorId('territorio-02')
  const percentuais = t2.filiais
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
  const t2 = T.territorioPorId('territorio-02')
  // `filiais[0]` é a assinatura de TO, que não é do CO — tem de buscar pela sigla declarada.
  const alvo = parcial.filiais.find(f => f.sigla === t2.filiais[0])
  assert.ok(alvo, `a filial ${t2.filiais[0]} precisa existir no snapshot`)
  for (const r of Object.keys(alvo.rubricas)) alvo.rubricas[r].meta = 0
  const linha = T.linhasDeTerritorio(parcial, 'mrr').find(l => l.territorio.id === t2.id)
  assert.equal(linha.filiais, t2.filiais.length)
  assert.equal(linha.filiaisComMeta, t2.filiais.length - 1)
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
  assert.ok(T.filialDoTerritorio(S, 'territorio-02', 'DF'))
  assert.equal(T.filialDoTerritorio(S, 'territorio-02', 'RO'), null, 'RO não é do Território 02')
  assert.equal(T.filialDoTerritorio(S, 'territorio-05', 'DF'), null)
  assert.ok(T.filialDoTerritorio(S, 'territorio-05', 'RO'))
})

test('só o Território 02 tem desenho próprio', () => {
  const comDesenho = T.TERRITORIOS.filter(t => t.desenhoProprio)
  assert.equal(comDesenho.length, 1)
  assert.equal(comDesenho[0].id, 'territorio-02')
})

test('todo território declara procedência e não se apresenta como divisão oficial', () => {
  for (const t of T.TERRITORIOS) {
    assert.ok(t.procedencia.length > 0, `${t.id} sem procedência`)
    // A base é o organograma, mas os números são do cenário: a frase precisa dizer as duas coisas.
    assert.match(t.procedencia, /organograma/i, `${t.id} não diz de onde vem o recorte`)
    assert.match(t.procedencia, /fictíci/i, `${t.id} afirma dado real`)
  }
})

test('os territórios são os cinco do organograma, com UFs declaradas', () => {
  assert.equal(T.TERRITORIOS.length, 5, 'o organograma tem cinco territórios')
  const numeros = T.TERRITORIOS.map(t => t.nome).sort()
  assert.deepEqual(numeros, ['Território 01', 'Território 02', 'Território 03', 'Território 04', 'Território 05'])
  for (const t of T.TERRITORIOS) assert.ok(t.ufs.length > 0, `${t.id} sem UFs`)
})

test('todo território tem movimento: nenhum fica vazio na comparação', () => {
  // Se um território não tiver filial com dado, a comparação lê como
  // favorecimento dos outros. Todos precisam de meta e de ganho.
  for (const t of T.TERRITORIOS) {
    const r = T.recortarTerritorio(S, t)
    assert.ok(r.filiais.length > 0, `${t.nome} sem filial no cenário`)
    const total = resultadoTotal(r, 'mrr')
    assert.ok(total.meta > 0, `${t.nome} sem meta de MRR`)
    assert.ok(total.ganho > 0, `${t.nome} sem ganho de MRR`)
  }
})
