import test from 'node:test'
import assert from 'node:assert/strict'

/**
 * Regras da carteira por nó.
 *
 * Os módulos são TypeScript puro, sem DOM e sem React, e usam imports com
 * extensão `.ts` — o type-stripping do Node os resolve direto, sem transpile
 * manual. É o mesmo mecanismo que o `npm test` já usa.
 */
const raiz = new URL('../src/features/comercial-v3/', import.meta.url)
const carregar = nome => import(new URL(nome, raiz).href)

const { ARVORE, filhosDe, subarvore, trilha, no } = await carregar('carteira-arvore.ts')
const { atribuirResponsaveis, coberturaDePara, normalizarResponsavel, noDoResponsavel } = await carregar('carteira-de-para.ts')
const { montarCarteira, reconciliar, ordenarPorGap, coberturaDoNivel, totalComResiduo } = await carregar('carteira-model.ts')

/* ------------------------------------------------------------------ */
/*  Árvore                                                             */
/* ------------------------------------------------------------------ */

test('a raiz é o CSO e a cadeia chega ao gerente', () => {
  assert.equal(ARVORE.raiz, 'cso')
  assert.equal(no(ARVORE, 'cso')?.nome, 'Hermínio Gastaldi')

  const diretores = filhosDe(ARVORE, 'cso')
  assert.ok(diretores.length >= 4, 'o CSO tem ao menos quatro diretores/verticais')

  const demais = no(ARVORE, 'v-demais')
  assert.ok(demais, 'Demais Segmentos existe')
  const gerentes = filhosDe(ARVORE, 'v-demais')
  assert.ok(gerentes.length > 0, 'o diretor de Demais Segmentos tem gerentes')
  assert.ok(gerentes.every(g => g.nivel === 'gerente'))
})

test('toda pessoa tem pai, exceto a raiz', () => {
  for (const n of ARVORE.nos.values()) {
    if (n.id === ARVORE.raiz) assert.equal(n.pai, null)
    else assert.ok(n.pai, `${n.id} deveria ter pai`)
  }
})

test('nenhum id se repete, mesmo com nomes iguais', () => {
  // O id é posicional, não derivado do nome: duas pessoas homônimas não colidem.
  const ids = [...ARVORE.nos.keys()]
  assert.equal(new Set(ids).size, ids.length)
})

test('vaga tem nome nulo e continua na árvore', () => {
  const vagas = [...ARVORE.nos.values()].filter(n => n.nome === null)
  assert.ok(vagas.length > 0, 'o organograma 2027 tem posições em aberto')
  for (const vaga of vagas) assert.ok(vaga.pai, 'vaga preserva a topologia')
})

test('a trilha vai da raiz até o nó', () => {
  const gerentes = filhosDe(ARVORE, 'v-demais')
  const caminho = trilha(ARVORE, gerentes[0].id)
  assert.equal(caminho[0].id, 'cso')
  assert.equal(caminho[caminho.length - 1].id, gerentes[0].id)
})

test('subárvore inclui o próprio nó e todos os descendentes', () => {
  const todos = subarvore(ARVORE, 'v-demais')
  assert.ok(todos.some(n => n.id === 'v-demais'))
  assert.ok(todos.length > filhosDe(ARVORE, 'v-demais').length)
})

/* ------------------------------------------------------------------ */
/*  De-para: a regra mais importante do modelo                         */
/* ------------------------------------------------------------------ */

test('normalização ignora acento, caixa e espaço — e nada mais', () => {
  assert.equal(normalizarResponsavel('  Hermínio   Gastaldi '), 'HERMINIO GASTALDI')
  assert.equal(normalizarResponsavel('herminio gastaldi'), 'HERMINIO GASTALDI')
  // Nomes diferentes continuam diferentes: não há aproximação.
  assert.notEqual(normalizarResponsavel('Jose Tavares'), normalizarResponsavel('Jose Ricardo Porto Tavares'))
})

test('nome parecido não casa por conta própria: só o alias declarado casa', () => {
  // "Jose Tavares" casa porque está no organograma E no de-para.
  assert.ok(noDoResponsavel(ARVORE, 'Jose Tavares'))
  // Já "José Ricardo Porto Tavares" só casa porque foi declarado como alias.
  const completo = noDoResponsavel(ARVORE, 'Jose Ricardo Porto Tavares')
  assert.ok(completo, 'o nome completo é alias declarado do mesmo nó')
  assert.equal(completo.id, noDoResponsavel(ARVORE, 'Jose Tavares').id)
  // Um nome que não está em nenhum dos dois não casa.
  assert.equal(noDoResponsavel(ARVORE, 'Jose Ricardo'), null)
})

test('responsável vazio e responsável desconhecido caem em baldes distintos', () => {
  const resultado = atribuirResponsaveis(ARVORE, ['', '   ', 'Fulano Que Nao Existe', 'Herminio Gastaldi'])
  assert.equal(resultado.semResponsavel.length, 1, 'vazio é um balde único')
  assert.deepEqual(resultado.naoCadastrado, ['Fulano Que Nao Existe'])
  assert.equal(resultado.mapa.size, 1)
})

test('a cobertura informa quantos nós nomeados têm alias', () => {
  const cobertura = coberturaDePara(ARVORE)
  assert.ok(cobertura.total > 0)
  assert.ok(cobertura.percentual > 0 && cobertura.percentual <= 1)
})

/* ------------------------------------------------------------------ */
/*  Agregação                                                          */
/* ------------------------------------------------------------------ */

const registro = (over = {}) => ({
  row: 1, opportunityId: 'OPP-1', orderId: '', accountId: 'ACC-1', account: 'Conta',
  stage: 'Proposta', status: '', classification: '', representative: 'Filial Alfa',
  executive: 'Herminio Gastaldi', ownerGroup: '',
  forecastDate: '2026-10-20', closingDate: null, conferenceDate: null,
  predictedValue: 1000, closedValue: null, maintenance: null,
  product: '', module: '', modality: '', probability: 0.8,
  ...over,
})

const cobertura = { declarados: 1, total: 1, percentual: 1 }

test('previsto respeita o corte de 75% quando a carga traz probabilidade', () => {
  const registros = [
    registro({ opportunityId: 'A', predictedValue: 1000, probability: 0.8 }),
    registro({ opportunityId: 'B', predictedValue: 500, probability: 0.5 }),
  ]
  const carteira = montarCarteira(ARVORE, registros, 'cso', '2026-10-28', cobertura)
  assert.equal(carteira.raiz.metricas.previsto, 1000, 'só a oportunidade com 80% entra')
})

test('nulo propaga: um registro sem valor torna o total desconhecido, não menor', () => {
  const registros = [
    registro({ opportunityId: 'A', predictedValue: 1000 }),
    registro({ opportunityId: 'B', predictedValue: null }),
  ]
  const carteira = montarCarteira(ARVORE, registros, 'cso', '2026-10-28', cobertura)
  assert.equal(carteira.raiz.metricas.previsto, null)
})

test('contagem é distinta por oportunidade, não por linha', () => {
  const registros = [
    registro({ opportunityId: 'A', accountId: 'ACC-1' }),
    registro({ opportunityId: 'A', accountId: 'ACC-1' }),
    registro({ opportunityId: 'B', accountId: 'ACC-1' }),
  ]
  const carteira = montarCarteira(ARVORE, registros, 'cso', '2026-10-28', cobertura)
  assert.equal(carteira.raiz.metricas.oportunidades, 2)
  assert.equal(carteira.raiz.metricas.contas, 1)
})

test('registro sem responsável vai para o resíduo, com motivo separado', () => {
  const registros = [
    registro({ opportunityId: 'A', executive: 'Herminio Gastaldi' }),
    registro({ opportunityId: 'B', executive: '' }),
    registro({ opportunityId: 'C', executive: 'Ninguem Cadastrado' }),
  ]
  const carteira = montarCarteira(ARVORE, registros, 'cso', '2026-10-28', cobertura)
  assert.equal(carteira.raiz.residuo.quantidade, 2)
  assert.equal(carteira.raiz.residuo.semResponsavel, 1)
  assert.equal(carteira.raiz.residuo.naoMapeado, 1)
  assert.ok(carteira.raiz.residuo.grafias.includes('Ninguem Cadastrado'))
})

test('a reconciliação fecha: Σ filhos + próprias = total do nó', () => {
  const registros = [
    registro({ opportunityId: 'A', executive: 'Herminio Gastaldi', predictedValue: 100 }),
    registro({ opportunityId: 'B', executive: 'Giovanne Farias', predictedValue: 200 }),
    registro({ opportunityId: 'C', executive: 'Raíssa Delamora', predictedValue: 300 }),
    registro({ opportunityId: 'D', executive: 'Fantasma', predictedValue: 50 }),
  ]
  const carteira = montarCarteira(ARVORE, registros, 'cso', '2026-10-28', cobertura)
  const resultado = reconciliar(carteira)
  assert.equal(resultado.fecha, true, `diferença inesperada: ${resultado.diferenca}`)
  // O total do nó não inclui o resíduo: só o que pertence à estrutura.
  assert.equal(carteira.raiz.metricas.previsto, 600)
  // E o resíduo aparece separado, com o valor que ficou fora.
  assert.equal(carteira.raiz.residuo.valor, 50)
  assert.equal(totalComResiduo(carteira), 650, 'estrutura + fora dela = tudo que existe')
})

test('ordenar por gap põe quem tem menos previsto primeiro', () => {
  const filhos = [
    { no: { id: 'a' }, metricas: { previsto: 500 } },
    { no: { id: 'b' }, metricas: { previsto: 100 } },
    { no: { id: 'c' }, metricas: { previsto: null } },
  ]
  const ordenado = ordenarPorGap(filhos).map(f => f.no.id)
  assert.deepEqual(ordenado, ['c', 'b', 'a'], 'desconhecido vem antes de todo mundo')
})

test('cobertura do nível conta só filhos nomeados', () => {
  const filhos = [
    { no: { nome: 'A' }, metricas: { previsto: 100 } },
    { no: { nome: 'B' }, metricas: { previsto: 0 } },
    { no: { nome: null }, metricas: { previsto: 500 } },
  ]
  assert.deepEqual(coberturaDoNivel(filhos), { comValor: 1, total: 2 })
})

test('travada é aberta sem previsão ou com previsão vencida', () => {
  const registros = [
    registro({ opportunityId: 'A', forecastDate: null, stage: 'Proposta' }),
    registro({ opportunityId: 'B', forecastDate: '2026-10-01', stage: 'Proposta' }),
    registro({ opportunityId: 'C', forecastDate: '2026-12-01', stage: 'Proposta' }),
    registro({ opportunityId: 'D', forecastDate: null, stage: 'Fechada e Ganha' }),
  ]
  const carteira = montarCarteira(ARVORE, registros, 'cso', '2026-10-28', cobertura)
  assert.equal(carteira.raiz.metricas.travadasQuantidade, 2, 'A e B; a ganha não conta')
})

test('ganho no CRM exige efetivação na competência', () => {
  const registros = [
    registro({ opportunityId: 'A', stage: 'Fechada e Ganha', closingDate: '2026-10-15', closedValue: 700 }),
    registro({ opportunityId: 'B', stage: 'Fechada e Ganha', closingDate: '2026-09-15', closedValue: 900 }),
  ]
  const carteira = montarCarteira(ARVORE, registros, 'cso', '2026-10-28', cobertura)
  assert.equal(carteira.raiz.metricas.ganhos, 700)
})

test('carga sem coluna de probabilidade não aplica o corte de 75%', () => {
  const registros = [registro({ opportunityId: 'A', predictedValue: 1000, probability: null })]
  const carteira = montarCarteira(ARVORE, registros, 'cso', '2026-10-28', cobertura)
  assert.equal(carteira.probabilidadeDisponivel, false)
  assert.equal(carteira.raiz.metricas.previsto, 1000)
})

/* ------------------------------------------------------------------ */
/*  Fila de pedidos e lente de território                              */
/* ------------------------------------------------------------------ */

const { filaDaPessoa } = await carregar('carteira-fila.ts')
const { lenteTerritorios } = await carregar('carteira-territorio.ts')

const pedido = (over = {}) => registro({
  orderId: 'PED-1', status: 'EM CONFERENCIA', maintenance: 500, ...over,
})

test('a fila conta pedido distinto, não linha de item', () => {
  const pedidos = [
    pedido({ orderId: 'PED-1', row: 1, maintenance: 500 }),
    pedido({ orderId: 'PED-1', row: 2, maintenance: 300 }),
    pedido({ orderId: 'PED-2', row: 3, maintenance: 200 }),
  ]
  const fila = filaDaPessoa(pedidos)
  assert.equal(fila.pedidos, 2)
  const emConferencia = fila.estados.find(e => e.estado === 'em conferência')
  assert.equal(emConferencia.pedidos, 2)
})

test('a fila separa os estados pelo vocabulário do glossário', () => {
  const fila = filaDaPessoa([
    pedido({ orderId: 'A', status: 'EM CONFERENCIA' }),
    pedido({ orderId: 'B', status: 'DEVOLVIDO' }),
    pedido({ orderId: 'C', status: 'INTEGRADO COM ERP' }),
    pedido({ orderId: 'D', status: 'STATUS ESTRANHO' }),
  ])
  const estados = fila.estados.map(e => e.estado).sort()
  assert.ok(estados.includes('em conferência'))
  assert.ok(estados.includes('devolvido'))
  assert.ok(estados.includes('integrado'))
  assert.ok(estados.includes('Não classificado'), 'status fora do de-para nunca é encaixado à força')
})

test('valor pendente soma só o que ainda não concluiu', () => {
  const fila = filaDaPessoa([
    pedido({ orderId: 'A', status: 'EM CONFERENCIA', maintenance: 500 }),
    pedido({ orderId: 'B', status: 'DEVOLVIDO', maintenance: 250 }),
    pedido({ orderId: 'C', status: 'INTEGRADO', maintenance: 999 }),
  ])
  assert.equal(fila.valorPendente, 750)
  assert.match(fila.nota, /não soma ao forecast/)
})

test('valor ausente na fila propaga nulo, não vira zero', () => {
  const fila = filaDaPessoa([
    pedido({ orderId: 'A', status: 'EM CONFERENCIA', maintenance: 500 }),
    pedido({ orderId: 'B', status: 'EM CONFERENCIA', maintenance: null }),
  ])
  assert.equal(fila.valorPendente, null)
})

test('a lente de território calcula a diferença da matriz em vez de afirmá-la', () => {
  const lente = lenteTerritorios()
  assert.equal(lente.territorios.length, 5)
  // A abertura por vertical é R$ 123 mil menor que o total declarado.
  assert.equal(Math.round(lente.reconciliacao.diferencaDaMatriz), 123_000)
  assert.equal(lente.reconciliacao.totalDeclarado, 77_500_000)
})

test('território sem base própria não aparece como zero', () => {
  const lente = lenteTerritorios()
  const t05 = lente.territorios.find(t => t.numero === 5)
  assert.equal(t05.temBasePropria, false)
  assert.equal(t05.mrr, null, 'null, nunca R$ 0 — zero diria "vendeu nada"')
})

test('a lente avisa que o dado não vem da carga', () => {
  const lente = lenteTerritorios()
  assert.match(lente.aviso, /não medida na carga/)
  assert.match(lente.aviso, /não foi redistribuída/)
})
