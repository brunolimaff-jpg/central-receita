const MAX_ROWS = 50_001
const MAX_COLUMNS = 100

type Delimiter = ',' | ';'

const csvError = (message: string) => new Error(`CSV inválido: ${message}`)

/**
 * Decodifica o CSV tentando UTF-8 estrito e caindo para Windows-1252.
 *
 * O export nativo do CRM sai em Latin-1 por padrão; recusá-lo obrigava a Fabi a
 * reexportar como "CSV UTF-8" num diálogo que não aparece em todo Excel. O
 * fallback só entra quando o UTF-8 falha de fato — acentuação correta continua
 * determinística, e texto que não for nem UTF-8 nem cp1252 segue como erro.
 */
export function decodeImportCsv(bytes: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    try {
      const latin = new TextDecoder('windows-1252', { fatal: true }).decode(bytes)
      if (/�/.test(latin)) throw csvError('codificação inválida. Exporte como CSV UTF-8 e tente novamente.')
      return latin
    } catch {
      throw csvError('codificação inválida. Exporte como CSV UTF-8 e tente novamente.')
    }
  }
}

function detectDelimiter(source: string): Delimiter {
  let commas = 0
  let semicolons = 0
  let quoted = false
  let fieldStart = true

  for (let index = 0; index < source.length; index++) {
    const character = source[index]
    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') index++
        else quoted = false
      }
      continue
    }
    if (character === '"' && fieldStart) {
      quoted = true
      fieldStart = false
    } else if (character === ',') {
      commas++
      fieldStart = true
    } else if (character === ';') {
      semicolons++
      fieldStart = true
    } else if (character === '\n' || character === '\r') {
      break
    } else {
      fieldStart = false
    }
  }

  if (commas === semicolons) throw csvError('delimitador do cabeçalho ambíguo. Use vírgula ou ponto e vírgula.')
  return commas > semicolons ? ',' : ';'
}

export function parseImportCsv(source: string): string[][] {
  if (source.charCodeAt(0) === 0xfeff) source = source.slice(1)
  if (!source.length) throw csvError('arquivo vazio.')
  const delimiter = detectDelimiter(source)
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let quoteClosed = false
  let line = 1
  let fieldColumn = 1
  let headerColumns = 0
  let endedWithLineBreak = false

  const badQuotes = (reason: string) => csvError(`${reason} na linha ${line}, coluna ${fieldColumn}.`)
  const pushField = () => {
    row.push(field)
    if (row.length > MAX_COLUMNS) throw csvError(`limite de ${MAX_COLUMNS} colunas excedido na linha ${line}.`)
    field = ''
    quoteClosed = false
    fieldColumn = row.length + 1
  }
  const appendRow = () => {
    if (rows.length === 0) headerColumns = row.length
    else if (row.length > headerColumns && row.slice(headerColumns).some(value => value.trim() !== '')) {
      throw csvError(`a linha ${rows.length + 1} contém campos além das ${headerColumns} colunas do cabeçalho. Confira o delimitador.`)
    }
    rows.push(row)
    if (rows.length > MAX_ROWS) throw csvError('limite de 50.000 linhas de dados excedido.')
    row = []
    fieldColumn = 1
  }
  const pushRow = () => {
    pushField()
    appendRow()
    line++
    endedWithLineBreak = true
  }

  for (let index = 0; index < source.length; index++) {
    const character = source[index]
    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"'
          index++
        } else {
          quoted = false
          quoteClosed = true
        }
      } else {
        field += character
        if (character === '\r' && source[index + 1] === '\n') {
          field += '\n'
          index++
          line++
        } else if (character === '\r' || character === '\n') line++
      }
      endedWithLineBreak = false
      continue
    }

    if (quoteClosed) {
      if (character === delimiter) pushField()
      else if (character === '\r' || character === '\n') {
        if (character === '\r' && source[index + 1] === '\n') index++
        pushRow()
      } else throw badQuotes('conteúdo após o fechamento das aspas')
      if (character === delimiter) endedWithLineBreak = false
      continue
    }

    if (character === '"') {
      if (field.length) throw badQuotes('aspas fora do início do campo')
      quoted = true
    } else if (character === delimiter) {
      pushField()
      endedWithLineBreak = false
    } else if (character === '\r' || character === '\n') {
      if (character === '\r' && source[index + 1] === '\n') index++
      pushRow()
    } else {
      field += character
      endedWithLineBreak = false
    }
  }

  if (quoted) throw badQuotes('aspas não fechadas')
  if (!endedWithLineBreak || row.length > 0 || field.length > 0 || quoteClosed) {
    pushField()
    appendRow()
  }
  return rows
}
