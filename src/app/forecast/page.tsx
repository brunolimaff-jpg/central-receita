import { Suspense } from 'react'
import { CommercialV3App } from '@/features/comercial-v3/commercial-v3-app'

export default function Page() {
  return (
    <Suspense fallback={<div role="status">Carregando Forecast…</div>}>
      <CommercialV3App fixedView="forecast" />
    </Suspense>
  )
}
