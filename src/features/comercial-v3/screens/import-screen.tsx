'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FileSpreadsheet, Settings2 } from 'lucide-react'
import { MetricDetail } from '../components/metric-detail'
import { OpportunitiesForecastChart } from '../components/opportunities-forecast-chart'
import type { ImportBatch, ImportIssue, ImportKind, ImportWorkspace, ImportedRecord } from '../manual-import'
import { reconcileImports, selectImportedForecast, groupForecastDates, isDuplicateImport, isValidImportReference, currentImportDate as localDate } from '../manual-import'
import { readImportFile, saveImportDraft, sharedImportEnabled, type ImportDraft } from '../manual-import-client'
import type { CommercialNav } from '../nav'

const panel = 'revenue-panel rounded-[14px] border border-[#dfe8ef] bg-white/95 p-5'
const input = 'mt-1 min-h-10 w-full rounded-lg border border-[#bdc6e3] bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#086b6b] disabled:opacity-50'
const button = 'inline-flex min-h-10 items-center justify-center rounded-lg bg-[#086b6b] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086b6b] disabled:cursor-not-allowed disabled:opacity-50'
const names: Record<ImportKind, string> = { opportunities: 'Oportunidades', orders: 'Pedidos' }
const currency = (value: number | null) => value === null ? 'Indisponível' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const displayDate = (date: string | null | undefined) => date ? date.slice(0, 10).split('-').reverse().join('/') : 'Indisponível'

function SourceNote({ canImport }: { canImport: boolean }) {
  return <p className="rounded-lg border border-[#bdc6e3] bg-[#f6f9fe] px-4 py-3 text-sm leading-5 text-[#33466c]">
    {sharedImportEnabled ? (canImport ? 'Carga compartilhada. Confirme a conferência para disponibilizar os dados à diretoria.' : 'Carga compartilhada · seu acesso é somente para consulta.') :
      'Prévia local · dados salvos neste dispositivo. O compartilhamento com Giovanne ainda não está ativo.'}
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
  return <dl className="grid gap-3 sm:grid-cols-3">{entries.map(([label, value, description]) => <div key={label} className="rounded-lg bg-[#f6f9fe] p-3">
    <dt className="text-sm text-[#52677f]">{label}</dt><dd className="mt-1 break-words text-xl font-semibold text-[#0d2340]">
      <MetricDetail label={label} value={String(value)} description={description ?? 'Contagem da fonte no recorte apresentado. Linhas de itens, pedidos, oportunidades e contas têm contagens distintas.'}>{value}</MetricDetail>
    </dd>
  </div>)}</dl>
}

function ForecastDates({ records }: { records: ImportedRecord[] }) {
  const groups = useMemo(() => groupForecastDates(records), [records])
  const [selected, setSelected] = useState<string | null>(null)
  const current = groups.find(group => group.date === selected)
  let count = 0
  const series = groups.map((group, index) => ({ week: index + 1, date: group.date, label: displayDate(group.date).slice(0, 5), rangeLabel: displayDate(group.date),
    current: false, forecast: count += group.count, pace: 0, cutoffDay: Number(group.date.slice(8)), closed: true }))
  return <section aria-label="Distribuição das previsões de fechamento">
    <OpportunitiesForecastChart semanas={series} mode="dueDates" onSelectWeek={week => setSelected(groups[week - 1]?.date ?? null)} onClearSelection={() => setSelected(null)} />
    {current && <div className="mt-4 border-t border-[#dfe8ef] pt-3"><h3 className="mb-3 text-sm font-semibold">{displayDate(current.date)} · {current.count} oportunidades · {currency(current.value)}</h3><PreviewTable records={current.records} /><button type="button" className="mt-2 min-h-10 text-sm text-[#086b6b] underline" onClick={() => setSelected(null)}>Fechar recorte da data</button></div>}
    <details className="mt-3 text-sm text-[#52677f]"><summary className="min-h-10 cursor-pointer py-2 font-medium">Como ler o Forecast e suas linhas</summary><p className="leading-6">A linha soma a quantidade de oportunidades até cada data prevista. É a distribuição de uma única carga, não a evolução histórica da receita. O congelado exige uma lista validada, e a meta exige um valor informado.</p></details>
  </section>
}

export function ImportFreshness({ batch, lastSavedAt }: { batch: ImportBatch; lastSavedAt?: string }) {
  const at = batch.savedAt ?? lastSavedAt
  return <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-[#dfe8ef] bg-white px-4 py-3 text-sm text-[#33466c]">
    <span><span className="text-[#52677f]">{sharedImportEnabled ? 'Última carga confirmada' : 'Última prévia salva'} · </span><strong>{at && Number.isFinite(Date.parse(at)) ?
      new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Cuiaba', dateStyle: 'short', timeStyle: 'short' }).format(new Date(at)) + ' (Cuiabá)' : 'Horário indisponível'}</strong></span>
    <span><span className="text-[#52677f]">Dados referentes a · </span><strong>{displayDate(batch.referenceDate)}</strong></span>
  </div>
}

function PreviewTable({ records, orders = false }: { records: ImportedRecord[]; orders?: boolean }) {
  return <div className="scroll-discreta overflow-x-auto"><table className="w-full text-left text-sm">
    <caption className="pb-2 text-left text-sm text-[#52677f]">Primeiras {Math.min(records.length, 10)} linhas da prévia · {records.length.toLocaleString('pt-BR')} linhas no recorte</caption>
    <thead className="border-b border-[#dfe8ef] text-[#33466c]"><tr>
      <th className="p-2">{orders ? 'Pedido / oportunidade' : 'Oportunidade'}</th><th className="p-2">Conta</th>
      <th className="p-2">{orders ? 'Classificação da fonte' : 'Etapa da fonte'}</th>
      <th className="p-2">{orders ? 'Status do pedido' : 'Previsão / valor previsto'}</th>
    </tr></thead><tbody>{records.slice(0, 10).map(record => <tr key={record.row} className="border-b border-[#edf1f5]">
      <td className="p-2">{orders && `${record.orderId} / `}{record.opportunityId}</td><td className="max-w-80 p-2 break-words">{record.account || 'Nome indisponível'}</td>
      <td className="p-2">{(orders ? record.classification : record.stage) || 'Indisponível'}</td>
      <td className="p-2">{orders ? record.status || 'Indisponível' : <>{displayDate(record.forecastDate)}<br />{currency(record.predictedValue)}</>}</td>
    </tr>)}</tbody>
  </table>{records.length === 0 && <p className="p-3 text-sm">Nenhuma linha neste recorte.</p>}</div>
}

function BatchPreview({ batch }: { batch: ImportBatch }) {
  const issueGroups = groupIssues(batch.issues)
  const issueSampleIsPartial = batch.errorCount + batch.warningCount > batch.issues.length
  return <div className="mt-4 grid gap-3">
    <p className="break-all text-sm font-medium">{batch.filename} · {batch.sheet}</p>
    <Metrics entries={[[batch.kind === 'orders' ? 'Linhas de itens' : 'Linhas de oportunidades', batch.stats.records.toLocaleString('pt-BR')],
      [batch.kind === 'orders' ? 'Pedidos distintos' : 'Oportunidades distintas', batch.kind === 'orders' ? batch.stats.orders : batch.stats.opportunities], ['Contas distintas', batch.stats.accounts]]} />
    <p role="status" className={'text-sm font-medium ' + (batch.errorCount ? 'text-[#9a3412]' : 'text-[#33466c]')}>
      {batch.errorCount} erros bloqueadores · {batch.warningCount} avisos
    </p>
    {batch.issues.length > 0 && <details className="rounded-lg border border-[#dfe8ef] p-3 text-sm">
      <summary className="cursor-pointer font-semibold">Ver problemas resumidos</summary>
      {issueSampleIsPartial && <p className="mt-2 text-[#52677f]">Resumo dos primeiros {batch.issues.length} problemas disponíveis; as contagens acima consideram o arquivo inteiro.</p>}
      <ul className="mt-2 grid gap-3">{issueGroups.map(({ issue, count, rows }) => <li key={[issue.severity, issue.code, issue.field, issue.message].join('|')}>
        <p>{issue.severity === 'error' ? 'Erro' : 'Aviso'}{issue.field ? ` · ${issue.field}` : ''}: {issue.message}</p>
        <p className="mt-1 text-[#52677f]">{count} {count === 1 ? 'ocorrência' : 'ocorrências'} nesta amostra{rows.length ? ` · linhas ${rows.join(', ')}` : ''}</p>
      </li>)}</ul>
    </details>}
    {!batch.errorCount && <details className="rounded-lg border border-[#dfe8ef] p-3"><summary className="cursor-pointer text-sm font-semibold">Conferir linhas lidas</summary>
      <div className="mt-3"><PreviewTable records={batch.records} orders={batch.kind === 'orders'} /></div>
    </details>}
  </div>
}

export function ImportScreen({ draft, canImport, onSaved, loading, loadError, nav }: {
  draft: ImportDraft | null; canImport: boolean; onSaved: (draft: ImportDraft) => void; loading: boolean; loadError: string; nav: CommercialNav
}) {
  const [staged, setStaged] = useState<ImportWorkspace>({ opportunities: null, orders: null })
  const [referenceDate, setReferenceDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<ImportKind, string>>>({})
  const [message, setMessage] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const workspace: ImportWorkspace = {
    opportunities: staged.opportunities ? { ...staged.opportunities, referenceDate } : draft?.opportunities ?? null,
    orders: staged.orders ? { ...staged.orders, referenceDate } : draft?.orders ?? null,
  }
  const reconciliation = reconcileImports(workspace.opportunities, workspace.orders)
  const changed = Boolean(staged.opportunities || staged.orders)
  const differentDates = Boolean(workspace.opportunities?.referenceDate && workspace.orders?.referenceDate && workspace.opportunities.referenceDate !== workspace.orders.referenceDate)
  const warnings = (staged.opportunities?.warningCount ?? 0) + (staged.orders?.warningCount ?? 0) + reconciliation.unmatchedOrders + Number(differentDates)
  const blocked = busy || loading || Boolean(loadError) || !changed || !isValidImportReference(referenceDate, localDate()) ||
    Boolean(errors.orders || errors.opportunities || workspace.opportunities?.errorCount || workspace.orders?.errorCount) ||
    reconciliation.conflictingAccounts > 0 || (warnings > 0 && !acknowledged)

  async function selectFile(kind: ImportKind, file?: File) {
    if (!file) return
    setBusy(true); setMessage(''); setAcknowledged(false)
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
      onSaved(saved); setStaged({ opportunities: null, orders: null }); setAcknowledged(false)
      setMessage(sharedImportEnabled ? 'Carga confirmada. Forecast e New Name já podem consultar esta versão.' : 'Prévia salva neste navegador. Forecast e New Name podem ser revisados pelos links abaixo.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'A prévia não foi salva. Tente novamente.') }
    finally { setBusy(false) }
  }

  if (sharedImportEnabled && !canImport) return <div className="revenue-page grid gap-4 text-[#0d2340]">
    <header><h1 className="revenue-heading flex items-center gap-2 text-2xl font-bold"><Settings2 aria-hidden size={24} />Configurações</h1>
      <h2 className="mt-3 text-lg font-semibold">Consulta das cargas</h2><p className="mt-1 text-sm text-[#52677f]">Seu acesso permite consultar os dados confirmados. A publicação de uma nova carga fica com pessoas autorizadas.</p></header>
    <SourceNote canImport={canImport} />
    {loadError && <p role="alert" className="rounded-lg border border-[#f2bd91] p-3 text-sm">{loadError} Recarregue para tentar novamente.</p>}
    <section className={panel + ' grid gap-3'}>
      {loading ? <p role="status" className="text-sm text-[#52677f]">Consultando a carga compartilhada…</p> : draft ? <>
        {draft.history?.[0] && <p className="text-sm">Última carga confirmada · {new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Cuiaba', dateStyle: 'short', timeStyle: 'short' }).format(new Date(draft.history[0].at))} (Cuiabá)</p>}
        <p className="text-sm text-[#52677f]">Oportunidades · {draft.opportunities?.filename ?? 'sem arquivo nesta carga'} · referência {displayDate(draft.opportunities?.referenceDate)}</p>
        <p className="text-sm text-[#52677f]">Pedidos · {draft.orders?.filename ?? 'sem arquivo nesta carga'} · referência {displayDate(draft.orders?.referenceDate)}</p>
        <div className="flex flex-wrap gap-3">
          {draft.opportunities && <Link className="min-h-10 rounded px-2 py-2 text-sm font-semibold text-[#086b6b] underline" href={nav.href('forecast')}>Consultar Forecast</Link>}
          {draft.orders && <Link className="min-h-10 rounded px-2 py-2 text-sm font-semibold text-[#086b6b] underline" href={nav.href('new-name')}>Consultar New Name</Link>}
        </div>
      </> : <p role="status" className="text-sm text-[#52677f]">Nenhuma carga compartilhada foi confirmada ainda.</p>}
    </section>
  </div>

  return <div className="revenue-page grid gap-4 text-[#0d2340]">
    <header><h1 className="revenue-heading flex items-center gap-2 text-2xl font-bold"><Settings2 aria-hidden size={24} />Configurações</h1>
      <h2 className="mt-3 text-lg font-semibold">Importação de dados</h2><p className="mt-1 text-sm text-[#52677f]">{sharedImportEnabled ? 'Fabi seleciona as exportações do CRM, confere a leitura e confirma a carga para os leitores.' : 'Fabi seleciona as exportações do CRM, confere a leitura e salva uma prévia local.'}</p></header>
    <SourceNote canImport={canImport} />
    {loadError && <p role="alert" className="rounded-lg border border-[#f2bd91] p-3 text-sm">{loadError} Recarregue para tentar novamente.</p>}
    <section className={panel}>
      <label className="block max-w-xs text-sm font-semibold">Data de referência da exportação
        <input type="date" aria-label="Data de referência da exportação" min="1900-01-01" max={localDate()} className={input} value={referenceDate} onChange={event => { setReferenceDate(event.target.value); setAcknowledged(false) }} disabled={busy || loading} />
      </label><p className="mt-2 text-sm text-[#52677f]">Escolha a data do retrato do CRM; a data de hoje não é presumida. A leitura não recupera o congelado do início do mês.</p>
    </section>
    <div className="grid items-start gap-4 xl:grid-cols-2">{(['opportunities', 'orders'] as const).map(kind => <section key={kind} className={panel}>
      <h3 className="flex items-center gap-2 text-base font-semibold"><FileSpreadsheet aria-hidden size={20} />{names[kind]}</h3>
      <p className="mt-1 text-sm text-[#52677f]">{kind === 'orders' ? 'CSV UTF-8 ou XLSX · linhas de produtos e serviços, como em Pedidos Outubro 26.xlsx.' : 'CSV UTF-8 ou XLSX · uma linha por oportunidade, como em Opp em andamento.xlsx.'}</p>
      <label className="mt-3 block text-sm font-semibold">Selecionar CSV ou XLSX de {names[kind].toLowerCase()}
        <input type="file" accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={busy || loading || !isValidImportReference(referenceDate, localDate())} className={input + ' file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-[#eef7f5] file:px-3 file:py-1 file:text-[#086b6b]'}
          onChange={event => { void selectFile(kind, event.target.files?.[0]); event.target.value = '' }} />
      </label>
      {errors[kind] && <p role="alert" className="mt-3 text-sm text-[#9a3412]">{errors[kind]}</p>}
      {(staged[kind] || errors[kind]) && <button type="button" disabled={busy} className="mt-3 min-h-10 rounded px-2 text-sm underline focus-visible:outline-2 focus-visible:outline-[#086b6b]"
        onClick={() => { setStaged(current => ({ ...current, [kind]: null })); setErrors(current => ({ ...current, [kind]: '' })); setAcknowledged(false) }}>Descartar seleção</button>}
      {workspace[kind] ? <><p className="mt-3 text-sm font-semibold">{staged[kind] ? 'Nova seleção · substitui esta fonte na prévia' : `${sharedImportEnabled ? 'Carga compartilhada confirmada' : 'Prévia salva'} · referência ${displayDate(workspace[kind]?.referenceDate)}`}</p>
        <BatchPreview batch={workspace[kind]!} /></> : <p className="mt-4 text-sm text-[#52677f]">Nenhum arquivo desta fonte na prévia.</p>}
    </section>)}</div>
    <section className={panel + ' grid gap-4'} aria-label="Conferência das fontes">
      <h3 className="text-base font-semibold">Conferência antes de salvar</h3>
      {workspace.opportunities && workspace.orders ? <Metrics entries={[[ 'Pedidos vinculados por ID', reconciliation.matchedOrders], ['Pedidos sem oportunidade nesta carga', reconciliation.unmatchedOrders], ['Divergências de conta', reconciliation.conflictingAccounts]]} />
        : <p className="text-sm text-[#52677f]">Selecione as duas fontes para conferir pedidos × oportunidades pelo ID.</p>}
      {reconciliation.conflictingAccounts > 0 && <p role="alert" className="text-sm text-[#9a3412]">A gravação está bloqueada: revise as divergências de conta entre as fontes.</p>}
      {differentDates && <p className="text-sm text-[#9a3412]">As fontes têm datas de referência diferentes. O vínculo por ID não comprova atualização simultânea dos estados.</p>}
      <p className="text-sm leading-5 text-[#52677f]">Cada carga substitui o retrato anterior daquela fonte nesta prévia. Itens de pedido são preservados sem somar manutenção como MRR. Datas ausentes e valores vazios continuam indisponíveis.</p>
      {changed && warnings > 0 && <label className="flex min-h-10 items-start gap-3 text-sm"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 accent-[#086b6b]" />
        <span>Revisei os avisos e as relações sem correspondência. Os campos afetados continuam indisponíveis.</span></label>}
      <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => void save()} disabled={blocked} className={button}>{busy ? 'Lendo ou salvando…' : loading ? 'Carregando…' : sharedImportEnabled ? 'Confirmar carga compartilhada' : 'Salvar prévia local'}</button>
        {draft?.opportunities && <Link className="min-h-10 rounded px-2 py-2 text-sm font-semibold text-[#086b6b] underline" href={nav.href('forecast')}>Revisar Forecast</Link>}
        {draft?.orders && <Link className="min-h-10 rounded px-2 py-2 text-sm font-semibold text-[#086b6b] underline" href={nav.href('new-name')}>Revisar New Name</Link>}
      </div><p role="status" aria-live="polite" className="text-sm">{message}</p>
    </section>
    {draft?.history?.length ? <details className={panel}><summary className="cursor-pointer text-sm font-semibold">{sharedImportEnabled ? 'Histórico das cargas compartilhadas' : 'Histórico das prévias locais'}</summary><ul className="mt-3 grid gap-3 text-sm">{draft.history.map(entry => <li key={entry.at}>
      {new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Cuiaba', dateStyle: 'short', timeStyle: 'short' }).format(new Date(entry.at))} · referência {displayDate(entry.referenceDate)} · {entry.sources.join(' + ')}
    </li>)}</ul><p className="mt-3 text-sm text-[#52677f]">Últimos 20 registros de gravação. O histórico registra cargas; não contém versões para restaurar nem movimentos comerciais.</p></details> : null}
  </div>
}

export function ImportedDataScreen({ batch, kind, nav, lastSavedAt, embedded = false, canImport }: { batch: ImportBatch; kind: 'forecast' | 'new-name'; nav: CommercialNav; lastSavedAt?: string; embedded?: boolean; canImport: boolean }) {
  const router = useRouter()
  const params = useSearchParams()
  const requestedMonth = params.get('importMonth') ?? ''
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth) ? requestedMonth : (batch.referenceDate ?? localDate()).slice(0, 7)
  const scopeKey = kind === 'forecast' ? 'importRepresentative' : 'importUnit'
  const representative = params.get(scopeKey) ?? ''
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value); else next.delete(key)
    router.replace(`/?${next.toString()}`, { scroll: false })
  }
  const representatives = useMemo(() => [...new Set(batch.records.map(record => record.representative).filter(Boolean))].sort(), [batch])
  const forecast = useMemo(() => selectImportedForecast(batch, month, representative), [batch, month, representative])
  const candidates = useMemo(() => batch.records.filter(record => record.classification.trim().toLowerCase() === 'novo' &&
    (!representative || record.representative === representative)), [batch, representative])
  const rows = kind === 'forecast' ? forecast.records : candidates
  return <div className="revenue-page grid gap-4">
    {!embedded && <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="revenue-heading text-2xl font-bold">{kind === 'forecast' ? 'Forecast' : 'New Name'}</h1>
      <Link href={nav.href('config')} className="min-h-10 rounded px-3 py-2 text-sm font-semibold text-[#086b6b] underline">{canImport ? 'Atualizar arquivos' : 'Consultar carga'}</Link></header>}
    <ImportFreshness batch={batch} lastSavedAt={lastSavedAt} /><p className="text-xs text-[#52677f]">{sharedImportEnabled ? 'Carga compartilhada' : 'Carga local'} · {batch.filename}</p>
    <section className={panel + ' grid gap-4'}>
      <div className="flex flex-wrap gap-4">{kind === 'forecast' && <label className="text-sm font-semibold">Mês de previsão<input type="month" className={input} value={month} onChange={event => setFilter('importMonth', event.target.value)} /></label>}
        <label className="min-w-60 max-w-full text-sm font-semibold">{kind === 'forecast' ? 'Representante informado no CRM' : 'Unidade da oportunidade no pedido'}
          <select className={input} value={representative} onChange={event => setFilter(scopeKey, event.target.value)}><option value="">Todos os registros da fonte</option>{representatives.map(value => <option key={value} value={value}>{value}</option>)}</select>
        </label></div>
      <p className="text-sm text-[#52677f]">O recorte de filiais da diretoria precisa ser validado. Representante, unidade e grupo do proprietário são campos distintos.</p>
      {kind === 'forecast' ? <>
        <Metrics entries={[[ 'Oportunidades abertas com previsão no mês', rows.length, 'Oportunidades com etapa aberta e previsão de fechamento no mês selecionado. Cada ID é contado uma vez.'], ['Contas no recorte', forecast.accounts, 'Contas distintas, identificadas pelo ID. Uma conta pode ter mais de uma oportunidade.'], ['Valor previsto da fonte', currency(forecast.predictedValue), 'Soma do Valor Previsto das oportunidades deste recorte. Não representa receita recorrente mensal (MRR). Valores ausentes não viram zero.']]} />
        <p className="text-sm leading-5 text-[#52677f]">Esta leitura mostra a carteira prevista. MRR, meta e forecast oficial estão indisponíveis até validar a composição financeira e a lista congelada. Fechadas e perdidas ficam fora deste recorte. Zero no arquivo permanece zero.</p>
        <ForecastDates records={rows} />
      </> : <>
        <Metrics entries={[[ 'Pedidos com linhas marcadas Novo', new Set(candidates.map(record => record.orderId)).size, 'Pedidos distintos com pelo menos um item classificado como Novo. Itens repetidos não multiplicam pedidos.'], ['Contas com linhas marcadas Novo', new Set(candidates.map(record => record.accountId)).size, 'Contas distintas associadas aos pedidos marcados Novo. A classificação ainda precisa confirmar quais são novas contas.'], ['New Names validados', 'Indisponível', 'New Name conta novas contas segundo a regra de negócio validada. Novos negócios em reais é uma medida diferente. A planilha não certifica esta classificação.']]} />
        <p className="text-sm leading-5 text-[#52677f]">“CLASSIFICACAO DO PEDIDO” é informação da fonte e requer validação da Fabi para determinar New Name. A lista inclui todo o arquivo; DATA FECHAMENTO não comprova o mês de integração. Pedido assinado ou conferido continua pendente. Realizado exige integração com data.</p>
      </>}
      <PreviewTable records={rows} orders={kind === 'new-name'} />
    </section>
  </div>
}
