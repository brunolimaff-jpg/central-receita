# Plano da suíte de testes de performance

**Data:** 2026-10-28 · **Branch:** `claude/gifted-mccarthy-odjru5` · **HEAD:** `e3f0a4c`
**Estado:** projeto desenhado e instrumento validado. Nenhum arquivo de suíte criado, nenhuma otimização feita, nada commitado.

Este documento substitui o plano P0–P5 de 21/10 como referência de execução. Aquele foi validado adversarialmente mas nunca executado além de um piloto; este aproveita as mesmas lições metodológicas e acrescenta medições feitas hoje.

---

## 0. O que foi medido nesta sessão (antes de escrever qualquer teste)

Tudo abaixo saiu do mesmo pacote que está no ar (`dist/visual/2026-10-28T14-02-24-989Z`), servido por `serve-visual.mjs` em `127.0.0.1:3013`, medido por Chrome 156 headless via CDP cru. Os scripts de sondagem eram temporários e foram apagados — não são parte da suíte.

### 0.1 Peso do pacote — VERIFICADO

| Item | Medido |
|---|---:|
| JS carregado na rota | 907.296 B |
| CSS | 208.269 B |
| Fontes WOFF2 (4 pesos) | 134.588 B |
| Imagens | 668.487 B |
| Requisições até o load | 61 |
| Total transferido (sem compressão) | 2.175.363 B |

O maior arquivo é `revenue/senior-hq.jpeg` com **394 KB** — 18% de tudo que a página carrega, e é o elemento de LCP.

### 0.2 Carga de página — VERIFICADO, 12 amostras

Quatro views × 3 repetições, cache desabilitado, viewport 1440×900, DPR 1.

| Métrica | Resultado |
|---|---|
| LCP | 832–1344 ms (mediana ≈ 960 ms) |
| TTFB / DCL / load | 4–8 ms / 47–138 ms / 355–1024 ms |
| Elemento de LCP | sempre `DIV.revenue-bg-faixa` (a foto de fundo) |
| **CLS** | **0,1302–0,1307 em todas as amostras** |
| Long tasks na carga | 5–6 por execução, máx 114–235 ms |

### 0.3 CLS de 0,13 — a regressão mais concreta encontrada

O baseline de 21/10 registrou CLS **0**. Hoje toda carga tem **0,13**, que é 2,6× acima do limite "bom" do Core Web Vitals (0,1). Duas origens, ambas identificadas por `PerformanceObserver` com os retângulos antes/depois:

1. **t≈687 ms, peso 0,118** — o bloco `.grid` de cima sai de `y=315, h=248` para `y=155, h=670`: um painel grande aparece acima e empurra o resto da página para baixo.
2. **t≈950 ms, peso 0,012** — os grids de cartões de métrica descem ~52 px quando o primeiro bloco termina de crescer.

A causa é estrutural: em `commercial-v3-app.tsx:117`, a home no pacote visual é `executiveView`, que renderiza `ExecutivePage` com `carregando = importLoading && !importDraft`. Enquanto a leitura assíncrona da carga não resolve, aparece a seção "Carregando a última carga…" (uma linha); quando resolve, ela é substituída pelo conteúdo real — muito mais alto. Nada reserva esse espaço. **Existe placeholder, mas ele não tem a altura do conteúdo que vai substituí-lo.**

### 0.4 Navegação entre views — VERIFICADO, e o número é o custo de pintura

Clique em link da sidebar trocando de view, medido de três formas independentes:

| Medida | Resultado |
|---|---|
| `click → 2 frames` | 154–242 ms |
| `ScriptDuration` (CDP) | 10–66 ms |
| `LayoutDuration` / `RecalcStyleDuration` | 6–18 ms / 8–26 ms |
| Perfil de CPU (2,6 s de janela) | 2,38 s **idle**; maior função ativa = 38 ms |
| Trace: Paint | 28 ms (31 eventos) |
| Trace: Raster | 127 ms |

**Conclusão:** o JavaScript responde em dezenas de milissegundos, mas o frame seguinte demora 150–240 ms. O custo está em rasterização e pintura, não em cálculo. Com `backdrop-filter`, `filter` e animações desligados por CSS injetado, o total do trace caiu de 2.464 ms para 1.292 ms e o `Layerize` subiu de 7 para 30 ms — assinatura de que as camadas de vidro e a aurora desfazem e refazem durante a troca.

**Ressalva importante:** as primeiras medições deram 248–624 ms porque eu estava clicando nas âncoras `#forecast`, `#diretorias` da home — que rolam a página, não trocam de view. Corrigido, os números acima são os de navegação real. Está registrado porque o erro é fácil de repetir: **na home, os itens da sidebar são âncoras; a troca de view usa os outros itens.**

### 0.5 Carga de importação — VERIFICADO, camada de dados isolada

CSV sintético no esquema real (`Oportunidade ID, Conta ID, …`), `parseImportCsv` → `normalizeImport` → `reconcileImports` → `groupForecastDates`, em Node 24 com type-stripping (o mesmo mecanismo do `npm test`):

| Linhas | Arquivo | Parse | Normalizar | SHA-256 | Agrupar | Heap no normalizar |
|---:|---:|---:|---:|---:|---:|---:|
| 1.000 | 0,07 MB | 3 ms | 21 ms | 1 ms | 1 ms | 1,4 MB |
| 5.000 | 0,38 MB | 15 ms | 60 ms | 0 ms | 4 ms | 2,8 MB |
| 10.000 | 0,76 MB | 21 ms | 122 ms | 1 ms | 14 ms | 17,5 MB |
| 50.000 | 3,82 MB | 133 ms | 516 ms | 4 ms | 44 ms | **81,9 MB** |

O limite de 50.000 linhas existe no código (`manual-import-csv.ts:93`). No teto, a pipeline inteira custa **697 ms** e **82 MB de heap**. Isso está dentro do aceitável para um Worker, mas 82 MB no teto é o número que precisa de teto explícito no teste — hoje nada impede que ele dobre sem ninguém notar.

**O que nesta tabela é INFERÊNCIA:** o Worker roda no navegador, não no Node, e `normalizeImport` roda no cliente depois do parse. O número aqui mede a lógica, não a experiência. A UI poderá travar mesmo com esses tempos, porque a normalização de 516 ms acontece na thread principal.

---

## 1. Três camadas, e só uma vira gate

| Camada | O que mede | Confiabilidade | Papel |
|---|---|---|---|
| **A — Orçamento de peso** | Bytes e contagem de arquivos do pacote estático; gzip calculado em teste | **Alta** — determinística, sem relógio | **Gate de CI** |
| **B — Laboratório em navegador** | LCP, CLS, long tasks, requisições, tempo de pintura na troca de view | **Média** — depende de máquina, cache, versão do Chrome | **Alerta local, nunca gate** |
| **C — Carga de importação** | Tempo e heap de parse/normalização por faixa de linhas | **Alta para a lógica**, não prova UI livre | **Alerta local com teto bruto** |

**Fora da suíte, com motivo declarado:**

- **INP e P75 de campo** — não existe sem RUM. O histórico já fixou que cinco amostras de laboratório não são Core Web Vitals de campo. O proxy de interação que dá para medir (evento → próximo frame) será rotulado `interactionProxyMs`, nunca "INP".
- **Lighthouse score** — exigiria dependência nova e produz um número composto que não mapeia em regressão acionável. Os mesmos sinais saem do CDP cru.
- **Memória de GPU, FPS, aparelho físico** — limitação aceita, como já registrado em 21/10.
- **D1 e API compartilhada** — fora do pacote estático, exige runtime e credencial. `NÃO VERIFICADO`.

---

## 2. Arquitetura

```
tests/perf/
  budgets.mjs           tetos nomeados, cada um com o medido ao lado no comentário
  baseline.json         números aceitos + fingerprint de ambiente (versionado)
  fixtures.mjs          gerador determinístico de CSV sintético, seed fixa
  budget.test.mjs       camada A — node:test
  import-load.test.mjs  camada C — node:test
scripts/perf/
  cdp.mjs               cliente CDP mínimo sobre WebSocket nativo
  chrome.mjs            descoberta do binário, launch headless, perfil temporário
  server.mjs            sobe e derruba serve-visual.mjs
  collect.mjs           orquestra amostras, escreve relatório
  compare.mjs           regra de decisão (canário, mediana, veredito)
  scenarios.mjs         matriz de cenários
dist/perf/<timestamp>/report.json   gitignored
```

`npm test` usa o glob `tests/*.test.mjs`, que não é recursivo — `tests/perf/` não é capturado. Os 264 testes atuais seguem intocados.

Scripts novos, nenhum existente alterado:

```json
"perf:budget":  "node --experimental-strip-types --test tests/perf/budget.test.mjs",
"perf:import":  "node --expose-gc --experimental-strip-types --test tests/perf/import-load.test.mjs",
"perf:browser": "node --experimental-strip-types scripts/perf/collect.mjs",
"perf":         "npm run perf:budget && npm run perf:import"
```

**Alvo é sempre o `build:visual`, nunca o `out/`.** `build:static` puro embute `real-branches.json`, a fonte comercial. Só `build:visual` troca por `visual-branches.json` e valida o pacote. A camada A exige o `manifest.json` com `purpose: homologacao-visual`, `data: synthetic`, `api: false`, `d1: false` — o gate de peso é também gate de privacidade, verificável em vez de combinado.

---

## 3. Instrumento: CDP cru, sem dependência nova

**Recomendação: falar CDP direto sobre o `WebSocket` nativo do Node 24. Zero dependência.**

Já validei a rota na prática, não no papel:

- `typeof WebSocket === 'function'` no Node v24.22.0 — VERIFICADO.
- Chrome 156.0.8078.48 em `C:\Program Files\Google\Chrome\Application\chrome.exe`, `--headless=new --remote-debugging-port=9333` responde `/json/version` — VERIFICADO.
- `PerformanceObserver` de LCP, CLS, long task e event timing via `Page.addScriptToEvaluateOnNewDocument` — VERIFICADO, produziu todas as tabelas da seção 0.
- `Performance.getMetrics` (`TaskDuration`, `ScriptDuration`, `LayoutDuration`, `RecalcStyleDuration`, `JSHeapUsedSize`) — VERIFICADO.
- `Tracing.start` com `devtools.timeline` para separar Paint/Raster/Layout — VERIFICADO.
- `Input.dispatchMouseEvent` e clique programático com `requestAnimationFrame` para medir resposta a interação — VERIFICADO.

`puppeteer-core` economizaria talvez meio dia de escrita, uma vez, ao custo de uma dependência a mais num repo com cinco de runtime, e de superfície de atualização quando o Chrome mudar de protocolo. **Gatilho de reversão declarado:** se a fase B consumir mais de uma sessão só em detalhe de protocolo, adotar `puppeteer-core` com versão exata pinada e registrar o motivo.

---

## 4. Tetos, derivados do que foi medido hoje

### Camada A — gate duro

| Métrica | Medido | Teto | Folga |
|---|---:|---:|---|
| JS inicial | 907.296 B | 950.000 B | +4,7% |
| JS inicial gzip-9 | — (calcular no teste) | 285.000 B | — |
| Maior chunk JS | 279.118 B | 300.000 B | +7% |
| CSS | 208.269 B | 220.000 B | +5,6% |
| Fontes | 134.588 B / 4 arquivos | 140.000 B / 4 | +4% |
| Imagem de hero | 403.205 B | 430.000 B | +6,6% |
| Requisições | 61 | 65 | — |
| CLS | 0,13 | — | ver abaixo |

A folga cobre re-hash e reordenação de chunks do webpack, que mudam bytes sem mudar conteúdo. Um crescimento real estoura e força decisão consciente. Mudar um teto é editar `budgets.mjs` no mesmo PR que justifica o aumento — o diff é a aprovação.

### Camada B — alerta, nunca gate

| Métrica | Faixa de alerta |
|---|---|
| LCP mediana (cold, 7 amostras) | ≤ 2.000 ms **e** ≤ baseline × 1,15 (+ piso de 50 ms) |
| CLS mediana | **≤ 0,10** — hoje está em 0,13 e reprova |
| Long tasks na carga | ≤ 8 tarefas e ≤ 1.000 ms somados |
| Navegação entre views (`click → 2 frames`) | ≤ 250 ms mediana |
| Soma de pintura na troca de view | ≤ baseline × 1,15 |

### Camada C — alerta com teto bruto

| Faixa | Teto de tempo | Teto de heap |
|---|---:|---:|
| 10.000 linhas | 1.500 ms | 40 MB |
| 50.000 linhas | 4.000 ms | **120 MB** |

O teto duro de 45 s (o timeout de produto) fica como Última linha. O teto de heap de 82 MB medido é o que dá margem para o dobro sem falhar.

**DECISÃO DO USUÁRIO** — três escolhas que são de negócio, não de engenharia:

1. **O CLS de 0,13 é o alvo prioritário?** Ele reprova o critério "bom" do Core Web Vitals e foi regressão desde 21/10. Corrigir exige reservar espaço para o conteúdo que chega, o que mexe no layout da home.
2. **O hero de 394 KB fica?** É o maior arquivo e o elemento de LCP. Trocar por WebP ou reduzir dimensão corta o LCP, mas muda a imagem que você aprovou.
3. **O `perf:budget` vira required check no PR?** A suíte funciona como alerta sem isso.

---

## 5. Cenários

| # | Cenário | URL | N | Condição |
|---|---|---|---:|---|
| S1 | Home (representa também forecast, new-name, opportunities) | `/?view=home` | 7 | cold |
| S2 | Home warm | idem | 5 | warm |
| S3–S6 | Jornada, Configurações, Contas, Filial | `?view=journey`, `config`, `accounts`, `branch` | 3 cada | cold |
| S7 | Home com movimento reduzido | `Emulation.setEmulatedMedia` | 3 | fase 4 |
| Canário | `404.html` | — | 3 | primeiro de cada corrida |

**Home representa quatro views porque são a mesma página.** Em `commercial-v3-app.tsx:117`, `executiveView` é verdadeiro para `home`, `forecast`, `new-name` e `opportunities` no pacote visual — medir as quatro seria medir a mesma árvore quatro vezes. As views realmente distintas são `journey`, `system`, `accounts`, `cross`, `branch`, `opportunity`, `agent`, `config`.

**Cold verificado, não presumido.** O piloto de 21/10 falhou aqui: aba nova continuava com cache. A técnica: perfil novo em `os.tmpdir()` por execução, `Network.clearBrowserCache`, `setCacheDisabled(true)`, e uma **asserção** — toda resposta com `encodedBodySize > 0` precisa ter `transferSize > 0` e `fromDiskCache === false`. Se a asserção falhar, a amostra é INCONCLUSIVO e a corrida aborta. A suíte nunca publica uma amostra "cold" que não seja cold.

**N = 7 porque** o histórico mostra LCP cold variando de 508 a 2.664 ms (5,2×). Com 7 amostras a mediana resiste a 3 outliers. Não alegamos percentil — alegamos "mediana desta corrida".

**Canário** é `404.html`, uma página que o app não controla. Se ela também ficar lenta, o problema é a máquina, não o código.

---

## 6. Regressão vs. ruído

A regra, em ordem, em `compare.mjs`:

1. **Canário dobrou** em relação ao baseline ⇒ corrida INCONCLUSIVO (antivírus, indexação do Windows, outro Chrome aberto, OneDrive sincronizando). INCONCLUSIVO não é PASS e não altera baseline.
2. **Fingerprint divergiu** (SO, major do Chrome, Node, viewport, DPR) ⇒ INCONCLUSIVO com instrução de recoletar baseline nesta máquina.
3. **Alerta ou falha** só quando as três condições valem juntas: mediana acima do teto **e** pelo menos ⌈N/2⌉+1 amostras acima **e** mediana > baseline × 1,15 e > baseline + 50 ms. O piso de 50 ms evita alarme em valores pequenos, onde 15% é ruído.
4. **Melhora** de mais de 15% é reportada como "melhorou" mas **não** atualiza baseline sozinha — evita catraca para baixo que gera falso alarme depois.

Camada B sai com `exit 0` por padrão; `--strict` existe para quem chamou manualmente. Um gate duro sobre métrica ruidosa ensina o time a ignorar o teste.

---

## 7. CI

| Camada | Roda no CI? | Motivo |
|---|---|---|
| A — peso | **Sim, gate** | Determinística; runner lento não muda contagem de bytes |
| C — importação | Não por padrão | CPU compartilhada de runner vira loteria |
| B — navegador | **Nunca** | LCP em runner do GitHub é erraticamente lento |

Workflow novo `.github/workflows/performance.yml`, separado de `homologacao-visual.yml`: checkout → `npm ci` → `npm run build:visual` → `npm run perf:budget` → artefato. O `build:visual` já produz o manifest que a camada A consome e já valida privacidade.

Se quiser sinal remoto das camadas B/C sem bloquear nada, um job noturno com `continue-on-error: true` que sobe o JSON. Fica a seu critério.

---

## 8. Fases

| Fase | Entrega | Pronto quando | Esforço |
|---|---|---|---|
| **F1 — Orçamento de peso** | `budgets.mjs`, `budget.test.mjs`, `baseline.json`, script `perf:budget` | `npm run build:visual && npm run perf:budget` sai 0 na HEAD; teste com manifest inflado falha; `npm test` continua 264/264 | 2–3 h |
| **F2 — Importação com carga** | `fixtures.mjs`, `import-load.test.mjs`, script `perf:import` | 1k/5k/50k medidos; baseline gravado a partir da primeira medição | 3–4 h |
| **F3 — Navegador, cenário de referência** | `scripts/perf/*`, S1 cold N=7, S2 warm N=5, canário | Relatório sai com asserção de coldness passando; corrida contaminada dá INCONCLUSIVO | 6–8 h |
| **F4 — Cenários secundários + regra exercitada** | S3–S7, proxy de interação | Regressão sintética de +30% dispara ALERTA | 4 h |
| **F5 — CI** | `performance.yml` | Job verde em PR trivial; PR que estoura chunk de 300 KB falha | 1 h |

A F1 é pequena, não tem relógio e já entrega o único gate que o CI vai usar. Se as fases pararem depois dela, o valor já está no repo.

---

## 9. Riscos e como cada um é neutralizado

| Risco | Tratamento |
|---|---|
| Cache contaminado | Perfil temporário por execução + asserção de `transferSize > 0`. Falha ⇒ INCONCLUSIVO |
| `serve-visual.mjs` lê `latest.json` uma vez no startup | O runner sobe o servidor depois do build e o derruba ao fim; nunca reaproveita |
| Porta 3013 ocupada por `preview:visual` | Preflight `fetch`; se responder, aborta com instrução |
| `serve-visual` não comprime | LCP local é limite superior frente ao Cloudflare. Comparação é sempre local vs local; o comprimido é calculado na camada A |
| Outra sessão reescreve `latest.json` no meio | Hash do manifest conferido no início e no fim da corrida |
| OneDrive no caminho | Afeta build, não a leitura do pacote pronto. Tempo de build nunca entra em relatório |
| Antivírus e indexação do Windows | O canário detecta; a resposta é INCONCLUSIVO, nunca alarme de regressão |
| Browser MCP do agente | Só diagnóstico manual, nunca fonte da suíte — foi a não conformidade do piloto de 21/10 |
| Chrome auto-atualiza | Fingerprint com major; divergência ⇒ INCONCLUSIVO |
| `dist/` ausente | Exit 2 com instrução de rodar `build:visual` |

---

## 10. O que este plano NÃO conclui

Nenhuma das medições acima é Core Web Vitals de campo. "Passou no orçamento" não é "pronto para produção". Laboratório é diagnóstico: aponta onde olhar, não quanto o cliente sente.

E, pela ordem de preferência que vale neste projeto: primeiro medir, depois decidir se vale otimizar. Os três achados desta sessão — CLS 0,13, hero de 394 KB e 150–240 ms de pintura na troca de view — são evidência. Se e quando vão virar trabalho de otimização é decisão sua, e cada um pede uma alteração separada com reteste pareado.
