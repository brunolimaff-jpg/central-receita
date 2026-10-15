import readExcelFile from 'read-excel-file/web-worker'
import { normalizeImport, type ImportKind } from './manual-import'
import { decodeImportCsv, parseImportCsv } from './manual-import-csv'

self.addEventListener('message', async (event: MessageEvent<{ kind: ImportKind; file?: File; csv?: ArrayBuffer }>) => {
  try {
    if (event.data.csv) {
      const rows = parseImportCsv(decodeImportCsv(event.data.csv))
      const batch = normalizeImport(event.data.kind, rows)
      self.postMessage({ batch: { ...batch, sheet: 'CSV' } })
      return
    }
    if (!event.data.file) throw new Error('missing_file')
    const sheets = await readExcelFile(event.data.file)
    const populated = sheets.filter(sheet => sheet.data.length > 0)
    if (populated.length !== 1) {
      self.postMessage({ error: 'Use uma única aba de dados por arquivo, como nas exportações fornecidas.' })
      return
    }
    const batch = normalizeImport(event.data.kind, populated[0].data)
    self.postMessage({ batch: { ...batch, sheet: populated[0].sheet } })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    self.postMessage({ error: event.data.csv && message.startsWith('CSV inválido:') ? message : 'Não foi possível ler o arquivo. Exporte novamente pelo CRM e tente novamente.' })
  }
})
