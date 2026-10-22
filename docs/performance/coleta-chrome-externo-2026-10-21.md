# Coleta de performance em Chrome externo — 21–22/10/2026

**Escopo:** revisão de P1 (Home), P2 (trace de carga/interação) e P3 (importação local) sobre snapshot/export derivado com fixtures sintéticas. **P2: seis traces revisados por GLM, aceitos com ressalvas metodológicas; nenhum gargalo causal confirmado. P3 de 5.000 linhas foi revisto por GLM e aceito parcialmente como evidência funcional/tempos do cenário; nenhuma extrapolação de escala é válida. Nenhuma otimização foi aplicada.** São dados de laboratório, não métricas de campo/Core Web Vitals nem evidência para declarar prontidão de produção.

## P1 — Home, carga inicial

**VERIFICADO, cenário limitado:** Chrome 155.0.8059.85 headless, perfil separado, viewport 1440×900, DPR 1, URL Home em modo demo. Cinco execuções com cache limpo e cinco warm; `Network.clearBrowserCache` foi usado antes de cada cold. O navegador reportou 12 threads lógicas (`hardwareConcurrency`) e 16 GB (`deviceMemory`); isso não verifica o hardware físico nem sua capacidade efetiva. LCP observado teve mediana **692 ms cold** (faixa 508–2664 ms) e **544 ms warm** (faixa 380–972 ms). A faixa ampla e o valor cold de 2664 ms mostram variabilidade/outlier; n=5 por cenário não sustenta comparação estatística ou limiar de campo. O elemento LCP observado foi o bloco de imagem de fundo. CLS ficou próximo de zero nas amostras, mas não é avaliação de estabilidade em campo.

Cache e transferência: cold registrou 0 hits em 22 recursos; warm, 17–18 hits em 21 recursos. A foto foi 403.505 bytes transferidos / 403.205 bytes de corpo decodificado por entrada de Resource Timing. Essas medidas descrevem o export/local e o perfil headless, não latência de rede de usuário real. A observação da imagem não a classifica como gargalo nem implica recomendação de alteração. LCP não é INP; INP/P75 de campo não foi medido.

## P2 — trace da carga e interação, Home demonstrativa

**VERIFICADO; revisão GLM aceita com ressalvas:** seis traces em Chrome 155.0.8059.85 headless, perfil separado, mesma Home `demo=1`, 1440×900, DPR 1; três corridas por condição, em ordem alternada, com preferência de movimento normal/reduzido confirmada em cada run. Long Tasks foram observadas via PerformanceObserver. O recorte de carga usou a âncora do primeiro `navigationStart` do trace e terminou na marca `__p2:load` + 3.000 ms; o recorte de interação usou as marcas verificadas `__p2:interaction-start` e `__p2:interaction-end`, após seis rolagens e oito movimentos de mouse. A interação começou em torno de 3,0 s e terminou entre 5,9–6,2 s da navegação (janela de cerca de 2,8–3,1 s). Os seis run IDs e nomes são únicos, zero erros do observer; hashes dos traces conferem com o manifest. A reanálise ancora timestamps do trace no evento `navigationStart` (`ph=R`) porque `trace.ts` é tempo absoluto em microssegundos; usa as marcas do resumo para recortar janelas. O primeiro agregado de buckets, sem ancoragem correta, foi descartado; os valores abaixo vêm somente de `p2-reanalysis-anchored-6runs.json`.

| Medida observada | Movimento normal (3 runs) | Movimento reduzido (3 runs) |
|---|---:|---:|
| Long Tasks na carga, contagem por run | 3 / 3 / 4; mediana 3 | 3 / 4 / 4; mediana 4 |
| Soma de duração de Long Tasks na carga, por run (ms) | 297 / 229 / 400; mediana 297, faixa 229–400 | 272 / 465 / 342; mediana 342, faixa 272–465 |
| Long Tasks observadas na janela de interação | 0 em 3/3 | 0 em 3/3 |
| Eventos instantâneos `DrawFrame` na janela de interação | 188 / 187 / 185; mediana 187, faixa 185–188 | 6 / 7 / 7; mediana 7, faixa 6–7 |
| Eventos instantâneos `BeginFrame` na janela de interação | 188 / 188 / 185; mediana 188, faixa 185–188 | 53 / 53 / 51; mediana 53, faixa 51–53 |
| Duração bucket `script` na janela (ms) | 11,8 / 7,9 / 12,1; mediana 11,8, faixa 7,9–12,1 | 6,5 / 7,4 / 10,2; mediana 7,4, faixa 6,5–10,2 |
| Duração bucket `layout` na janela (ms) | 23,3 / 21,2 / 29,7; mediana 23,3, faixa 21,2–29,7 | 5,2 / 4,5 / 6,2; mediana 5,2, faixa 4,5–6,2 |
| Duração bucket `paint` na janela (ms) | 2,7 / 3,9 / 7,0; mediana 3,9, faixa 2,7–7,0 | 1,6 / 1,8 / 1,5; mediana 1,6, faixa 1,5–1,8 |

**Leitura cuidadosa:** os eventos de frame são contagens, não duração; buckets `X` de trace somam eventos observados e podem incluir sobreposição/nesting/threads, não são CPU total nem tempo de GPU. O contraste na contagem `DrawFrame` e em buckets durante a janela é compatível com diferente atividade observada entre condições, mas não prova economia proporcional, causa em Motion/blur, impacto perceptível, ausência de jank ou benefício de produto. As Long Tasks de carga variam entre runs e não apresentam diferença conclusiva entre condições. Zero Long Tasks vale apenas para as seis janelas curtas observadas, não para qualquer interação ou usuário. Não se mediu INP, FPS de hardware, memória, compositor/GPU por componente nem experiência em dispositivo físico.

## P3 — importação CSV e persistência local

**VERIFICADO, uma amostra funcional cronometrada:** com fixture CSV sintética de 100 oportunidades, Chrome externo preencheu a data, atribuiu o arquivo ao `input[type=file]` via CDP `DOM.setFileInputFiles` (não abriu o seletor nativo), observou a prévia de 100 linhas e clicou “Salvar prévia local”. Instrumentação no evento `complete` de transação IndexedDB registrou **218,9 ms do clique à conclusão da transação**; a prévia ficou pronta **145,8 ms após atribuição do arquivo** (n=1 válido para cada tempo). A leitura posterior encontrou 100 registros e histórico de 1 carga em `central-receita-import-preview`/`drafts`, com referência 2026-10-20. Em outra sequência, recarga da mesma origem e reabertura do Chrome com o mesmo perfil mantiveram o retrato; a rota Forecast sem `demo=1` exibiu a carga. Isso demonstra percurso sintético local funcional, não robustez para produção. O estado textual do primeiro ensaio de latência retornou erro “Uncaught”; por isso não se usa esse ensaio como prova de mensagem de confirmação. Duas seleções repetidas encontraram o botão desabilitado e foram excluídas, sem inventar novas amostras. Um teste separado registrou `click-save` de 17,148 s, mas esse valor inclui espera/polling com timeout e **não é duração medida da gravação**. A medição de 218,9 ms é observação instrumentada em n=1, não estimativa estável nem duração isolada de parsing/hash/render.

### P3 — lote médio de CSV, 5.000 oportunidades

**VERIFICADO, três execuções válidas em fixtures distintas:** Chrome 155.0.8059.85 headless, perfil novo por execução, mesma origem/export sintético, viewport 1440×900, DPR 1. Cada CSV continha 5.000 oportunidades com IDs únicos. As três cargas chegaram ao estado estável “5.000 linhas”, 0 erros e 0 avisos; IndexedDB armazenou 5.000 registros/5.000 IDs únicos e histórico de uma carga. Após reload na mesma origem sem `demo=1`, a UI mostrou a carga e a prévia de 5.000 linhas. Sem erros de console capturados nos runs válidos.

| Etapa observada | Medidas | n válido |
|---|---|---:|
| Arquivo selecionado → prévia estável | 948 / 854 / 956 ms; mediana 948, faixa 854–956 | 3 |
| Clique salvar → evento `complete` IndexedDB | 313 / 324 / 297 ms; mediana 313, faixa 297–324 | 3 |
| Persistência e retomada após reload | 5.000 registros; 5.000 IDs únicos; 3/3 retomaram | 3 |

O tempo arquivo→prévia é ponta a ponta e não separa leitura, hash, Worker, parse, validação, reconciliação ou render. Clique→`complete` mede o intervalo observado até a transação IndexedDB completar, não isoladamente custo interno de escrita. A automação selecionou o CSV sintético pelo input real via CDP, não pelo seletor nativo do sistema operacional. Foram preservadas no manifest, mas excluídas da amostra, duas tentativas inválidas: uma falha do harness/node; outra com clique fora do viewport. Os ensaios de 100 linhas (n=1) e 5.000 (n=3) usaram scripts, fixtures, perfis e instrumentações diferentes; não se devem comparar latências para traçar curva. Não há evidência para alegar curva plana ou ausência de degradação em escala 50×; 50.000 linhas não foram medidas.

**Limites explícitos:** não foram medidos XLSX, 50k linhas, heap/memória, custo por etapa no main thread, dispositivos móveis, persistência compartilhada ou APIs/D1. A Home P1/P2 usa workload sintético derivado e não representa a Home com dados importados. Persistência observada é IndexedDB local, não backend.

## Hipóteses H01–H09 — status após revisão das coletas

| Hipótese | Estado após esta coleta |
|---|---|
| H01 — JavaScript inicial/imports | **Parcialmente medido:** bundle/rede inicial consta em `diagnostico-baseline-2026-10-21.md`; nenhuma causalidade ou ganho de divisão de código demonstrado. |
| H02 — recálculo React | **Não medido:** sem React Profiler nem isolamento de cálculos; trace de carga não atribui custo a componentes React. |
| H03 — SVG/interação da trajetória | **Parcialmente amostrado, sem custo causal:** P2 incluiu rolagens e movimentos de ponteiro, mas não interação focada no gráfico nem latência de interação perceptual; eventos de trace não isolam o SVG. |
| H04 — aurora, blur e pintura | **Não atribuível:** o trace mede buckets agregados de `layout`/`paint`; não isola CSS, camada, filtro ou componente. Nenhum custo causal comprovado. |
| H05 — Motion | **Diferença observada, causa não provada:** contagens `DrawFrame` e buckets de trace variaram entre preferência normal/reduzida nesta janela; isso não identifica Motion como origem, nem mede CPU/GPU ou ganho percebido. |
| H06 — memória/50k registros | **Não medido:** P3 percorreu fixtures sintéticas de 100 e 5.000 linhas; sem heap, GC ou ensaio de 50k. Os dois tamanhos não sustentam curva de escala ou extrapolação. |
| H07 — persistência/reload | **Parcialmente funcional e cronometrado em cenário limitado:** IndexedDB local persistiu/reabriu em amostras sintéticas de 100 e 5.000; para 5.000, clique→transação `complete` foi 297–324 ms (n=3). Não é benchmark isolado do custo de gravação e não valida backend compartilhado. |
| H08 — imagem/fontes/LCP | **Medido em laboratório, limitado:** 5 cold + 5 warm na Home sintética; LCP observado e transferência registrados, sem generalização para campo/dispositivo real e sem comprovar gargalo na imagem. |
| H09 — API/D1 | **Não medido:** nenhuma chamada a backend compartilhado/D1; resultado local não valida runtime hospedado. |

A revisão de hipótese/escopo segue [validação do plano](validacao-plano-2026-10-21.md). A síntese inicial de build/rede está em [diagnóstico baseline](diagnostico-baseline-2026-10-21.md).

## Evidências e reprodutibilidade

Raws/scripts P1 e P3 de 100 linhas permanecem em `.scratch/perf-collect-20261021/`, os seis traces P2 em `.scratch/perf-p2-runs-20261021-2140/` e os runs P3 de 5.000 linhas em `.scratch/perf-p3-medium-20261021-214300/`; traces completos não foram copiados para a documentação nem para o Git. Os manifestos contêm hashes individuais dos artefatos; os seis hashes P2 e os hashes dos três runs P3 médios foram recalculados e conferem. SHA-256 dos artefatos usados:

| Evidência | SHA-256 |
|---|---|
| `baseline-home-cold-warm.json` | `aaf38e8f387ecd1868241e9b7cf53b65044295c870962fb55bf3d6ef524801d4` |
| `baseline.mjs` | `f0f33686a4de704311284031316bebfd61bb52c7d2840362def8629d7605c4eb` |
| `p3-final.json` | `0d59a7d57ccb44902824c4369c3efbad4aac6b8b5181e4d46c2e0147b42f9139` |
| `p3-final.mjs` | `110c1905b21654e63da723b64c07869943f4ac6e57fda6c3e4c373e5121c9f59` |
| `p3-reload-after-reopen.json` | `ec4ffc104e53e4a5bb4466f5520e668a0ff8063847642a6e584cff0900cc2a2d` |
| `p3-after-reopen-text.json` | `f7c1f15cbf19d058cc7bf7f9a2ebe911659d5f42ee1e7bc515fd81f7e1b20f69` |
| `synthetic-opportunities-100.csv` (fixture privada, 100 oportunidades) | `8c4039126d06722206ff2af39dde4df4a0c7a6b1b7b56a774fd23e4e20a23f12` |
| `p3-import.json` (tentativa adicional, não usada para latência final) | `bda77faa20c0f9afe3abad7713c8382598698f240ce540fcd0efe65ffe26267c` |
| `p3-latency.json` | `c2ac856bebe20d6e9e259b406e6cc90d13ec3268d6e8e3533748ecb5fc95b250` |
| `p3-latency.mjs` | `12eb4fb09fd95211d0f1b074efbd0baa26d226e0d5c8a883bcea99aa1b947423` |
| `cdp.mjs` (launcher Chrome/CDP) | `d1607c0bfaf86fbe36ed310514cce2a45d894f48f120cf4d1593db9bb0eeefcc` |
| `p2-6runs.mjs` | `eb9c0045492b137693d0f2d645b75010df67973071913f71ce4532c171998e8e` |
| `manifest-6runs-2026-10-22T01-37-37-967Z.json` | `656f794085a4d924f00d9e356f1d2bbdf299c59f713c47c71ab5c6a2eb72ef7a` |
| `p2-summary-6runs-2026-10-22T01-37-37-967Z.json` | `ec366514e33fb2d548a2eb764103080d7cfdf86a5f2693c8ced952e359df97fc` |
| `p2-reanalysis-anchored-6runs.json` | `7d70d1d5ebd67d0812fececca1612f60e5d6df14fd51737a89742197bd8ac34a` |
| `reanalyze-anchored.mjs` | `fc1420159b2be6e6d44bd88a702adb5ac3cd1358cbe4b7167faf7855f6853a77` |
| `manifest-medium-1792633821359.json` (três runs P3 válidos e dois descartados) | `918d6347a891fa7add937a25985fbccbac541976a78f26de5fbd412ec5d7d78f` |
| `run-a1-79060dde.json` | `dda4ec9a1e2183f04be3ac33e8c0c82b0efa32e57ce55dc3d0a71238e18b2889` |
| `run-b1-a0585b15.json` | `bf5f8047b5f2cbd2cc84fe31576b5ce3c2cfe13bcc002e42bf41ab2e81860ce5` |
| `run-c1-195c431d.json` | `e7e6485ec55261527b9d1885d14bb01366af6aa05ba89a849eabc261a77e51de` |
| `p3-medium.mjs` | `a688a76bfe1d0140607632d7f25773c1d636a832050418a94a7a25fe245ec873` |
| `synthetic-opportunities-5000-a.csv` | `ec2c1d1814cc3fcf97449db128fc63f7d674a103893722f611b915e82c322e37` |
| `synthetic-opportunities-5000-b.csv` | `b7cb7726a449a679896944e308d9c2ae60ecf164aaf4c28995392a07303a1532` |
| `synthetic-opportunities-5000-c.csv` | `1b7c027a659f96960ad58b6607434e2093cdbdc7c7e2a9f1684976fe863bb846` |

## Próximo passo proporcional — P4, sem otimização

1. **Não repetir P2 agora:** seis corridas válidas, hash/âncoras revisados por GLM; sem gargalo causal ou diferença conclusiva de Long Tasks. Se houver nova pergunta de produto, definir antes o usuário, cenário e alvo de qualidade para orientar a coleta.
2. **H08 não comprovou gargalo:** a imagem de fundo foi o elemento LCP observado e transferiu cerca de 403,5 kB, mas não há evidência de que seja problema percebido ou causa de degradação. Não priorizar mudança de imagem; revisitar apenas se surgir meta de experiência ou reclamação concreta, com comparação pareada.
3. **Não ampliar P3 sem novo sinal:** os ensaios sintéticos de 100 e 5.000 linhas confirmam o percurso local observado, mas não medem XLSX, heap, 50k ou custo por etapa. Só diante de uma queixa concreta separar leitura, hash, parsing, reconciliação, prévia, gravação e reabertura; qualquer escala adicional deve ter justificativa própria.
4. **Não otimizar nesta etapa:** sem code splitting, virtualização, cache, remoção de Motion/filtros ou outras mudanças. Qualquer hipótese futura exige evidência causal, autorização específica e comparação pareada com teste funcional e análise de regressões.
