import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DatabaseSync } from 'node:sqlite'
import { handleRequest } from '../backend/worker.js'

const schema = await readFile(new URL('../drizzle/0000_shared_import.sql', import.meta.url), 'utf8')
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
