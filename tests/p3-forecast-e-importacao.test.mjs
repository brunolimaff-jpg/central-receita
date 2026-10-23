import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { calculateForecastMonth } from '../src/features/comercial-v3/forecast-month.ts'
import { fonteCarregada } from '../src/features/comercial-v3/manual-import.ts'

/**
 * Issue #18 — os dois P3 registrados no comentário da #16 depois que ela
 * fechou no merge da PR #17.
 *
 * P3-a: o rodapé do critério no Forecast lia `monthResult.period`, calculado
 * sempre no mês, e anunciava 01–31/10 mesmo com cartões recortados na semana.
 * P3-b: "O que já está carregado" lia `workspace`, que inclui a leitura
 * recém-feita — um arquivo com erros, nunca salvo, aparecia como carregado.
 */

const ler = (caminho) => readFileSync(new URL(caminho, import.meta.url), 'utf8')
const forecast = () => ler('../src/features/comercial-v3/screens/import-forecast-screen.tsx')
const importScreen = () => ler('../src/features/comercial-v3/screens/import-screen.tsx')

const rec = (overrides = {}) => ({
  row: 1, opportunityId: 'OP-1', orderId: '', accountId: 'C-1', account: 'Conta 1',
  stage: 'Proposta', status: '', classification: '', representative: 'Filial Sul', executive: 'Ana',
  ownerGroup: '', forecastDate: '2026-10-22', closingDate: null, conferenceDate: null,
  predictedValue: 1000, closedValue: null, maintenance: null, product: '', module: '', modality: '',
  probability: 0.9,
  ...overrides,
})

const batch = (overrides = {}) => ({
  kind: 'opportunities', records: [], issues: [], errorCount: 0, warningCount: 0,
  stats: { records: 0, opportunities: 0, orders: 0, accounts: 0, integratedOrders: 0, sourceNewOrders: 0 },
  ...overrides,
})

// ---------------------------------------------------------------------------
// P3-a — o rodapé segue a janela selecionada
// ---------------------------------------------------------------------------

test('P3-a: Semana mostra 19–25/10 e Mês mostra 01–31/10 — a janela que o rodapé deve anunciar', () => {
  const atual = [rec()]
  const semana = calculateForecastMonth(atual, null, '2026-10', '2026-10-22', 'semana')
  const mes = calculateForecastMonth(atual, null, '2026-10', '2026-10-22', 'mês')
  assert.deepEqual(semana.period, { start: '2026-10-19', end: '2026-10-25' })
  assert.deepEqual(mes.period, { start: '2026-10-01', end: '2026-10-31' })
})

test('P3-a: o rodapé de import-forecast-screen lê result.period, não monthResult.period', () => {
  const texto = forecast()
  const rodape = texto.match(/\{' '\}Previsão de \{[^}]+\} a \{[^}]+\}\./)
  assert.ok(rodape, 'o rodapé do critério continua na tela')
  assert.match(rodape[0], /dataCurta\(result\.period\.start\)/)
  assert.match(rodape[0], /dataCurta\(result\.period\.end\)/)
  assert.doesNotMatch(rodape[0], /monthResult\.period/)
})

// ---------------------------------------------------------------------------
// P3-b — "O que já está carregado" fala só do que foi salvo
// ---------------------------------------------------------------------------

test('P3-b: sem carga salva, a fonte não aparece como carregada', () => {
  assert.equal(fonteCarregada(null), null)
})

test('P3-b: carga salva expõe nome, referência e horário do retrato', () => {
  const salvo = batch({ filename: 'vendas.csv', referenceDate: '2026-10-22', savedAt: '2026-10-22T13:05:00.000Z' })
  assert.deepEqual(fonteCarregada(salvo), {
    filename: 'vendas.csv',
    referenceDate: '2026-10-22',
    quando: '2026-10-22T13:05:00.000Z',
  })
})

test('P3-b: horário inválido não vira data inventada', () => {
  const salvo = batch({ filename: 'vendas.csv', referenceDate: '2026-10-22', savedAt: 'ontem à tarde' })
  assert.equal(fonteCarregada(salvo).quando, null)
})

test('P3-b: sem savedAt nem importedAt, o horário fica nulo', () => {
  assert.equal(fonteCarregada(batch({ filename: 'vendas.csv' })).quando, null)
})

test('P3-b: um lote com erro não é fonte carregada — só o salvo conta', () => {
  // A função só aceita o estado persistido; um lote com erro nunca chega aqui
  // pela tela, e quando chega continua descrevendo o arquivo, não a gravação.
  const rejeitado = batch({ filename: 'errado.csv', errorCount: 8 })
  assert.equal(fonteCarregada(rejeitado).filename, 'errado.csv')
  assert.equal(fonteCarregada(rejeitado).quando, null)
})

test('P3-b: o painel lê draft, nunca workspace nem staged', () => {
  const texto = importScreen()
  const painel = texto.slice(texto.indexOf('O que já está carregado'), texto.indexOf('<div className="grid items-start gap-4 xl:grid-cols-2">'))
  assert.match(painel, /carregadas\[kind\]/)
  assert.doesNotMatch(painel, /workspace\[kind\]/)
  assert.match(texto, /fonteCarregada\(draft\?\.opportunities/)
  assert.match(texto, /fonteCarregada\(draft\?\.orders/)
})

// ---------------------------------------------------------------------------
// Segundo commit: falha de consulta não pode virar "sem carga"
// ---------------------------------------------------------------------------

const executivo = () => ler('../src/features/comercial-v3/screens/executive-page.tsx')
const app = () => ler('../src/features/comercial-v3/commercial-v3-app.tsx')

test('a seção vazia distingue carregando, falha e ausência de carga', () => {
  const texto = executivo()
  assert.match(texto, /if \(carregando\) return 'Carregando a última carga…'/)
  assert.match(texto, /if \(falha\) return 'Não foi possível consultar a carga/)
  assert.match(texto, /return 'Sem carga importada para esta seção\.'/)
})

test('a falha aparece em âmbar na seção, não como texto apagado de vazio', () => {
  const texto = executivo()
  assert.match(texto, /falha && !carregando \? 'text-\[13px\] text-dado-atencao' : 'text-\[13px\] text-ink-muted'/)
})

test('o cartão principal da Visão Executiva oferece tentar de novo quando a consulta falha', () => {
  const texto = executivo()
  assert.match(texto, /falha \? 'Não foi possível consultar a carga\.' : 'Nenhuma carga importada\.'/)
  assert.match(texto, /Tentar novamente/)
})

test('o prazo de segurança termina o loading com erro de consulta, nunca com estado vazio', () => {
  const texto = app()
  const bloco = texto.slice(texto.indexOf('const armarPrazo'), texto.indexOf('const refresh'))
  assert.match(bloco, /setImportLoading\(false\)/)
  assert.match(bloco, /setImportError\(/)
  assert.doesNotMatch(bloco, /setImportDraft\(/)
  assert.match(bloco, /A consulta da última carga não terminou/)
})

test('o prazo chega ao ExecutivePage como falha, separado de carregando', () => {
  const texto = app()
  assert.match(texto, /carregando=\{importLoading && !importDraft\} falha=\{importError \|\| null\}/)
})

// ---------------------------------------------------------------------------
// Segundo commit, achados da auditoria independente
// ---------------------------------------------------------------------------

const sistema = () => ler('../src/features/comercial-v3/screens/system-screen.tsx')
const sidebar = () => ler('../src/features/comercial-v3/components/commercial-sidebar.tsx')

test('Sistema de Receita marca a origem de cada bloco', () => {
  const texto = sistema()
  assert.match(texto, /<OrigemDado tipo="demonstrativo">Indicadores abaixo: snapshot demonstrativo/)
  assert.match(texto, /<OrigemDado tipo="demonstrativo">Snapshot demonstrativo<\/OrigemDado>/)
  assert.match(texto, /tipo=\{filiaisReais \? 'real' : 'demonstrativo'\}/)
  assert.match(texto, /Agregado real exportado de setembro\/2026/)
})

test('Sistema de Receita não promete que o rail é sempre real', () => {
  const texto = sistema()
  // O cabeçalho antigo dizia "O rail de filiais informa quando usa o agregado
  // real"; a etiqueta agora é por bloco, e o texto não pode afirmar o geral.
  assert.doesNotMatch(texto, /O rail de filiais informa quando usa o agregado real de setembro/)
})

test('o ponto preliminar chega ao leitor de tela por texto, não só por title', () => {
  const texto = sidebar()
  assert.match(texto, /<span className="sr-only"> \(versão preliminar\)<\/span>/)
  assert.match(texto, /aria-hidden className="revenue-nav-selo"/)
})

test('a decisão de liberar as quatro áreas está registrada no plano', () => {
  const plano = ler('../docs/PLANO-VISAO-EXECUTIVA.md')
  assert.match(plano, /Decisão posterior \(23\/10\/2026/)
  assert.match(plano, /foram \*\*liberadas\*\* na navegação/)
  assert.match(plano, /Esta nota prevalece sobre a linha anterior/)
})

// ---------------------------------------------------------------------------
// Terceiro commit: o prazo pertence à consulta vigente
// ---------------------------------------------------------------------------

test('o prazo é rearmado a cada consulta, não uma vez por efeito', () => {
  const texto = app()
  // `armarPrazo` é chamado dentro de refresh(), então uma consulta nova
  // substitui o prazo da anterior em vez de conviver com ele.
  assert.match(texto, /const armarPrazo = \(epoch: number\) =>/)
  assert.match(texto, /armarPrazo\(epoch\)/)
  // armado dentro do refresh, depois do epoch novo
  const refresh = texto.slice(texto.indexOf('const refresh = () => {'), texto.indexOf('void refresh()'))
  const posEpoch = refresh.indexOf('importEpoch.current')
  const posArma = refresh.indexOf('armarPrazo(epoch)')
  assert.ok(posEpoch !== -1 && posArma > posEpoch, 'armarPrazo deve vir depois do epoch novo')
})

test('o prazo vencido só age se a consulta que o armou continua vigente', () => {
  const texto = app()
  const bloco = texto.slice(texto.indexOf('const armarPrazo'), texto.indexOf('const refresh'))
  assert.match(bloco, /epoch !== importEpoch\.current/)
  // Uma consulta velha que vence depois que outra assumiu não pode anunciar
  // erro sobre dados que chegaram.
  assert.match(bloco, /setImportError/)
})

test('a consulta que termina limpa o próprio prazo', () => {
  const texto = app()
  const fim = texto.slice(texto.indexOf('.finally(() => { if (active && epoch === importEpoch.current)'), texto.indexOf('void refresh()'))
  assert.match(fim, /window\.clearTimeout\(prazo\)/)
})

test('o aria-label do cartão vazio acompanha o estado', () => {
  const texto = executivo()
  assert.match(texto, /aria-label=\{carregando \? 'Carregando a última carga' : falha \? 'Falha ao consultar a carga' : 'Sem carga importada'\}/)
})
