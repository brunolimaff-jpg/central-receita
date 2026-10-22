import { spawn } from 'node:child_process'
import { closeSync, existsSync, openSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ambienteLocal, ehMetaDaCentral } from './central-runtime.mjs'

const raiz = resolve(fileURLToPath(new URL('..', import.meta.url)))
const porta = Number(process.env.CENTRAL_PORT ?? '3001')
const cdpPorta = 9222
const urlApp = `http://127.0.0.1:${porta}/?tela=agora`
const urlSaude = `http://127.0.0.1:${porta}/api/meta`
const envLocal = ambienteLocal(process.env)

if (!Number.isInteger(porta) || porta < 1 || porta > 65535) {
  throw new Error(`CENTRAL_PORT inválida: ${process.env.CENTRAL_PORT}`)
}

async function respostaSaude() {
  const response = await fetch(urlSaude, { signal: AbortSignal.timeout(1500) }).catch(() => null)
  if (!response) return null
  const body = await response.json().catch(() => null)
  return { response, body }
}

function centralDisponivel(saudeAtual) {
  return Boolean(saudeAtual?.response.ok && ehMetaDaCentral(saudeAtual.body))
}

let saude = await respostaSaude()
if (!saude) {
  const binarioNext = resolve(raiz, 'node_modules/next/dist/bin/next')
  if (!existsSync(binarioNext)) throw new Error(`Next.js não encontrado em ${binarioNext}. O projeto inclui bun.lock: use bun install --frozen-lockfile; como alternativa, npm install --package-lock=false.`)

  const arquivoLog = join(tmpdir(), `central-revenue-server-${porta}.log`)
  const descritorLog = openSync(arquivoLog, 'a')
  const servidor = spawn(process.execPath, [binarioNext, 'dev', '--turbo', '--hostname', '127.0.0.1', '--port', String(porta)], {
    cwd: raiz,
    env: envLocal,
    detached: true,
    stdio: ['ignore', descritorLog, descritorLog],
    windowsHide: true,
  })
  closeSync(descritorLog)
  servidor.unref()

  for (let tentativa = 0; tentativa < 45; tentativa++) {
    saude = await respostaSaude()
    if (centralDisponivel(saude)) break
    if (saude) {
      const status = saude.response.status
      throw new Error(`O serviço em ${urlSaude} respondeu HTTP ${status} ou não foi reconhecido como a Central local; não iniciei outro servidor.`)
    }
    if (servidor.exitCode !== null || servidor.signalCode !== null) {
      const logFinal = readFileSync(arquivoLog, 'utf8').trim().split(/\r?\n/).slice(-8).join('\n')
      throw new Error(`O Next encerrou antes de ficar pronto. Consulte ${arquivoLog}.\n${logFinal}`)
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 1000))
  }
  if (!centralDisponivel(saude)) throw new Error(`A Central não respondeu em 45 segundos. Consulte ${arquivoLog}.`)
  console.log(`Servidor iniciado em ${urlApp}; log local: ${arquivoLog}`)
} else if (centralDisponivel(saude)) {
  console.log(`Servidor local já ativo em ${urlApp}; reutilizei a instância.`)
} else {
  throw new Error(`O serviço em ${urlSaude} respondeu HTTP ${saude.response.status} ou não foi reconhecido como a Central local; nenhum processo foi substituído.`)
}

const chromeCandidatos = [
  process.env.CHROME_PATH,
  process.env.ProgramFiles ? join(process.env.ProgramFiles, 'Google', 'Chrome', 'Application', 'chrome.exe') : null,
  process.env['ProgramFiles(x86)'] ? join(process.env['ProgramFiles(x86)'], 'Google', 'Chrome', 'Application', 'chrome.exe') : null,
].filter(Boolean)
const chrome = chromeCandidatos.find((caminho) => existsSync(caminho))
if (!chrome) throw new Error('Google Chrome não encontrado. Defina CHROME_PATH para o executável local do Chrome.')

const perfilIsolado = join(tmpdir(), 'central-revenue-chrome-9222')
const navegador = spawn(chrome, [
  '--new-window',
  `--remote-debugging-port=${cdpPorta}`,
  '--remote-debugging-address=127.0.0.1',
  `--user-data-dir=${perfilIsolado}`,
  '--disable-extensions',
  '--disable-sync',
  '--disable-background-networking',
  '--no-first-run',
  '--no-default-browser-check',
  urlApp,
], { detached: true, stdio: 'ignore', windowsHide: false })
navegador.unref()

console.log(`Chrome abriu a Central local. Depuração de navegador solicitada na porta ${cdpPorta}; app: ${urlApp}.`)
