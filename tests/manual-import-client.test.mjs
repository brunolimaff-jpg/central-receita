import test from 'node:test'
import assert from 'node:assert/strict'
import { importRejectionMessage } from '../src/features/comercial-v3/manual-import.ts'

test('a recusa 422 mostra o motivo legível do servidor em vez de uma mensagem genérica', () => {
  const message = importRejectionMessage('invalid_text_field')
  assert.match(message, /recusada/i)
  assert.match(message, /texto/i)
  assert.doesNotMatch(message, /invalid_text_field/)
})

test('a recusa 422 cobre os códigos de identificador, data, número e conflito', () => {
  assert.match(importRejectionMessage('invalid_id'), /identificador/i)
  assert.match(importRejectionMessage('invalid_date'), /data/i)
  assert.match(importRejectionMessage('invalid_number'), /valor/i)
  assert.match(importRejectionMessage('conflicting_order_accounts'), /contas diferentes/i)
  assert.match(importRejectionMessage('revision_conflict'), /outra pessoa/i)
})

test('código ausente ou desconhecido mantém uma mensagem pt-BR sem vazar o código', () => {
  const fallback = importRejectionMessage(undefined)
  assert.match(fallback, /recusada/i)
  assert.match(fallback, /Revise/i)
  const unknown = importRejectionMessage('some_unknown_code')
  assert.match(unknown, /recusada/i)
  assert.doesNotMatch(unknown, /some_unknown_code/)
})

test('a mensagem de recusa não vaza valores de célula nem dados comerciais', () => {
  const message = importRejectionMessage('invalid_id')
  assert.doesNotMatch(message, /\d{2,}/)
})
