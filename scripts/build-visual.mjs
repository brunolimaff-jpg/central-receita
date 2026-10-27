import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'

const npmCli = process.env.npm_execpath
if (!npmCli) throw new Error('Rode por npm run build:visual.')
const result = spawnSync(process.execPath, [npmCli, 'run', 'build:static'], {
  cwd: process.cwd(),
  env: { ...process.env, NEXT_PUBLIC_VISUAL_PREVIEW: '1', NEXT_PUBLIC_IMPORT_STORAGE: 'visual' },
  stdio: 'inherit',
})
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)

const directory = path.resolve('dist/visual', new Date().toISOString().replace(/[:.]/g, '-'))
const assets = path.join(directory, 'assets')
mkdirSync(assets, { recursive: true })
cpSync('out', assets, { recursive: true })
writeFileSync(path.join(assets, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Content-Security-Policy: connect-src \'self\'; frame-ancestors \'none\'\n')
const original = JSON.parse(readFileSync('src/features/comercial-v3/real-branches.json', 'utf8'))
const forbidden = [original.source, ...original.branches.map(row => row.branch)].filter(Boolean)
const files = []
function inspect(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const filename = path.join(folder, entry.name)
    if (entry.isDirectory()) { inspect(filename); continue }
    const relative = path.relative(assets, filename).replaceAll('\\', '/')
    if (/(^|\/)(api|server|backend|drizzle)(\/|$)|\.map$|\.sql$|\.env/.test(relative)) throw new Error('Artefato proibido no pacote visual.')
    const bytes = readFileSync(filename)
    if (/\.(js|json|html|txt)$/.test(filename)) {
      const text = bytes.toString('utf8')
      if (forbidden.some(value => text.includes(value))) throw new Error('Referência à fonte comercial encontrada; pacote NÃO liberado.')
    }
    files.push({ path: relative, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') })
  }
}
inspect(assets)
writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify({
  purpose: 'homologacao-visual', published: false, api: false, d1: false,
  data: 'synthetic', createdAt: new Date().toISOString(), assets: 'assets', files,
}, null, 2))
writeFileSync('dist/visual/latest.json', JSON.stringify({ directory }, null, 2))
console.log(`Pacote visual validado: ${directory}; ${files.length} arquivos; sem backend ou referências à fonte comercial.`)
