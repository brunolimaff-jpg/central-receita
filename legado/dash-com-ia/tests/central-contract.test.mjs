import assert from 'node:assert/strict'
import test from 'node:test'

const baseUrl = process.env.CENTRAL_BASE_URL ?? 'http://127.0.0.1:3000'

async function getJson(path) {
  const response = await fetch(new URL(path, baseUrl))
  const body = await response.json()
  return { response, body }
}

async function postJson(path, body) {
  const response = await fetch(new URL(path, baseUrl), {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
  return { response, body: await response.json() }
}

test('o contrato HTTP preserva bruto, resolução e proveniência de etapa e natureza', async () => {
  const { response, body } = await getJson('/api/oportunidades')
  assert.equal(response.status, 200)
  assert.ok(body.oportunidades.length > 0)
  assert.ok(body.oportunidades.some((item) => item.etapa_taxonomia.estado_mapeamento === 'nao_mapeado'))
  for (const item of body.oportunidades) {
    assert.equal(item.etapa_taxonomia.etapa_bruta, item.etapa)
    assert.equal(item.etapa_taxonomia.rotulo, item.etapa)
    assert.ok(['observado', 'nao_mapeado'].includes(item.etapa_taxonomia.estado_mapeamento))
    assert.ok(Array.isArray(item.etapa_taxonomia.fontes))
    assert.equal(item.natureza_venda_taxonomia.valor_bruto, item.classificacao_fixture ?? '')
    assert.ok(Array.isArray(item.natureza_venda_taxonomia.fontes))
    if (['Originação', 'SQL'].includes(item.etapa)) {
      assert.equal(item.etapa_taxonomia.estado_mapeamento, 'nao_mapeado')
      assert.deepEqual(item.etapa_taxonomia.fontes, ['briefing_anterior', 'fixture'])
    } else if (item.etapa_taxonomia.estado_mapeamento === 'nao_mapeado') {
      assert.deepEqual(item.etapa_taxonomia.fontes, [])
    }
  }

  const id = body.oportunidades[0].oportunidade_id
  const { response: detalheResponse, body: detalhe } = await getJson(`/api/oportunidades/${id}`)
  assert.equal(detalheResponse.status, 200)
  assert.equal(detalhe.oportunidade.etapa, body.oportunidades[0].etapa)
  assert.deepEqual(detalhe.oportunidade.etapa_taxonomia, body.oportunidades[0].etapa_taxonomia)
})

test('Radar, Casos e Pergunte expõem a etapa resolvida sem promover Fechamento no R4', async () => {
  const { response: radarResponse, body: radar } = await getJson('/api/radar')
  assert.equal(radarResponse.status, 200)
  const r4 = radar.regras.find((regra) => regra.codigo === 'R4')
  assert.ok(r4)
  assert.ok(r4.oportunidades.length > 0)
  for (const referencia of r4.oportunidades) {
    assert.equal(referencia.etapa_taxonomia.estado_mapeamento, 'observado')
    assert.notEqual(referencia.etapa, 'Fechamento')
  }

  const { response: casosResponse, body: casos } = await getJson('/api/casos')
  assert.equal(casosResponse.status, 200)
  assert.ok(casos.casos.length > 0)
  for (const caso of casos.casos) {
    assert.equal(caso.etapa_taxonomia.etapa_bruta, caso.etapa)
    if (caso.sinal_codigo === 'R4') assert.notEqual(caso.etapa, 'Fechamento')
  }

  const { response: agenteResponse, body: agente } = await postJson('/api/agente', { pergunta: 'Quais oportunidades têm forecast com previsão vencida?' })
  assert.equal(agenteResponse.status, 200)
  assert.equal(agente.reconhecido, true)
  assert.ok(agente.blocos[0].linhas.every((linha) => linha[3] && linha[3] !== 'Não comprovado'))
})

test('o fixture principal usa a taxonomia Senior autorizada no briefing', async () => {
  const { response, body } = await getJson('/api/oportunidades')
  assert.equal(response.status, 200)
  const main = body.oportunidades.find((item) => item.oportunidade_id === 339001)
  assert.ok(main, 'oportunidade sintética 339001 deve existir')
  assert.equal(main.nome, 'ERP GATec')
  assert.equal(main.tipo_oportunidade, 'Vendas Instituição Privada')
  assert.equal(main.subtipo_oportunidade, 'ERP GATec')
  assert.equal(main.classificacao_fixture, 'New Name / Novo Cliente')

  const classificacoes = new Set(body.oportunidades.map((item) => item.classificacao_fixture))
  for (const valor of ['New Name / Novo Cliente', 'Base', 'Cross / Up Sell', 'C4L']) {
    assert.ok(classificacoes.has(valor), `fixture deve exercitar ${valor}`)
  }
  for (const item of body.oportunidades) {
    assert.doesNotMatch(item.nome, /Programa de fidelização|Portal do Parceiro|Expansão do time comercial/i)
  }
})

test('a classificação e a filial do contexto reduzem a população de oportunidades', async () => {
  const { body: all } = await getJson('/api/oportunidades')
  const { response: classResponse, body: base } = await getJson('/api/oportunidades?classificacao=Base')
  assert.equal(classResponse.status, 200)
  assert.ok(base.total > 0 && base.total < all.total)
  assert.ok(base.oportunidades.every((item) => item.classificacao_fixture === 'Base'))

  const filial = encodeURIComponent('Matriz — Sorriso')
  const { response: branchResponse, body: branch } = await getJson(`/api/oportunidades?filial=${filial}`)
  assert.equal(branchResponse.status, 200)
  assert.ok(branch.total > 0 && branch.total < all.total)
  assert.ok(branch.oportunidades.every((item) => item.filial === 'Matriz — Sorriso'))
})

test('a janela de forecast é explícita e muda entre 30 e 90 dias', async () => {
  const { response: response30, body: view30 } = await getJson('/api/visao?janela=30')
  const { response: response90, body: view90 } = await getJson('/api/visao?janela=90')
  assert.equal(response30.status, 200)
  assert.equal(response90.status, 200)
  assert.ok(view30.indicadores.some((item) => item.rotulo === 'Projeção móvel 30 dias'))
  assert.ok(view90.indicadores.some((item) => item.rotulo === 'Projeção móvel 90 dias'))
})

test('a Visão separa o PEX mensal da projeção móvel e valida a competência escolhida', async () => {
  const { response, body } = await getJson('/api/visao?ano=2026&mes=9&janela=30')
  assert.equal(response.status, 200)
  assert.deepEqual(body.forecast_pex.competencia, { ano: 2026, mes: 9 })
  assert.equal(body.forecast_pex.fuso_horario, 'America/Sao_Paulo')
  assert.equal(body.forecast_pex.fonte, 'pdf_crm_integrado_mg')
  assert.ok(body.forecast_pex.total_pex_mes.quantidade >= body.forecast_pex.previsto_pex.quantidade)
  assert.ok(body.indicadores.some((item) => item.rotulo === 'Projeção móvel 30 dias'))

  const { response: invalida } = await getJson('/api/visao?ano=2026&mes=13')
  assert.equal(invalida.status, 400)
})

test('Agora expõe agenda com motivo, proveniência, limitação e ações somente simuladas', async () => {
  const { response, body } = await getJson('/api/agora?ano=2026&mes=9')
  assert.equal(response.status, 200)
  assert.deepEqual(body.agenda_executiva.competencia, { ano: 2026, mes: 9 })
  assert.equal(body.agenda_executiva.fuso_horario, 'America/Sao_Paulo')
  assert.ok(body.agenda_executiva.limitacao_perda_ritmo.includes('não as usa como limiar'))
  assert.ok(Array.isArray(body.agenda_executiva.mutirao_por_motivo))
  for (const item of body.agenda_executiva.itens) {
    assert.ok(item.motivos.length > 0)
    assert.ok(item.regra)
    assert.ok(item.limitacao)
    assert.ok(Array.isArray(item.fontes))
    assert.ok(item.etapa_taxonomia.etapa_bruta)
    assert.ok(item.acao_simulada.every((acao) => ['abrir', 'retomar', 'reprogramar'].includes(acao)))
  }
})

test('o Fio da Receita preserva objetos distintos e só renderiza a relação existente', async () => {
  const { response, body } = await getJson('/api/oportunidades/339001')
  assert.equal(response.status, 200)
  assert.equal(body.oportunidade.situacao, 'Ganha')
  assert.ok(Array.isArray(body.fio_da_receita), 'detalhe deve expor a lista explícita de transições')
  assert.deepEqual(
    body.fio_da_receita.map(({ objeto, id, data, estado }) => ({ objeto, id, data, estado })),
    [
      { objeto: 'SQL', id: '84521', data: '2026-04-15', estado: 'Aceito' },
      { objeto: 'Conta', id: '200001', data: null, estado: 'Agro Horizonte S.A.' },
      { objeto: 'Oportunidade', id: '339001', data: null, estado: 'ERP GATec' },
      { objeto: 'Proposta', id: '427070', data: null, estado: 'Válida' },
      { objeto: 'Win/Loss', id: null, data: '2026-07-31', estado: 'Win' },
      { objeto: 'Pedido', id: '212625', data: '2026-08-18', estado: 'Em conferência' },
    ],
  )
  assert.equal(body.pedido.numero, '212625')

  const { response: noThreadResponse, body: noThread } = await getJson('/api/oportunidades/339002')
  assert.equal(noThreadResponse.status, 200)
  assert.deepEqual(noThread.fio_da_receita, [])
})

test('ID de oportunidade inexistente não recebe fixture de fallback', async () => {
  const { response, body } = await getJson('/api/oportunidades/999999')
  assert.equal(response.status, 404)
  assert.match(body.erro, /não encontrada/i)
})
