/**
 * Harness de cenários de erro humano na importação.
 * Para cada cenário, imprime o que a pessoa VÊ: quantos erros/avisos e a mensagem.
 */
const imp = await import('../src/features/comercial-v3/manual-import.ts')
const csv = await import('../src/features/comercial-v3/manual-import-csv.ts')

const OPP = ['Oportunidade ID','Conta ID','Conta','Etapa','Previsão de Fechamento','Valor Previsto','Valor Fechado','Representante']
const PED = ['NUMERO PEDIDO','ID OPORTUNIDADE','ID CONTA','NOME FANTASIA CONTA','STATUS OPORTUNIDADE','CLASSIFICACAO DO PEDIDO','DATA FECHAMENTO','PRODUTO - VALOR MANUTENCAO','UNIDADE NEGOCIO OPORTUNIDADE']

let falhas = 0
const check = (nome, condicao, detalhe) => {
  const ok = Boolean(condicao)
  if (!ok) falhas++
  console.log(`${ok ? 'PASS' : 'FALHA'}  ${nome}`)
  if (!ok) console.log(`        ${detalhe}`)
}
const resumo = (b) => `${b.errorCount} erro(s), ${b.warningCount} aviso(s)${b.issues[0] ? ` :: ${b.issues[0].message}` : ''}`

console.log('\n=== 1. ARQUIVO NO SLOT ERRADO ===')
{
  const b = imp.normalizeImport('orders', [OPP, ['1','2','ACME','Proposta','31/10/2026','100','','RS']])
  console.log('   pessoa vê:', resumo(b))
  check('detecta a troca e diz qual arquivo vai onde', /parece ser a planilha de Oportunidades/i.test(b.issues[0]?.message ?? ''), b.issues[0]?.message)
  check('reduz a 1 erro, não 9', b.errorCount === 1, `errorCount=${b.errorCount}`)
}
{
  const b = imp.normalizeImport('opportunities', [PED, ['9','1','2','ACME','FECHADA','Novo','31/10/2026','100','RS']])
  console.log('   pessoa vê:', resumo(b))
  check('detecta a troca no sentido inverso', /parece ser a planilha de Pedidos/i.test(b.issues[0]?.message ?? ''), b.issues[0]?.message)
}

console.log('\n=== 2. CSV NATIVO DO CRM (Latin-1) ===')
{
  const texto = 'Oportunidade ID;Conta ID;Conta;Etapa;Previsão de Fechamento;Valor Previsto;Valor Fechado;Representante\n1;2;Empresa Ação;Proposta;31/10/2026;1.000,00;;Filial SP'
  const bytes = new TextEncoder().encode(texto)
  const decoded = csv.decodeImportCsv(bytes.buffer)
  check('lê UTF-8 sem perder acento', decoded.includes('Ação'), decoded.slice(0, 60))
  const latin = new Uint8Array([...new TextEncoder().encode('Oportunidade ID;Conta;Etapa\n1;Empresa '), 0xe7, 0xe3, 0x6f, ...new TextEncoder().encode(';Proposta')])
  const d2 = csv.decodeImportCsv(latin.buffer)
  check('cai para windows-1252 e recupera "ção"', d2.includes('ção'), JSON.stringify(d2))
}

console.log('\n=== 3. DATA COM HORA ===')
{
  const b = imp.normalizeImport('opportunities', [OPP, ['1','2','ACME','Proposta','31/10/2026 00:00:00','100','','RS']])
  check('aceita data com hora', b.records[0]?.forecastDate === '2026-10-31' && b.warningCount === 0, resumo(b))
}

console.log('\n=== 4. SENTINELA 01/01/1000 (sem data) ===')
{
  const b = imp.normalizeImport('opportunities', [OPP, ['1','2','ACME','Fechada e Perdida','01/01/1000','100','500','RS']])
  check('não gera aviso falso', b.warningCount === 0 && b.records[0]?.forecastDate === null, resumo(b))
}

console.log('\n=== 5. NÚMERO pt-BR ===')
{
  const b = imp.normalizeImport('opportunities', [OPP, ['1','2','ACME','Proposta','31/10/2026','15.000','','RS']])
  check('lê 15.000 como 15000', b.records[0]?.predictedValue === 15000, String(b.records[0]?.predictedValue))
  const b2 = imp.normalizeImport('orders', [PED, ['9','1','2','ACME','FECHADA','Novo','31/10/2026','1.234,56','RS']])
  check('lê 1.234,56 como 1234.56', b2.records[0]?.maintenance === 1234.56, String(b2.records[0]?.maintenance))
}

console.log('\n=== 6. COLUNA AUSENTE / RENOMEADA ===')
{
  const semEtapa = OPP.filter(c => c !== 'Etapa')
  const b = imp.normalizeImport('opportunities', [semEtapa, ['1','2','ACME','31/10/2026','100','','RS']])
  console.log('   pessoa vê:', resumo(b))
  check('nomeia a coluna que falta', /“Etapa”/.test(b.issues[0]?.message ?? ''), b.issues[0]?.message)
}

console.log('\n=== 7. PLANILHA VAZIA / SÓ CABEÇALHO ===')
{
  const b = imp.normalizeImport('opportunities', [OPP])
  console.log('   pessoa vê:', resumo(b))
  check('explica que não há linhas', /não tem linhas de dados/i.test(b.issues[0]?.message ?? ''), b.issues[0]?.message)
}

console.log('\n=== 8. ID INVÁLIDO / DUPLICADO ===')
{
  const b = imp.normalizeImport('opportunities', [OPP, ['ABC','2','ACME','Proposta','31/10/2026','100','','RS']])
  console.log('   pessoa vê:', resumo(b))
  check('recusa ID não numérico', b.errorCount > 0, resumo(b))
  const dup = imp.normalizeImport('opportunities', [OPP, ['1','2','A','Proposta','31/10/2026','1','','RS'], ['1','3','B','Proposta','31/10/2026','1','','RS']])
  check('recusa ID duplicado', dup.errorCount > 0, resumo(dup))
}

console.log('\n=== 9. TEXTO LONGO / VALOR INVÁLIDO ===')
{
  const b = imp.normalizeImport('opportunities', [OPP, ['1','2','X'.repeat(600),'Proposta','31/10/2026','100','','RS']])
  check('recusa texto acima do limite do servidor', b.errorCount > 0, resumo(b))
  const b2 = imp.normalizeImport('opportunities', [OPP, ['1','2','ACME','Proposta','31/10/2026','abc','','RS']])
  console.log('   pessoa vê:', resumo(b2))
  check('avisa valor não numérico', b2.warningCount === 1 && /não foi reconhecido como número/i.test(b2.issues[0]?.message ?? ''), resumo(b2))
}

console.log('\n=== 10. ETAPA SEM ACENTO E CAIXA DIFERENTE ===')
{
  const b = imp.normalizeImport('opportunities', [OPP, ['1','2','ACME','proposta','31/10/2026','100','','RS']])
  check('preserva a etapa como veio (sem inventar)', b.records[0]?.stage === 'proposta', b.records[0]?.stage)
}

console.log('\n=== 11. ID INVALIDO: a mensagem nomeia o campo? ===')
{
  const b = imp.normalizeImport('opportunities', [OPP, ['ABC','2','ACME','Proposta','31/10/2026','100','','RS']])
  console.log('   pessoa ve:', resumo(b))
  check('diz QUAL coluna e QUAL linha', /Oportunidade ID/.test(b.issues[0]?.message ?? '') && /linha 2/.test(b.issues[0]?.message ?? ''), b.issues[0]?.message)
  check('diz o que fazer', /exporte de novo/i.test(b.issues[0]?.message ?? ''), b.issues[0]?.message)
}

console.log('\n=== 12. PLANILHA VAZIA: mensagem nao se contradiz ===')
{
  const b = imp.normalizeImport('opportunities', [OPP])
  console.log('   pessoa ve:', resumo(b))
  check('nao mistura "vazia" com "reduza o periodo"', !/reduza o per[ií]odo/i.test(b.issues[0]?.message ?? ''), b.issues[0]?.message)
}

console.log('\n=== 13. ARQUIVO GRANDE (50.001 linhas) ===')
{
  const linhas = Array.from({ length: 50001 }, (_, i) => [String(i + 1), '2', 'ACME', 'Proposta', '31/10/2026', '1', '', 'RS'])
  const b = imp.normalizeImport('opportunities', [OPP, ...linhas])
  console.log('   pessoa ve:', resumo(b))
  check('explica o limite e a acao', /50\.000 linhas/.test(b.issues[0]?.message ?? '') && /Reduza o per[ií]odo/i.test(b.issues[0]?.message ?? ''), b.issues[0]?.message)
}

console.log('\n=== 14. COLUNAS DEMAIS (101) ===')
{
  const cols = [...OPP, ...Array.from({ length: 93 }, (_, i) => `Extra ${i}`)]
  const linha = ['1','2','ACME','Proposta','31/10/2026','1','','RS', ...Array(93).fill('x')]
  const b = imp.normalizeImport('opportunities', [cols, linha])
  console.log('   pessoa ve:', resumo(b))
  check('explica o limite de colunas', /100 colunas/i.test(b.issues[0]?.message ?? ''), b.issues[0]?.message)
}

console.log('\n=== 15. DATA DE REFERENCIA DO FUTURO ===')
{
  const { isValidImportReference, currentImportDate } = imp
  const hoje = currentImportDate()
  const amanha = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10) })()
  check('recusa referencia no futuro', isValidImportReference(amanha, hoje) === false, `amanha=${amanha} hoje=${hoje}`)
  check('recusa data impossivel 31/02', isValidImportReference('2026-02-31', hoje) === false, '2026-02-31')
  check('aceita hoje', isValidImportReference(hoje, hoje) === true, hoje)
}

console.log('\n=== 16. PLANILHAS REAIS TROCADAS DE SLOT ===')
{
  const OPP_REAL = ['Oportunidade ID','Conta ID','Conta','Etapa','Previsão de Fechamento','Valor Previsto','Valor Fechado','Representante','Efetivação do Fechamento','Responsável','Pedido','CLASSIFICACAO DA CONTA','Criado pelo grupo','Prob.']
  const PED_REAL = ['NUMERO PEDIDO','ID OPORTUNIDADE','ID CONTA','NOME FANTASIA CONTA','STATUS OPORTUNIDADE','CLASSIFICACAO DO PEDIDO','DATA FECHAMENTO','PRODUTO - VALOR MANUTENCAO','UNIDADE NEGOCIO OPORTUNIDADE','ETAPA OPORTUNIDADE','DATA CONFERENCIA']
  const oppLinha = ['9001','501','ACME','Proposta','31/10/2026','1.000,00','','Senior Filial SP','','Ana','','Novo','','0.8']
  const pedLinha = ['7001','9001','501','ACME','INTEGRADO COM ERP','Novo','30/09/2026','500,00','Senior Filial SP','Proposta','01/10/2026']
  const t1 = imp.normalizeImport('orders', [OPP_REAL, oppLinha])
  const t2 = imp.normalizeImport('opportunities', [PED_REAL, pedLinha])
  console.log('   oportunidades no slot de pedidos:', resumo(t1))
  console.log('   pedidos no slot de oportunidades:', resumo(t2))
  check('detecta troca do arquivo real 1', /parece ser a planilha de Oportunidades/i.test(t1.issues[0]?.message ?? ''), t1.issues[0]?.message)
  check('detecta troca do arquivo real 2', /parece ser a planilha de Pedidos/i.test(t2.issues[0]?.message ?? ''), t2.issues[0]?.message)
  const certo = imp.normalizeImport('orders', [PED_REAL, pedLinha])
  check('arquivo certo nao da erro', certo.errorCount === 0, resumo(certo))
}

console.log('')
console.log(falhas === 0 ? 'TODOS PASSARAM' : String(falhas) + ' CENARIO(S) COM PROBLEMA')
process.exit(falhas ? 1 : 0)
