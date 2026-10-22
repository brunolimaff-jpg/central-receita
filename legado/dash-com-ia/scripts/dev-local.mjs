import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ambienteLocal } from './central-runtime.mjs'

const raiz = resolve(fileURLToPath(new URL('..', import.meta.url)))
const binarioNext = resolve(raiz, 'node_modules/next/dist/bin/next')
const porta = process.env.PORT ?? '3001'
const args = ['dev', '--turbo', '--hostname', '127.0.0.1', '--port', porta, ...process.argv.slice(2)]
const env = ambienteLocal(process.env)

const servidor = spawn(process.execPath, [binarioNext, ...args], { cwd: raiz, env, stdio: 'inherit' })

servidor.on('error', (erro) => {
  console.error('Não foi possível iniciar o Next.js local:', erro.message)
  process.exitCode = 1
})

servidor.on('exit', (codigo, sinal) => {
  if (sinal) process.kill(process.pid, sinal)
  else process.exitCode = codigo ?? 1
})
