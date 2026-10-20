import { OPORTUNIDADE_COPY } from '../copy'
import { formatarValorOportunidade, formatarPercentualInteiro } from '../format'
import type { OpportunityModel } from '../model'

/**
 * Composição comercial da oportunidade (plano Task 9 Step 2, l.756-758; spec §7, l.317-341).
 *
 * A receita recorrente é o componente visualmente mais forte — barra cheia, valor
 * maior e legenda própria. Habilitação e serviços continuam visíveis, mas em
 * segundo plano, como pede a regra de receita da spec (§2, l.56-62).
 */

export function OpportunityRevenue({ model }: { model: OpportunityModel }) {
  const total = model.recurring + model.enablement + model.services
  const partes = [
    {
      chave: 'recorrente',
      rotulo: OPORTUNIDADE_COPY.recorrente,
      nota: 'Receita que se repete',
      valor: model.recurring,
      destaque: true,
    },
    {
      chave: 'habilitacao',
      rotulo: OPORTUNIDADE_COPY.habilitacao,
      nota: 'Não recorrente',
      valor: model.enablement,
      destaque: false,
    },
    {
      chave: 'servicos',
      rotulo: OPORTUNIDADE_COPY.servicos,
      nota: 'Não recorrente',
      valor: model.services,
      destaque: false,
    },
  ]

  return (
    <section className="h-full rounded-[14px] border border-[#dfe8ef] bg-white px-4 py-3.5 shadow-[0_3px_9px_rgba(32,73,91,0.025)]">
      <div className="mb-2.5">
        <h2 className="text-[16px] font-bold tracking-[-0.02em] text-[#0d2340]">
          {OPORTUNIDADE_COPY.composicaoTitulo}
        </h2>
        <p className="mt-0.5 text-[12px] text-[#63748a]">
          Valores do snapshot local, sem writeback.
        </p>
      </div>

      <ul className="grid gap-2.5">
        {partes.map((parte) => {
          const participacao = total > 0 ? parte.valor / total : 0
          return (
            <li
              key={parte.chave}
              className={`rounded-[11px] border px-3 py-2.5 ${
                parte.destaque ? 'border-[#cfe9e2] bg-[#f3faf8]' : 'border-[#edf2f6] bg-[#fbfdfe]'
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0">
                  <strong
                    className={`block ${parte.destaque ? 'text-[14px] font-extrabold text-[#0d2340]' : 'text-[12.5px] font-semibold text-[#3d5069]'}`}
                  >
                    {parte.rotulo}
                  </strong>
                  <span className="block text-[11px] text-[#75869a]">{parte.nota}</span>
                </span>
                <b
                  className={`num whitespace-nowrap ${
                    parte.destaque
                      ? 'text-[20px] font-extrabold text-[#0d2340]'
                      : 'text-[13px] font-bold text-[#3d5069]'
                  }`}
                >
                    {formatarValorOportunidade(parte.valor)}
                </b>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e6edf1]">
                  <span
                    className={`block h-full rounded-full ${
                      parte.destaque
                        ? 'bg-[linear-gradient(90deg,#04a88b,#42c5ae)]'
                        : 'bg-[#b8c6d4]'
                    }`}
                    style={{ width: `${Math.min(100, participacao * 100)}%` }}
                  />
                </span>
                <span className="num w-[38px] text-right text-[11px] text-[#75869a]">
                  {formatarPercentualInteiro(participacao)}
                </span>
              </div>
            </li>
          )
        })}
      </ul>

      <p className="num mt-2.5 border-t border-[#edf2f6] pt-2 text-[11px] text-[#8190a2]">
        Composição comercial total: {formatarValorOportunidade(total)}
      </p>
    </section>
  )
}
