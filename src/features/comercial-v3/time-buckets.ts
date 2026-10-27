/**
 * Fatias de tempo para os gráficos com eixo de data: semana, mês ou trimestre
 * a partir da data de referência da carga. Funções puras; a data entra sempre
 * como parâmetro (`YYYY-MM-DD`), nunca de `new Date()` implícito.
 */

export type Granularidade = 'semana' | 'mês' | 'tri'

export type Fatia = { rotulo: string; inicio: string; fim: string; atual: boolean }

const iso = (data: Date) => data.toISOString().slice(0, 10)
const utc = (data: string) => new Date(`${data}T12:00:00Z`)
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const fimDoMes = (ano: number, mes: number) => iso(new Date(Date.UTC(ano, mes + 1, 0, 12)))
const inicioDaSemana = (data: string) => {
  const d = utc(data)
  const dia = d.getUTCDay()
  d.setUTCDate(d.getUTCDate() - (dia === 0 ? 6 : dia - 1))
  return d
}

/** Olhando para trás: dias da semana, semanas do mês ou meses do trimestre da referência. */
export function fatiasDoPeriodo(referencia: string, granularidade: Granularidade): Fatia[] {
  const ano = Number(referencia.slice(0, 4))
  const mes = Number(referencia.slice(5, 7)) - 1
  if (granularidade === 'semana') {
    const d = inicioDaSemana(referencia)
    return Array.from({ length: 7 }, () => {
      const dia = iso(d)
      const fatia = { rotulo: `${DIAS[d.getUTCDay()]} ${dia.slice(8)}`, inicio: dia, fim: dia, atual: dia === referencia }
      d.setUTCDate(d.getUTCDate() + 1)
      return fatia
    })
  }
  if (granularidade === 'mês') {
    const fim = fimDoMes(ano, mes)
    const prefixo = referencia.slice(0, 8)
    return [0, 1, 2, 3, 4].map(semana => {
      const inicio = `${prefixo}${String(semana * 7 + 1).padStart(2, '0')}`
      const ultimo = semana === 4 ? fim : `${prefixo}${String(semana * 7 + 7).padStart(2, '0')}`
      return { rotulo: `Sem ${semana + 1}`, inicio, fim: ultimo, atual: referencia >= inicio && referencia <= ultimo }
    }).filter(fatia => fatia.inicio <= fim)
  }
  const primeiro = Math.floor(mes / 3) * 3
  return [0, 1, 2].map(i => {
    const m = primeiro + i
    const inicio = `${ano}-${String(m + 1).padStart(2, '0')}-01`
    return { rotulo: MESES[m], inicio, fim: fimDoMes(ano, m), atual: m === mes }
  })
}

/** Olhando para frente: 4 semanas, 4 meses ou 4 trimestres a partir da referência. */
export function fatiasAFrente(referencia: string, granularidade: Granularidade): Fatia[] {
  const ano = Number(referencia.slice(0, 4))
  const mes = Number(referencia.slice(5, 7)) - 1
  if (granularidade === 'semana') {
    const d = inicioDaSemana(referencia)
    return Array.from({ length: 4 }, (_, i) => {
      const inicio = iso(d)
      d.setUTCDate(d.getUTCDate() + 6)
      const fim = iso(d)
      d.setUTCDate(d.getUTCDate() + 1)
      return { rotulo: i === 0 ? 'Esta semana' : `${inicio.slice(8)}/${inicio.slice(5, 7)}`, inicio, fim, atual: i === 0 }
    })
  }
  if (granularidade === 'mês') {
    return Array.from({ length: 4 }, (_, i) => {
      const total = ano * 12 + mes + i
      const a = Math.floor(total / 12)
      const m = total % 12
      return { rotulo: `${MESES[m]} '${String(a).slice(2)}`, inicio: `${a}-${String(m + 1).padStart(2, '0')}-01`, fim: fimDoMes(a, m), atual: i === 0 }
    })
  }
  const triAtual = ano * 4 + Math.floor(mes / 3)
  return Array.from({ length: 4 }, (_, i) => {
    const t = triAtual + i
    const a = Math.floor(t / 4)
    const q = t % 4
    return { rotulo: `${q + 1}º tri '${String(a).slice(2)}`, inicio: `${a}-${String(q * 3 + 1).padStart(2, '0')}-01`, fim: fimDoMes(a, q * 3 + 2), atual: i === 0 }
  })
}

/** Soma por fatia; `null` numa fatia quando algum valor dela falta. */
export function somarPorFatia<T>(itens: T[], fatias: Fatia[], data: (item: T) => string | null, valor: (item: T) => number | null) {
  return fatias.map(fatia => {
    const dentro = itens.filter(item => {
      const d = data(item)
      return d !== null && d >= fatia.inicio && d <= fatia.fim
    })
    const soma = dentro.some(item => valor(item) === null) ? null : dentro.reduce((s, item) => s + (valor(item) ?? 0), 0)
    return { ...fatia, valor: soma, quantidade: dentro.length }
  })
}
