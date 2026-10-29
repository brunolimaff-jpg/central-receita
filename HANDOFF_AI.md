# Handoff — Central de Receita

## Estado atual — 29/10/2026

Territórios está no ar na homologação: `?view=territorios&period=month&from=home` em https://central-receita-visual.brunolimaff.workers.dev. Branch `fix/regional-mapa-calor` @ `a19b386`, mesclada em `claude/gifted-mccarthy-odjru5`; deploy `success` nesse SHA. PR #22 MERGED.
Navegação em três níveis por **cartões** (padrão da Carteira, não pílula): CSO mostra os 5 territórios com Base/meta/farol, território mostra as filiais com foto dos executivos.
Gates: 353 testes PASS, typecheck e build PASS. Aceite visual de Bruno NAO VALIDADO.
Pendente (parecer): M1 — filial sem meta infla o percentual do território (medido 75%→106%); M2 — "integrado no ERP" sem campo na carga.
Vault: `Bruno Vault/Sessões/2026-10/2026-10-29T11-38-52-central-receita-territorios-cartoes-fotos-deploy.md`.
Parecer e QA: `docs/regional/PARECER-TERRITORIOS-2026-10-28.md`, `docs/regional/QA-TERRITORIOS-2026-10-29.md`.

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
