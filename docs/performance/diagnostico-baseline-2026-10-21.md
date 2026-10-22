# Diagnóstico de performance — coleta local exploratória

**Data:** 2026-10-21 · **Autorização:** Bruno autorizou o diagnóstico P0–P3 e início do P1 nesta sessão. **Resultado:** P0 mecânico passou apenas em snapshot sintético derivado, com ressalva de representatividade (não é build do checkout dirty exato nem da Home final); P1 exploratório parcial (cinco amostras warm do Forecast demo sintético, não Home nem importação); P2 parcial (bundle/rede); P3 não concluído. Nenhum gargalo foi comprovado e nenhuma otimização foi feita.

## Resumo executivo

- **VERIFICADO, COM RESSALVA:** `npm run build:static` passou no snapshot derivado sintético com Next 16.3.8 e Webpack; não foi build fiel do checkout dirty exato. O snapshot substituiu três arquivos de dados/texto e, portanto, não valida o build final da Home. Não rodei o agregador `npm run build`, que modifica `dist/`.
- **VERIFICADO:** export estático final tem 90 arquivos e 2.490.426 bytes. O artefato contém uma rota `/` e `/_not-found`; as views do produto não são 12 rotas independentes.
- **VERIFICADO, EXPLORATÓRIO:** cinco recargas warm do Forecast demonstrativo sintético, Chrome UA 152, viewport 1440×900; não são medições da Home, do caminho de importação nem um baseline P1 completo. LCP observado: mediana 256 ms, faixa 180–324 ms; CLS observado 0 em todas. Isso é laboratório local, não INP de campo nem percentil de Core Web Vitals.
- **NÃO VERIFICADO:** cache realmente frio; o contexto do navegador já tinha recursos do mesmo host em cache e não expôs um meio confiável de limpar o cache sem trocar de cenário. Uma aba nova continuou indicando cache hits. Não apresento essas leituras como cold.
- **NÃO VERIFICADO:** importação por seletor nativo, persistência IndexedDB/reload, arquivos de 5k–50k linhas, perfil React, cobertura, heap, custo de GPU, runtime D1/API ou produção.
- **VERIFICADO:** nenhuma otimização, instalação, migração, alteração de código de aplicação, commit, push, publicação ou envio externo foi realizado. Foram escritos este relatório, `amostras-brutas-2026-10-21.json` e a atualização operacional de `HANDOFF_AI.md`; o servidor e abas locais de teste foram encerrados.

## GitHub e estado do plano anterior

- **VERIFICADO:** branch `feat/trajetoria-receita`, HEAD local e remoto `origin/feat/trajetoria-receita` estão em `08869cdb06f76cbf35bd7c3ab6c748ddb2105a8b`. `main` remoto observado em `4329ba8795e7438a6221fed434b7dbb31ef8f8b0`.
- **VERIFICADO:** no início desta tarefa havia 15 arquivos rastreados modificados e 13 caminhos não rastreados. As alterações locais — incluindo importação, Worker, Trajetória, Home, Scout, testes e evidências — não estavam commitadas; HEAD igual ao remoto não publica essas diferenças. Não afirmo que todo o plano anterior foi enviado.
- **VERIFICADO:** issue #11 está OPEN, criada por `brunolimaff-jpg` em 2026-10-21T17:07:10Z, label `pronto-pra-agente`, sem comentários. O título e corpo tratam do ciclo local do Senior Scout, não de performance.
- **VERIFICADO:** a busca de issues abertas/fechadas (até 100) não encontrou issue de performance, desempenho ou baseline. Não criei nem alterei issue.
- **VERIFICADO:** `gh pr list --state all` retornou `[]`; API de deployments retornou `0`. Isso não prova ausência de deploy fora do GitHub.
- **CONCLUSÃO:** há rastreabilidade da frente Scout (#11), mas não encontrei registro do plano de performance no issue tracker; o trabalho dirty atual não está enviado em commit/PR.

## P0 — build do snapshot sintético derivado (ressalva de representatividade)

### Snapshot

**Gate P0:** allowlist, cópia de dependências e build estático foram executados no snapshot, mas o critério de representatividade não passou: os dados/texto de fixture foram substituídos. Não classificar como build do checkout final dirty; o status é PASS técnico restrito à cópia sintética derivada.

- **Origem:** `C:\Users\bruno.ferreira\OneDrive - Senior Sistemas SA\Documentos\Projetos\Central de Receita\central-receita-sites`, branch e HEAD acima; worktree preservada.
- **Snapshot privado:** `C:\Users\bruno.ferreira\AppData\Local\CentralReceitaPerf-20261021-1792627294039`.
- **Manifest de allowlist/hashes:** `C:\Users\bruno.ferreira\AppData\Local\CentralReceitaPerf-20261021-1792627294039\snapshot-manifest.json`; SHA-256 do manifest: `05c380b1c237cadd2ba7214b1b2ab30c4d76d996bb770f14c04cb33926560c65`. O manifest lista 18.996 arquivos e a validação final encontrou 0 divergências nos arquivos listados.
- **Conteúdo copiado:** 144 arquivos de código/configuração/assets permitidos e `node_modules` copiado fisicamente (~472.311.111 bytes); não houve instalação. A varredura encontrou 0 symlinks no `node_modules` original. O snapshot não inclui `.git`, arquivos `.env*`, `.claude/`, `.agents/`, `legado/`, `.scratch/`, evidências, backups, `dist/`, nem fixtures/dados comerciais reais.
- **Sanitização sintética no snapshot:** `real-branches.json` foi substituído por quatro filiais fictícias; `mock-data.ts` foi substituído por workload sintético gerado com 100 oportunidades e 20 negócios; texto de demonstração que mencionava fonte real foi trocado por aviso de fixture sintética. `accounts-data.ts` foi lido e contém somente tipos/lógica, sem registros. Essas substituições ocorreram apenas no snapshot; os originais do repositório não foram alterados.
- **Reprodutibilidade do derivado:** o gerador determinístico está no `mock-data.ts` do snapshot (SHA-256 `b1f0e289672ecf63db589dff03238281bc0f10686c827f43691a426f0621c1ba`); fixture de filiais no `real-branches.json` (SHA-256 `701d6d3834a4f172d3be5af959861409a3950dd83ba3ec12d00119c08de24738`); texto sanitizado em `commercial-v3-app.tsx` (SHA-256 `874f3b5eb80bcaeeb9791f44987136a68ea6f1bf36b7a7d982b177b719fded22`). O conteúdo/hashes está no manifest privado; não foi capturado patch diff separado contra a fonte, e nenhum dado comercial foi copiado.
- **Ambiente:** Node v24.22.0, npm 11.19.1, Next 16.3.8, Tailwind 4.3.3. O processo foi iniciado com ambiente limpo, variáveis de plataforma Windows necessárias, `NEXT_PUBLIC_IMPORT_STORAGE=local` explícita e telemetria Next desabilitada. Não havia configuração `.env*` copiada; só foi preservada a configuração do projeto necessária ao build.
- **Tentativa inicial:** o ambiente mínimo omitiu `SYSTEMROOT`, causando erro de inicialização do Node; após incluir variáveis necessárias do Windows, o processo isolado funcionou. Um build intermediário também detectou formato incompleto no total sintético; a fixture foi corrigida e o build final passou.

### Build final

Comando executado **no snapshot**: `NEXT_PUBLIC_IMPORT_STORAGE=local NEXT_TELEMETRY_DISABLED=1 npm run build:static`.

Saída bruta resumida:

```text
▲ Next.js 16.3.8 (webpack)
✓ Running next.config.ts
✓ Compiled successfully
✓ Finished TypeScript
✓ Generating static pages (3/3)
Route (app)
┌ ○ /
└ ○ /_not-found
○ (Static) prerendered as static content.
```

- `out/`: 90 arquivos, 2.490.426 bytes; 23 JS/1.393.765 bytes, 1 CSS/77.583 bytes, 3 HTML/18.786 bytes, 4 fontes WOFF2/134.588 bytes e restante de assets públicos.
- `out/index.html`: 5.674 bytes, SHA-256 `204cd4aa41de753f3aa585a4a51d76f16fcfdfbb79286fbc046bed10ec9fc012`.
- Chunk da página: `out/_next/static/chunks/app/page-b3c40558be101664.js`, 246.912 bytes, SHA-256 `c04104ab2165c87c4a6bd9a35c1fe7b54471f80e1c4efc85ddd58157d22ec5b7`.
- CSS final: `out/_next/static/css/d87613253ff1a202.css`, 77.583 bytes, SHA-256 `34d3aa37fb4ccb2200c5dde40ff27db8f911ae5ef77354764ff5b7f45a2a1970`.
- **Limite:** build de cópia não valida Worker/D1, deploy, experiência com dados reais ou o build da worktree original após suas alterações finais.

## P1 — cinco amostras warm

**Cenário exploratório, não baseline P1 conforme:** URL `http://127.0.0.1:3012/?view=forecast&period=month&demo=1`, export estático do snapshot sintético derivado; 100 oportunidades geradas pela fixture, viewport 1440×900, UA observado Chrome 152.0.7977.149 em Windows 11, DPR 1,25, 12 threads reportadas, sem CPU/network throttle. O app exibiu 100 linhas. A tela é Forecast demonstrativo — não é Home e não exercita importação; não representa o fluxo de dados carregados pelo usuário. Cache aquecido; a coluna de hits usa `transferSize=0` e `encodedBodySize>0`. Observação via Performance API com LCP/CLS observers buffered, janela de 2,6 s antes de interação.

**Não conformidade de ambiente confirmada:** a coleta foi feita pelo Claude Browser pane (IAB/in-app browser), não por Chrome externo isolado. O UA Chrome 152 identifica o motor/versão declarada, mas não prova perfil externo nem isolamento; o perfil usado não foi tecnicamente confirmado. As leituras abaixo são exploratórias e não satisfazem o gate de Chrome externo isolado.

| Amostra warm | responseStart (ms) | DOMContentLoaded (ms) | load (ms) | LCP observado (ms) | CLS observado | Hits / recursos | Transferência de recursos (bytes) |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 16,3 | 57,1 | 59,2 | 292 | 0 | 31/42 | 3.000 |
| 2 | 9,5 | 42,0 | 44,0 | 324 | 0 | 31/42 | 3.000 |
| 3 | 8,6 | 32,1 | 33,4 | 192 | 0 | 31/42 | 3.000 |
| 4 | 13,6 | 42,4 | 44,0 | 256 | 0 | 31/42 | 3.000 |
| 5 | 6,8 | 31,9 | 33,3 | 180 | 0 | 31/42 | 3.000 |
| **Mediana** | **9,5** | **42,0** | **44,0** | **256** | **0** | — | **3.000** |
| **Faixa min–max** | **6,8–16,3** | **31,9–57,1** | **33,3–59,2** | **180–324** | **0–0** | — | **3.000–3.000** |

Cada documento transferiu 5.974 bytes. A transferência de recursos exclui esse documento; 31/42 entradas de recursos foram marcadas como cache hit. Os valores são de navegação local em ambiente com cache prévio, não cenário cold. O LCP é a entrada observada nesta janela em cada carga, não LCP de campo nem garantia de último candidato absoluto.

As cinco amostras numéricas transcritas das saídas reais do Browser pane e a tentativa mista excluída foram salvas em `docs/performance/amostras-brutas-2026-10-21.json`. Não foi produzido HAR/CDP trace; não havia arquivo de log bruto persistido, e o JSON identifica exatamente essa limitação. Manifest/hashes do build sintético estão em `C:\Users\bruno.ferreira\AppData\Local\CentralReceitaPerf-20261021-1792627294039\snapshot-manifest.json` e são apontados sem expor conteúdo comercial.

**Cold — NÃO VERIFICADO:** aba recém-aberta ainda reportou 19 cache hits em 26 recursos; a medição também ocorreu inicialmente em viewport 279×307 e foi excluída. O viewport foi então corrigido para 1440×900. Sem controle confiável de cache/perfil isolado, não inventei cinco amostras cold nem comparei cold com warm.

**INP — NÃO MEDIDO:** não foi coletada interação representativa nem P75 de campo. Nenhuma medição de latência de input foi chamada de INP. Também não foi aplicada GPU/FPS profiling ou inferida performance de hardware físico.

## P2 — decomposição inicial, sem diagnóstico de gargalo

- **VERIFICADO:** Next exporta a aplicação ativa como uma rota `/`; as views são selecionadas por query string no client. `commercial-v3-app.tsx` importa estaticamente as telas, o que é compatível com o resultado observado: no Forecast, 6 arquivos JS somaram 862.028 bytes por Resource Timing; o chunk de página foi 246.912 bytes. Não são 12 bundles/rotas independentes.
- **VERIFICADO:** export completo contém 23 arquivos JS/1.393.765 bytes, mas essa soma inclui assets que não foram carregados pela visita medida; CSS final tem 77.583 bytes. Não instalei analyzer nem inferi oportunidade de code splitting sem perfil.
- **Observação de instrumentação:** abas que haviam aberto o build anterior conservaram URLs CSS antigas e geraram avisos de preload durante a troca de export; uma carga em aba nova confirmou o HTML/chunks atuais e o CSS final `d876…css` em HTTP 200. A coleta de cache permanece parcialmente contaminada pelo contexto compartilhado; não usei o aviso como defeito do app.
- **NÃO VERIFICADO:** contribuição de renders/cálculos React, gráfico SVG/ResizeObserver/ponteiro, CSS blur/backdrop, Motion, heap/GC ou custo de pintura/composição. Não foi feita coleta com React Profiler, Coverage, heap snapshot ou trace de performance.
- **Conclusão P2:** bundle/rede inicial estão caracterizados em baixa intrusão; nenhum gargalo causal nem ganho de otimização foi demonstrado.

## P3 — importação, memória e persistência

**NÃO CONCLUÍDO.** Não houve amostra confiável de importação por seletor nativo, leitura CSV/XLSX, SHA-256, Worker, clone/reconciliação, persistência IndexedDB ou reload com fixtures sintéticas. Durante exploração, foi tentada atribuição programática de arquivos a `input.files` e disparo de `change`; apesar de a UI ter exibido leituras sintéticas, isso não equivaleu ao seletor nativo e a navegação descartou o estado transitório. Não cliquei em “Salvar prévia local”; não considero parsing/vínculos dessa tentativa como evidência P3. Não testei 5k–10k ou 50k linhas.

O modo do build foi explícito `local`; não observei chamada `/api/imports/*` na navegação coletada. A aplicação abre sua IndexedDB local ao inicializar; não confirmei isolamento do perfil do navegador via identificador técnico. Não houve registro de carga salvo por esta sessão nem uso de dados reais.

## Limites e próximo gate

1. O baseline de laboratório não mede LCP/INP de campo, não substitui dispositivo físico e não autoriza afirmar “pronto para produção”.
2. P1 cold requer contexto de navegador isolado e limpeza de cache verificável; P3 requer acesso seguro ao seletor de arquivo para os CSVs sintéticos e confirmação de estado antes/depois na mesma origem.
3. P2 pode continuar com trace leve e interação representativa, separando essa instrumentação do baseline; React Profiler, Coverage e heap permanecem coletas separadas.
4. Nenhuma otimização foi autorizada ou aplicada nesta etapa; qualquer conclusão sobre benefício exige comparação pareada antes/depois em ambiente e estado iguais.
