# Labels de triagem

As skills falam em cinco papéis de triagem. Este arquivo diz qual nome usar em cada situação.

| Papel na skill | Label neste projeto | O que significa |
| --- | --- | --- |
| `needs-triage` | `pra-avaliar` | Alguém precisa dar uma olhada antes de seguir |
| `needs-info` | `falta-info` | Falta informação de quem abriu |
| `ready-for-agent` | `pronto-pra-agente` | Está tudo descrito. Um agente pode rodar sozinho |
| `ready-for-human` | `decisao-do-bruno` | Precisa de decisão ou ação do Bruno |
| `wontfix` | `deixado-de-lado` | Não vamos fazer. Fica registrado |

Quando uma skill citar um papel (por exemplo, "aplique a label de pronto para agente"),
use o nome da coluna do meio.

O mesmo nome vale em todos os projetos do Bruno. Assim o `/triage` funciona igual em qualquer lugar.

### Criar as labels

As labels existem no repositório do GitHub (criadas na unificação de 20/10/2026).
no topo do arquivo, usando os mesmos nomes desta tabela.

Se este projeto ganhar um repositório no GitHub, use o comando abaixo:

```bash
for l in pra-avaliar falta-info pronto-pra-agente decisao-do-bruno deixado-de-lado; do
  gh label create "$l" --repo <owner>/<repo> --description "..." --color "ededed"
done
```

