import { OPORTUNIDADE_COPY } from '../copy'
import { formatarValorOportunidade } from '../format'
import type { OpportunityModel } from '../model'
import type { ForecastMovement } from '../types'
import { ProductLabel } from './product-icon'

/**
 * Cabeçalho da Oportunidade (plano Task 9 Step 1, l.736-755; spec §7, l.317-341).
 *
 * Mostra exatamente os campos exigidos quando existem no mock — conta, solução,
 * executivo, filial, HEAD, estágio, origem, fotografia oficial, forecast atual,
 * movimento e recorrente. Nenhum decisor, causa ou ação de cobrança é inventado:
 * o que o snapshot não tem (HEAD ausente) aparece como `—`.
 */

const TAG_POR_MOVIMENTO: Record<ForecastMovement, string> = {
  Saiu: 'bg-[#ffecef] text-[#c32943]',
  Postergou: 'bg-[#fff4dc] text-[#aa6a08]',
  'Alterou valor': 'bg-[#eaf3ff] text-[#2368bf]',
  Entrou: 'bg-[#e8f8f3] text-[#00856f]',
}

export function OpportunitySummary({ model }: { model: OpportunityModel }) {
  const campos = [
    { rotulo: 'Conta', valor: model.account },
    { rotulo: 'Solução', valor: model.solution },
    { rotulo: 'Executivo', valor: model.executive },
    { rotulo: 'Filial', valor: model.branch },
    { rotulo: 'HEAD', valor: model.head ?? '—' },
    { rotulo: 'Estágio', valor: model.stage },
    { rotulo: 'Movimento observado', valor: model.movement ?? 'Sem mudança' },
  ]

  const celulas = [
    {
      chave: 'oficial',
      rotulo: 'Forecast na foto',
      valor: formatarValorOportunidade(model.forecastOfficial),
      negativo: false,
    },
    {
      chave: 'atual',
      rotulo: 'Forecast atual',
      valor: formatarValorOportunidade(model.forecastCurrent),
      negativo: false,
    },
    {
      chave: 'delta',
      rotulo: 'Δ valor',
      valor: formatarValorOportunidade(model.delta),
      negativo: model.delta < 0,
    },
    {
      chave: 'recorrente',
      rotulo: 'Receita recorrente',
      valor: formatarValorOportunidade(model.recurring),
      negativo: false,
    },
  ]

  return (
    <section className="rounded-[10px] border border-[#dfe8ef] bg-white px-5 py-4 shadow-[0_4px_14px_rgba(32,73,91,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[26px] font-bold tracking-[-0.04em] text-[#0d2340]">Oportunidade {model.id}</h1>
          <p className="mt-1 text-[15px] font-semibold text-[#33466c]">{model.account} · {model.solution}</p>
          <div aria-label="Classificação da oportunidade" className="mt-2.5 flex flex-wrap items-center gap-2 text-[12px] font-semibold">
            <span className="rounded-full border border-[#d4e4ff] bg-[#eaf3ff] px-3 py-1.5 text-[#2368bf]" title="Solução / produto">
              <ProductLabel solucao={model.solution} tamanho={15} />
            </span>
            <span className="rounded-full border border-[#e5d9f5] bg-[#f3ecfb] px-3 py-1.5 text-[#7142a1]" title="Etapa comercial">{model.stage}</span>
            <span className="rounded-full border border-[#dfe8ef] bg-[#f5f8fb] px-3 py-1.5 text-[#33466c]" title="Classificação informada no cenário; a classificação validada permanece indisponível">{model.origin} · informado no cenário</span>
          </div>
          <p className="num mt-2 text-[13px] text-[#50647d]">
            {model.executive} · Filial {model.branch}
          </p>
        </div>
        {model.movement ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border border-current/15 px-3 py-2 text-[12px] font-bold ${TAG_POR_MOVIMENTO[model.movement]}`}
          >
            <span aria-hidden>{model.movement === 'Entrou' ? '+' : model.movement === 'Saiu' ? '−' : '↔'}</span>
            {model.movement}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-[#eef2f6] px-2.5 py-1.5 text-[11px] font-bold text-[#5b6d82]">
            {OPORTUNIDADE_COPY.semMovimento}
          </span>
        )}
      </div>

      <dl className="mt-3 grid gap-x-4 gap-y-2 border-t border-[#edf2f6] pt-3 sm:grid-cols-2 xl:grid-cols-4">
        {campos.map((campo) => (
          <div key={campo.rotulo} className="min-w-0">
            <dt className="text-[12px] text-[#50647d]">{campo.rotulo}</dt>
            <dd className="mt-0.5 text-[13px] font-semibold text-[#203550]">{campo.valor}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 min-[1600px]:grid-cols-4">
        {celulas.map((celula) => (
          <article
            key={celula.chave}
            className={`rounded-[10px] border px-3.5 py-3.5 ${
              celula.negativo
                ? 'border-[#f3d9de] bg-[linear-gradient(180deg,#ffffff,#fff7f8)]'
                : 'border-[#dfe8ef] bg-[#fbfdfe]'
            }`}
          >
            <p className="text-[12px] text-[#6b7d91]">{celula.rotulo}</p>
            <b
              className={`num mt-1.5 block text-[22px] font-extrabold ${
                celula.negativo ? 'text-[#d62d4a]' : 'text-[#0d2340]'
              }`}
            >
              {celula.valor}
            </b>
          </article>
        ))}
      </div>
    </section>
  )
}
