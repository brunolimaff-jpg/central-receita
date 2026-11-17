# Reconciliação de histórico — GitHub × cópia local · CENTRAL-001

Data da consulta: **17/11/2026, ~13:55 (-04:00)** · Verificador: Explorer (somente leitura)
Nenhum `fetch`, push, merge, deploy ou escrita externa. Nenhuma ref local alterada.
Acesso remoto: `gh` CLI autenticado como `brunolimaff-jpg` (token com escopo `repo`) — consultas **GET** na API.

## 1. O que existe no remoto

Repositório `brunolimaff-jpg/central-receita`: **privado**, criado em 20/10/2026, `pushed_at` **2026-11-10T22:14:08Z**.

| Branch | SHA | Observação |
|---|---|---|
| `main` (default) | `d0248a17a133049d155638bd3cc36e66b16be75f` | 29/10/2026 · **não protegida** |
| `local/cloudflare-a19b386` | **`bd1dfe9252261a9a1db1623342c633fba3d3301e`** | 10/11/2026 · baseline do trabalho |
| `feat/visao-regional` | `82fd349…` | PR #20 aberta |
| `fix/p3-forecast-e-importacao` | `5dedd87…` | PR #19 aberta |
| `claude/gifted-mccarthy-odjru5`, `fix/regional-mapa-calor` | `a19b386…` | PR #22 mergeada |
| `feat/trajetoria-receita` | `d01b5cf…` | PR #15 mergeada |
| `fix/forecast-janela-e-saldo` | `e4fe807…` | PR #17 mergeada |

- **PRs:** #22, #17, #15 merged; **#19 e #20 abertas** (sem atualização desde 26–28/10).
- **Issues abertas:** 26.
- **Divergência `main` × `bd1dfe9`:** `status: diverged`; merge base `971a2cd…`; `bd1dfe9` tem **77 commits que não estão em `main`**; `main` tem **2 commits** que não estão em `bd1dfe9` (`5144c04`, `d0248a1`, ambos de 29/10).
- Conclusão: **`bd1dfe9` não é ancestral de `main`.** O baseline é ponta de uma branch lateral; `main` está 77 commits atrás naquela linhagem.

## 2. O que existe na cópia local (`.scratch\CENTRAL-001-paineis\app`)

- **Sem ningún remote** (`git remote -v` vazio).
- Histórico de **11 commits**, começando num **commit raiz**:

| Commit | Data | Papel |
|---|---|---|
| `7befe1f` "baseline: app central-receita bd1dfe9" | 16/11/2026 13:30 | **raiz recriada**, sem pai, autor `Builder <builder@local>` |
| `b3e5074`, `c998a51`, `f48f929`, `c9643b2`, `c9c78c9`, `cf9a426`, `0187047`, `fe00eea`, `c954f94`, `f2a80f8` | 16–17/11 | 10 commits de trabalho; `master` = `c9c78c9`, branch de trabalho = `f2a80f8` |

- **`bd1dfe9` não existe como objeto** nesta cópia (`git cat-file -e` → exit 1).

## 3. Identidade: conteúdo igual, commit diferente

| Prova | Resultado |
|---|---|
| Árvore do `bd1dfe9` **remoto** | `6b785b71e71286c79756a039093829d63dd2a8bf` |
| Árvore do raiz local `7befe1f` | `6b785b71e71286c79756a039093829d63dd2a8bf` |
| Comparação | **idênticas bit a bit** (873 arquivos na árvore) |

Ou seja: a cópia local é **fiel em conteúdo** ao baseline `bd1dfe9`, mas **não é o mesmo commit** — a história foi recriada com uma raiz própria. Consequência prática: qualquer patch local se aplica sobre o conteúdo de `bd1dfe9`; nenhum comando que dependa de ancestralidade (`merge`, `rebase`, `pull`) reconhece o parentesco sem intervenção (graft/subtree ou reaplicar sobre um clone real).

## 4. Classificação

| Categoria | Itens |
|---|---|
| **Realmente remoto** | `bd1dfe9` (branch `local/cloudflare-a19b386`), `main` `d0248a1`, as 7 outras branches, 3 PRs mergeadas, 2 abertas, 26 issues |
| **Somente local** | raiz `7befe1f` e os 10 commits `b3e5074…f2a80f8`; `master` `c9c78c9`; **nenhum desses SHAs existe no remoto** (API devolve HTTP 422) |
| **Divergente** | `bd1dfe9` × `main`: 77/2, merge base `971a2cd` — o baseline nunca foi mergeado |
| **Não verificável** | se o Copilot consegue ler o repositório (o próprio Copilot declarou falha no conector); estado remoto além do snapshot da API (changes de terceiros depois desta hora); o conteúdo de branches locais não publicadas que possam existir em outras máquinas |

## 5. Origem da cópia

O worktree original existe e está **limpo**: `…\Documentos\Projetos\Central de Receita\central-receita-cloudflare`
— `origin = https://github.com/brunolimaff-jpg/central-receita.git`, branch `local/cloudflare-a19b386`, `HEAD = bd1dfe9`, árvore `6b785b71…`, nada modificado. Ou seja, o repo real não foi tocado; a cópia scratch é que recebeu o trabalho.

## 6. Riscos para continuidade

1. **Push criaria história desconexa.** A branch `central-001/home-giovanne` tem raiz própria. Se for publicada, entra no GitHub sem merge base com `main` nem com `bd1dfe9` — PR contra qualquer uma fica inviável sem reescrita/graft. **Não publicar** enquanto isso não for decidido.
2. **Trabalho em cópia única.** Os 10 commits existem só nesta máquina. Se a cópia sumir, some o trabalho; o baseline, esse sim, está no remoto.
3. **Base não mergeada.** O material parte de uma branch lateral 77 commits à frente do ponto de separação. Se o Bruno quiser o trabalho sobre `main`, é reaplicação/decidir a base, não `pull`.
4. **O Copilot lê `main`.** Ele relatou ler `d0248a1` (29/10), que **não contém** nem `bd1dfe9` nem o trabalho local. Revisar "o repositório" ali mostra uma árvore ~3 semanas mais velha.
5. **Acesso ≠ prova.** `gh` autenticado aqui prova acesso **desta sessão**; não prova que o Copilot lê o repo — o próprio Copilot informou falha no conector.
6. **`main` não é protegida**, e há 26 issues abertas: qualquer consolidação precisa de disciplina de branch.

## 7. O que o Chief pode afirmar ao Copilot

- O trabalho da Home **não está no GitHub**. Rótulo correto: "branch local, sem remote".
- O baseline do trabalho é **`bd1dfe9`**, branch `local/cloudflare-a19b386` — não `main`.
- `main` (`d0248a1`) divergiu: `bd1dfe9` tem 77 commits a mais; `main` tem 2 que `bd1dfe9` não tem.
- O conteúdo local do baseline é **igual** ao de `bd1dfe9` (mesma árvore `6b785b71…`), mas o commit local é raiz nova.
- Para revisar as correções, o Copilot precisa do diff/arquivos enviados por texto ou de uma branch publicada — por SHA, ele não alcança (`c9c78c9`, `0187047`, `f2a80f8` não existem no remoto).

## 8. Limites

- Snapshot por API às ~13:55 de 17/11; não é monitoração contínua.
- Não rodei `git fetch`/`ls-remote` no worktree original para não alterar refs; a comparação remota usou só a API.
- Não inspecionei o conteúdo de outras máquinas nem do Vault.
- Nada foi escrito no app, no repo ou no GitHub.
