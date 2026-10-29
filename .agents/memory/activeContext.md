# Contexto ativo — 27/10/2026

- Homologação visual pública: https://central-receita-visual.brunolimaff.workers.dev, somente dados sintéticos, sem API/D1/Access. Não requer dev local.
- **A homologação publica da branch `claude/gifted-mccarthy-odjru5`**, não da PR 19 nem da `main`. O workflow `homologacao-visual.yml` dispara em push das duas. Trabalho desta branch em `.claude/worktrees/visual-tipografia`. Para saber de onde saiu um deploy: `gh run list --workflow=homologacao-visual.yml`.
- 27/10: tipografia da assinatura na sidebar restaurada (caixa normal, 11px, peso 500) e cinco executivos com foto no organograma — Hermínio Gastaldi, Giovanne Farias, Fernando Silva, Alexandre Mancini, Marcos Paulo Malagola. Avatar lê `public/pessoas/<slug>.jpg` como camada de fundo. 264 testes, tipos e build PASS; três deploys success.
- **A busca da hierarquia devolve "Não autorizado. Usuário não autorizado."** para o usuário do Bruno (`searchHierarchyItem` 401). As 23 fotos restantes estão bloqueadas por permissão, não por automação. Bruno decidiu parar nos cinco.
- Relatório para o planejador: `docs/planner/2026-10-27-relatorio-planejador.md`; enviado no chat "Planejamento da PR 19" e respondido.
- Narrativa no Vault: `Sessões/2026-10/2026-10-27T14-30-00-central-receita-fotos-organograma-tipografia.md`. Lições novas em `Lições/evidencia/2026-10-27-*`.
- PR 19 OPEN/draft, head `5dedd87`, sem merge. Trabalho em `.claude/worktrees/p3-forecast-import`; fonte + CI commitados e pushados em 26/10.
- Build remoto via GitHub Actions nos dois projetos: Central run `40407352712`/versão `f2e77b5a`; Atlas run `40407230755`/versão `eb0840be`. Workers Builds (Cloudflare) bloqueado por API hidden (`8000008`); não insistir.
- Gates no delta local: 255 testes, tipos, build visual PASS; pacote e deploy Wrangler 4.135.0 PASS. Hospedado: Home/Configurações/Jornada verificadas; API 404, sem erros observados.
- Aceite visual de Bruno NAO VALIDADO; shared real/D1/autenticação/retencão fora desta demonstração. Não reaproveitar Worker Sites publicamente.
- Retomada em outro local: `git fetch` + `checkout fix/p3-forecast-e-importacao` recebe o delta; evidências `.scratch` (550 MB) ficam só nesta máquina; merge e aceite visual seguem com Bruno.
- Handoff detalhado na worktree e `docs/cloudflare-publicacao-visual.md`.
- Vault: `C:/Users/bruno.ferreira/OneDrive - Senior Sistemas SA/Documentos/Bruno Vault/Sessões/2026-10/2026-10-26T11-13-59-central-receita-cloudflare-visual-publicada.md`.
