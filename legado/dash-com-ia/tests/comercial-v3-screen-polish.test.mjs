import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const jornada = readFileSync(new URL('../src/features/comercial-v3/screens/journey-screen.tsx', import.meta.url), 'utf8')
const contas = readFileSync(new URL('../src/features/comercial-v3/screens/accounts-screen.tsx', import.meta.url), 'utf8')

test('Jornada limita conversão às etapas identificadas como conversão e separa outros indicadores', () => {
  assert.match(jornada, /stage\.detail === 'conversão'/)
  assert.match(jornada, /ETAPAS_COM_CONVERSAO_DEMO\.map/)
  assert.match(jornada, /Indicadores demonstrativos separados da conversão/)
})

test('Jornada mantém o rótulo 3.000 dentro do eixo e amplia a fonte dos ticks', () => {
  assert.match(jornada, /<text x="42"[^>]*fontSize="12"[^>]*>\{n\.toLocaleString\('pt-BR'\)\}/)
  assert.match(jornada, /role="region"[^>]*tabIndex=\{0\}[^>]*overflow-x-auto/)
  assert.match(jornada, /min-w-\[750px\]/)
})

test('Contas agrupa clientes do mock, permite busca e mantém links acessíveis ao detalhe', () => {
  assert.match(contas, /selectAccountGroups\(rows, detalhes\)/)
  assert.match(contas, /selectAccountGroups\(rows, detalhes, query\)/)
  assert.match(contas, /grupo\.account \?\? 'Cliente indisponível'/)
  assert.match(contas, /Responsáveis nas oportunidades:/)
  assert.match(contas, /role="status"/)
  assert.match(contas, /href=\{nav\.href\('opportunity', \{ opportunityId: id, from: 'accounts' \}\)\}/)
  assert.match(contas, /Cenário simulado/)
  assert.match(contas, /hover:bg-\[#f5f9fb\]/)
  assert.match(contas, /focus-visible:outline-2/)
  assert.doesNotMatch(contas, /SAUDE_DEMO|RECEITA_DEMO|EXPANSAO_DEMO|churn/i)
})
