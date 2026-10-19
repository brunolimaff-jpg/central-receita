const API_PATH = '/api/imports/current'
const PREVIOUS_API_PATH = '/api/imports/previous'
const MAX_BODY_BYTES = 32 * 1024 * 1024
const MAX_CHUNK_BYTES = 800_000
const MAX_CHUNKS = 45
const MAX_HISTORY = 20
const KINDS = ['opportunities', 'orders']
const RECORD_KEYS = [
  'row', 'opportunityId', 'orderId', 'accountId', 'account', 'stage', 'status', 'classification',
  'representative', 'executive', 'ownerGroup', 'forecastDate', 'closingDate', 'conferenceDate',
  'predictedValue', 'closedValue', 'maintenance', 'product', 'module', 'modality',
]
const OPTIONAL_RECORD_KEYS = ['probability']
const BATCH_KEYS = [
  'kind', 'records', 'issues', 'errorCount', 'warningCount', 'stats', 'filename', 'hash', 'sheet',
  'importedAt', 'referenceDate', 'savedAt',
]
const STAT_KEYS = ['records', 'opportunities', 'orders', 'accounts', 'integratedOrders', 'sourceNewOrders']
const textEncoder = new TextEncoder()

class HttpError extends Error {
  constructor(status, code) {
    super(code)
    this.status = status
    this.code = code
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function hasExactKeys(value, allowed, required = allowed) {
  return isObject(value) && required.every(key => Object.hasOwn(value, key)) &&
    Object.keys(value).every(key => allowed.includes(key))
}

function fail(code) {
  throw new HttpError(422, code)
}

function localDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Cuiaba', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now)
}

function validDate(value, latest = '2100-12-31', earliest = '1900-01-01') {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < earliest || value > latest) return false
  const date = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function currentRevision(value) {
  return value === null || (typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))
}

function cleanText(value, max = 512) {
  return typeof value === 'string' && value.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
}

export function validateRecord(value, kind) {
  if (!hasExactKeys(value, RECORD_KEYS.concat(OPTIONAL_RECORD_KEYS), RECORD_KEYS)) fail('invalid_record_shape')
  if (!Number.isInteger(value.row) || value.row < 2 || value.row > 50_001) fail('invalid_row')
  for (const key of RECORD_KEYS.slice(1, 11).concat(['product', 'module', 'modality'])) {
    if (!cleanText(value[key], key === 'account' || key === 'representative' || key === 'executive' ? 512 : 256)) fail('invalid_text_field')
  }
  for (const key of ['opportunityId', 'accountId']) {
    if (!/^\d{1,64}$/.test(value[key]) || /^0+$/.test(value[key])) fail('invalid_id')
  }
  if (kind === 'orders' && (!/^\d{1,64}$/.test(value.orderId) || /^0+$/.test(value.orderId))) fail('invalid_id')
  if (kind === 'opportunities' && value.orderId !== '' && (!/^\d{1,64}$/.test(value.orderId) || /^0+$/.test(value.orderId))) fail('invalid_id')
  for (const key of ['forecastDate', 'closingDate', 'conferenceDate']) {
    if (value[key] !== null && !validDate(value[key])) fail('invalid_date')
  }
  for (const key of ['predictedValue', 'closedValue', 'maintenance']) {
    if (value[key] !== null && (typeof value[key] !== 'number' || !Number.isFinite(value[key]) || Math.abs(value[key]) > Number.MAX_SAFE_INTEGER)) fail('invalid_number')
  }
  const clean = Object.fromEntries(RECORD_KEYS.map(key => [key, value[key]]))
  if (!Object.hasOwn(value, 'probability')) return clean
  const probability = value.probability
  if (probability !== null && (typeof probability !== 'number' || !Number.isFinite(probability) || probability < 0 || probability > 1)) fail('invalid_number')
  return { ...clean, probability }
}

function normalizeText(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toUpperCase()
}

function computedStats(kind, records) {
  const opportunities = new Set(records.map(record => record.opportunityId))
  const orders = new Map()
  for (const record of records) {
    if (!record.orderId) continue
    const group = orders.get(record.orderId)
    if (group) group.push(record); else orders.set(record.orderId, [record])
  }
  return {
    records: records.length,
    opportunities: opportunities.size,
    orders: orders.size,
    accounts: new Set(records.map(record => record.accountId)).size,
    integratedOrders: kind === 'orders'
      ? [...orders.values()].filter(group => group.every(record => normalizeText(record.status) === 'INTEGRADO COM ERP')).length
      : 0,
    sourceNewOrders: kind === 'orders'
      ? [...orders.values()].filter(group => group.every(record => normalizeText(record.classification) === 'NOVO')).length
      : 0,
  }
}

function validateBatch(value, kind) {
  const required = ['kind', 'records', 'issues', 'errorCount', 'warningCount', 'stats', 'filename', 'hash', 'sheet', 'referenceDate']
  if (!hasExactKeys(value, BATCH_KEYS, required) || value.kind !== kind) fail('invalid_batch_shape')
  if (!Array.isArray(value.records) || value.records.length === 0 || value.records.length > 50_000) fail('invalid_record_count')
  if (!Array.isArray(value.issues) || value.issues.length > 50) fail('invalid_issues')
  if (value.errorCount !== 0 || !Number.isInteger(value.warningCount) || value.warningCount < value.issues.length || value.warningCount > value.records.length * 20) fail('unresolved_import_errors')
  if (!isObject(value.stats) || !hasExactKeys(value.stats, STAT_KEYS) || STAT_KEYS.some(key => !Number.isInteger(value.stats[key]) || value.stats[key] < 0)) fail('invalid_stats')
  if (typeof value.filename !== 'string' || value.filename.length === 0 || value.filename.length > 255 || /[\\/\u0000-\u001f]/.test(value.filename)) fail('invalid_filename')
  if (typeof value.hash !== 'string' || !/^[a-f0-9]{64}$/i.test(value.hash)) fail('invalid_hash')
  if (!cleanText(value.sheet, 255) || !validDate(value.referenceDate, localDate())) fail('invalid_source_metadata')
  if (value.importedAt !== undefined && (typeof value.importedAt !== 'string' || value.importedAt.length > 40 || !Number.isFinite(Date.parse(value.importedAt)))) fail('invalid_import_time')
  if (value.savedAt !== undefined && (typeof value.savedAt !== 'string' || value.savedAt.length > 40 || !Number.isFinite(Date.parse(value.savedAt)))) fail('invalid_saved_time')

  const issues = value.issues.map(issue => {
    if (!hasExactKeys(issue, ['severity', 'code', 'row', 'field', 'message'], ['severity', 'code', 'message']) ||
      issue.severity !== 'warning' || !/^[a-z0-9-]{1,64}$/.test(issue.code) || !cleanText(issue.message, 300) ||
      (issue.row !== undefined && (!Number.isInteger(issue.row) || issue.row < 1 || issue.row > 50_001)) ||
      (issue.field !== undefined && !cleanText(issue.field, 255))) fail('invalid_issue')
    return { severity: issue.severity, code: issue.code, ...(issue.row === undefined ? {} : { row: issue.row }),
      ...(issue.field === undefined ? {} : { field: issue.field }), message: issue.message }
  })
  const records = value.records.map(record => validateRecord(record, kind))
  if (kind === 'opportunities' && new Set(records.map(record => record.opportunityId)).size !== records.length) fail('duplicate_opportunity_id')
  if (kind === 'orders') {
    const accounts = new Map()
    for (const record of records) {
      if (accounts.has(record.orderId) && accounts.get(record.orderId) !== record.accountId) fail('conflicting_order_accounts')
      accounts.set(record.orderId, record.accountId)
    }
  }
  return {
    kind, records, issues, errorCount: 0, warningCount: value.warningCount,
    stats: computedStats(kind, records), filename: value.filename, hash: value.hash.toLowerCase(), sheet: value.sheet,
    importedAt: value.importedAt, referenceDate: value.referenceDate,
  }
}

function validateWorkspace(value) {
  if (!hasExactKeys(value, KINDS) || !KINDS.some(kind => value[kind] !== null)) fail('invalid_workspace')
  return Object.fromEntries(KINDS.map(kind => [kind, value[kind] === null ? null : validateBatch(value[kind], kind)]))
}

function reconciliationConflict(workspace) {
  if (!workspace.opportunities || !workspace.orders) return false
  const accounts = new Map(workspace.opportunities.records.map(record => [record.opportunityId, record.accountId]))
  return workspace.orders.records.some(record => accounts.has(record.opportunityId) && accounts.get(record.opportunityId) !== record.accountId)
}

function sameParsedSource(a, b) {
  return JSON.stringify({ records: a.records, issues: a.issues, warningCount: a.warningCount }) ===
    JSON.stringify({ records: b.records, issues: b.issues, warningCount: b.warningCount })
}

async function readJsonBody(request) {
  const declared = request.headers.get('content-length')
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY_BYTES)) throw new HttpError(413, 'payload_too_large')
  if (!request.body) throw new HttpError(400, 'missing_body')
  const reader = request.body.getReader()
  const chunks = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_BODY_BYTES) {
      await reader.cancel()
      throw new HttpError(413, 'payload_too_large')
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  try { return JSON.parse(new TextDecoder().decode(bytes)) }
  catch { throw new HttpError(400, 'invalid_json') }
}

function splitRecords(records) {
  const chunks = []
  let current = []
  let bytes = 2
  for (const record of records) {
    const encoded = JSON.stringify(record)
    const encodedBytes = textEncoder.encode(encoded).byteLength
    const added = encodedBytes + (current.length ? 1 : 0)
    if (current.length && bytes + added > MAX_CHUNK_BYTES) {
      chunks.push(JSON.stringify(current))
      current = []
      bytes = 2
    }
    if (bytes + encodedBytes > MAX_CHUNK_BYTES) fail('record_too_large')
    current.push(record)
    bytes += encodedBytes + (current.length > 1 ? 1 : 0)
  }
  if (current.length) chunks.push(JSON.stringify(current))
  return chunks
}

function metadataOnly(workspace) {
  return Object.fromEntries(KINDS.map(kind => {
    if (!workspace[kind]) return [kind, null]
    const { records, ...metadata } = workspace[kind]
    return [kind, metadata]
  }))
}

function d1Rows(result) {
  if (!result || result.success === false || !Array.isArray(result.results)) throw new Error('D1 query failed')
  return result.results
}

const VERSION_COLUMNS = 'v.revision, v.sequence, v.workspace_json, v.opportunities_chunk_count, v.orders_chunk_count'

async function readCurrent(db) {
  return readVersion(db, await db.prepare(`
    SELECT ${VERSION_COLUMNS}
    FROM import_current c JOIN import_versions v ON v.revision = c.revision
    WHERE c.singleton_id = 1
  `).first())
}

// Read-only: the version that the current one replaced (current.previous_revision).
async function readPrevious(db) {
  return readVersion(db, await db.prepare(`
    SELECT ${VERSION_COLUMNS}
    FROM import_current c
    JOIN import_versions cur ON cur.revision = c.revision
    JOIN import_versions v ON v.revision = cur.previous_revision
    WHERE c.singleton_id = 1
  `).first())
}

async function readVersion(db, row) {
  if (!row) return null
  const workspace = JSON.parse(row.workspace_json)
  const jobs = []
  for (const kind of KINDS) {
    const count = kind === 'opportunities' ? row.opportunities_chunk_count : row.orders_chunk_count
    if (!Number.isInteger(count) || count < 0 || count > MAX_CHUNKS || (workspace[kind] === null && count !== 0) || (workspace[kind] !== null && count === 0)) {
      throw new Error('Snapshot chunk metadata is invalid')
    }
    for (let index = 0; index < count; index++) jobs.push({ kind, index })
  }
  if (jobs.length > MAX_CHUNKS) throw new Error('Snapshot is too large')
  const chunkRows = jobs.length ? await db.batch(jobs.map(({ kind, index }) => db.prepare(`
    SELECT record_count, records_json FROM import_chunks WHERE revision = ? AND kind = ? AND chunk_index = ?
  `).bind(row.revision, kind, index))) : []
  const records = Object.fromEntries(KINDS.map(kind => [kind, []]))
  for (let index = 0; index < jobs.length; index++) {
    const rows = d1Rows(chunkRows[index])
    if (rows.length !== 1) throw new Error('Snapshot chunk is missing')
    const chunk = JSON.parse(rows[0].records_json)
    if (!Array.isArray(chunk) || chunk.length !== rows[0].record_count) throw new Error('Snapshot chunk is invalid')
    records[jobs[index].kind].push(...chunk)
  }
  const historyResult = await db.prepare(`
    SELECT saved_at, reference_date, sources_json FROM import_versions
    WHERE sequence <= ? ORDER BY sequence DESC LIMIT ?
  `).bind(row.sequence, MAX_HISTORY).all()
  const history = d1Rows(historyResult).map(entry => ({
    at: entry.saved_at, referenceDate: entry.reference_date, sources: JSON.parse(entry.sources_json),
  }))
  return {
    ...Object.fromEntries(KINDS.map(kind => [kind, workspace[kind] ? { ...workspace[kind], records: records[kind] } : null])),
    revision: row.revision, history,
  }
}

function parseAllowlist(value) {
  return new Set(typeof value === 'string' ? value.split(/[\s,]+/).filter(Boolean) : [])
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), { status, headers: {
    'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extraHeaders,
  } })
}

function authenticate(request, env, write) {
  // This identity header is trusted only when the Worker is reached through the Sites dispatcher.
  // Do not substitute browser JSON, X-User-ID, or a caller-provided role.
  const userId = request.headers.get('oai-authenticated-user-id')?.trim()
  if (!userId || userId.length > 512 || /[\r\n]/.test(userId)) throw new HttpError(401, 'authentication_required')
  const importers = parseAllowlist(env.IMPORTER_USER_IDS)
  const viewers = parseAllowlist(env.VIEWER_USER_IDS)
  // Sites account/grant IDs differ from runtime Site-scoped IDs; email comes only from the trusted dispatcher.
  const email = request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase()
  const importerEmails = parseAllowlist(env.IMPORTER_EMAILS?.toLowerCase())
  const viewerEmails = parseAllowlist(env.VIEWER_EMAILS?.toLowerCase())
  if (!importers.size && !viewers.size && !importerEmails.size && !viewerEmails.size) throw new HttpError(503, 'role_allowlist_not_configured')
  const canImport = importers.has(userId) || Boolean(email && importerEmails.has(email))
  if (write ? !canImport : !canImport && !viewers.has(userId) && !(email && viewerEmails.has(email))) throw new HttpError(403, 'forbidden')
  return { userId, canImport }
}

function requireSiteOrigin(request, env) {
  if (typeof env.SITE_ORIGIN !== 'string') throw new HttpError(503, 'site_origin_not_configured')
  let configured
  try { configured = new URL(env.SITE_ORIGIN) }
  catch { throw new HttpError(503, 'site_origin_not_configured') }
  if (configured.pathname !== '/' || configured.search || configured.hash || configured.username || configured.password) {
    throw new HttpError(503, 'site_origin_not_configured')
  }
  if (new URL(request.url).origin !== configured.origin) throw new HttpError(403, 'site_origin_required')
}

async function persist(db, workspace, previousRevision, referenceDate, savedAt, actorId, sources, priorHistory) {
  const revision = crypto.randomUUID()
  const recordsByKind = Object.fromEntries(KINDS.map(kind => [kind, workspace[kind]?.records ?? []]))
  const chunksByKind = Object.fromEntries(KINDS.map(kind => [kind, splitRecords(recordsByKind[kind])]))
  const chunkCount = KINDS.reduce((sum, kind) => sum + chunksByKind[kind].length, 0)
  if (chunkCount > MAX_CHUNKS) throw new HttpError(413, 'payload_too_large')
  const statements = [db.prepare(`
    INSERT INTO import_versions (
      revision, previous_revision, reference_date, saved_at, actor_id, sources_json, workspace_json,
      opportunities_chunk_count, orders_chunk_count
    ) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE (? IS NULL AND NOT EXISTS (SELECT 1 FROM import_current WHERE singleton_id = 1))
       OR EXISTS (SELECT 1 FROM import_current WHERE singleton_id = 1 AND revision = ?)
  `).bind(revision, previousRevision, referenceDate, savedAt, actorId, JSON.stringify(sources),
    JSON.stringify(metadataOnly(workspace)), chunksByKind.opportunities.length, chunksByKind.orders.length,
    previousRevision, previousRevision)]
  for (const kind of KINDS) chunksByKind[kind].forEach((recordsJson, index) => {
    const records = JSON.parse(recordsJson)
    statements.push(db.prepare(`
      INSERT INTO import_chunks (revision, kind, chunk_index, record_count, records_json)
      SELECT ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM import_versions WHERE revision = ?)
    `).bind(revision, kind, index, records.length, recordsJson, revision))
  })
  statements.push(db.prepare(`
    INSERT INTO import_current (singleton_id, revision)
    SELECT 1, ? WHERE EXISTS (SELECT 1 FROM import_versions WHERE revision = ?)
      AND (SELECT COUNT(*) FROM import_chunks WHERE revision = ?) = ?
      AND ((? IS NULL AND NOT EXISTS (SELECT 1 FROM import_current WHERE singleton_id = 1))
        OR EXISTS (SELECT 1 FROM import_current WHERE singleton_id = 1 AND revision = ?))
    ON CONFLICT(singleton_id) DO UPDATE SET revision = excluded.revision
    WHERE import_current.revision IS ?
  `).bind(revision, revision, revision, chunkCount, previousRevision, previousRevision, previousRevision))
  const results = await db.batch(statements)
  const activation = results.at(-1)
  if (!activation || activation.success === false) throw new Error('Snapshot activation failed')
  if (Number(activation.meta?.changes ?? 0) !== 1) throw new HttpError(409, 'revision_conflict')
  return {
    ...workspace, revision,
    history: [{ at: savedAt, referenceDate, sources }, ...(priorHistory ?? [])].slice(0, MAX_HISTORY),
  }
}

async function update(request, env, actorId) {
  if (request.headers.get('origin') !== new URL(request.url).origin) throw new HttpError(403, 'same_origin_required')
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new HttpError(415, 'json_required')
  const body = await readJsonBody(request)
  if (!hasExactKeys(body, ['workspace', 'previousRevision', 'referenceDate']) || !currentRevision(body.previousRevision) ||
    !validDate(body.referenceDate, localDate())) fail('invalid_request')
  const workspace = validateWorkspace(body.workspace)
  if (reconciliationConflict(workspace)) fail('conflicting_reconciliation')

  const previous = await readCurrent(env.DB)
  if ((previous?.revision ?? null) !== body.previousRevision) throw new HttpError(409, 'revision_conflict')
  const savedAt = new Date().toISOString()
  const sources = []
  for (const kind of KINDS) {
    const batch = workspace[kind]
    const priorBatch = previous?.[kind]
    if (priorBatch && !batch) fail('source_removal_not_supported')
    if (!batch) continue
    const unchanged = priorBatch && priorBatch.hash === batch.hash && priorBatch.referenceDate === batch.referenceDate
    if (unchanged) {
      if (!sameParsedSource(priorBatch, batch)) fail('source_hash_content_mismatch')
      batch.savedAt = priorBatch.savedAt
    } else {
      if (batch.referenceDate !== body.referenceDate) fail('source_reference_mismatch')
      batch.savedAt = savedAt
      sources.push(batch.filename)
    }
  }
  if (!sources.length) fail('no_source_changed')
  const saved = await persist(env.DB, workspace, body.previousRevision, body.referenceDate, savedAt, actorId, sources, previous?.history)
  return json(saved)
}

async function api(request, env, previous = false) {
  const allow = previous ? 'GET' : 'GET, PUT'
  if (request.method !== 'GET' && (previous || request.method !== 'PUT')) return json({ error: 'method_not_allowed' }, 405, { allow })
  try {
    requireSiteOrigin(request, env)
    const { userId: actorId, canImport } = authenticate(request, env, request.method === 'PUT')
    if (!env.DB) throw new HttpError(503, 'database_not_configured')
    if (previous) {
      const draft = await readPrevious(env.DB)
      if (!draft) throw new HttpError(404, 'no_previous')
      return json({ draft, canImport })
    }
    if (request.method === 'GET') return json({
      draft: await readCurrent(env.DB),
      canImport,
    })
    return await update(request, env, actorId)
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.code }, error.status)
    return json({ error: 'shared_import_unavailable' }, 503)
  }
}

export async function handleRequest(request, env) {
  const { pathname } = new URL(request.url)
  if (pathname === API_PATH) return api(request, env)
  if (pathname === PREVIOUS_API_PATH) return api(request, env, true)
  if (pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404)
  if (!env.ASSETS) return new Response('Static assets are not configured.', { status: 503 })
  return env.ASSETS.fetch(request)
}

export default { fetch: handleRequest }
