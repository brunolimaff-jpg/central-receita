import { Info } from 'lucide-react'

export interface DadosProvenienciaInline {
  fonte: string
  atualizacao?: string
  populacao: string
  regra: string
  limitacao: string
  versao?: string
}

export function ProvenienciaInline({
  dados,
  rotulo,
}: {
  dados: DadosProvenienciaInline
  rotulo: string
}) {
  const campos = [
    { rotulo: 'Fonte', valor: dados.fonte },
    { rotulo: 'Atualização', valor: dados.atualizacao },
    { rotulo: 'População', valor: dados.populacao },
    { rotulo: 'Regra', valor: dados.regra },
    { rotulo: 'Limitação', valor: dados.limitacao },
    { rotulo: 'Versão', valor: dados.versao },
  ]

  return (
    <details className="group min-w-0 text-left">
      <summary
        aria-label={rotulo}
        className="inline-flex max-w-full cursor-pointer list-none items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-[11px] font-medium leading-tight text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 [&::-webkit-details-marker]:hidden"
      >
        <Info className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{rotulo}</span>
      </summary>
      <dl className="mt-2 grid gap-2 rounded-xl border border-border bg-white p-3 text-left shadow-sm sm:grid-cols-[minmax(6rem,0.35fr)_minmax(0,1fr)] sm:gap-x-4">
        {campos.map((campo) => (
          <div key={campo.rotulo} className="contents">
            <dt className="text-[11px] font-semibold text-muted-foreground">{campo.rotulo}</dt>
            <dd className="min-w-0 break-words text-[12px] leading-relaxed text-foreground">
              {campo.valor?.trim() || 'Não informado'}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
