import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const root = new URL('../', import.meta.url)
const read = name => readFileSync(new URL(name, root), 'utf8')

test('homologação ignora API e armazenamento e recusa arquivos antes de lê-los', async () => {
  const previous = process.env.NEXT_PUBLIC_VISUAL_PREVIEW
  process.env.NEXT_PUBLIC_VISUAL_PREVIEW = '1'
  try {
    const { outputText } = ts.transpileModule(read('src/features/comercial-v3/manual-import-client.ts'), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    })
    // As operações de preview devem retornar antes de depender dos módulos de importação.
    const code = `const visualDraft = ${read('src/features/comercial-v3/visual-import.json')};\n` + outputText.replace(/^import .* from .*;?$/gm, '')
    const client = await import(`data:text/javascript,${encodeURIComponent(code)}`)
    assert.equal(client.sharedImportEnabled, false)
    const access = await client.loadImportDraft()
    assert.equal(access.canImport, false)
    assert.equal(access.draft.revision, 'visual-synthetic')
    assert.equal(access.draft.opportunities.errorCount, 0)
    assert.equal(access.draft.orders.errorCount, 0)
    assert.equal(await client.loadPreviousDraft(), null)
    await assert.rejects(client.saveImportDraft(null, null, null), /desativada/)
    await assert.rejects(client.readImportFile('orders', null, null), /desativada/)
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_VISUAL_PREVIEW
    else process.env.NEXT_PUBLIC_VISUAL_PREVIEW = previous
  }
})

test('cenário visual tem totais coerentes e filiais sintéticas', () => {
  const fixture = JSON.parse(read('src/features/comercial-v3/visual-branches.json'))
  assert.match(fixture.source, /sintético/)
  assert.equal(fixture.unit, 'millions BRL')
  assert.equal(fixture.total.meta, 12)
  assert.ok(fixture.total.forecastAtual < 100)
  for (const row of fixture.branches) assert.match(row.branch, /^Filial (Alfa|Beta|Gama|Delta)$/)
  for (const key of Object.keys(fixture.total).filter(key => key !== 'branch')) {
    assert.equal(fixture.branches.reduce((sum, row) => sum + row[key], 0), fixture.total[key])
  }
})
