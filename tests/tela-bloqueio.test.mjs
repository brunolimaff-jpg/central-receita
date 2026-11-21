import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const root = new URL('../', import.meta.url)
const fonte = readFileSync(new URL('src/features/comercial-v3/tela-bloqueio.ts', root), 'utf8')

/**
 * O módulo é TypeScript puro e sem DOM, então transpila igual aos outros testes
 * do repositório (`tests/visual-preview.test.mjs` usa a mesma técnica).
 */
async function carregar() {
  const { outputText } = ts.transpileModule(fonte, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  })
  return import(`data:text/javascript,${encodeURIComponent(outputText)}`)
}

test('senha da demonstração é RACE, a fala do Hermínio', async () => {
  const m = await carregar()
  assert.equal(m.SENHA, 'RACE')
})

test('aceita RACE em maiúscula, com espaço sobrando nas pontas', async () => {
  const m = await carregar()
  for (const tentativa of ['RACE', '  RACE  ', '\tRACE\n']) {
    assert.equal(m.senhaCorreta(tentativa), true, `deveria aceitar ${JSON.stringify(tentativa)}`)
  }
})

test('a caixa faz parte da senha: minúscula e mista reprovam', async () => {
  const m = await carregar()
  for (const tentativa of ['race', 'Race', 'rAcE']) {
    assert.equal(m.senhaCorreta(tentativa), false, `não deveria aceitar ${JSON.stringify(tentativa)}`)
  }
})

test('recusa o que não é a senha, incluindo vazio, cerquilha e espaço no meio', async () => {
  const m = await carregar()
  for (const tentativa of ['', '#', '#RACE', 'RAC', 'RACES', 'RA CE', 'RACE!', '5BI']) {
    assert.equal(m.senhaCorreta(tentativa), false, `não deveria aceitar ${JSON.stringify(tentativa)}`)
  }
})

test('normalização só apara espaço, nunca troca a caixa', async () => {
  const m = await carregar()
  assert.equal(m.normalizarSenha('  ra ce  '), 'ra ce')
  assert.equal(m.normalizarSenha('RACE'), 'RACE')
})

test('armazenamento vazio, corrompido ou de outra versão conta como bloqueado', async () => {
  const m = await carregar()
  assert.equal(m.estaLiberado(null), false)
  assert.equal(m.estaLiberado(''), false)
  assert.equal(m.estaLiberado('liberado'), false)
  assert.equal(m.estaLiberado('liberado-v2'), false)
  assert.equal(m.estaLiberado('true'), false)
})

test('o valor gravado é o mesmo que a leitura reconhece', async () => {
  const m = await carregar()
  assert.equal(m.estaLiberado(m.gravarLiberado()), true)
})

test('a tela não promete segurança que não tem', () => {
  // Um bloqueio de demonstração não é controle de acesso. O comentário existe
  // para que ninguém o trate como porta de verdade depois.
  assert.match(fonte, /não protege nada de verdade|não é uma fechadura/)
})

test('o tom de voz não usa exclamação empilhada nem caixa alta gritada', async () => {
  const m = await carregar()
  const textos = Object.values(m.TEXTO_BLOQUEIO).join(' ')
  assert.doesNotMatch(textos, /!{2,}/)
  assert.doesNotMatch(textos, /[A-ZÀ-Ú]{6,}/, 'texto de interface não grita em caixa alta')
})
