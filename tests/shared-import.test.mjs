import test from 'node:test'
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { DatabaseSync } from 'node:sqlite'
import { handleRequest } from '../backend/worker.js'
import { calculateForecastMonth } from '../src/features/comercial-v3/forecast-month.ts'
import { trajectorySnapshotFrom } from '../src/features/comercial-v3/trajectory-snapshot.ts'

// Aplica as migrações na ordem em que o Sites aplica (numérica), não só a inicial.
const migrations = new URL('../drizzle/', import.meta.url)
const schema = (await Promise.all(
  (await readdir(migrations)).filter(file => file.endsWith('.sql')).sort()
    .map(file => readFile(new URL(file, migrations), 'utf8')),
)).join('\n')
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Cuiaba', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

class SqliteD1 {
  constructor() {
    this.sqlite = new DatabaseSync(':memory:')
    this.sqlite.exec('PRAGMA foreign_keys = ON')
    this.sqlite.exec(schema)
    this.batchQueue = Promise.resolve()
  }

  prepare(sql) {
    const statement = this.sqlite.prepare(sql)
    const run = async (...values) => {
      if (statement.columns().length) return { success: true, results: statement.all(...values), meta: { changes: 0 } }
      const result = statement.run(...values)
      return { success: true, meta: { changes: Number(result.changes) } }
    }
    const bind = (...values) => ({
      run: async () => run(...values),
      first: async () => statement.get(...values) ?? null,
      all: async () => ({ success: true, results: statement.all(...values) }),
    })
    return { bind, ...bind() }
  }

  async batch(statements) {
    const operation = this.batchQueue.then(async () => {
      this.sqlite.exec('BEGIN')
      try {
        const results = []
        for (const statement of statements) results.push(await statement.run())
        this.sqlite.exec('COMMIT')
        return results
      } catch (error) {
        this.lastError = error
        this.sqlite.exec('ROLLBACK')
        throw error
      }
    })
    this.batchQueue = operation.catch(() => {})
    return operation
  }

  close() { this.sqlite.close() }
}

function makeEnv(DB = new SqliteD1()) {
  return {
    DB,
    SITE_ORIGIN: 'https://central.example',
    IMPORTER_USER_IDS: 'fabi-site-user',
    VIEWER_USER_IDS: 'giovanne-site-user',
    ASSETS: { fetch: async () => new Response('asset') },
  }
}

function record(kind, index = 1, overrides = {}) {
  return {
    row: index + 1,
    opportunityId: String(100 + index), orderId: kind === 'orders' ? String(200 + index) : '',
    accountId: String(10 + index), account: `Conta teste ${index}`, stage: 'Negociação', status: '', classification: '',
    representative: 'Unidade teste', executive: 'Executivo teste', ownerGroup: '', forecastDate: today,
    closingDate: null, conferenceDate: null, predictedValue: 1000, closedValue: null, maintenance: null,
    product: '', module: '', modality: '', ...overrides,
  }
}

function batch(kind, file, hash, records = [record(kind)]) {
  return {
    kind, records, issues: [], errorCount: 0, warningCount: 0,
    stats: { records: records.length, opportunities: records.length, orders: records.length, accounts: records.length, integratedOrders: 0, sourceNewOrders: 0 },
    filename: file, hash: hash.repeat(64), sheet: 'Sheet1', importedAt: new Date().toISOString(), referenceDate: today,
  }
}

function workspace({ opportunityHash = 'a', orderHash = 'b', opportunityRecords, orderRecords } = {}) {
  return {
    opportunities: batch('opportunities', 'Opp em andamento.xlsx', opportunityHash, opportunityRecords),
    orders: batch('orders', 'Pedidos Outubro 26.xlsx', orderHash, orderRecords ?? [record('orders', 1, { opportunityId: '101', accountId: '11', status: 'Integrado com ERP', classification: 'Novo' })]),
  }
}

function req(method, userId, body, extraHeaders = {}) {
  return new Request('https://central.example/api/imports/current', {
    method,
    headers: {
      ...(userId ? { 'oai-authenticated-user-id': userId } : {}),
      ...(method === 'PUT' ? { origin: 'https://central.example', 'content-type': 'application/json' } : {}),
      ...extraHeaders,
    },
    body: method === 'PUT' ? JSON.stringify(body) : undefined,
  })
}

async function getDraft(env, user = 'fabi-site-user') {
  const response = await handleRequest(req('GET', user), env)
  assert.equal(response.status, 200)
  const access = await response.json()
  assert.equal(access.canImport, user === 'fabi-site-user')
  return access.draft
}

test('Sites identity and server-side roles fail closed and distinguish importer from viewer', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())

  assert.equal((await handleRequest(req('GET', null), env)).status, 401)
  assert.equal((await handleRequest(req('GET', null, undefined, { 'x-user-id': 'fabi-site-user' }), env)).status, 401)
  assert.equal((await handleRequest(req('PUT', 'giovanne-site-user', {
    workspace: workspace(), previousRevision: null, referenceDate: today,
  }), env)).status, 403)
  assert.deepEqual(await (await handleRequest(req('GET', 'giovanne-site-user'), env)).json(), { draft: null, canImport: false })

  const noRoles = makeEnv()
  t.after(() => noRoles.DB.close())
  noRoles.IMPORTER_USER_IDS = ''
  noRoles.VIEWER_USER_IDS = ''
  assert.equal((await handleRequest(req('GET', 'fabi-site-user'), noRoles)).status, 503)
})

test('dispatcher email authorizes approved visitors despite Site-scoped ID differences', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  env.IMPORTER_EMAILS = 'fabi@example.com'
  env.VIEWER_EMAILS = 'bruno@example.com giovanne@example.com'
  const email = value => ({ 'oai-authenticated-user-email': value })
  const read = await handleRequest(req('GET', 'opaque-runtime-id', undefined, email('BRUNO@example.com')), env)
  assert.equal(read.status, 200)
  assert.equal((await read.json()).canImport, false)
  const importer = await handleRequest(req('GET', 'another-runtime-id', undefined, email('fabi@example.com')), env)
  assert.equal((await importer.json()).canImport, true)
  const payload = { workspace: workspace(), previousRevision: null, referenceDate: today }
  assert.equal((await handleRequest(req('PUT', 'opaque-runtime-id', payload, email('bruno@example.com')), env)).status, 403)
  assert.equal((await handleRequest(req('PUT', 'another-runtime-id', payload, email('fabi@example.com')), env)).status, 200)
  assert.equal((await handleRequest(req('GET', null, undefined, email('fabi@example.com')), env)).status, 401)
  assert.equal((await handleRequest(req('GET', 'unapproved', undefined, email('other@example.com')), env)).status, 403)
  assert.equal((await handleRequest(req('GET', 'unapproved', undefined, { 'x-user-email': 'fabi@example.com' }), env)).status, 403)
})

test('a valid import is stored in immutable chunks with server timestamps and served to readers', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  const rows = Array.from({ length: 2500 }, (_, index) => record('opportunities', index + 1, { account: `Conta ${index} ${'ç'.repeat(420)}` }))
  assert.ok(Buffer.byteLength(JSON.stringify(rows), 'utf8') > 2_000_000)
  const payload = { workspace: workspace({ opportunityRecords: rows }), previousRevision: null, referenceDate: today }
  const saved = await handleRequest(req('PUT', 'fabi-site-user', payload), env)
  assert.equal(saved.status, 200, env.DB.lastError?.message)
  const first = await saved.json()
  assert.match(first.revision, /^[0-9a-f-]{36}$/i)
  assert.match(first.opportunities.savedAt, /^\d{4}-\d\d-\d\dT.*Z$/)
  assert.match(first.orders.savedAt, /^\d{4}-\d\d-\d\dT.*Z$/)
  assert.equal(first.history[0].sources.length, 2)

  const reader = await getDraft(env, 'giovanne-site-user')
  assert.equal(reader.revision, first.revision)
  assert.equal(reader.opportunities.records.length, rows.length)
  assert.deepEqual(reader.opportunities.records.at(-1), rows.at(-1))
  assert.ok(env.DB.sqlite.prepare('SELECT COUNT(*) AS n FROM import_chunks WHERE revision = ?').get(first.revision).n > 1)
  assert.equal(env.DB.sqlite.prepare('SELECT MAX(length(CAST(records_json AS BLOB))) AS n FROM import_chunks').get().n <= 800_000, true)
})

test('optimistic conflict and a failed D1 batch keep the previous full snapshot active', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  const initial = await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: workspace(), previousRevision: null, referenceDate: today,
  }), env)
  const first = await initial.json()
  const nextWorkspace = workspace({ opportunityHash: 'c' })
  nextWorkspace.opportunities.records[0].predictedValue = 2500
  const secondResponse = await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: nextWorkspace, previousRevision: first.revision, referenceDate: today,
  }), env)
  assert.equal(secondResponse.status, 200, env.DB.lastError?.message)
  const second = await secondResponse.json()
  assert.notEqual(second.opportunities.savedAt, first.opportunities.savedAt)
  assert.equal(second.orders.savedAt, first.orders.savedAt)
  assert.deepEqual(second.history[0].sources, ['Opp em andamento.xlsx'])

  const staleWorkspace = workspace({ opportunityHash: 'd' })
  const stale = await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: staleWorkspace, previousRevision: first.revision, referenceDate: today,
  }), env)
  assert.equal(stale.status, 409)
  assert.equal((await getDraft(env)).revision, second.revision)
  assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) AS n FROM import_versions').get().n, 2)
  const oldChunk = env.DB.sqlite.prepare(`SELECT records_json FROM import_chunks WHERE revision = ? AND kind = 'opportunities' AND chunk_index = 0`).get(first.revision)
  assert.equal(JSON.parse(oldChunk.records_json)[0].predictedValue, 1000)

  env.DB.sqlite.exec(`CREATE TRIGGER fail_import_chunks BEFORE INSERT ON import_chunks BEGIN SELECT RAISE(ABORT, 'test failure'); END`)
  const failedWorkspace = workspace({ opportunityHash: 'e' })
  const failed = await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: failedWorkspace, previousRevision: second.revision, referenceDate: today,
  }), env)
  assert.equal(failed.status, 503)
  const preserved = await getDraft(env)
  assert.equal(preserved.revision, second.revision)
  assert.equal(preserved.opportunities.records[0].predictedValue, 2500)
  assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) AS n FROM import_versions').get().n, 2)
})

test('invalid IDs, dates, unknown sensitive columns and reconciliation conflicts never activate', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  const invalidCases = [
    current => { current.opportunities.records[0].accountId = '0' },
    current => { current.opportunities.records[0].forecastDate = '2026-02-31' },
    current => { current.opportunities.records[0].email = 'person@example.invalid' },
    current => { current.orders.records[0].accountId = '999' },
    current => { current.opportunities.referenceDate = '2026-10-04' },
  ]
  for (const mutate of invalidCases) {
    const candidate = structuredClone(workspace())
    mutate(candidate)
    const response = await handleRequest(req('PUT', 'fabi-site-user', {
      workspace: candidate, previousRevision: null, referenceDate: today,
    }), env)
    assert.equal(response.status, 422)
    assert.equal(await getDraft(env), null)
  }
  assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) AS n FROM import_versions').get().n, 0)
})

test('two concurrent first imports activate exactly one complete version', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  const first = handleRequest(req('PUT', 'fabi-site-user', {
    workspace: workspace({ opportunityHash: 'a' }), previousRevision: null, referenceDate: today,
  }), env)
  const second = handleRequest(req('PUT', 'fabi-site-user', {
    workspace: workspace({ opportunityHash: 'c' }), previousRevision: null, referenceDate: today,
  }), env)
  const responses = await Promise.all([first, second])
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 409])
  assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) AS n FROM import_versions').get().n, 1)
  assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) AS n FROM import_current').get().n, 1)
  const draft = await getDraft(env)
  assert.equal(draft.opportunities.records.length, 1)
  assert.ok(['a'.repeat(64), 'c'.repeat(64)].includes(draft.opportunities.hash))
})

test('unrelated paths use static assets and unknown API routes remain API 404s', async () => {
  const env = makeEnv()
  const asset = await handleRequest(new Request('https://central.example/config.html'), env)
  assert.equal(await asset.text(), 'asset')
  assert.equal((await handleRequest(new Request('https://central.example/api/other'), env)).status, 404)
  env.DB.close()
})

function previousReq(userId, method = 'GET') {
  return new Request('https://central.example/api/imports/previous', {
    method, headers: userId ? { 'oai-authenticated-user-id': userId } : {},
  })
}

function dbSnapshot(env) {
  return ['import_versions', 'import_chunks', 'import_current']
    .map(table => env.DB.sqlite.prepare(`SELECT * FROM ${table} ORDER BY 1, 2`).all())
}

test('previous returns 404 no_previous when there is no earlier version', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  const empty = await handleRequest(previousReq('fabi-site-user'), env)
  assert.equal(empty.status, 404)
  assert.deepEqual(await empty.json(), { error: 'no_previous' })
  await handleRequest(req('PUT', 'fabi-site-user', { workspace: workspace(), previousRevision: null, referenceDate: today }), env)
  const single = await handleRequest(previousReq('giovanne-site-user'), env)
  assert.equal(single.status, 404)
  assert.deepEqual(await single.json(), { error: 'no_previous' })
})

test('previous returns the first import while current returns the second, without writing', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  const first = await (await handleRequest(req('PUT', 'fabi-site-user', { workspace: workspace(), previousRevision: null, referenceDate: today }), env)).json()
  const next = workspace({ opportunityHash: 'c' })
  next.opportunities.records[0].predictedValue = 2500
  const second = await (await handleRequest(req('PUT', 'fabi-site-user', { workspace: next, previousRevision: first.revision, referenceDate: today }), env)).json()

  const before = dbSnapshot(env)
  const response = await handleRequest(previousReq('giovanne-site-user'), env)
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.deepEqual(Object.keys(body).sort(), ['canImport', 'draft'])
  assert.equal(body.canImport, false)
  assert.equal(body.draft.revision, first.revision)
  assert.equal(body.draft.opportunities.records[0].predictedValue, 1000)
  assert.equal(body.draft.history.length, 1)
  const current = await getDraft(env, 'giovanne-site-user')
  assert.equal(current.revision, second.revision)
  assert.deepEqual(Object.keys(body.draft).sort(), Object.keys(current).sort())
  assert.equal((await handleRequest(previousReq('fabi-site-user', 'PUT'), env)).status, 405)
  assert.deepEqual(dbSnapshot(env), before)
})

// --- Ticket 03: snapshot numérico no histórico de cargas ---

test('a carga confirmada grava o snapshot numérico e o devolve no histórico', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  const saved = await (await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: workspace(), previousRevision: null, referenceDate: today,
  }), env)).json()
  assert.deepEqual(saved.history[0].snapshot, {
    forecastTotal: 1000, entered: null, exited: null, changed: null, realized: 0,
  })
  const stored = env.DB.sqlite.prepare('SELECT snapshot_json FROM import_versions WHERE revision = ?').get(saved.revision)
  assert.deepEqual(JSON.parse(stored.snapshot_json), saved.history[0].snapshot)

  const draft = await getDraft(env, 'giovanne-site-user')
  assert.deepEqual(draft.history[0].snapshot, saved.history[0].snapshot)
})

test('duas cargas guardam snapshots distintos, com o movimento da segunda', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  const first = await (await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: workspace(), previousRevision: null, referenceDate: today,
  }), env)).json()
  const next = workspace({ opportunityHash: 'c' })
  next.opportunities.records[0].predictedValue = 2500
  const second = await (await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: next, previousRevision: first.revision, referenceDate: today,
  }), env)).json()
  // Com carga anterior, movimento vazio é zero legítimo — a ponte precisa do
  // número para a conta fechar; `null` fica reservado a valor desconhecido.
  assert.deepEqual(second.history[0].snapshot, {
    forecastTotal: 2500, entered: 0, exited: 0, changed: 1500, realized: 0,
  })
  assert.deepEqual(second.history[1].snapshot, first.history[0].snapshot)
  assert.notDeepEqual(second.history[0].snapshot, second.history[1].snapshot)
  const rows = env.DB.sqlite.prepare('SELECT snapshot_json FROM import_versions ORDER BY sequence').all()
  assert.equal(rows.length, 2)
  assert.notEqual(rows[0].snapshot_json, rows[1].snapshot_json)
})

test('carga anterior à migração tem snapshot_json nulo e a leitura não lança', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  const saved = await (await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: workspace(), previousRevision: null, referenceDate: today,
  }), env)).json()
  env.DB.sqlite.prepare('UPDATE import_versions SET snapshot_json = NULL WHERE revision = ?').run(saved.revision)
  const draft = await getDraft(env, 'giovanne-site-user')
  assert.equal(draft.revision, saved.revision)
  assert.equal(draft.history[0].snapshot, undefined)
  assert.equal(draft.history[0].at, saved.history[0].at)
  assert.deepEqual(draft.history[0].sources, saved.history[0].sources)
})

test('snapshot_json corrompido é omitido da leitura, sem derrubar o histórico', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  const saved = await (await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: workspace(), previousRevision: null, referenceDate: today,
  }), env)).json()
  env.DB.sqlite.prepare('UPDATE import_versions SET snapshot_json = ? WHERE revision = ?').run('{"truncado', saved.revision)
  const draft = await getDraft(env, 'giovanne-site-user')
  assert.equal(draft.history.length, 1)
  assert.equal(draft.history[0].snapshot, undefined)
  assert.match(draft.history[0].at, /^\d{4}-\d\d-\d\dT.*Z$/)
})

test('o histórico continua truncado em 20 cargas, com snapshots da mais nova à mais antiga', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  const hex = index => index.toString(16).padStart(64, '0')
  let revision = null
  for (let index = 0; index < 25; index++) {
    const next = workspace()
    next.opportunities.hash = hex(index)
    next.opportunities.records[0].predictedValue = 1000 + index
    const body = { workspace: next, previousRevision: revision, referenceDate: today }
    const response = await handleRequest(req('PUT', 'fabi-site-user', body), env)
    assert.equal(response.status, 200, env.DB.lastError?.message)
    revision = (await response.json()).revision
  }
  const draft = await getDraft(env, 'giovanne-site-user')
  assert.equal(draft.history.length, 20)
  assert.equal(draft.history[0].snapshot.forecastTotal, 1024)
  assert.equal(draft.history.at(-1).snapshot.forecastTotal, 1005)
  assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) AS n FROM import_versions').get().n, 25)
})

test('o snapshot do worker coincide com o do módulo do cliente para a mesma carga', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  const month = today.slice(0, 7)
  const chance = (index, stage, probability, predictedValue) => record('opportunities', index, {
    stage, probability, predictedValue, forecastDate: today,
  })
  const firstWorkspace = workspace({
    opportunityRecords: [chance(1, 'Negociação', 0.8, 15000), chance(2, 'Proposta', 0.5, 9000)],
  })
  const first = await (await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: firstWorkspace, previousRevision: null, referenceDate: today,
  }), env)).json()
  const current = workspace({
    opportunityHash: 'c',
    opportunityRecords: [chance(1, 'Negociação', 0.5, 12000), chance(2, 'Proposta', 0.9, 4000)],
  })
  const second = await (await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: current, previousRevision: first.revision, referenceDate: today,
  }), env)).json()

  const expected = trajectorySnapshotFrom(
    calculateForecastMonth(current.opportunities.records, firstWorkspace.opportunities.records, month, today, 'mês'),
    calculateForecastMonth(firstWorkspace.opportunities.records, null, month, today, 'mês'),
  )
  assert.deepEqual(second.history[0].snapshot, expected)
  // E o corte de 75% do worker também é o mesmo: só a de 90% fica no previsto.
  assert.equal(second.history[0].snapshot.forecastTotal, 4000)
})

test('valor desconhecido na carga anterior contamina a variação do snapshot, sem virar zero', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  const withoutValue = record('opportunities', 1, { predictedValue: null })
  const first = await (await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: workspace({ opportunityRecords: [withoutValue] }), previousRevision: null, referenceDate: today,
  }), env)).json()
  const second = await (await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: workspace({ opportunityHash: 'c' }), previousRevision: first.revision, referenceDate: today,
  }), env)).json()
  assert.equal(second.history[0].snapshot.changed, null)
  assert.equal(second.history[0].snapshot.forecastTotal, 1000)
})

test('carga só de pedidos não grava snapshot, em vez de gravar zero falso', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  const ordersOnly = { opportunities: null, orders: workspace().orders }
  const saved = await (await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: ordersOnly, previousRevision: null, referenceDate: today,
  }), env)).json()
  assert.equal(saved.history[0].snapshot, undefined)
  assert.equal(env.DB.sqlite.prepare('SELECT snapshot_json FROM import_versions').get().snapshot_json, null)
})

test('chave extra no corpo do PUT continua sendo rejeitada, inclusive um snapshot enviado pelo cliente', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  const payload = {
    workspace: workspace(), previousRevision: null, referenceDate: today,
    snapshot: { forecastTotal: 1, entered: 0, exited: 0, changed: 0, realized: 0 },
  }
  const response = await handleRequest(req('PUT', 'fabi-site-user', payload), env)
  assert.equal(response.status, 422)
  assert.deepEqual(await response.json(), { error: 'invalid_request' })
  assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) AS n FROM import_versions').get().n, 0)
})

test('previous applies the same authentication and authorization as current', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  for (const user of [null, 'unapproved']) {
    const cur = await handleRequest(req('GET', user), env)
    const prev = await handleRequest(previousReq(user), env)
    assert.equal(prev.status, cur.status)
    assert.deepEqual(await prev.json(), await cur.json())
  }
  const wrongOrigin = new Request('https://other.example/api/imports/previous', { headers: { 'oai-authenticated-user-id': 'fabi-site-user' } })
  assert.equal((await handleRequest(wrongOrigin, env)).status, 403)
})

/* ---------- COR02: o worker compara cargas pelo mês de referência de cada uma ---------- */

test('COR02: carga anterior de outro mês grava movimento nulo, nunca zero', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  // Setembro carregado em 30/09 e outubro em 01/10: a virada de mês é permitida.
  const setembro = workspace({ opportunityRecords: [record('opportunities', 1, { forecastDate: '2026-09-20', predictedValue: 900 })] })
  setembro.opportunities.referenceDate = '2026-09-30'
  setembro.orders.referenceDate = '2026-09-30'
  const first = await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: setembro, previousRevision: null, referenceDate: '2026-09-30',
  }), env)
  assert.equal(first.status, 200, env.DB.lastError?.message)
  const primeira = await first.json()

  const outubro = workspace({ opportunityHash: 'c', opportunityRecords: [record('opportunities', 1, { forecastDate: '2026-10-01', predictedValue: 1000 })] })
  outubro.opportunities.referenceDate = '2026-10-01'
  outubro.orders.referenceDate = '2026-10-01'
  const second = await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: outubro, previousRevision: primeira.revision, referenceDate: '2026-10-01',
  }), env)
  assert.equal(second.status, 200, env.DB.lastError?.message)
  const snapshot = (await second.json()).history[0].snapshot
  assert.equal(snapshot.forecastTotal, 1000)
  assert.equal(snapshot.entered, null, 'não inventa entrada ao trocar de mês')
  assert.equal(snapshot.exited, null, 'não inventa saída ao trocar de mês')
  assert.equal(snapshot.changed, null)
})

/* ---------- P2: snapshot só quando a foto de oportunidades muda ---------- */

test('P2: pedidos-only com opp de outubro e pedido de setembro não cria snapshot', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  const outubro = workspace({ opportunityRecords: [record('opportunities', 1, { forecastDate: '2026-10-20' })] })
  outubro.opportunities.referenceDate = '2026-10-20'
  outubro.orders.referenceDate = '2026-10-20'
  const first = await (await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: outubro, previousRevision: null, referenceDate: '2026-10-20',
  }), env)).json()

  const setembro = workspace({ opportunityHash: 'a', orderHash: 'c' })
  setembro.opportunities = structuredClone(outubro.opportunities)
  setembro.orders.referenceDate = '2026-09-30'
  setembro.orders.records[0].closingDate = '2026-09-30'
  const second = await (await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: setembro, previousRevision: first.revision, referenceDate: '2026-09-30',
  }), env))
  const secondBody = await second.json()
  assert.equal(second.status, 200, JSON.stringify(secondBody))

  assert.equal(secondBody.history[0].snapshot, undefined)
  assert.deepEqual(secondBody.history[0].sources, ['Pedidos Outubro 26.xlsx'])
  assert.equal(secondBody.history[0].referenceDate, '2026-09-30')
  assert.deepEqual(secondBody.history[1].snapshot, first.history[0].snapshot)
})

test('P2: opp novo conteúdo cria snapshot; hash igual com nova referência de opps também', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  const primeiro = workspace({ opportunityRecords: [record('opportunities', 1, { forecastDate: '2026-10-20', predictedValue: 1000 })] })
  primeiro.opportunities.referenceDate = '2026-10-20'
  primeiro.orders.referenceDate = '2026-10-20'
  const first = await (await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: primeiro, previousRevision: null, referenceDate: '2026-10-20',
  }), env)).json()

  const novo = workspace({ opportunityHash: 'c', opportunityRecords: [record('opportunities', 1, { forecastDate: '2026-10-20', predictedValue: 1500 })] })
  novo.opportunities.referenceDate = '2026-10-21'
  novo.orders.referenceDate = '2026-10-21'
  const second = await (await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: novo, previousRevision: first.revision, referenceDate: '2026-10-21',
  }), env)).json()
  assert.equal(second.history[0].snapshot.forecastTotal, 1500)
  assert.equal(second.history[0].snapshot.changed, 500)

  const mesmaHash = workspace({ opportunityHash: 'c', opportunityRecords: [record('opportunities', 1, { forecastDate: '2026-10-20', predictedValue: 1500 })] })
  mesmaHash.opportunities.referenceDate = '2026-10-22'
  mesmaHash.orders.referenceDate = '2026-10-22'
  const third = await (await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: mesmaHash, previousRevision: second.revision, referenceDate: '2026-10-22',
  }), env)).json()
  assert.equal(third.history[0].snapshot.forecastTotal, 1500)
})

test('P2: mesma hash e mesma referência em pedidos-only não duplica o ponto de opp', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  const base = workspace({ opportunityRecords: [record('opportunities', 1, { forecastDate: '2026-10-20' })] })
  base.opportunities.referenceDate = '2026-10-20'
  base.orders.referenceDate = '2026-10-20'
  const first = await (await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: base, previousRevision: null, referenceDate: '2026-10-20',
  }), env)).json()

  const pedidos = workspace({ opportunityHash: 'a', orderHash: 'd' })
  pedidos.opportunities = structuredClone(base.opportunities)
  pedidos.orders.referenceDate = '2026-10-20'
  pedidos.orders.records[0].predictedValue = null
  const second = await (await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: pedidos, previousRevision: first.revision, referenceDate: '2026-10-20',
  }), env))
  const secondBody = await second.json()
  assert.equal(second.status, 200, JSON.stringify(secondBody))
  assert.equal(secondBody.history[0].snapshot, undefined)
  const snapshots = secondBody.history.filter(entrada => entrada.snapshot)
  assert.equal(snapshots.length, 1)
  assert.equal(snapshots[0].snapshot.forecastTotal, 1000)
})

test('COR02: cargas do mesmo mês em dias diferentes continuam comparando (20/10 → 21/10)', async t => {
  const env = makeEnv()
  t.after(() => env.DB.close())
  const primeiro = workspace({ opportunityRecords: [record('opportunities', 1, { forecastDate: '2026-10-20', predictedValue: 1000 })] })
  primeiro.opportunities.referenceDate = '2026-10-20'
  primeiro.orders.referenceDate = '2026-10-20'
  const first = await (await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: primeiro, previousRevision: null, referenceDate: '2026-10-20',
  }), env)).json()
  const segundo = workspace({ opportunityHash: 'c', opportunityRecords: [record('opportunities', 1, { forecastDate: '2026-10-20', predictedValue: 1200 })] })
  segundo.opportunities.referenceDate = '2026-10-21'
  segundo.orders.referenceDate = '2026-10-21'
  const response = await handleRequest(req('PUT', 'fabi-site-user', {
    workspace: segundo, previousRevision: first.revision, referenceDate: '2026-10-21',
  }), env)
  assert.equal(response.status, 200, env.DB.lastError?.message)
  const snapshot = (await response.json()).history[0].snapshot
  assert.equal(snapshot.forecastTotal, 1200)
  assert.equal(snapshot.entered, 0)
  assert.equal(snapshot.exited, 0)
  assert.equal(snapshot.changed, 200)
})
