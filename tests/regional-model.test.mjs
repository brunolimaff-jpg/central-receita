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

/* ------------------------------------------------------------------ */
/*  Escala única do mapa de calor (issue #21, critério 6)              */
/* ------------------------------------------------------------------ */

test('tom do calor usa as mesmas faixas do farol, não uma escala própria', () => {
  // Antes o mapa tinha 5 faixas e o farol 3: 60% saía salmão no mapa e
  // vermelho no chip, lado a lado. Agora o mapa herda o farol.
  for (const pct of [0, 0.5, 0.69, 0.7, 0.85, 0.99, 1, 1.4]) {
    assert.equal(M.tomDoCalor(pct), M.farolOf(pct), `pct ${pct}`)
  }
})

test('zero e indisponível não pintam igual', () => {
  // A regra do produto: ausente nunca vira zero. O mapa tinha os dois em vermelho.
  assert.equal(M.tomDoCalor(0), 'vermelho')
  assert.equal(M.tomDoCalor(null), 'indisponivel')
  assert.notEqual(M.tomDoCalor(0), M.tomDoCalor(null))
})

test('rótulo do calor: ausente nunca vira "0%"', () => {
  assert.equal(M.rotuloDoCalor(null), '—')
  assert.equal(M.rotuloDoCalor(NaN), '—')
  assert.equal(M.rotuloDoCalor(0), '0%')
  assert.equal(M.rotuloDoCalor(0.732), '73%')
})

/* ------------------------------------------------------------------ */
/*  Zero de meta propaga nulo, nunca zero (achado A2/A3 do parecer)    */
/* ------------------------------------------------------------------ */

test('filial sem meta: percentual nulo e farol nulo, não vermelho', () => {
  const semMeta = { sigla: 'XX', nome: 'Sem meta', metaClientesNovos: 0, clientesNovos: 0,
    rubricas: { licenca: { meta: 0, ganho: 0 }, manutencao: { meta: 0, ganho: 0 }, servico: { meta: 0, ganho: 0 } } }
  const b = M.resultadoFilial(semMeta, 'mrr')
  assert.equal(b.pct, null, 'pct deve ser null, nunca 0')
  assert.equal(b.farol, null, 'sem meta não há farol')
  assert.equal(b.falta, null, 'sem meta não há "falta"')
})

test('total sem filiais não afirma farol', () => {
  const b = M.resultadoTotal({ filiais: [] }, 'mrr')
  assert.equal(b.pct, null)
  assert.equal(b.farol, null)
})

test('conversão exigida sem Best case não diz "verde"', () => {
  // Antes: 0 ÷ 0 = 0, faixa verde — "alcançável" para uma carteira sem o que converter.
  const vazio = { meta: 1000, ganho: 0, fora: 0, categorias: [
    { categoria: 'Commit', bruto: 0, esperado: 0, n: 0 },
    { categoria: 'Best case', bruto: 0, esperado: 0, n: 0 },
    { categoria: 'Pipeline', bruto: 0, esperado: 0, n: 0 },
    { categoria: 'Omitido', bruto: 0, esperado: 0, n: 0 }] }
  const c = M.conversaoExigida(vazio)
  assert.equal(c.semFora, null)
  assert.equal(c.comFora, null)
  assert.equal(c.farol, null, 'sem Best case não há veredito')
})

/* ------------------------------------------------------------------ */
/*  Tier D fora do cenário (regra de REGRAS, antes não cumprida)       */
/* ------------------------------------------------------------------ */

test('oportunidade tier D não entra em nenhum cenário, mesmo com pb > 0', () => {
  const o = (tier, pb) => ({ id: 'x', filial: 'DF', exec: 'E', cliente: 'C', novo: false, data: '2026-10-30',
    tier, pb, mrr: 1000, nrr: 0, nota: 'ok', proximaAcao: 'a', proximaAcaoData: '2026-10-29',
    atualizadaEm: '2026-10-20', status: 'Em andamento', congelada: true })
  const r = M.porCategoria([o('D', 0.5), o('A', 0.5)], 'mrr')
  const omitido = r.find(c => c.categoria === 'Omitido')
  assert.equal(omitido.bruto, 0, 'D não pode somar valor ao cenário')
  assert.equal(omitido.esperado, 0, 'D não pode somar esperado ao cenário')
  assert.equal(omitido.n, 0, 'D não entra na contagem')
  // E o Commit, que existe, continua entrando.
  assert.equal(r.find(c => c.categoria === 'Commit').esperado, 500)
})

/* ------------------------------------------------------------------ */
/*  Recorte: o histórico não tem filial — e a tela precisa saber       */
/* ------------------------------------------------------------------ */

test('recorte por filial não finge filtrar o histórico de meses fechados', () => {
  const r = M.recortar(S, ['MS'])
  // O histórico é do negócio inteiro; recortar não pode inventar filial nele.
  assert.equal(r.hist.length, S.hist.length)
  assert.equal(r.histOpps.length, S.histOpps.length)
  // A calibração é, portanto, a mesma — e a tela avisa.
  assert.equal(M.calibracao(r.hist, 'mrr').rendimentoMedio, M.calibracao(S.hist, 'mrr').rendimentoMedio)
  const escopo = M.escopoDoRecorte(['MS'])
  assert.equal(escopo.parcial, true)
  assert.ok(escopo.aviso && escopo.aviso.length > 0)
  assert.equal(M.escopoDoRecorte(null).aviso, null)
})

/* ------------------------------------------------------------------ */
/*  Mapa lê o cenário Base, não o ganho                                */
/* ------------------------------------------------------------------ */

test('mapa: colunas de fluxo leem o cenário Base, não o ganho', () => {
  const calor = M.calorFilialRubrica(S)
  const sigla = S.filiais[0].sigla
  const base = calor.celulas.find(c => c.linha === sigla && c.coluna === 'MRR Base')
  const f = M.forecastFluxo(M.recortar(S, [sigla]), 'mrr')
  assert.equal(base.valor, f.pctBase, 'a célula "MRR Base" deve ser o Base ÷ meta do fluxo')
  // E é diferente do ganho: se fossem iguais, a coluna não estaria medindo o Base.
  const ganho = M.resultadoFilial(S.filiais[0], 'mrr').pct
  assert.notEqual(base.valor, ganho)
})

test('mapa: colunas de rubrica leem ganho, porque o Base não abre por rubrica', () => {
  const calor = M.calorFilialRubrica(S)
  const f = S.filiais[0]
  // Ratear o Base pela meta daria às três rubricas o mesmo número do fluxo.
  // A carga só traz MRR e NRR inteiros, não licença e serviço separados.
  for (const [coluna, rubrica] of [['Manutenção', 'manutencao'], ['Licença', 'licenca'], ['Serviço', 'servico']]) {
    const cel = calor.celulas.find(c => c.linha === f.sigla && c.coluna === coluna)
    const meta = f.rubricas[rubrica].meta
    const esperado = meta > 0 ? f.rubricas[rubrica].ganho / meta : null
    assert.equal(cel.valor, esperado, `${coluna} deve ser ganho ÷ meta da própria rubrica`)
  }
  // O agrupamento existe para a tela não deixar as duas leituras se confundirem.
  const grupos = calor.grupos
  assert.equal(grupos.length, 2)
  assert.equal(grupos[0].ate - grupos[0].de + 1, 3, 'três rubricas no primeiro grupo')
  assert.equal(grupos[1].ate - grupos[1].de + 1, 2, 'dois fluxos no segundo')
})

test('célula sem meta é indisponível, com rótulo —, não zero', () => {
  const s = JSON.parse(JSON.stringify(S))
  s.filiais[0].rubricas.licenca.meta = 0
  s.filiais[0].rubricas.licenca.ganho = 0
  const calor = M.calorFilialRubrica(s)
  const cel = calor.celulas.find(c => c.linha === s.filiais[0].sigla && c.coluna === 'Licença')
  assert.equal(cel.valor, null)
  assert.equal(cel.rotulo, '—')
  assert.equal(cel.tom, 'indisponivel')
})

test('mapa filial × dia: dia sem oportunidade é indisponível, não zero', () => {
  const calor = M.calorFilialDia(S, 'mrr')
  // Toda célula tem ou um valor conhecido, ou a marca de indisponível — nunca
  // um zero disfarçado de "não vai fechar nada".
  for (const c of calor.celulas) {
    if (c.valor === 0) assert.notEqual(c.tom, 'indisponivel', 'zero real não é ausência')
  }
})
