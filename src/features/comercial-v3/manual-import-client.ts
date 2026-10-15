import type { ImportBatch, ImportKind, ImportWorkspace } from './manual-import'
import { isValidImportReference, currentImportDate, isDuplicateImport } from './manual-import'

export type ImportDraft = ImportWorkspace & { revision: string; history: Array<{ at: string; sources: string[]; referenceDate: string }> }
export type ImportAccess = { draft: ImportDraft | null; canImport: boolean }

export const sharedImportEnabled = process.env.NEXT_PUBLIC_IMPORT_STORAGE === 'shared'

async function sharedRequest(method: 'GET'): Promise<ImportAccess>
async function sharedRequest(method: 'PUT', body: unknown): Promise<ImportDraft>
async function sharedRequest(method: 'GET' | 'PUT', body?: unknown): Promise<ImportAccess | ImportDraft> {
  let response: Response
  try {
    response = await fetch('/api/imports/current', { method, credentials: 'same-origin', cache: 'no-store',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(45000) })
  } catch {
    throw new Error(method === 'PUT' ? 'Não foi possível confirmar a carga. Recarregue para conferir a versão atual antes de tentar novamente.' :
      'Não foi possível consultar os dados compartilhados. Tente novamente.')
  }
  if (!response.ok) throw new Error(response.status === 409 ? 'Outra pessoa atualizou os dados. Recarregue antes de confirmar a carga.' :
    response.status === 401 || response.status === 403 ? 'Seu acesso não permite esta operação. Entre com a conta autorizada.' :
    response.status === 413 ? 'A carga excede o limite do armazenamento compartilhado. Reduza o recorte do CRM e tente novamente.' :
    response.status === 422 && method === 'PUT' ? 'A carga foi recusada. Revise os problemas e os vínculos antes de tentar novamente.' :
    method === 'PUT' ? 'A gravação não foi confirmada. Recarregue para conferir a versão atual antes de tentar novamente.' :
    'Não foi possível consultar os dados compartilhados. Tente novamente.')
  return await response.json() as ImportAccess | ImportDraft
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

export async function loadImportDraft(): Promise<ImportAccess> {
  if (sharedImportEnabled) return sharedRequest('GET')
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
  const draft: ImportDraft = { ...savedWorkspace, revision: crypto.randomUUID(), history: [
    { at, referenceDate, sources: (['opportunities', 'orders'] as const)
      .filter(kind => workspace[kind] && !isDuplicateImport(workspace[kind]!, previous?.[kind]))
      .map(kind => workspace[kind]!.filename).filter((name): name is string => Boolean(name)) },
    ...(previous?.history ?? []),
  ].slice(0, 20) }
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('drafts', 'readwrite')
    const store = transaction.objectStore('drafts')
    let conflict = false
    store.get('current').onsuccess = (event) => {
      const current = (event.target as IDBRequest<ImportDraft | undefined>).result
      if ((current?.revision ?? null) !== (previous?.revision ?? null)) { conflict = true; transaction.abort(); return }
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
