import type { ImportBatch } from './manual-import'
import { calcularElegibilidadeForecast, type ResultadoElegibilidadeForecast } from './forecast-eligibility.ts'
import type { SeloBloco } from './home-raio-x'

export type ResumoForecastModel =
  | { estado: 'carregando' | 'erro' | 'sem-carga'; mensagem: string }
  | { estado: 'valida' | 'degradada'; resultado: ResultadoElegibilidadeForecast; selo: SeloBloco }

export function criarResumoForecast({ batch, referenceDate, carregando = false, erro = '' }: {
  batch: ImportBatch | null
  referenceDate?: string
  carregando?: boolean
  erro?: string
}): ResumoForecastModel {
  if (erro) return { estado: 'erro', mensagem: erro }
  if (carregando) return { estado: 'carregando', mensagem: 'Carregando a última carga…' }
  if (!batch) return { estado: 'sem-carga', mensagem: 'Nenhuma carga de oportunidades disponível. Consulte as cargas para começar.' }
  const referencia = batch.referenceDate ?? referenceDate ?? ''
  const competencia = referencia.slice(0, 7)
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(competencia)) return { estado: 'erro', mensagem: 'A carga não informa uma data de referência válida para definir a competência.' }
  const resultado = calcularElegibilidadeForecast(batch.records, competencia)
  const detalhes = [
    batch.filename ?? 'Arquivo não informado', `referência ${referencia}`, `competência ${competencia}`,
    batch.importedAt ? `importada em ${batch.importedAt}` : null,
    batch.hash ? `hash ${batch.hash.slice(0, 8)}` : null,
  ].filter(Boolean).join(' · ')
  return {
    estado: resultado.estimado.estado === 'degradado' || resultado.estimado.aviso ? 'degradada' : 'valida',
    resultado,
    selo: { origem: 'teste', rotulo: 'Carga importada', periodo: competencia, referencia: detalhes, texto: `Carga importada · ${detalhes}` },
  }
}
