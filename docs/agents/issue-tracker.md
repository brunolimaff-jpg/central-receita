# Rastreador de issues: GitHub

Issues e specs deste projeto ficam no GitHub Issues do repositório
`brunolimaff-jpg/central-receita` (privado). Toda operação usa o `gh`; o repositório
vem do `git remote -v`.

Specs e tickets anteriores a 20/10/2026 continuam em `.scratch/<feature>/` como histórico.
Não abra ticket novo lá.

## Operações

- **Criar:** `gh issue create --title "..." --body "..." --label ready-for-agent` (corpo longo via heredoc)
- **Ler:** `gh issue view <n> --comments`
- **Listar:** `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`, com `--label` e `--state` quando precisar
- **Comentar:** `gh issue comment <n> --body "..."`
- **Labels:** `gh issue edit <n> --add-label "..."` / `--remove-label "..."` (nomes em `triage-labels.md`)
- **Fechar:** `gh issue close <n> --comment "..."`

## Pull requests como entrada de triagem

**PRs como pedido: não.** _(Troque para `sim` se PRs externos virarem pedidos; o `/triage` lê esta linha.)_

## Quando uma skill disser "publicar no rastreador"

Criar uma issue no GitHub.

## Quando uma skill disser "buscar o ticket"

`gh issue view <n> --comments`.

## Spec e tickets

- A spec é uma issue com a label `ready-for-agent` e o título começando por `Spec:`.
- Cada ticket é uma issue própria, com `Parte de #<spec>` na primeira linha do corpo.
- **Bloqueio:** dependência nativa do GitHub
  (`gh api --method POST repos/brunolimaff-jpg/central-receita/issues/<filho>/dependencies/blocked_by -F issue_id=<id-numérico-do-bloqueador>`,
  com o id de `gh api repos/brunolimaff-jpg/central-receita/issues/<n> --jq .id`).
  Sem esse recurso, a linha `Bloqueado por: #<n>, #<n>` no topo do corpo.
  O ticket está livre quando todos os bloqueadores estão fechados.

## Operações de wayfinding (`/wayfinder`)

- **Mapa:** uma issue com a label `wayfinder:map` (Notas / Decisões até agora / Neblina).
- **Filho:** sub-issue do mapa, label `wayfinder:<research|prototype|grilling|task>`.
- **Fronteira:** filhos abertos do mapa, sem bloqueador aberto e sem responsável; o primeiro na ordem do mapa vence.
- **Assumir:** `gh issue edit <n> --add-assignee @me`, antes de qualquer outra escrita.
- **Resolver:** comentar a resposta, fechar a issue e anotar o ponteiro nas Decisões do mapa.
