# Decisões

- 2026-10-29 — Territórios usa cartões informativos de nível em vez de pílulas de filtro, seguindo "quem responde abaixo" da Carteira: cada cartão mostra Base, meta e farol antes do clique. Decisão veio do parecer do Planejador após Bruno apontar que a tela estava mais vazia que a oficial. A Carteira responde "quem é responsável"; Territórios responde "onde o resultado acontece" — dois caminhos, sem confundir hierarquia com geografia. Ver `docs/regional/QA-TERRITORIOS-2026-10-29.md`.

- 2026-10-26 — Build remoto de homologação adotado via GitHub Actions (`wrangler deploy` com secret `CLOUDFLARE_API_TOKEN`), porque a API de Workers Builds da Cloudflare recusa a configuração (`8000008`, endpoints hidden) apesar do Git conectado. Merge e aceite visual seguem exclusivos de Bruno. Ver Vault `Sessões/2026-10/2026-10-26T17-50-00-central-receita-build-remoto-github-actions.md`.

- 2026-10-26 — Bruno autorizou explicitamente substituir a homologação privada por link público central-receita-visual na conta confirmada, só com dados fictícios, sem Access/API/D1; escolheu Wrangler, já autenticado. Publicação não autoriza dados reais nem merge. Fonte segue local sem commit/push. Ver Vault Sessões/2026-10/2026-10-26T11-13-59-central-receita-cloudflare-visual-publicada.md.

- 2026-10-22 — Corrigir e revisar a PR #15 cumulativa, sem reconstruir branch nem isolar o checkpoint `26ec8b5`: os pré-requisitos da trajetória foram criados antes dele. Depois do artefato validado publicado em `275fc9b`, a PR foi mesclada (`ef2c8dd`). Merge não autoriza deploy nem D1. Ver `docs/reviews/2026-10-22-pr15-leitura-navegacao.md`.
- 2026-10-22 — A série C usa a competência da própria carga e o fuso `America/Cuiaba` do histórico; snapshot de oportunidades só nasce quando hash e referência dessa fonte mudam. Ambos restauram contratos existentes, sem decisão comercial nova.
