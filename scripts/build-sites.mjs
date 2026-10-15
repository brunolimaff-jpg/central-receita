import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'

const npmCli = process.env.npm_execpath
if (!npmCli) throw new Error('Rode este script por `npm run build:sites`.')

const result = spawnSync(process.execPath, [npmCli, 'run', 'build:static'], {
  cwd: process.cwd(),
  env: { ...process.env, NEXT_PUBLIC_IMPORT_STORAGE: 'shared' },
  stdio: 'inherit',
})
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)

const dist = path.resolve('dist')
rmSync(dist, { recursive: true, force: true })
mkdirSync(path.join(dist, 'client'), { recursive: true })
mkdirSync(path.join(dist, 'server'), { recursive: true })
cpSync('out', path.join(dist, 'client'), { recursive: true })
cpSync('backend/worker.js', path.join(dist, 'server/index.js'))
