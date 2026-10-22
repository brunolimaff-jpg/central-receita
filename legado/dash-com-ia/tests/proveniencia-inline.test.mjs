import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const componentePath = fileURLToPath(new URL('../src/components/central/proveniencia-inline.tsx', import.meta.url))
const componente = existsSync(componentePath) ? readFileSync(componentePath, 'utf8') : ''

test('proveniência inline expõe os seis campos em disclosure acessível', () => {
  assert.match(componente, /<details\b/)
  assert.match(componente, /<summary[\s\S]*?aria-label=\{rotulo\}/)
  assert.match(componente, /<dl\b/)
  for (const rotulo of ['Fonte', 'Atualização', 'População', 'Regra', 'Limitação', 'Versão']) {
    assert.match(componente, new RegExp(rotulo, 'i'))
  }
  for (const campo of ['fonte', 'atualizacao', 'populacao', 'regra', 'limitacao', 'versao']) {
    assert.match(componente, new RegExp(`dados\\.${campo}`))
  }
})
