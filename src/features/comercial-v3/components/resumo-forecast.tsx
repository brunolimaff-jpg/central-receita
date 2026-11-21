import Link from 'next/link'
import type { ResumoForecastModel } from '../forecast-screen-model'
import { SeloOrigem } from './home-resultado'

const moeda = (valor: number | null) => valor === null ? 'Indisponível' : valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function ResumoForecast({ modelo, consultarHref }: { modelo: ResumoForecastModel; consultarHref: string }) {
  if (!('resultado' in modelo)) return (
    <section className="revenue-panel mb-5 p-6" aria-label="Forecast">
      <h1 className="text-xl font-bold text-ink">Forecast</h1>
      <p className="mt-3 text-sm text-ink-muted" role={modelo.estado === 'erro' ? 'alert' : 'status'}>{modelo.mensagem}</p>
      {modelo.estado !== 'carregando' && <Link href={consultarHref} className="mt-4 inline-block font-semibold text-brand-escuro underline">Consultar cargas</Link>}
    </section>
  )
  const { corporativo, estimado } = modelo.resultado
  return (
    <section className="revenue-panel mb-5 space-y-5 p-6" aria-label="Forecast da competência">
      <h1 className="text-xl font-bold text-ink">Forecast</h1>
      <SeloOrigem selo={modelo.selo} />
      <div className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-xl border border-line p-4">
          <h2 className="text-sm font-semibold text-ink">Forecast corporativo (4 critérios)</h2>
          <p className="mt-2 text-2xl font-bold text-ink">{corporativo.estado === 'valido' ? moeda(corporativo.valor) : 'Indisponível'}</p>
          {corporativo.estado !== 'valido' && <p className="mt-2 text-sm text-ink-muted">{corporativo.motivo}</p>}
        </article>
        <article className="rounded-xl border border-line p-4">
          <h2 className="text-sm font-semibold text-ink">{estimado.rotulo}</h2>
          <p className="mt-2 text-2xl font-bold text-ink">{moeda(estimado.valor)}</p>
          <p className="mt-2 text-sm text-ink-muted">{estimado.quantidade} oportunidades · Estimativa, não é o Forecast corporativo.</p>
          {estimado.aviso && <p className="mt-2 text-sm text-dado-atencao"><span className="revenue-pill">Degradado</span> {estimado.aviso}</p>}
          {estimado.semProbabilidade > 0 && <p className="mt-2 text-sm text-ink-muted">Sem probabilidade: {estimado.semProbabilidade} oportunidades.</p>}
          {estimado.semValor > 0 && <p className="mt-2 text-sm text-ink-muted">Sem valor previsto: {estimado.semValor} oportunidades. {estimado.motivo}</p>}
        </article>
      </div>
    </section>
  )
}
