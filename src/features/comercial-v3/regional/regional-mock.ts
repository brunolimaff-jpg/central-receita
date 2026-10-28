/**
 * Cenário demonstrativo da Visão Regional. Todos os dados são FICTÍCIOS:
 * clientes, executivos, valores e notas foram gerados com semente fixa (asOf declarado, ADR-0005).
 * Inclui casos adversariais de propósito para a limpeza do forecast aparecer na tela.
 */
import { mulberry32, type RegionalExec, type RegionalExecHist, type RegionalFilial, type RegionalHistMes, type RegionalHistOpp, type RegionalOpp, type RegionalSnapshot, type Tier } from './regional-model.ts'

const FILIAIS: { sigla: string; nome: string; metaMrr: number; metaNrr: number; execs: string[] }[] = [
  { sigla: 'DF', nome: 'Distrito Federal', metaMrr: 42000, metaNrr: 260000, execs: ['Ana Ribeiro', 'Caio Mendes', 'Lívia Prado'] },
  { sigla: 'GO', nome: 'Goiás', metaMrr: 48000, metaNrr: 300000, execs: ['Rafael Teles', 'Bianca Sousa', 'Diego Arantes'] },
  { sigla: 'MS', nome: 'Mato Grosso do Sul', metaMrr: 30000, metaNrr: 190000, execs: ['Paulo Viana', 'Renata Lobo'] },
  { sigla: 'MT', nome: 'Mato Grosso', metaMrr: 52000, metaNrr: 340000, execs: ['Tiago Farias', 'Marina Couto', 'Eduardo Leme', 'Sofia Rangel'] },
  { sigla: 'RO', nome: 'Rondônia', metaMrr: 16000, metaNrr: 110000, execs: ['Hugo Batista'] },
  { sigla: 'TO', nome: 'Tocantins', metaMrr: 14000, metaNrr: 90000, execs: ['Clara Nunes', 'Vitor Assis'] },
]

/** Quanto do NRR realizado vem de cada rubrica, por filial. Soma ~2 (as duas colunas do NRR). */
const SPLIT_LICENCA: Record<string, number> = { DF: 1.18, GO: 0.92, MS: 0.86, MT: 1.06, RO: 1.24, TO: 0.95 }
const SPLIT_SERVICO: Record<string, number> = { DF: 0.78, GO: 1.09, MS: 1.14, MT: 0.94, RO: 0.72, TO: 1.05 }

const PREFIXOS = ['Agro', 'Grupo', 'Cooperativa', 'Usina', 'Distribuidora', 'Transportes', 'Laticínios', 'Sementes', 'Fazendas', 'Comercial']
const NOMES = ['Cerrado Vivo', 'Pantanal', 'Serra Azul', 'Bom Retiro', 'Rio Claro', 'Vale Verde', 'Planalto', 'Araguaia', 'Boa Safra', 'Horizonte', 'Ipê Dourado', 'Três Lagoas', 'Chapada', 'Buriti', 'Santa Fé', 'Nova Era', 'Guaporé', 'Jalapão', 'Brasília Norte', 'Primavera']

const NOTAS_POR_TIER: Record<Tier, string[]> = {
  A: ['Contrato enviado para assinatura, decisor aprovou.', 'Cliente confirmou assinatura até sexta.', 'Minuta validada pelo jurídico; falta assinatura.'],
  'B+': ['Proposta final com diretoria; reunião marcada.', 'Decisor pediu ajuste de escopo; nova proposta enviada.', 'Negociação de prazo com CFO.'],
  B: ['Aguardando retorno do cliente sobre proposta.', 'Apresentação feita, cliente avaliando concorrente.', 'Reunião com diretoria a agendar.'],
  C: ['Primeira reunião feita, levantar necessidades.', 'Cliente pediu material técnico.', 'Aguarda retorno do cliente.'],
  D: ['Sem orçamento este ano.', 'Cliente sem resposta há semanas.'],
}

const PB: Record<Tier, number[]> = { A: [0.62, 0.6, 0.65], 'B+': [0.52, 0.38, 0.32], B: [0.24, 0.2], C: [0.1, 0.13, 0.08], D: [0] }

function gerar(): RegionalSnapshot {
  const rnd = mulberry32(20261028)
  const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)]
  const ri = (a: number, b: number) => Math.round(a + rnd() * (b - a))
  const usados = new Set<string>()
  const cliente = () => {
    for (;;) {
      const c = `${pick(PREFIXOS)} ${pick(NOMES)}`
      if (!usados.has(c)) { usados.add(c); return c }
    }
  }

  const execs: RegionalExec[] = []
  const opps: RegionalOpp[] = []
  const execHist: RegionalExecHist[] = []
  let seq = 410100

  for (const f of FILIAIS) {
    // Perfis diferentes de executivo para a nine box ter dispersão.
    f.execs.forEach((nome, i) => {
      const peso = 1 / f.execs.length
      const perfil = rnd()
      execs.push({ nome, filial: f.sigla, metaMrr: Math.round(f.metaMrr * peso), metaNrr: Math.round(f.metaNrr * peso) })
      const metaMes = Math.round((f.metaMrr + f.metaNrr) * peso)
      for (const mes of ['2026-08', '2026-09']) {
        const h = perfil > 0.66 ? 0.95 + rnd() * 0.35 : perfil > 0.33 ? 0.7 + rnd() * 0.3 : 0.35 + rnd() * 0.35
        execHist.push({ exec: nome, mes, meta: metaMes, ganho: Math.round(metaMes * h) })
      }
      const metaM = Math.round(f.metaMrr * peso), metaN = Math.round(f.metaNrr * peso)
      // Atingimento até agora (eixo Y) e cobertura do aberto (eixo X) variam de forma independente.
      const at = perfil > 0.66 ? 0.72 + rnd() * 0.3 : perfil > 0.33 ? 0.42 + rnd() * 0.25 : 0.15 + rnd() * 0.25
      const cov = 0.8 + rnd() * 2.8
      const nGanhas = Math.max(1, Math.round(at * 4))
      const nAbertas = Math.max(2, Math.round(cov * 2))
      const pesos = (n: number) => { const w = Array.from({ length: n }, () => 0.3 + rnd()); const t = w.reduce((a, b) => a + b, 0); return w.map(x => x / t) }
      const wg = pesos(nGanhas), wa = pesos(nAbertas)
      const faltaM = metaM * (1 - at), faltaN = metaN * (1 - at)
      for (let k = 0; k < nGanhas + nAbertas; k++) {
        const ganha = k < nGanhas
        const w = ganha ? wg[k] : wa[k - nGanhas]
        const tier: Tier = ganha ? 'A' : pick(['A', 'B+', 'B', 'B', 'C', 'C', 'C', 'D'] as Tier[])
        const novo = rnd() < 0.35
        const soNrr = rnd() < 0.15, soMrr = !soNrr && rnd() < 0.15
        const mrr = soNrr ? 0 : Math.round((ganha ? metaM * at : faltaM * cov) * w / 10) * 10
        const nrr = soMrr ? 0 : Math.round((ganha ? metaN * at : faltaN * cov) * w / 100) * 100
        const temAcao = tier !== 'C' || rnd() < 0.55
        opps.push({
          id: String(seq++),
          filial: f.sigla,
          exec: nome,
          cliente: cliente(),
          novo,
          data: `2026-10-${String(ganha ? ri(1, 27) : ri(28, 30)).padStart(2, '0')}`,
          tier,
          pb: ganha ? 1 : pick(PB[tier]),
          mrr: mrr || (nrr ? 0 : 1500),
          nrr,
          nota: pick(NOTAS_POR_TIER[tier]),
          proximaAcao: temAcao ? pick(['Reunião com decisor', 'Enviar contrato', 'Ligação de follow-up', 'Visita presencial']) : null,
          proximaAcaoData: temAcao ? `2026-10-${ri(28, 30)}` : null,
          atualizadaEm: `2026-10-${String(ri(14, 27)).padStart(2, '0')}`,
          status: ganha ? 'Ganha' : 'Em andamento',
          congelada: rnd() < 0.7,
        })
      }
      void i
    })
  }

  // Casos adversariais para a limpeza do forecast.
  const base = (over: Partial<RegionalOpp>): RegionalOpp => ({
    id: String(seq++), filial: 'MT', exec: 'Tiago Farias', cliente: 'Cliente', novo: false, data: '2026-10-30', tier: 'B', pb: 0.2,
    mrr: 2400, nrr: 30000, nota: 'Aguardando retorno do cliente.', proximaAcao: 'Ligação de follow-up', proximaAcaoData: '2026-10-29',
    atualizadaEm: '2026-10-22', status: 'Em andamento', congelada: true, ...over,
  })
  opps.push(
    base({ cliente: 'Usina Boa Vista do Norte', exec: 'Tiago Farias', nota: 'Proposta de ERP com diretoria.', tier: 'B+', pb: 0.38, nrr: 85000, mrr: 6200 }),
    base({ cliente: 'Usina Boa Vista do Norte', exec: 'Marina Couto', nota: 'Proposta de ERP com diretoria.', tier: 'B+', pb: 0.38, nrr: 85000, mrr: 6200 }),
    base({ cliente: 'Cooperativa Alto Xingu', filial: 'MT', exec: 'Eduardo Leme', nota: 'Módulo fiscal em negociação.', tier: 'B', pb: 0.24, nrr: 22000, mrr: 1800 }),
    base({ cliente: 'Cooperativa Alto Xingu', filial: 'MT', exec: 'Eduardo Leme', nota: 'Módulo de folha em negociação.', tier: 'B', pb: 0.24, nrr: 18000, mrr: 1400 }),
    base({ cliente: 'Grupo Lago Sul', filial: 'DF', exec: 'Ana Ribeiro', nota: 'Cliente informou que perdemos para concorrente.', tier: 'B+', pb: 0.32, nrr: 64000, mrr: 4100 }),
    base({ cliente: 'Transportes Cuiabá Rápido', filial: 'MT', exec: 'Sofia Rangel', nota: 'Empresa em recuperação judicial; aguardando crédito.', tier: 'B', pb: 0.2, nrr: 40000, mrr: 3000 }),
    base({ cliente: 'Agro Campo Grande Sul', filial: 'MS', exec: 'Paulo Viana', nota: 'Cliente indica pagamento só em 2027.', tier: 'B+', pb: 0.38, nrr: 72000, mrr: 5200 }),
    base({ cliente: 'Comercial Palmas Centro', filial: 'TO', exec: 'Clara Nunes', nota: 'Proposta enviada.', tier: 'C', pb: 0.1, mrr: 0, nrr: 0 }),
    base({ cliente: 'Laticínios Ji-Paraná', filial: 'RO', exec: 'Hugo Batista', nota: 'Levantamento inicial.', tier: 'C', pb: 0.1, proximaAcao: null, proximaAcaoData: null, atualizadaEm: '2026-08-30', nrr: 26000, mrr: 1900 }),
    base({ cliente: 'Sementes Rio Verde', filial: 'GO', exec: 'Rafael Teles', nota: 'Contrato com assinatura agendada na segunda.', tier: 'A', pb: 0.62, nrr: 120000, mrr: 9800 }),
  )

  const filiais: RegionalFilial[] = FILIAIS.map(f => {
    const ganhas = opps.filter(o => o.filial === f.sigla && o.status === 'Ganha')
    const mrr = ganhas.reduce((a, o) => a + o.mrr, 0)
    const nrr = ganhas.reduce((a, o) => a + o.nrr, 0)
    return {
      sigla: f.sigla,
      nome: f.nome,
      metaClientesNovos: Math.max(2, Math.round(f.execs.length * 1.5)),
      clientesNovos: ganhas.filter(o => o.novo).length,
      /*
       * Licença e serviço não fecham na mesma proporção na vida real: numa
       * filial o serviço puxa, noutra a licença trava. Sem essa diferença o
       * mapa de calor mostra duas colunas idênticas e não ensina nada a ler.
       * O split é fixo por filial para o cenário continuar reproduzível.
       */
      rubricas: {
        manutencao: { meta: f.metaMrr, ganho: mrr },
        licenca: { meta: Math.round(f.metaNrr * 0.7), ganho: Math.round(nrr * 0.7 * SPLIT_LICENCA[f.sigla]) },
        servico: { meta: Math.round(f.metaNrr * 0.3), ganho: Math.round(nrr * 0.3 * SPLIT_SERVICO[f.sigla]) },
      },
    }
  })

  const metaMrr = FILIAIS.reduce((a, f) => a + f.metaMrr, 0)
  const metaNrr = FILIAIS.reduce((a, f) => a + f.metaNrr, 0)
  const hist: RegionalHistMes[] = [
    { mes: 'Ago/2026', fluxo: 'mrr', meta: metaMrr, ganho: Math.round(metaMrr * 0.86), congelado: Math.round(metaMrr * 2.2), ganhoDoCongelado: Math.round(metaMrr * 0.48), foraDoCongelado: Math.round(metaMrr * 0.2) },
    { mes: 'Set/2026', fluxo: 'mrr', meta: metaMrr, ganho: Math.round(metaMrr * 0.94), congelado: Math.round(metaMrr * 2.4), ganhoDoCongelado: Math.round(metaMrr * 0.55), foraDoCongelado: Math.round(metaMrr * 0.22) },
    { mes: 'Ago/2026', fluxo: 'nrr', meta: metaNrr, ganho: Math.round(metaNrr * 0.78), congelado: Math.round(metaNrr * 1.7), ganhoDoCongelado: Math.round(metaNrr * 0.42), foraDoCongelado: Math.round(metaNrr * 0.18) },
    { mes: 'Set/2026', fluxo: 'nrr', meta: metaNrr, ganho: Math.round(metaNrr * 0.83), congelado: Math.round(metaNrr * 1.8), ganhoDoCongelado: Math.round(metaNrr * 0.47), foraDoCongelado: Math.round(metaNrr * 0.2) },
  ]

  const histOpps: RegionalHistOpp[] = []
  for (let i = 0; i < 260; i++) {
    const fluxo = i % 2 ? 'mrr' : 'nrr'
    const valor = fluxo === 'mrr' ? ri(3, 140) * 100 : ri(2, 160) * 1000
    const nota = pick(['Contrato para assinatura.', 'Aguarda retorno do cliente.', 'Reunião com diretoria.', 'Proposta enviada.', 'Negociação de prazo.'])
    const grande = fluxo === 'mrr' ? valor > 8000 : valor > 100000
    let p = 0.26
    if (/assinatura/.test(nota)) p += 0.2
    if (/Aguarda/.test(nota)) p -= 0.14
    if (grande) p -= 0.1
    histOpps.push({ fluxo, valor, nota, ganha: rnd() < p })
  }

  return {
    asOf: '2026-10-28',
    competencia: 'Outubro/2026',
    ultimoDiaUtil: '2026-10-30',
    persona: { nome: 'Matheus Martins', papel: 'Gerente regional · Centro-Oeste + estados', filiais: FILIAIS.map(f => f.sigla) },
    filiais,
    execs,
    opps,
    hist,
    histOpps,
    execHist,
  }
}

export const REGIONAL_SNAPSHOT: RegionalSnapshot = gerar()
