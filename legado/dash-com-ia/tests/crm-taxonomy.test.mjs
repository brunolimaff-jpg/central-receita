import assert from 'node:assert/strict'
import test from 'node:test'

import { resolverEtapaOportunidade, resolverNaturezaVenda } from '../src/lib/domain/crm-taxonomy.ts'

const PRIVADA = 'Vendas Instituição Privada'
const PUBLICA = 'Vendas Instituição Pública'
const PDF = ['pdf_crm_integrado_mg']

test('as cinco fases privadas são observadas somente no funil privado', () => {
  for (const etapa of ['Primeiro Contato de Venda', 'Mapeamento da Necessidade', 'Defesa Técnica', 'Proposta', 'Negociação']) {
    assert.deepEqual(resolverEtapaOportunidade(PRIVADA, etapa), {
      tipo_funil: 'privado',
      etapa_bruta: etapa,
      rotulo: etapa,
      estado_mapeamento: 'observado',
      fontes: PDF,
    })
  }
  assert.equal(resolverEtapaOportunidade(PRIVADA, 'Análise de Documentos').estado_mapeamento, 'nao_mapeado')
})

test('as cinco fases públicas e variantes permanecem no funil público', () => {
  for (const etapa of ['Primeiro Contato de Venda', 'Mapeamento da Necessidade', 'Análise de Documentos', 'Proposta', 'Negociação/Habilitação/Certame']) {
    assert.deepEqual(resolverEtapaOportunidade(PUBLICA, etapa), {
      tipo_funil: 'publico',
      etapa_bruta: etapa,
      rotulo: etapa,
      estado_mapeamento: 'observado',
      fontes: PDF,
    })
  }
  assert.equal(resolverEtapaOportunidade(PUBLICA, 'Defesa Técnica').estado_mapeamento, 'nao_mapeado')
  assert.equal(resolverEtapaOportunidade(PUBLICA, 'Negociação').estado_mapeamento, 'nao_mapeado')
})

test('somente os tipos exatos identificam o funil', () => {
  for (const tipo of [null, 'Vendas Instituição Privada ', 'vendas instituição pública', 'Outro']) {
    assert.deepEqual(resolverEtapaOportunidade(tipo, 'Proposta'), {
      tipo_funil: 'nao_identificado',
      etapa_bruta: 'Proposta',
      rotulo: 'Proposta',
      estado_mapeamento: 'nao_mapeado',
      fontes: [],
    })
  }
})

test('rótulo novo permanece visível como bruto e sem proveniência atribuída', () => {
  assert.deepEqual(resolverEtapaOportunidade(PRIVADA, 'Nova fase local'), {
    tipo_funil: 'privado',
    etapa_bruta: 'Nova fase local',
    rotulo: 'Nova fase local',
    estado_mapeamento: 'nao_mapeado',
    fontes: [],
  })
  for (const etapa of ['MQL', 'SAL', 'SQL']) {
    assert.equal(resolverEtapaOportunidade(PRIVADA, etapa).estado_mapeamento, 'nao_mapeado')
  }
})

test('naturezas observadas no PDF ficam separadas de termos do briefing e fixture', () => {
  assert.deepEqual(resolverNaturezaVenda('Base'), {
    valor_bruto: 'Base', rotulo: 'Base', estado_mapeamento: 'observado',
    fontes: ['pdf_crm_integrado_mg', 'briefing_anterior', 'fixture'],
  })
  for (const valor of ['New Name', 'Cross']) {
    assert.deepEqual(resolverNaturezaVenda(valor), {
      valor_bruto: valor, rotulo: valor, estado_mapeamento: 'observado', fontes: PDF,
    })
  }
  for (const valor of ['New Name / Novo Cliente', 'Cross / Up Sell', 'C4L']) {
    assert.deepEqual(resolverNaturezaVenda(valor), {
      valor_bruto: valor, rotulo: valor, estado_mapeamento: 'autorizado_anterior',
      fontes: ['briefing_anterior', 'fixture'],
    })
  }
  assert.deepEqual(resolverNaturezaVenda('Nova natureza'), {
    valor_bruto: 'Nova natureza', rotulo: 'Nova natureza', estado_mapeamento: 'nao_mapeado', fontes: [],
  })
})
