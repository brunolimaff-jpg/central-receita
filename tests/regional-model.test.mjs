import test from 'node:test'
import assert from 'node:assert/strict'
import * as M from '../src/features/comercial-v3/regional/regional-model.ts'
import { REGIONAL_SNAPSHOT as S } from '../src/features/comercial-v3/regional/regional-mock.ts'

const opp = (id, o = {}) => ({ id: String(id), filial: 'DF', exec: 'X', cliente: `C${id}`, novo: false, data: '2026-10-30', tier: 'B', pb: 0.2, mrr: 1000, nrr: 10000, nota: 'ok', proximaAcao: 'a', proximaAcaoData: '2026-10-29', atualizadaEm: '2026-10-20', status: 'Em andamento', congelada: true, ...o })

test('farol: verde >= 100%, amarelo >= 70%, vermelho abaixo', () => {
  assert.equal(M.farolOf(1), 'verde')
  assert.equal(M.farolOf(0.7), 'amarelo')
  assert.equal(M.farolOf(0.699), 'vermelho')
})

test('categorias por estágio', () => {
  assert.deepEqual(['A', 'B+', 'B', 'C', 'D'].map(M.categoriaOf), ['Commit', 'Best case', 'Best case', 'Pipeline', 'Omitido'])
})

test('esperado = soma de valor x probabilidade, só em andamento', () => {
  const r = M.porCategoria([opp(1, { tier: 'A', pb: 0.5 }), opp(2, { tier: 'A', pb: 1, status: 'Ganha' })], 'mrr')
  assert.equal(r[0].bruto, 1000)
  assert.equal(r[0].esperado, 500)
})

test('conversão exigida para 70% da meta', () => {
  const f = { meta: 100, ganho: 30, fora: 10, categorias: [
    { categoria: 'Commit', bruto: 20, esperado: 10, n: 1 },
    { categoria: 'Best case', bruto: 100, esperado: 30, n: 3 },
    { categoria: 'Pipeline', bruto: 0, esperado: 0, n: 0 },
    { categoria: 'Omitido', bruto: 0, esperado: 0, n: 0 }] }
  const c = M.conversaoExigida(f)
  assert.ok(Math.abs(c.semFora - 0.3) < 1e-9)
  assert.ok(Math.abs(c.comFora - 0.2) < 1e-9)
  assert.equal(c.assumida, 0.3)
  assert.equal(c.farol, 'verde')
})

test('limpeza marca duplicidade, perdido, zerado, RJ, 2027, sem ação e sem atualização', () => {
  const s = { asOf: '2026-10-28', opps: [
    opp(1, { cliente: 'K', exec: 'A', nota: 'mesma' }), opp(2, { cliente: 'K', exec: 'B', nota: 'mesma' }),
    opp(3, { cliente: 'J', nota: 'x' }), opp(4, { cliente: 'J', nota: 'y' }),
    opp(5, { nota: 'Perdemos para concorrente' }), opp(6, { mrr: 0, nrr: 0 }),
    opp(7, { nota: 'Em recuperação judicial' }), opp(8, { nota: 'só em 2027' }),
    opp(9, { tier: 'C', proximaAcao: null }), opp(10, { atualizadaEm: '2026-08-01' })] }
  const f = M.flagsLimpeza(s)
  assert.deepEqual(f.get('1'), ['Duplicidade provável'])
  assert.deepEqual(f.get('3'), ['Mesma decisão em várias opps'])
  assert.deepEqual(f.get('5'), ['Nota diz perdido'])
  assert.deepEqual(f.get('6'), ['Valor zerado'])
  assert.deepEqual(f.get('7'), ['Recuperação judicial'])
  assert.deepEqual(f.get('8'), ['Cliente indica 2027'])
  assert.deepEqual(f.get('9'), ['Sem próxima ação'])
  assert.deepEqual(f.get('10'), ['Sem atualização'])
})

test('rolagem: 58% do que está aberto e não fecha', () => {
  const f = M.forecastFluxo(S, 'mrr')
  assert.ok(Math.abs(f.rola - 0.58 * (f.andamento - f.esperado)) < 1e-6)
  assert.ok(Math.abs(f.base - (f.ganho + f.esperado + f.fora)) < 1e-6)
})

test('simulação é reproduzível e ordenada', () => {
  const a = M.simular(S, 'mrr', 2000), b = M.simular(S, 'mrr', 2000)
  assert.deepEqual(a, b)
  assert.ok(a.p10 <= a.p50 && a.p50 <= a.p90)
  assert.ok(a.probMeta <= a.probAlvo)
})

test('nine box cobre todos os executivos em 9 células', () => {
  const linhas = M.linhasExec(S)
  const nb = M.ninebox(linhas)
  assert.equal(nb.length, 9)
  assert.equal(nb.reduce((a, c) => a + c.execs.length, 0), S.execs.length)
})

test('recorte por filial restringe opps e executivos', () => {
  const r = M.recortar(S, ['MS'])
  assert.ok(r.opps.every(o => o.filial === 'MS'))
  assert.ok(r.execs.every(e => e.filial === 'MS'))
  assert.equal(r.filiais.length, 1)
})

test('mock tem 6 filiais e casos adversariais visíveis', () => {
  assert.deepEqual(S.filiais.map(f => f.sigla), ['DF', 'GO', 'MS', 'MT', 'RO', 'TO'])
  const flags = new Set([...M.flagsLimpeza(S).values()].flat())
  for (const f of M.FLAGS_LIMPEZA.map(x => x.flag)) assert.ok(flags.has(f), f)
})

test('apostas: até 15, sem flags que zeram a chance', () => {
  const a = M.apostas(S)
  assert.ok(a.lista.length <= 15 && a.lista.length > 0)
  assert.ok(a.coberturaMrr > 0 && a.coberturaMrr <= 1)
})

test('apostas: um cliente vira uma aposta só', () => {
  const nomes = M.apostas(S).lista.map(a => a.opp.cliente)
  assert.equal(new Set(nomes).size, nomes.length)
})
