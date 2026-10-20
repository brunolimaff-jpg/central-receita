// Capturas de QA da Visão Comercial V3 (gate visual, Fase 4).
// Uso: node scripts/capture-v3-qa.mjs  (requer app em http://127.0.0.1:3001)
// Playwright vem do cache do npx (ver memória playwright-capturas-locais); Chrome do sistema.
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const require = createRequire(import.meta.url)
const { chromium } = require('C:/Users/bruno.ferreira/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright')

const BASE = process.env.CENTRAL_BASE_URL || 'http://127.0.0.1:3001'
const AQUI = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(AQUI, '..', 'screenshots', 'v3')

const ALVOS = [
  { nome: 'home-1536x1024', url: `${BASE}/?view=home&period=month`, viewport: { width: 1536, height: 1024 }, fullPage: true },
  { nome: 'home-375x812', url: `${BASE}/?view=home&period=month`, viewport: { width: 375, height: 812 }, fullPage: true },
  { nome: 'agente-1536x1024', url: `${BASE}/?view=agent&period=month`, viewport: { width: 1536, height: 1024 }, fullPage: true },
  { nome: 'forecast-1536x1024', url: `${BASE}/?view=forecast&period=month`, viewport: { width: 1536, height: 1024 }, fullPage: true },
  { nome: 'filial-sp-1536x1024', url: `${BASE}/?view=branch&period=month&branch=SP`, viewport: { width: 1536, height: 1024 }, fullPage: true },
  { nome: 'oportunidade-opp001-1536x1024', url: `${BASE}/?view=opportunity&period=month&op=opp-001&from=home`, viewport: { width: 1536, height: 1024 }, fullPage: true },
]

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ channel: 'chrome' })
  const contexto = await browser.newContext({ viewport: { width: 1536, height: 1024 } })
  const page = await contexto.newPage()
  const erros = []
  page.on('pageerror', (erro) => erros.push(`pageerror: ${erro.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') erros.push(`console: ${msg.text()}`)
  })

  for (const alvo of ALVOS) {
    await page.setViewportSize(alvo.viewport)
    await page.goto(alvo.url, { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    const destino = path.join(OUT, `${alvo.nome}.png`)
    await page.screenshot({ path: destino, fullPage: alvo.fullPage })
    console.log(`captura ok: ${destino}`)
  }

  console.log(erros.length === 0 ? 'console/erros: nenhum' : `ERROS DE CONSOLE/PÁGINA:\n${erros.join('\n')}`)
  await browser.close()
})().catch((erro) => {
  console.error('falha na captura:', erro)
  process.exit(1)
})
