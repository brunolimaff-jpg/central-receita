'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, CheckCircle2, FileSpreadsheet, Settings2, Upload } from 'lucide-react'
import { avaliarArquivoSoltado, formatarTamanhoArquivo } from '../import-file'
import { MetricDetail } from '../components/metric-detail'
import { OpportunitiesForecastChart } from '../components/opportunities-forecast-chart'
import type { ImportBatch, ImportIssue, ImportKind, ImportWorkspace, ImportedRecord } from '../manual-import'
import { fonteCarregada, reconcileImports, groupForecastDates, isDuplicateImport, isValidImportReference, currentImportDate as localDate } from '../manual-import'
import { readImportFile, saveImportDraft, sharedImportEnabled, visualPreviewEnabled, type ImportDraft } from '../manual-import-client'
import type { CommercialNav } from '../nav'

const panel = 'rounded-[10px] border border-hairline bg-surface-raised p-5 shadow-[var(--sombra-painel)]'
const input = 'mt-1.5 min-h-10 w-full rounded-[8px] border border-hairline bg-surface-raised px-3 py-2 text-sm text-ink-strong transition-premium focus-visible:border-brand disabled:opacity-50'
const button = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-[8px] bg-brand-escuro px-4 py-2 text-sm font-semibold text-white transition-premium hover:bg-verde-escuro disabled:cursor-not-allowed disabled:bg-azul-claro disabled:text-azul-medio'
const names: Record<ImportKind, string> = { opportunities: 'Oportunidades', orders: 'Pedidos' }

/**
 * Colunas que a leitura exige, com o nome exato que o CRM exporta.
 * Espelha `fields` e `required` de `manual-import.ts`: a tela mostra, antes de
 * subir, o que o validador cobra depois — a Fabi confere com o arquivo fechado.
 */
const COLUNAS_OBRIGATORIAS: Record<ImportKind, string[]> = {
  opportunities: ['Oportunidade ID', 'Conta ID', 'Conta', 'Etapa', 'Previsão de Fechamento', 'Valor Previsto', 'Valor Fechado', 'Representante'],
  orders: ['NUMERO PEDIDO', 'ID OPORTUNIDADE', 'ID CONTA', 'NOME FANTASIA CONTA', 'STATUS OPORTUNIDADE', 'CLASSIFICACAO DO PEDIDO', 'DATA FECHAMENTO', 'PRODUTO - VALOR MANUTENCAO', 'UNIDADE NEGOCIO OPORTUNIDADE'],
}

const currency = (value: number | null) => value === null ? 'Indisponível' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const displayDate = (date: string | null | undefined) => date ? date.slice(0, 10).split('-').reverse().join('/') : 'Indisponível'

function SourceNote({ canImport }: { canImport: boolean }) {
  return <p className="rounded-[8px] border border-hairline bg-surface-base px-4 py-3 text-[13px] leading-5 text-ink-muted">
    {sharedImportEnabled ? (canImport ? 'Carga compartilhada. Confirme a conferência para disponibilizar os dados à diretoria.' : 'Carga compartilhada · seu acesso é somente para consulta.') :
      'Prévia local · dados salvos neste dispositivo. O compartilhamento com a diretoria ainda não está ativo.'}
  </p>
}

function groupIssues(issues: ImportIssue[]) {
  const groups = new Map<string, { issue: ImportIssue; count: number; rows: number[] }>()
  for (const issue of issues) {
    const key = [issue.severity, issue.code, issue.field ?? '', issue.message].join('|')
    const group = groups.get(key) ?? { issue, count: 0, rows: [] }
    group.count++
    if (issue.row !== undefined && group.rows.length < 5) group.rows.push(issue.row)
    groups.set(key, group)
  }
  return [...groups.values()]
}

function Metrics({ entries }: { entries: Array<[string, string | number, string?]> }) {
  return <dl className="grid gap-3 sm:grid-cols-3">{entries.map(([label, value, description]) => <div key={label} className="rounded-[8px] bg-surface-base p-3">
    <dt className="text-[12px] font-medium text-ink-muted">{label}</dt><dd className="mt-1 break-words text-[20px] font-bold tracking-[-0.02em] text-ink-strong">
      <MetricDetail label={label} value={String(value)} description={description ?? 'Contagem da fonte no recorte apresentado. Linhas de itens, pedidos, oportunidades e contas têm contagens distintas.'}>{value}</MetricDetail>
    </dd>
  </div>)}</dl>
}

/** Contagem de erros e avisos com o ícone certo, para a operadora saber se pode confirmar. */
function ContagemProblemas({ errorCount, warningCount }: { errorCount: number; warningCount: number }) {
  const ok = errorCount === 0 && warningCount === 0
  return (
    <p role="status" className={`flex items-center gap-2 text-[13px] font-semibold ${errorCount ? 'text-dado-negativo' : warningCount ? 'text-dado-atencao' : 'text-dado-positivo'}`}>
      {ok ? <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0" /> : <AlertTriangle aria-hidden className="h-4 w-4 shrink-0" />}
      {errorCount} {errorCount === 1 ? 'erro bloqueador' : 'erros bloqueadores'} · {warningCount} {warningCount === 1 ? 'aviso' : 'avisos'}
    </p>
  )
}

function ForecastDates({ records }: { records: ImportedRecord[] }) {
  const groups = useMemo(() => groupForecastDates(records), [records])
  const [selected, setSelected] = useState<string | null>(null)
  const current = groups.find(group => group.date === selected)
  let count = 0
  const series = groups.map((group, index) => ({ week: index + 1, date: group.date, label: displayDate(group.date).slice(0, 5), rangeLabel: displayDate(group.date),
    current: false, forecast: count += group.count, pace: 0, cutoffDay: Number(group.date.slice(8)), closed: true }))
  return <section aria-label="Distribuição das previsões de fechamento" className="min-w-0">
    <OpportunitiesForecastChart semanas={series} mode="dueDates" onSelectWeek={week => setSelected(groups[week - 1]?.date ?? null)} onClearSelection={() => setSelected(null)} />
    {current && <div className="mt-4 border-t border-hairline pt-3"><h3 className="mb-3 text-[13px] font-semibold text-ink-strong">{displayDate(current.date)} · {current.count} oportunidades · {currency(current.value)}</h3><PreviewTable records={current.records} /><button type="button" className="mt-2 min-h-10 text-sm font-semibold text-brand-escuro underline" onClick={() => setSelected(null)}>Fechar recorte da data</button></div>}
    <details className="mt-3 text-[12px] text-ink-muted"><summary className="min-h-10 cursor-pointer py-2 font-medium">Como ler o Forecast e suas linhas</summary><p className="leading-5">A linha soma a quantidade de oportunidades até cada data prevista. É a distribuição de uma única carga, não a evolução histórica da receita. O congelado exige uma lista validada, e a meta exige um valor informado.</p></details>
  </section>
}

function PreviewTable({ records, orders = false }: { records: ImportedRecord[]; orders?: boolean }) {
  return <div className="scroll-discreta overflow-x-auto"><table className="w-full text-left text-[13px]">
    <caption className="pb-2 text-left text-[12px] text-ink-muted">Primeiras {Math.min(records.length, 10)} linhas da prévia · {records.length.toLocaleString('pt-BR')} linhas no recorte</caption>
    <thead className="border-b border-hairline text-[11px] uppercase tracking-[0.04em] text-ink-muted"><tr>
      <th className="p-2">{orders ? 'Pedido / oportunidade' : 'Oportunidade'}</th><th className="p-2">Conta</th>
      <th className="p-2">{orders ? 'Classificação da fonte' : 'Etapa da fonte'}</th>
      <th className="p-2">{orders ? 'Status do pedido' : 'Previsão / valor previsto'}</th>
    </tr></thead><tbody>{records.slice(0, 10).map(record => <tr key={record.row} className="border-b border-hairline-suave">
      <td className="num p-2">{orders && `${record.orderId} / `}{record.opportunityId}</td><td className="max-w-80 p-2 break-words">{record.account || 'Nome indisponível'}</td>
      <td className="p-2">{(orders ? record.classification : record.stage) || 'Indisponível'}</td>
      <td className="p-2">{orders ? record.status || 'Indisponível' : <>{displayDate(record.forecastDate)}<br />{currency(record.predictedValue)}</>}</td>
    </tr>)}</tbody>
  </table>{records.length === 0 && <p className="p-3 text-[13px] text-ink-muted">Nenhuma linha neste recorte.</p>}</div>
}

function BatchPreview({ batch }: { batch: ImportBatch }) {
  const issueGroups = groupIssues(batch.issues)
  const issueSampleIsPartial = batch.errorCount + batch.warningCount > batch.issues.length
  return <div className="mt-4 grid gap-3">
    <p className="break-all text-[13px] font-medium text-ink-strong">{batch.filename} · {batch.sheet}</p>
    <Metrics entries={[[batch.kind === 'orders' ? 'Linhas de itens' : 'Linhas de oportunidades', batch.stats.records.toLocaleString('pt-BR')],
      [batch.kind === 'orders' ? 'Pedidos distintos' : 'Oportunidades distintas', batch.kind === 'orders' ? batch.stats.orders : batch.stats.opportunities], ['Contas distintas', batch.stats.accounts]]} />
    <ContagemProblemas errorCount={batch.errorCount} warningCount={batch.warningCount} />
    {batch.issues.length > 0 && <details className="rounded-[8px] border border-hairline p-3 text-[13px]" open={batch.errorCount > 0}>
      <summary className="cursor-pointer font-semibold text-ink-strong">Ver problemas resumidos</summary>
      {issueSampleIsPartial && <p className="mt-2 text-[12px] text-ink-muted">Resumo dos primeiros {batch.issues.length} problemas disponíveis; as contagens acima consideram o arquivo inteiro.</p>}
      <ul className="mt-2 grid gap-3">{issueGroups.map(({ issue, count, rows }) => <li key={[issue.severity, issue.code, issue.field, issue.message].join('|')}>
        <p className="text-ink-strong">{issue.severity === 'error' ? 'Erro' : 'Aviso'}{issue.field ? ` · ${issue.field}` : ''}: {issue.message}</p>
        <p className="mt-1 text-[12px] text-ink-muted">{count} {count === 1 ? 'ocorrência' : 'ocorrências'} nesta amostra{rows.length ? ` · linhas ${rows.join(', ')}` : ''}</p>
      </li>)}</ul>
    </details>}
    {!batch.errorCount && <details className="rounded-[8px] border border-hairline p-3"><summary className="cursor-pointer text-[13px] font-semibold text-ink-strong">Conferir linhas lidas</summary>
      <div className="mt-3"><PreviewTable records={batch.records} orders={batch.kind === 'orders'} /></div>
    </details>}
  </div>
}

/**
 * Área de arquivo com três estados: parado (ícone flutua), arrastando (borda
 * cônica girando) e lendo (barra com brilho, sem porcentagem inventada). Quem
 * já teve arquivo lido ganha o estado `pronto`, com a mesma leitura na faixa.
 *
 * O `<label>` embrulha o `input` nativo: clique em qualquer ponto e Tab até o
 * input abrem o seletor; Enter e Espaço valem ali, com o anel visível vindo de
 * `:focus-within`. Soltar um arquivo passa pelo mesmo `onChange` do seletor.
 */
function CampoArquivo({ kind, habilitado, busy, pronto, onChange, onSoltar }: {
  kind: ImportKind
  habilitado: boolean
  busy: boolean
  pronto: boolean
  onChange: (file?: File) => void
  onSoltar: (file: File) => void
}) {
  const [arrastando, setArrastando] = useState(false)
  // Profundidade do arrasto: `dragleave` dispara também ao cruzar os filhos da
  // área, então só encerramos o estado quando o ponteiro sai do elemento inteiro.
  const profundidade = useRef(0)
  const ativo = habilitado && !busy
  const estado = !habilitado ? 'bloqueado' : busy ? 'lendo' : arrastando ? 'arrastando' : pronto ? 'pronto' : 'parado'
  const descricao = names[kind].toLowerCase()
  return (
    <label
      data-estado={estado}
      aria-disabled={!ativo}
      className={`revenue-dropzone mt-3 ${ativo ? 'cursor-pointer' : 'cursor-not-allowed'}`}
      onDragEnter={event => {
        if (!ativo) return
        event.preventDefault()
        profundidade.current += 1
        setArrastando(true)
      }}
      onDragOver={event => {
        if (!ativo) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
      }}
      onDragLeave={() => {
        profundidade.current = Math.max(0, profundidade.current - 1)
        if (profundidade.current === 0) setArrastando(false)
      }}
      onDrop={event => {
        event.preventDefault()
        profundidade.current = 0
        setArrastando(false)
        if (!ativo) return
        const file = event.dataTransfer.files?.[0]
        if (file) onSoltar(file)
      }}
    >
      <span className="revenue-dropzone-icone">
        {estado === 'pronto' ? <CheckCircle2 aria-hidden className="h-5 w-5" /> : <Upload aria-hidden className="h-5 w-5" />}
      </span>
      <span className="text-[13px] font-semibold text-ink-strong">
        {estado === 'lendo' ? 'Lendo o arquivo…'
          : estado === 'arrastando' ? `Solte o arquivo de ${descricao}`
          : estado === 'pronto' ? `Arquivo de ${descricao} já lido`
          : `Selecionar CSV ou XLSX de ${descricao}`}
      </span>
      {estado === 'lendo'
        ? <><span className="revenue-leitura-barra" aria-hidden /><span className="text-[12px] text-ink-muted">Lendo todas as linhas do arquivo. A conferência aparece quando terminar.</span></>
        : <span className="text-[12px] text-ink-muted">
          {!habilitado ? 'Informe a data de referência acima para liberar a seleção'
            : estado === 'arrastando' ? 'Pode soltar: o arquivo é lido assim que chegar.'
            : estado === 'pronto' ? 'Pode trocar o arquivo ou soltar outro para substituir esta leitura.'
            : 'Arraste e solte, ou clique para escolher · CSV UTF-8 ou XLSX, até 15 MB'}
        </span>}
      <input
        type="file"
        aria-label={`Selecionar CSV ou XLSX de ${descricao}`}
        accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        disabled={busy || !habilitado}
        className="sr-only"
        onChange={event => { onChange(event.target.files?.[0]); event.target.value = '' }}
      />
    </label>
  )
}

export function ImportScreen({ draft, canImport, onSaved, loading, loadError, nav }: {
  draft: ImportDraft | null; canImport: boolean; onSaved: (draft: ImportDraft) => void; loading: boolean; loadError: string; nav: CommercialNav
}) {
  const [staged, setStaged] = useState<ImportWorkspace>({ opportunities: null, orders: null })
  const [referenceDate, setReferenceDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<ImportKind, string>>>({})
  /**
   * Recusa de arquivo solto. Separada de `errors`: não bloqueia a confirmação
   * nem descarta o que já foi lido — o arquivo errado simplesmente não entrou.
   */
  const [avisos, setAvisos] = useState<Partial<Record<ImportKind, string>>>({})
  /** Arquivo escolhido ou solto nesta sessão, para o cartão com nome e tamanho. */
  const [arquivos, setArquivos] = useState<Partial<Record<ImportKind, { nome: string; tamanho: number }>>>({})
  const [message, setMessage] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const workspace: ImportWorkspace = {
    opportunities: staged.opportunities ? { ...staged.opportunities, referenceDate } : draft?.opportunities ?? null,
    orders: staged.orders ? { ...staged.orders, referenceDate } : draft?.orders ?? null,
  }
  /*
   * O painel "O que já está carregado" fala só do que foi salvo. A leitura em
   * curso aparece no cartão da fonte, onde está claro que ainda não entrou.
   */
  const carregadas = { opportunities: fonteCarregada(draft?.opportunities ?? null), orders: fonteCarregada(draft?.orders ?? null) }
  const reconciliation = reconcileImports(workspace.opportunities, workspace.orders)
  const changed = Boolean(staged.opportunities || staged.orders)
  const differentDates = Boolean(workspace.opportunities?.referenceDate && workspace.orders?.referenceDate && workspace.opportunities.referenceDate !== workspace.orders.referenceDate)
  const warnings = (staged.opportunities?.warningCount ?? 0) + (staged.orders?.warningCount ?? 0) + reconciliation.unmatchedOrders + Number(differentDates)
  const dataValida = isValidImportReference(referenceDate, localDate())
  const blocked = busy || loading || Boolean(loadError) || !changed || !dataValida ||
    Boolean(errors.orders || errors.opportunities || workspace.opportunities?.errorCount || workspace.orders?.errorCount) ||
    reconciliation.conflictingAccounts > 0 || (warnings > 0 && !acknowledged)

  /**
   * Soltar arquivo passa pela mesma leitura do seletor, mas recusa extensão e
   * tamanho antes: o erro do `readImportFile` é genérico e não diz qual arquivo
   * chegou nem por que não serviu.
   */
  function soltarArquivo(kind: ImportKind, file: File) {
    const avaliacao = avaliarArquivoSoltado(file)
    if (!avaliacao.aceito) {
      // Arquivo solto recusado não mexe no que já estava lido: só informa.
      setAvisos(current => ({ ...current, [kind]: avaliacao.mensagem }))
      return
    }
    void selectFile(kind, file)
  }

  /** Volta a fonte ao estado vazio: descarta a leitura desta sessão, não a carga salva. */
  function trocarArquivo(kind: ImportKind) {
    setStaged(current => ({ ...current, [kind]: null }))
    setErrors(current => ({ ...current, [kind]: '' }))
    setAvisos(current => ({ ...current, [kind]: '' }))
    setArquivos(current => ({ ...current, [kind]: undefined }))
    setAcknowledged(false)
  }

  async function selectFile(kind: ImportKind, file?: File) {
    if (!file) return
    setBusy(true); setMessage(''); setAcknowledged(false)
    setAvisos(current => ({ ...current, [kind]: '' }))
    setArquivos(current => ({ ...current, [kind]: { nome: file.name, tamanho: file.size } }))
    setStaged(current => ({ ...current, [kind]: null }))
    setErrors(current => ({ ...current, [kind]: '' }))
    try {
      const batch = await readImportFile(kind, file, referenceDate)
      if (isDuplicateImport(batch, draft?.[kind])) setMessage('Este arquivo já está na prévia salva. Nenhuma linha foi adicionada.')
      else setStaged(current => ({ ...current, [kind]: batch }))
    } catch (error) {
      setErrors(current => ({ ...current, [kind]: error instanceof Error ? error.message : 'Não foi possível ler o arquivo. Exporte novamente pelo CRM.' }))
    } finally { setBusy(false) }
  }

  async function save() {
    if (blocked) return
    setBusy(true); setMessage('')
    try {
      const next = { ...workspace }
      for (const kind of ['opportunities', 'orders'] as const) {
        if (staged[kind]) next[kind] = { ...staged[kind], referenceDate }
      }
      const saved = await saveImportDraft(next, draft, referenceDate)
      onSaved(saved); setStaged({ opportunities: null, orders: null }); setArquivos({}); setAcknowledged(false)
      setMessage(sharedImportEnabled ? 'Carga confirmada. Forecast e New Name já podem consultar esta versão.' : 'Prévia salva neste navegador. Forecast e New Name podem ser revisados pelos links abaixo.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'A prévia não foi salva. Tente novamente.') }
    finally { setBusy(false) }
  }

  if (visualPreviewEnabled) return <section className="revenue-page grid gap-4">
    <h1 className="revenue-heading">Configurações</h1>
    <p className="revenue-subtitle">Importação desativada na homologação visual. Navegue pelas telas com os dados fictícios; nenhum arquivo é lido ou armazenado.</p>
  </section>

  if (sharedImportEnabled && !canImport) return <div className="revenue-page grid gap-4">
    <header>
      <h1 className="revenue-heading flex items-center gap-2"><Settings2 aria-hidden size={22} />Configurações</h1>
      <p className="revenue-subtitle">Consulta das cargas confirmadas.</p>
    </header>
    <SourceNote canImport={canImport} />
    {loadError && <p role="alert" className="rounded-[8px] border border-dado-atencao bg-dado-atencao-suave p-3 text-[13px] text-dado-atencao">{loadError} Recarregue para tentar novamente.</p>}
    <section className={`${panel} grid gap-3`}>
      {loading ? <p role="status" className="text-[13px] text-ink-muted">Consultando a carga compartilhada…</p> : draft ? <>
        {draft.history?.[0] && <p className="text-[13px] text-ink-strong">Última carga confirmada · {new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Cuiaba', dateStyle: 'short', timeStyle: 'short' }).format(new Date(draft.history[0].at))} (Cuiabá)</p>}
        <p className="text-[13px] text-ink-muted">Oportunidades · {draft.opportunities?.filename ?? 'sem arquivo nesta carga'} · referência {displayDate(draft.opportunities?.referenceDate)}</p>
        <p className="text-[13px] text-ink-muted">Pedidos · {draft.orders?.filename ?? 'sem arquivo nesta carga'} · referência {displayDate(draft.orders?.referenceDate)}</p>
        <div className="flex flex-wrap gap-3">
          {draft.opportunities && <Link className="inline-flex min-h-10 items-center gap-1.5 rounded-[8px] border border-brand px-3 text-[13px] font-semibold text-brand-escuro transition-premium hover:bg-dado-positivo-suave" href={nav.href('forecast')}>Consultar Forecast<ArrowRight aria-hidden className="h-3.5 w-3.5" /></Link>}
          {draft.orders && <Link className="inline-flex min-h-10 items-center gap-1.5 rounded-[8px] border border-brand px-3 text-[13px] font-semibold text-brand-escuro transition-premium hover:bg-dado-positivo-suave" href={nav.href('new-name')}>Consultar New Name<ArrowRight aria-hidden className="h-3.5 w-3.5" /></Link>}
        </div>
      </> : <p role="status" className="text-[13px] text-ink-muted">Nenhuma carga compartilhada foi confirmada ainda.</p>}
    </section>
  </div>

  return <div className="revenue-page grid gap-4">
    <header>
      <h1 className="revenue-heading flex items-center gap-2"><Settings2 aria-hidden size={22} />Configurações</h1>
      <p className="revenue-subtitle">Importação de dados · {sharedImportEnabled ? 'selecione as exportações, confira a leitura e confirme a carga.' : 'selecione as exportações, confira a leitura e salve uma prévia local.'}</p>
    </header>
    <SourceNote canImport={canImport} />
    {loadError && <p role="alert" className="rounded-[8px] border border-dado-atencao bg-dado-atencao-suave p-3 text-[13px] text-dado-atencao">{loadError} Recarregue para tentar novamente.</p>}

    <section className={panel}>
      <label className="block max-w-xs text-[13px] font-semibold text-ink-strong">Data de referência da exportação
        <input type="date" aria-label="Data de referência da exportação" min="1900-01-01" max={localDate()} className={input} value={referenceDate} onChange={event => { setReferenceDate(event.target.value); setAcknowledged(false) }} disabled={busy || loading} />
      </label>
      <p className="mt-2 text-[12px] text-ink-muted">A data do retrato que você exportou do CRM, não a de hoje. É a que os números representam.</p>
    </section>

    {/* Cada fonte guarda seu próprio horário: dá para atualizar uma sem a outra. */}
    {(carregadas.opportunities || carregadas.orders) ? (
      <section className={`${panel} grid gap-2`} aria-label="Horário de cada arquivo">
        <h2 className="text-[15px] font-bold text-ink-strong">O que já está carregado</h2>
        <ul className="grid gap-1.5 text-[13px] text-ink-muted">
          {(['opportunities', 'orders'] as const).map(kind => {
            const fonte = carregadas[kind]
            if (!fonte) return <li key={kind}><strong className="font-semibold text-ink-strong">{names[kind]}:</strong> nenhum arquivo carregado ainda.</li>
            const horario = fonte.quando
              ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(fonte.quando))
              : 'horário indisponível'
            return <li key={kind}>
              <strong className="font-semibold text-ink-strong">{names[kind]}:</strong> atualizado em {horario} · referência {displayDate(fonte.referenceDate)} · {fonte.filename ?? 'arquivo sem nome'}
            </li>
          })}
        </ul>
        {Boolean(carregadas.opportunities) !== Boolean(carregadas.orders) && (
          <p className="rounded-[8px] bg-dado-atencao-suave px-3 py-2 text-[13px] text-dado-atencao">
            Só uma das planilhas está carregada. Pode confirmar assim mesmo: a seção da outra continua com os números que já tinha.
          </p>
        )}
      </section>
    ) : null}

    <div className="grid items-start gap-4 xl:grid-cols-2">{(['opportunities', 'orders'] as const).map(kind => <section key={kind} className={panel}>
      <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink-strong"><FileSpreadsheet aria-hidden size={19} className="text-brand-escuro" />{names[kind]}</h2>
      <p className="mt-1 text-[12px] text-ink-muted">{kind === 'orders' ? 'Linhas de produtos e serviços, como em Pedidos Outubro 26.xlsx.' : 'Uma linha por oportunidade, como em Opp em andamento.xlsx.'}</p>
      <div className="mt-2 rounded-[8px] bg-surface-base px-3 py-2 text-[12px] text-ink-muted">
        <p className="font-semibold text-ink-strong">Colunas que o arquivo precisa ter ({COLUNAS_OBRIGATORIAS[kind].length})</p>
        <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label={`Colunas obrigatórias de ${names[kind].toLowerCase()}`}>
          {COLUNAS_OBRIGATORIAS[kind].map(coluna => <li key={coluna} className="revenue-chip">{coluna}</li>)}
        </ul>
        <p className="mt-2">Se o CRM exportar com outro nome, o painel diz qual coluna está faltando antes de confirmar a carga.</p>
      </div>
      <CampoArquivo kind={kind} habilitado={dataValida} busy={busy || loading} pronto={Boolean(workspace[kind] && workspace[kind]!.errorCount === 0)} onChange={file => { void selectFile(kind, file) }} onSoltar={file => soltarArquivo(kind, file)} />
      {arquivos[kind] && (staged[kind] || errors[kind]) && <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-hairline bg-surface-raised px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-dado-positivo-suave"><FileSpreadsheet aria-hidden className="h-4 w-4 text-brand-escuro" /></span>
          <div className="min-w-0">
            <p className="break-all text-[13px] font-semibold text-ink-strong">{arquivos[kind]!.nome}</p>
            <p className="text-[12px] text-ink-muted">{formatarTamanhoArquivo(arquivos[kind]!.tamanho)}</p>
          </div>
        </div>
        <button type="button" disabled={busy} className="inline-flex min-h-9 items-center rounded-[8px] border border-hairline px-3 text-[13px] font-semibold text-brand-escuro transition-premium hover:bg-dado-positivo-suave disabled:opacity-50"
          onClick={() => trocarArquivo(kind)}>Trocar arquivo</button>
      </div>}
      {errors[kind] && <p role="alert" className="mt-3 flex items-start gap-2 rounded-[8px] bg-dado-negativo-suave px-3 py-2 text-[13px] text-dado-negativo"><AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />{errors[kind]}</p>}
      {avisos[kind] && <p role="alert" className="mt-3 flex items-start gap-2 rounded-[8px] bg-dado-atencao-suave px-3 py-2 text-[13px] text-dado-atencao"><AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />{avisos[kind]}</p>}
      {workspace[kind] ? <>
        {workspace[kind]!.errorCount === 0 && !errors[kind] && <p role="status" className="revenue-faixa-pronta mt-3">
          <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0" />Pronto para conferir · {workspace[kind]!.stats.records.toLocaleString('pt-BR')} {workspace[kind]!.stats.records === 1 ? 'linha lida' : 'linhas lidas'}
        </p>}
        <p className="mt-3 text-[13px] font-semibold text-ink-strong">{staged[kind] ? 'Nova seleção · substitui esta fonte na prévia' : `${sharedImportEnabled ? 'Carga compartilhada confirmada' : 'Prévia salva'} · referência ${displayDate(workspace[kind]?.referenceDate)}`}</p>
        <BatchPreview batch={workspace[kind]!} /></> : <p className="mt-4 text-[13px] text-ink-muted">Nenhum arquivo desta fonte na prévia.</p>}
    </section>)}</div>

    <section className={`${panel} grid gap-4`} aria-label="Conferência das fontes">
      <h2 className="text-[15px] font-bold text-ink-strong">Conferência antes de salvar</h2>
      {workspace.opportunities && workspace.orders ? <Metrics entries={[['Pedidos vinculados por ID', reconciliation.matchedOrders], ['Pedidos sem oportunidade nesta carga', reconciliation.unmatchedOrders], ['Divergências de conta', reconciliation.conflictingAccounts]]} />
        : <p className="text-[13px] text-ink-muted">Selecione as duas fontes para conferir pedidos × oportunidades pelo ID.</p>}
      {reconciliation.conflictingAccounts > 0 && <p role="alert" className="rounded-[8px] bg-dado-negativo-suave px-3 py-2 text-[13px] text-dado-negativo">A gravação está bloqueada: revise as divergências de conta entre as fontes.</p>}
      {differentDates && <p className="rounded-[8px] bg-dado-atencao-suave px-3 py-2 text-[13px] text-dado-atencao">As fontes têm datas de referência diferentes. O vínculo por ID não comprova atualização simultânea dos estados.</p>}
      <p className="text-[12px] leading-5 text-ink-muted">Cada carga substitui o retrato anterior daquela fonte. Itens de pedido são preservados sem somar manutenção como MRR. Datas ausentes e valores vazios continuam indisponíveis.</p>
      {changed && warnings > 0 && <label className="flex min-h-10 items-start gap-3 rounded-[8px] border border-dado-atencao bg-dado-atencao-suave px-3 py-2.5 text-[13px] text-ink-strong"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--verde-escuro)]" />
        <span>Revisei os avisos e as relações sem correspondência. Os campos afetados continuam indisponíveis.</span></label>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void save()} disabled={blocked} className={button}>{busy ? 'Lendo ou salvando…' : loading ? 'Carregando…' : sharedImportEnabled ? 'Confirmar carga compartilhada' : 'Salvar prévia local'}</button>
        {draft?.opportunities && <Link className="inline-flex min-h-10 items-center gap-1.5 text-[13px] font-semibold text-brand-escuro underline" href={nav.href('forecast')}>Revisar Forecast</Link>}
        {draft?.orders && <Link className="inline-flex min-h-10 items-center gap-1.5 text-[13px] font-semibold text-brand-escuro underline" href={nav.href('new-name')}>Revisar New Name</Link>}
      </div>
      {message && <p role="status" aria-live="polite" className={`flex items-start gap-2 rounded-[8px] px-3 py-2 text-[13px] ${/não|recusada|bloqueada/i.test(message) ? 'bg-dado-negativo-suave text-dado-negativo' : 'bg-dado-positivo-suave text-brand-escuro'}`}>
        {/não|recusada|bloqueada/i.test(message) ? <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />}
        {message}
      </p>}
    </section>

    {draft?.history?.length ? <details className={panel}><summary className="cursor-pointer text-[13px] font-semibold text-ink-strong">{sharedImportEnabled ? 'Histórico das cargas compartilhadas' : 'Histórico das prévias locais'}</summary><ul className="mt-3 grid gap-2 text-[13px] text-ink-strong">{draft.history.map(entry => <li key={entry.at}>
      {new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Cuiaba', dateStyle: 'short', timeStyle: 'short' }).format(new Date(entry.at))} · referência {displayDate(entry.referenceDate)} · {entry.sources.join(' + ')}
    </li>)}</ul><p className="mt-3 text-[12px] text-ink-muted">Últimos 20 registros de gravação. O histórico registra cargas; não contém versões para restaurar nem movimentos comerciais.</p></details> : null}
  </div>
}

