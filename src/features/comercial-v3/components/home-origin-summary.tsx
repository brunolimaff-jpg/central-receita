import { formatarComSinal, formatarMilhoes, formatarPercentualInteiro } from '../format'
import type { Movimentos, OrigemRealizado } from '../model'

export function HomeOriginSummary({ origem, movimentos }: { origem: OrigemRealizado; movimentos: Movimentos }) {
  const totalOrigem = origem.newNames + origem.cross
  const newNameRatio = totalOrigem > 0 ? origem.newNames / totalOrigem : 0
  const revisao = movimentos.atual - movimentos.oficial

  return (
    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
      <OriginCard
        title="New Name"
        detail="Novos negócios"
        value={origem.newNames}
        total={origem.realizado}
        ratio={origem.realizado > 0 ? origem.newNames / origem.realizado : 0}
        color="#009b83"
      />
      <OriginCard
        title="Cross"
        detail="Expansão na base"
        value={origem.cross}
        total={origem.realizado}
        ratio={origem.realizado > 0 ? origem.cross / origem.realizado : 0}
        color="#3879db"
      />
      <section className="revenue-panel flex min-h-[132px] min-w-0 flex-col justify-center px-4 py-3">
        <h2 className="text-[12px] font-semibold text-[#405872]">Revisão do forecast</h2>
        <strong className={'num mt-2 text-[22px] font-bold tracking-tight ' + (revisao < 0 ? 'text-[#c93249]' : 'text-[#008b75]')}>
          {formatarComSinal(revisao)}
        </strong>
        <small className="mt-1 text-[11px] leading-4 text-[#687a92]">Forecast atual menos fotografia oficial</small>
      </section>
      <section className="revenue-panel flex min-h-[132px] min-w-0 items-center ga px-4 py-3">
        <div
          role="img"
          aria-label={'Distribuição dos ganhos no CRM: New Name ' + formatarPercentualInteiro(newNameRatio) + ', Cross ' + formatarPercentualInteiro(totalOrigem > 0 ? origem.cross / totalOrigem : 0)}
          className="relative grid h-[78px] w-[78px] shrink-0 place-items-center rounded-full"
          style={{ background: totalOrigem > 0 ? 'conic-gradient(#009b83 0 ' + (newNameRatio * 100) + '%, #3879db ' + (newNameRatio * 100) + '% 100%)' : '#e9eff2' }}
        >
          <span aria-hidden className="absolute inset-[10px] rounded-full bg-white/95" />
          <strong className="num relative text-[12px] font-bold text-[#10294c]">{formatarMilhoes(origem.realizado)}</strong>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[12px] font-semibold text-[#10294c]">Distribuição da receita</h2>
          <p className="mt-1.5 grid grid-cols-[8px_1fr_auto] items-center gap-1.5 text-[11px] text-[#526781]">
            <i aria-hidden className="h-2 w-2 rounded-full bg-[#009b83]" />
            <span>New Name</span>
            <b className="num text-right text-[#243b56]">{formatarPercentualInteiro(totalOrigem > 0 ? origem.newNames / totalOrigem : 0)}</b>
          </p>
          <p className="mt-1 grid grid-cols-[8px_1fr_auto] items-center gap-1.5 text-[11px] text-[#526781]">
            <i aria-hidden className="h-2 w-2 rounded-full bg-[#3879db]" />
            <span>Cross</span>
            <b className="num text-right text-[#243b56]">{formatarPercentualInteiro(totalOrigem > 0 ? origem.cross / totalOrigem : 0)}</b>
          </p>
        </div>
      </section>
    </div>
  )
}

function OriginCard({
  title,
  detail,
  value,
  total,
  ratio,
  color,
}: {
  title: string
  detail: string
  value: number
  total: number
  ratio: number
  color: string
}) {
  return (
    <section className="revenue-panel flex min-h-[132px] min-w-0 items-center ga px-4 py-3">
      <div
        role="img"
        aria-label={formatarPercentualInteiro(ratio) + ' dos ganhos no CRM'}
        className="relative grid h-[78px] w-[78px] shrink-0 place-items-center rounded-full"
        style={{ background: 'conic-gradient(' + color + ' 0 ' + (ratio * 100) + '%, #e9eff2 ' + (ratio * 100) + '% 100%)' }}
      >
        <span aria-hidden className="absolute inset-[10px] rounded-full bg-white/95" />
        <strong className="num relative text-[12px] font-bold text-[#10294c]">{formatarPercentualInteiro(ratio)}</strong>
      </div>
      <div className="min-w-0">
        <h2 className="truncate text-[12px] font-bold text-[#10294c]">{title}</h2>
        <p className="truncate text-[11px] text-[#687a92]">{detail}</p>
        <strong className="num mt-1 block truncate text-[15px] font-bold" style={{ color }}>{formatarMilhoes(value)}</strong>
        <small className="block truncate text-[11px] text-[#687a92]">de {formatarMilhoes(total)} nos ganhos no CRM</small>
      </div>
    </section>
  )
}
