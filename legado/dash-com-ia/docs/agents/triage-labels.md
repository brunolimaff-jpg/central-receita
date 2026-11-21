# Labels de triagem

Os cinco papéis de triagem usam os nomes oficiais de `mattpocock/skills`, sem tradução.

| Papel na skill | Label neste projeto | O que significa |
| --- | --- | --- |
| `needs-triage` | `needs-triage` | Alguém precisa dar uma olhada antes de seguir |
| `needs-info` | `needs-info` | Falta informação de quem abriu |
| `ready-for-agent` | `ready-for-agent` | Está tudo descrito. Um agente pode rodar sozinho |
| `ready-for-human` | `ready-for-human` | Precisa de decisão ou ação do Bruno |
| `wontfix` | `wontfix` | Não vamos fazer. Fica registrado |

Quando uma skill citar um papel (por exemplo, "aplique a label de pronto para agente"),
use o nome da coluna do meio.

O mesmo nome vale em todos os projetos do Bruno. Assim o `/triage` funciona igual em qualquer lugar.

### Criar as labels

No rastreador local não existe label para criar. O estado do ticket é a linha `Status:`
no topo do arquivo, usando os mesmos nomes desta tabela.

As labels já existem no GitHub com os nomes oficiais. Foram renomeadas em 2026-11-21,
preservando as labels das issues já classificadas.
O rastreador legado continua local e usa esses nomes na linha `Status:`.

Para criar as mesmas labels em outro repositório:

```bash
for l in needs-triage needs-info ready-for-agent ready-for-human wontfix; do
  gh label create "$l" --repo <owner>/<repo> --description "..." --color "ededed"
done
```
