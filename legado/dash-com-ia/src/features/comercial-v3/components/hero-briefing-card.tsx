import Link from 'next/link'
import { Activity, ArrowRight, Building2, Lightbulb, Users } from 'lucide-react'
import { formatarPercentualInteiro } from '../format'
import { FORECAST_MOVEMENTS, type ForecastMovement } from '../types'
import type { AgentBriefingModel } from '../model'
import type { CommercialNav } from '../nav'

type HeroBriefingCardProps = {
  briefing: AgentBriefingModel
  top10Count: number
  nav: CommercialNav
}

const MOVIMENTO_TEXTO: Record<ForecastMovement, string> = {
  Saiu: 'saída',
  Postergou: 'postergação',
  'Alterou valor': 'alteração de valor',
  Entrou: 'entrada',
}

export function HeroBriefingCard({ briefing, top10Count, nav }: HeroBriefingCardProps) {
  const movimentosNegativos = FORECAST_MOVEMENTS.filter(
    (movimento) => briefing.movimentos.byMovement[movimento].value < 0,
  )
  const resumoMovimentos = movimentosNegativos
    .map((movimento) => {
      const n = briefing.movimentos.byMovement[movimento].count
      const singular = MOVIMENTO_TEXTO[movimento]
      const plural = movimento === 'Postergou' ? 'postergações' : movimento === 'Alterou valor' ? 'alterações de valor' : singular + 's'
      return `${n} ${n === 1 ? singular : plural}`
    })
    .join(' · ')
  const filiaisAtencao = briefing.atencao.map((sinal) => sinal.branch).join(' · ')

  return (
    <nav aria-label="Sinais do recorte comercial" className="revenue-panel min-w-0 p-3">
      <ul className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <BriefRow
          icon={<Activity className="h-[18px] w-[18px]" strokeWidth={1.9} />}
          tone="emerald"
          title={briefing.tiposNegativos + (briefing.tiposNegativos === 1 ? ' tipo de movimento reduz o forecast' : ' tipos de movimento reduzem o forecast')}
          detail={resumoMovimentos || 'Nenhum movimento negativo no recorte'}
          href={nav.href('forecast', { from: 'home' })}
        />
        <BriefRow
          icon={<Lightbulb className="h-[18px] w-[18px]" strokeWidth={1.9} />}
          tone="amber"
          title={Math.min(5, top10Count) + ' oportunidades explicam ' + formatarPercentualInteiro(briefing.top5Share)}
          detail="do movimento absoluto do período"
          href={nav.href('opportunities', { from: 'home' })}
        />
        <BriefRow
          icon={<Building2 className="h-[18px] w-[18px]" strokeWidth={1.9} />}
          tone="blue"
          title="Acompanhar a cobertura por filial"
          detail={filiaisAtencao || 'Nenhuma filial em atenção no recorte'}
          href={briefing.atencao[0] ? nav.branchHref(briefing.atencao[0].branch) : nav.href('system', { from: 'home' })}
        />
        <BriefRow
          icon={<Users className="h-[18px] w-[18px]" strokeWidth={1.9} />}
          tone="purple"
          title="New Name · classificação indisponível"
          detail="Fonte independente pendente; mock demonstrativo"
          href={nav.href('new-name', { from: 'home' })}
        />
      </ul>
    </nav>
  )
}

function BriefRow({
  icon,
  tone,
  title,
  detail,
  href,
}: {
  icon: React.ReactNode
  tone: 'emerald' | 'amber' | 'blue' | 'purple'
  title: string
  detail: string
  href: string
}) {
  const tones = {
    emerald: 'bg-[#e7f7f3] text-[#008b75]',
    amber: 'bg-[#fff4de] text-[#ad6c07]',
    blue: 'bg-[#eaf2ff] text-[#3879db]',
    purple: 'bg-[#f2ecfb] text-[#8257b4]',
  }
  return (
    <li className="min-w-0">
      <Link href={href} className="group grid h-full min-h-[64px] grid-cols-[32px_minmax(0,1fr)_14px] items-center gap-2 rounded-[9px] px-2 py-2.5 transition-colors hover:bg-[#f0f8f6] focus-visible:outline-2 focus-visible:outline-[#086b6b]">
        <span aria-hidden className={'grid h-[32px] w-[32px] place-items-center rounded-[10px] ' + tones[tone]}>{icon}</span>
        <span className="min-w-0">
          <strong className="block text-[13px] font-bold leading-5 text-[#10294c]">{title}</strong>
          <small className="mt-0.5 block text-[12px] leading-4 text-[#50647d]">{detail}</small>
        </span>
        <ArrowRight aria-hidden className="h-3.5 w-3.5 text-[#8293a8] transition-transform group-hover:translate-x-0.5" />
      </Link>
    </li>
  )
}
