# Handoff — Central de Receita

## Estado atual — 21/11/2026: main reconciliada

- `main` reconciliada com `local/cloudflare-a19b386` (merge sem reescrever história; conflito só neste arquivo, resolvido mantendo as duas trilhas abaixo).
- **DECISÃO DO BRUNO, 21/11 (issue #46, opção 1):** autorizado o push da main reconciliada, com a condição de que os valores de planejamento 2027 fossem trocados por fictícios. Feito em `src/features/comercial-v3/org-2027.ts`: MRR, participação e grupos por vertical e por território são inventados (total R$ 52 mi; a matriz por vertical continua com resíduo, agora de R$ 150 mil). Os valores reais não voltam ao git.
- Continuam no repositório, fora do escopo desta troca: nomes/cargos do organograma e as 16 fotos em `public/pessoas/`; o histórico da branch `local/cloudflare-a19b386` ainda contém os valores reais (já públicos desde 10/11) — removê-los exigiria reescrever história.
- PRs #49, #50, #51 foram abertas sobre a main antiga e precisam de rebase/merge da nova main. PR #19 e #36 seguem como estavam.

## Auditoria de 10/11/2026 (branch `local/cloudflare-a19b386`)

- **Base a preservar:** Cloudflare, branch local `local/cloudflare-a19b386`, HEAD `f9fbff04a8a2903741521a37ebe0431c02c7ce55`, referência `a19b386`. As branches/heads nas seções antigas abaixo são históricas.
- **PRECISA AJUSTES:** exposição pública confirmada de conteúdo de planejamento no JavaScript da homologação, apesar da classificação de pacote sintético. Fotos possuem autorização histórica específica; autorização dos valores de planejamento não comprovada nesta auditoria. Portaria local não é autenticação.
- Relatório operacional completo: [auditoria de segurança, coerência e completude](docs/reviews/2026-11-10-auditoria-seguranca-coerencia.md). Ele corrige a conclusão ampla do retorno anterior; leia antes de prosseguir.
- Validação atual: 353/353 testes, tipos e build visual PASS; 118 arquivos com hashes conferidos. Checker estático falha nas regras padrão; scanner interno mantém alertas de contraste. Não é prontidão de produção.
- Bug reproduzido: trocar Mês por Trimestre dentro da filial perde território e volta ao CSO, ainda mostrando outubro. Proposta M1 não cobre total CSO; M2 tem risco de modelagem além da ausência na fonte; reconciliação do relatório anterior usa cenário errado.
- M1 **não implementado**: aguarda Q1/Q2/Q3 do Bruno. Nenhum push, merge, deploy, migração ou envio ao Planejador nesta auditoria. Nenhum código de aplicação alterado.
- **DECISÃO DO USUÁRIO, 10/11 às 17:57:** manter a Cloudflare publicada como está por enquanto e seguir com a revisão Impeccable. Isso não é certificação de segurança nem autorização de novo deploy. A contenção deixa de bloquear esta revisão local.
- **Impeccable 4.8.2 aplicado** (audit + critique, sem hooks/init/live/overlay): placar **12/20** e Nielsen **25/40**. Relatório: [Impeccable](docs/reviews/2026-11-10-impeccable.md). Detector estático: 2 `side-tab`; renderizado: 12 warnings + 2 advisories, todos na portaria. Lighthouse mobile: a11y 93, falhas em `color-contrast` (2,35:1) e `target-size` (20×20 px).
- Achados P1 de confiança no número: "Previsto" nomeia 14.000 no cartão e 7.500 na curva; cartão "Previsto" tem nota "Meta de outubro"; rosca mostra 46% mas inclui "Perdido" nas fatias; barra mobile esconde 6 destinos. Nada corrigido — o pedido era aplicar a revisão.
- Próximo: `clarify` nos rótulos/denominador, `adapt` na navegação mobile e tooltip, depois re-medir. M1/M2 seguem seus gates. Restrição de acesso ou republicação exigem autorização textual. Não executar `npm run build`/Sites como substituto do build visual.
- Vault e `.agents/memory/` não atualizados: nenhum pedido explícito de escrita no Vault; diretório de memória ausente, sem criação de estrutura preventiva.

### O que NÃO funcionou

- `scan` inicial examinou só a portaria, não as telas internas: repetido com pouso verificado. Onze alertas de imagens sumiram após aguardar carregamento e repetir; não são falhas persistentes confirmadas.
- Escrita de relatório pelo MCP: `Access denied ... is not within any of the configured workspace roots`; evidências locais gravadas pelas ferramentas permitidas, sem escalada.
- Mensagem a identificador de subagente: `active teammate ... not found`; não presumir entrega. Retornos originais foram recebidos e conferidos pelo Lead.

## Histórico de 29/10/2026 (main) — não usar como estado atual

Territórios está no ar na homologação: `?view=territorios&period=month&from=home` em https://central-receita-visual.brunolimaff.workers.dev. Branch `fix/regional-mapa-calor` @ `a19b386`, mesclada em `claude/gifted-mccarthy-odjru5`; deploy `success` nesse SHA. PR #22 MERGED.
Navegação em três níveis por **cartões** (padrão da Carteira, não pílula): CSO mostra os 5 territórios com Base/meta/farol, território mostra as filiais com foto dos executivos.
Gates: 353 testes PASS, typecheck e build PASS. Aceite visual de Bruno NAO VALIDADO.
Pendente (parecer): M1 — filial sem meta infla o percentual do território (medido 75%→106%); M2 — "integrado no ERP" sem campo na carga.
Vault: `Bruno Vault/Sessões/2026-10/2026-10-29T11-38-52-central-receita-territorios-cartoes-fotos-deploy.md`.
Parecer e QA: `docs/regional/PARECER-TERRITORIOS-2026-10-28.md`, `docs/regional/QA-TERRITORIOS-2026-10-29.md`.

## Histórico preservado — não usar como estado atual

## Estado em 27/10/2026 — esta worktree

Narrativa completa no Vault: `Bruno Vault/Sessões/2026-10/2026-10-27T14-30-00-central-receita-fotos-organograma-tipografia.md`.

Branch `claude/gifted-mccarthy-odjru5`, que é a que publica a homologação. Quatro commits nesta data (o último só documentação): `1ed4bac` (tipografia da assinatura na sidebar volta a caixa normal, 11px, peso 500), `9fc8789` e `816f8ef` (foto no avatar de cinco executivos, como camada de fundo sobre as iniciais).

- Fotos em `public/pessoas/<slug>.jpg`, 320x320, ~16 KB cada. Slug vem de `slugPessoa()` em `org-2027.ts`. Quem não tem arquivo mostra as iniciais — não existe lista de fotos em código.
- Publicados: Hermínio Gastaldi, Giovanne Farias, Fernando Silva, Alexandre Mancini, Marcos Paulo Malagola. Bruno decidiu parar nos cinco.
- **A busca da hierarquia responde "Não autorizado. Usuário não autorizado."** para o usuário do Bruno (`searchHierarchyItem` 401). As 23 pessoas restantes do organograma não são alcançáveis por ali; é bloqueio de permissão.
- Gates: 264 testes, typecheck e build visual PASS. Deploys `40511916157`, `40515996627`, `40517850570` success.
- Relatório para o planejador: `docs/planner/2026-10-27-relatorio-planejador.md`.
- PR 19 segue OPEN/draft em `5dedd87`, intocada por esta sessão.

## Histórico — 26/10/2026

Modo compact-pr. Bruno encerrou para retomar em outro local.

## Comece por aqui

- Homologação online: https://central-receita-visual.brunolimaff.workers.dev
- Abra essa URL; não precisa iniciar Next.js local para testar visualmente.
- Exposição pública explicitamente autorizada por Bruno, sem Access, API, D1 ou dados reais.
- Worker `central-receita-visual`, conta `Brunolimaff@gmail.com's Account`, versão `dfb0d215-3c61-42b9-b536-a579e133581b`.
- PR [brunolimaff-jpg/central-receita#19](https://github.com/brunolimaff-jpg/central-receita/pull/19): OPEN, draft, head `36b81e3`, 10 commits, sem merge. Checks: build-deploy SUCCESS e GitGuardian SUCCESS.
- Branch desta worktree: `fix/p3-forecast-e-importacao`. Não usar a pasta principal main para implementar este delta.

## Atenção ao trocar de local

O delta da homologação e o CI foram commitados e enviados à branch `fix/p3-forecast-e-importacao` em 26/10; um clone remoto os recebe com checkout dessa branch. O build remoto roda no GitHub Actions (`.github/workflows/homologacao-visual.yml`, secret `CLOUDFLARE_API_TOKEN`); a API de Workers Builds da Cloudflare recusa configuração (`8000008`) apesar do Git conectado. As evidências em `.scratch/p3-20261023/` (550 MB) não são versionadas e continuam apenas nesta máquina — não apagar `.scratch/` nem usar clean/reset. O merge da PR segue decisão do Bruno.

## Alterações locais

- Build separado `npm run build:visual`; flag `NEXT_PUBLIC_VISUAL_PREVIEW=1`, fonte comercial substituída por `visual-branches.json` via alias Webpack.
- Home usa `visual-import.json` das fixtures sintéticas, sem IndexedDB/API. Upload e gravação recusados no modo visual.
- Identificação de homologação, visitante neutro, rótulos e unidades fictícias corretos.
- `wrangler.visual.jsonc` foi criado após Bruno pedir Wrangler. Sem entrypoint backend ou bindings, workers.dev ativo, preview_urls false.
- Pacote publicado: `dist/visual/2026-10-26T14-35-34-624Z/assets` (92 arquivos com SHA-256). A configuração aponta para esse timestamp; não substituir por out de outro modo.
- Arquivos de código alterados: next.config.ts, package.json, commercial-v3-app.tsx, manual-import-client.ts, branch-rail.tsx, commercial-sidebar.tsx, executive-page.tsx, import-screen.tsx.
- Novos scripts build-visual.mjs/serve-visual.mjs e teste visual-preview.test.mjs; documentos Cloudflare em docs/; launch.json local.
- `next-env.d.ts` foi ajustado automaticamente pelo build. `.scratch/p3-20261023/` era preexistente e está preservado.
- real-branches.json, backend/worker.js e scripts/build-sites.mjs originais sem diff.

## Evidências

- PASS final: 255/255 testes, typecheck, build visual 3/3, verificador de pacote e Wrangler dry-run.
- Uma falha intermediária 254/255 foi resolvida antes do build publicado. Ver relatório.
- Local: nove visões renderizaram; amostra responsiva em 375px sem overflow em Jornada.
- Hospedado: Home HTTP 200, dados fictícios, Configurações sem upload, Jornada com superfície nos painéis; nenhum erro de console ou chamada API observado. GET/PUT /api/imports/current retornaram 404.
- GitHub retornou apenas GitGuardian SUCCESS; não atribuir os 255 testes ao CI ou ao commit 546eb20.
- Nenhum servidor local desta sessão ficou ativo; preview estático e login pendente cf encerrados. Sessão legítima Wrangler preservada.

## Pendências

- Aceite visual de Bruno: NAO VALIDADO. Merge é decisão separada, não executar.
- Build remoto ativo no GitHub Actions (Central `f2e77b5a`, Atlas `eb0840be` publicados nos runs `40407352712` e `40407230755`); Workers Builds via dashboard/API segue bloqueado (`8000008`). Aceite visual e merge seguem com Bruno.
- Operação real, identidade, retenção, D1 e concorrência shared hospedada: NAO VALIDADO, fora desta demonstração. Não expor o Worker Sites diretamente.
- Planner GPT Web recebeu checkpoint inicial, mas não o relatório final da publicação. Não alegar que está atualizado até enviar e confirmar.

## Referências

- Relatório: `docs/cloudflare-publicacao-visual.md`; validação: `docs/cloudflare-homologacao-resultado.md`.
- Narrativa canônica: `C:/Users/bruno.ferreira/OneDrive - Senior Sistemas SA/Documentos/Bruno Vault/Sessões/2026-10/2026-10-26T11-13-59-central-receita-cloudflare-visual-publicada.md`.
- Skills de retomada: cloudflare:wrangler e doc-handoff; sem reinstalar dependências do projeto para servir os assets.


## Histórico de 26/10 — não usar como estado atual

Homologação visual pública: https://central-receita-visual.brunolimaff.workers.dev — dados fictícios, sem API/D1/Access, publicação expressamente autorizada. Nenhum servidor local é necessário para testar.
PR 19 continua OPEN/draft, head `36b81e3` (10 commits; checks verdes) — delta + CI pushados em 26/10 na branch `fix/p3-forecast-e-importacao` (fonte na worktree `.claude/worktrees/p3-forecast-import`), sem merge. Build remoto de homologação roda no GitHub Actions; versões publicadas: Central `f2e77b5a`, Atlas `eb0840be`. Não confundir deploy com fonte no GitHub.
Gates locais finais: 255 testes PASS, tipos e build PASS. Home/Configurações/Jornada verificadas hospedadas; aceite visual de Bruno NAO VALIDADO.
Handoff operacional completo: `.claude/worktrees/p3-forecast-import/HANDOFF_AI.md`; relatório: `docs/cloudflare-publicacao-visual.md` dentro dessa worktree.
Vault: `C:/Users/bruno.ferreira/OneDrive - Senior Sistemas SA/Documentos/Bruno Vault/Sessões/2026-10/2026-10-26T11-13-59-central-receita-cloudflare-visual-publicada.md`.
Preservar evidências locais (`.scratch/p3-20261023/`, 550 MB, não versionadas). Para retomar em outro computador: `git fetch` + `checkout fix/p3-forecast-e-importacao` recebe o delta e o CI. Os workflows exigem o secret `CLOUDFLARE_API_TOKEN` (configurado nos dois repos). Merge segue decisão do Bruno.

## Histórico de 23/10 — não usar como estado atual

Atualizado: 2026-10-23 18:24. Baseline `main` em `971a2cd`. **PR #19 em Draft, head `546eb20`, 6 commits, sem merge, sem deploy.**

## Retomada (emergency — comece por aqui)

1. `cd central-receita-sites/.claude/worktrees/p3-forecast-import` (worktree isolada da PR).
2. `npm run dev` → http://localhost:3011.
3. Fazer o **aceite visual** das telas que ficou NAO VALIDADO: home, Forecast Semana/Mês, New Name, Configurações, Sistema, Jornada, Contas, Cross.
4. Passando o aceite: marcar a PR como **Ready for review** e pedir a decisão de **merge ao Bruno** (o merge é dele).
5. Retomar o planner "Rev" no ChatGPT com o estado do `546eb20` — ele parou no `a1e39aa`.

Gates no head: **253/253 testes**, typecheck limpo, build estático 3/3.

## O que a PR #19 entrega

- P3-a/P3-b da issue #18: rodapé do Forecast segue a janela Semana/Mês; "O que já está carregado" só mostra o estado persistido.
- Três estados de carga (carregando / falha / vazio), com prazo de 15s por consulta (identificado por epoch) e mensagem própria no modo local.
- Jornada, Sistema de Receita, Contas e Cross liberadas como versão preliminar: faixa no topo, ponto âmbar na sidebar e nome acessível no link.
- Sistema de Receita etiqueta a origem dos números (snapshot demonstrativo × agregado real de setembro).
- Sidebar recolhida sem vazamento; `.revenue-panel` com superfície de vidro padrão.

## Pendências

- Aceite visual das telas (NAO VALIDADO).
- Planner ChatGPT sem o relatório do `546eb20`.
- Prova de concorrência em modo shared (Worker/D1) fica para o ciclo do modo compartilhado.
- Ativação corporativa: identidade Sites, allowlists reais, D1 real, retenção — decisões humanas.

## Referências

- Sessão curada: `C:/Users/bruno.ferreira/OneDrive - Senior Sistemas SA/Documentos/Bruno Vault/Sessões/2026-10/2026-10-23T18-23-59-central-receita-pr19-interface-e-handoff.md`
- Lição: `Projetos/Central de Receita/Lições/interface/2026-10-23-tailwind-vence-css-do-estado.md`
- Capturas: `.scratch/p3-20261023/capturas/`
- Evidência da concorrência: `.scratch/p3-20261023/concorrencia-evidencia.md`
