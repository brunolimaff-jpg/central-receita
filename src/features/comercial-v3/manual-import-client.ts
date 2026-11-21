import type { ImportBatch, ImportKind, ImportWorkspace } from './manual-import'
import visualDraft from './visual-import.json'
import { isValidImportReference, currentImportDate, isDuplicateImport, importRejectionMessage } from './manual-import'
import { historyEntry, trajectorySnapshotForWorkspace } from './trajectory-snapshot'

/**
 * Resumo numérico de uma carga no histórico, para a trajetória comparar cargas
 * passadas. Valores em reais; `null` quando algum registro da conta não traz
 * valor (nulo contamina, nunca vira zero). `exited` é sinalizado (negativo).
 * O modo compartilhado calcula no worker; o modo local, em `trajectory-snapshot.ts`.
 */
export type TrajectorySnapshot = {
  forecastTotal: number | null
  entered: number | null
  exited: number | null
  changed: number | null
  realized: number | null
}
export type ImportHistoryEntry = {
  at: string
  sources: string[]
  referenceDate: string
  /** Ausente nas cargas anteriores ao snapshot, inclusive as gravadas antes da migração. */
  snapshot?: TrajectorySnapshot
}
export type ImportDraft = ImportWorkspace & { revision: string; history: ImportHistoryEntry[] }
export type ImportAccess = { draft: ImportDraft | null; canImport: boolean; tag?: string }

export const visualPreviewEnabled = process.env.NEXT_PUBLIC_VISUAL_PREVIEW === '1'
export const sharedImportEnabled = !visualPreviewEnabled && process.env.NEXT_PUBLIC_IMPORT_STORAGE === 'shared'

async function sharedRequest(method: 'GET', body?: undefined, knownTag?: string): Promise<ImportAccess | null>
async function sharedRequest(method: 'PUT', body: unknown): Promise<ImportDraft>
async function sharedRequest(method: 'GET' | 'PUT', body?: unknown, knownTag?: string): Promise<ImportAccess | ImportDraft | null> {
  let response: Response
  const headers: Record<string, string> = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (knownTag) headers['If-None-Match'] = knownTag
  try {
    response = await fetch('/api/imports/current', { method, credentials: 'same-origin', cache: 'no-store', headers,
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(45000) })
  } catch {
    throw new Error(method === 'PUT' ? 'Não foi possível confirmar a carga. Recarregue para conferir a versão atual antes de tentar novamente.' :
      'Não foi possível consultar os dados compartilhados. Tente novamente.')
  }
  if (method === 'GET' && response.status === 304) return null
  if (!response.ok) throw new Error(await rejectionError(response, method))
  if (method === 'PUT') return await response.json() as ImportDraft
  const access = await response.json() as ImportAccess
  const tag = response.headers.get('etag')
  return tag ? { ...access, tag } : access
}

async function rejectionError(response: Response, method: 'GET' | 'PUT'): Promise<string> {
  if (response.status === 409) return 'Outra pessoa atualizou os dados. Recarregue antes de confirmar a carga.'
  if (response.status === 401 || response.status === 403) return 'Seu acesso não permite esta operação. Entre com a conta autorizada.'
  if (response.status === 413) return 'A carga excede o limite do armazenamento compartilhado. Reduza o recorte do CRM e tente novamente.'
  if (response.status === 422 && method === 'PUT') {
    let code: unknown
    try { code = (await response.clone().json() as { error?: unknown }).error } catch { code = undefined }
    return importRejectionMessage(code)
  }
  return method === 'PUT' ? 'A gravação não foi confirmada. Recarregue para conferir a versão atual antes de tentar novamente.' :
    'Não foi possível consultar os dados compartilhados. Tente novamente.'
}

// Temporary, non-authoritative preview. Shared operation requires authenticated server storage.
function openDraftDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('central-receita-import-preview', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('drafts')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('Não foi possível abrir a prévia local. Verifique se o navegador permite armazenamento.'))
    request.onblocked = () => reject(new Error('Feche outras abas da Central e tente novamente.'))
  })
}

export async function loadPreviousDraft(): Promise<ImportDraft | null> {
  if (visualPreviewEnabled) return null
  if (sharedImportEnabled) {
    let response: Response
    try {
      response = await fetch('/api/imports/previous', { method: 'GET', credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(45000) })
    } catch {
      throw new Error('Não foi possível consultar a carga anterior. Tente novamente.')
    }
    if (response.status === 404) return null
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ?
      'Seu acesso não permite esta operação. Entre com a conta autorizada.' : 'Não foi possível consultar a carga anterior. Tente novamente.')
    return (await response.json() as ImportAccess).draft
  }
  const database = await openDraftDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('drafts', 'readonly')
    const request = transaction.objectStore('drafts').get('previous')
    transaction.oncomplete = () => { database.close(); resolve((request.result as ImportDraft | undefined) ?? null) }
    transaction.onabort = transaction.onerror = () => { database.close(); reject(new Error('Não foi possível recuperar a prévia anterior.')) }
  })
}

/** Shared mode: `null` means the revision behind `knownTag` is still current, so nothing was downloaded. */
export async function loadImportDraft(knownTag?: string): Promise<ImportAccess | null> {
  if (visualPreviewEnabled) return { draft: visualDraft as ImportDraft, canImport: false }
  if (sharedImportEnabled) return sharedRequest('GET', undefined, knownTag)
  const database = await openDraftDatabase()
  const draft = await new Promise<ImportDraft | null>((resolve, reject) => {
    const transaction = database.transaction('drafts', 'readonly')
    const request = transaction.objectStore('drafts').get('current')
    transaction.oncomplete = () => {
      const saved = request.result as ImportDraft | undefined
      database.close()
      resolve(saved ? { ...saved, history: saved.history ?? [] } : null)
    }
    transaction.onabort = transaction.onerror = () => { database.close(); reject(new Error('Não foi possível recuperar a prévia local.')) }
  })
  return { draft, canImport: true }
}

export async function saveImportDraft(workspace: ImportWorkspace, previous: ImportDraft | null, referenceDate: string): Promise<ImportDraft> {
  if (visualPreviewEnabled) throw new Error('Importação desativada nesta homologação visual. Use apenas o cenário demonstrativo.')
  if (!isValidImportReference(referenceDate, currentImportDate())) throw new Error('Informe uma data de referência válida, até hoje.')
  if (sharedImportEnabled) {
    return sharedRequest('PUT', { workspace, previousRevision: previous?.revision ?? null, referenceDate })
  }
  const database = await openDraftDatabase()
  const at = new Date().toISOString()
  const savedWorkspace = { ...workspace }
  for (const kind of ['opportunities', 'orders'] as const) {
    if (workspace[kind] && !isDuplicateImport(workspace[kind]!, previous?.[kind])) savedWorkspace[kind] = { ...workspace[kind]!, savedAt: at }
  }
  // Mesma regra do worker: só a foto de oportunidades que mudou gera ponto.
  const snapshot = trajectorySnapshotForWorkspace(workspace, previous)
  const draft: ImportDraft = { ...savedWorkspace, revision: crypto.randomUUID(), history: [
    historyEntry({
      at, referenceDate, snapshot,
      sources: (['opportunities', 'orders'] as const)
        .filter(kind => workspace[kind] && !isDuplicateImport(workspace[kind]!, previous?.[kind]))
        .map(kind => workspace[kind]!.filename).filter((name): name is string => Boolean(name)),
    }),
    ...(previous?.history ?? []),
  ].slice(0, 20) }
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('drafts', 'readwrite')
    const store = transaction.objectStore('drafts')
    let conflict = false
    store.get('current').onsuccess = (event) => {
      const current = (event.target as IDBRequest<ImportDraft | undefined>).result
      if ((current?.revision ?? null) !== (previous?.revision ?? null)) { conflict = true; transaction.abort(); return }
      if (current && current.revision !== draft.revision) store.put(current, 'previous')
      store.put(draft, 'current')
    }
    transaction.oncomplete = () => { database.close(); resolve(draft) }
    transaction.onabort = transaction.onerror = () => {
      database.close()
      reject(new Error(conflict ? 'Outra aba atualizou a prévia. Recarregue esta página antes de salvar.' : 'A prévia não foi salva. Verifique o espaço disponível e tente novamente.'))
    }
  })
}

export async function readImportFile(kind: ImportKind, file: File, referenceDate: string): Promise<ImportBatch> {
  if (visualPreviewEnabled) throw new Error('Importação desativada nesta homologação visual. Use apenas o cenário demonstrativo.')
  if (!isValidImportReference(referenceDate, currentImportDate())) throw new Error('Informe uma data de referência válida, até hoje, antes de selecionar o arquivo.')
  const isCsv = /\.csv$/i.test(file.name)
  const isXlsx = /\.xlsx$/i.test(file.name)
  if ((!isCsv && !isXlsx) || file.size === 0 || file.size > 15 * 1024 * 1024) {
    throw new Error('Selecione um CSV UTF-8 ou XLSX de até 15 MB, exportado pelo CRM.')
  }
  const bytes = await file.arrayBuffer()
  if (isXlsx) validateArchive(bytes)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const batch = await new Promise<ImportBatch>((resolve, reject) => {
    const worker = new Worker(new URL('./manual-import-worker.ts', import.meta.url))
    const timer = setTimeout(() => { worker.terminate(); reject(new Error('A leitura excedeu 45 segundos. Exporte um recorte menor do CRM e tente novamente.')) }, 45000)
    const finish = () => { clearTimeout(timer); worker.terminate() }
    worker.onmessage = (event: MessageEvent<{ batch?: ImportBatch; error?: string }>) => {
      finish()
      if (event.data.batch) resolve(event.data.batch)
      else reject(new Error(event.data.error ?? 'Não foi possível ler o arquivo. Exporte novamente pelo CRM.'))
    }
    worker.onerror = () => { finish(); reject(new Error('Não foi possível iniciar a leitura. Recarregue a página e tente novamente.')) }
    if (isCsv) worker.postMessage({ kind, csv: bytes }, [bytes])
    else worker.postMessage({ kind, file })
  })
  return { ...batch, filename: file.name, hash: Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join(''),
    importedAt: new Date().toISOString(), referenceDate }
}

function validateArchive(bytes: ArrayBuffer) {
  const view = new DataView(bytes)
  const invalid = () => new Error('O arquivo não é um XLSX válido ou excede o limite de leitura. Exporte novamente pelo CRM.')
  if (view.byteLength < 22 || view.getUint32(0, true) !== 0x04034b50) throw invalid()
  let end = -1
  for (let offset = view.byteLength - 22; offset >= Math.max(0, view.byteLength - 65557); offset--) {
    if (view.getUint32(offset, true) === 0x06054b50 && offset + 22 + view.getUint16(offset + 20, true) === view.byteLength) { end = offset; break }
  }
  if (end < 0) throw invalid()
  const entries = view.getUint16(end + 10, true)
  if (entries > 3000 || view.getUint16(end + 4, true) !== 0 || view.getUint16(end + 6, true) !== 0) throw invalid()
  let position = view.getUint32(end + 16, true)
  let expanded = 0
  for (let i = 0; i < entries; i++) {
    if (position + 46 > end || view.getUint32(position, true) !== 0x02014b50 || (view.getUint16(position + 8, true) & 1)) throw invalid()
    expanded += view.getUint32(position + 24, true)
    if (expanded > 64 * 1024 * 1024) throw invalid()
    position += 46 + view.getUint16(position + 28, true) + view.getUint16(position + 30, true) + view.getUint16(position + 32, true)
  }
  if (position > end) throw invalid()
}
