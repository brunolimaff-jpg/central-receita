# Rastreador de issues: Markdown local

Issues e specs deste projeto ficam como arquivos markdown dentro da pasta `.scratch/`.
Nada aqui depende de GitHub, de rede ou de login.

## Onde fica

- Uma feature por pasta: `.scratch/<feature-slug>/`
- A spec da feature: `.scratch/<feature-slug>/spec.md`
- Cada ticket é um arquivo: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`
  - A numeração começa em `01`
  - Um arquivo por ticket. Nunca um arquivo com todos os tickets juntos
- O estado do ticket fica na linha `Status:` no topo do arquivo
- Conversas e histórico vão no fim do arquivo, sob o título `## Comments`

## Status do ticket

O estado usa os mesmos nomes das labels de triagem. Veja `triage-labels.md`.

| Status | Quando usar |
| --- | --- |
| `needs-triage` | Ticket novo. Alguém precisa dar uma olhada antes de seguir |
| `needs-info` | Falta informação de quem abriu |
| `ready-for-agent` | Está tudo descrito. Um agente pode rodar sozinho |
| `ready-for-human` | Precisa de decisão ou ação do Bruno |
| `wontfix` | Não vamos fazer. Fica registrado |

## Quando uma skill disser "publicar no rastreador"

Criar a pasta da feature dentro de `.scratch/` (se ainda não existir) e gravar o ticket nela.

## Quando uma skill disser "buscar o ticket"

Ler o arquivo no caminho indicado.

## Operações de wayfinding (`/wayfinder`)

- **Mapa:** `.scratch/<esforço>/map.md`, com o corpo Notas / Decisões até agora / Neblina.
- **Ticket filho:** `.scratch/<esforço>/issues/<NN>-<slug>.md`, numerado a partir de `01`.
  - A linha `Type:` registra o tipo (`research` / `prototype` / `grilling` / `task`).
  - A linha `Status:` registra `claimed` / `resolved`.
- **Bloqueio:** linha `Blocked by: NN, NN` no topo. O ticket está liberado quando todos os listados estão `resolved`.
- **Fronteira:** varrer `issues/` procurando tickets abertos, sem bloqueio e sem responsável. O primeiro da lista vence.
- **Assumir:** colocar `Status: claimed` e salvar antes de começar.
- **Resolver:** escrever a resposta em `## Answer`, marcar `Status: resolved` e apontar o contexto no `map.md`.
