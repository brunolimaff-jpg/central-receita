import { Suspense } from 'react'
import { CommercialV3App } from '@/features/comercial-v3/commercial-v3-app'

/**
 * A raiz `/` passa a ser apenas a composição da Visão Comercial V3
 * (plano Task 3 Step 1, l.299-301): o legado permanece no repositório, mas
 * deixa de ser importado aqui. Toda a experiência vive em
 * `src/features/comercial-v3`; o Forecast tem rota própria.
 */
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#f5f8fb]" aria-hidden="true" />}>
      <CommercialV3App />
    </Suspense>
  )
}
