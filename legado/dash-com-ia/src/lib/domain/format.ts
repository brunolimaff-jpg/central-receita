// Formatadores PT-BR — funções puras, seguras para uso no cliente e no servidor.

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})
const int = new Intl.NumberFormat('pt-BR')
const DATA_CALENDARIO = /^(\d{4})-(\d{2})-(\d{2})$/

function dataLocal(iso: string): Date {
  const somenteData = iso.match(DATA_CALENDARIO)
  if (somenteData) return new Date(Number(somenteData[1]), Number(somenteData[2]) - 1, Number(somenteData[3]))
  return new Date(iso)
}

export function fmtBRL(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return '—'
  return brl.format(valor)
}

export function fmtInt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  return int.format(n)
}

export function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  return `${int.format(Math.round(n))}%`
}

export function fmtData(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = dataLocal(iso)
  return `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export function fmtDataCurta(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = dataLocal(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`
}

export function fmtDataHora(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = dataLocal(iso)
  return `${fmtData(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function rotuloAtualizacaoSnapshot(snapshotEm: string | null | undefined): string {
  if (!snapshotEm || !Number.isFinite(new Date(snapshotEm).getTime())) return 'Snapshot sem data registrada'
  return `Snapshot ${fmtDataCurta(snapshotEm)}`
}

// "há 3 dias" / "em 5 dias" — requer dias relativos já calculados (leitura determinística do servidor)
export function fmtDiasAtras(dias: number | null | undefined): string {
  if (dias === null || dias === undefined) return '—'
  if (dias === 0) return 'hoje'
  if (dias === 1) return 'há 1 dia'
  if (dias < 0) return `em ${Math.abs(dias)} dias`
  return `há ${dias} dias`
}

export function diasEntre(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86400000)
}

export function fmtDias(dias: number | null | undefined): string {
  if (dias === null || dias === undefined) return '—'
  return `${dias}d`
}
