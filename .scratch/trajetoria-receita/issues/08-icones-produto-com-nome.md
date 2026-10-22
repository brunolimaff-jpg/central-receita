# 08 — Ícones de produto sempre com nome

Status: pronto-pra-agente
Bloqueia: —
Bloqueado por: 07 (para o rótulo recolhido)

## Objetivo

Os ícones oficiais já existem em `public/brand/produtos`, mas o casamento entre
o nome da solução e o produto está dentro do componente visual — não dá para
testar, e não há garantia de que o ícone nunca apareça sozinho. O guia da Senior
exige que o ícone venha sempre acompanhado do nome.

## O que construir

### Mapa centralizado

`src/features/comercial-v3/product-catalog.ts` — módulo puro:

```ts
export type ProdutoId = 'erp' | 'hcm' | 'tms' | 'wms' | 'acesso-seguranca'
  | 'logistica' | 'industria' | 'agronegocio' | 'construcao' | 'servicos'

/** Nome da solução → produto. `null` quando não há correspondência. */
export function produtoDaSolucao(solucao: string | null | undefined): ProdutoId | null

/** Caminho público do ícone e a proporção original do arquivo. */
export function iconeDoProduto(id: ProdutoId): { src: string; proporcao: number }
```

Hoje a lógica vive em `components/product-icon.tsx` (constante `ALIASES`). Ela
sobe para o catálogo; o componente passa a só consumir.

### Aliases atuais (preservar)

| Padrão no texto | Produto |
|---|---|
| `ERP` | erp |
| `HCM`, "gestão de pessoas", "folha" | hcm |
| `WMS`, "armazém" | wms |
| `TMS`, "transporte", "frota" | tms |
| "acesso", "segurança" | acesso-seguranca |
| "logística" | logistica |
| "indústria", "manufatura" | industria |
| "agro", "agronegócio" | agronegocio |
| "construção" | construcao |
| "serviços" | servicos |

### Regras de exibição

- **Ícone nunca sozinho.** Toda renderização é ícone + nome ao lado.
- Sem correspondência: nada é renderizado no lugar do ícone, só o texto.
- O ícone carrega `aria-hidden` e `alt=""` — o nome já está no texto ao lado.
- Tamanho padrão 15–18px de altura; nunca ampliar além do arquivo.
- `loading="lazy"` e `decoding="async"` fora da primeira dobra.

### Onde aparece

1. Coluna "Solução" da tabela de oportunidades — já implementado, manter.
2. Filtro de solução do cabeçalho — ícone do produto ativo ao lado do select.
   Em "Todas as soluções", nenhum ícone.
3. Cabeçalho da seção quando houver uma solução única selecionada.

## Reaproveitar

- `src/features/comercial-v3/components/product-icon.tsx` — componente atual
- `public/brand/produtos/*.png` — nove ícones, já extraídos sem redesenho
- `src/features/comercial-v3/components/filter-select.tsx` — já aceita `icone`

## Testes — `tests/product-catalog.test.mjs`

| Entrada | Esperado |
|---|---|
| `'ERP'` | `'erp'` |
| `'erp'` (minúsculo) | `'erp'` |
| `'Gestão de Pessoas'` | `'hcm'` |
| `'Logística'` | `'logistica'` |
| `'Serviços'` | `'servicos'` |
| `'Consultoria Avulsa'` | `null` |
| `''` | `null` |
| `null` | `null` |
| `'   '` | `null` |
| `iconeDoProduto('erp').src` | contém `/brand/produtos/erp.png` |
| todo `ProdutoId` válido | arquivo existe em `public/brand/produtos` |

## Critério de aceite

- Nenhum lugar da interface mostra ícone de produto sem o nome ao lado.
- Solução desconhecida não renderiza imagem quebrada nem placeholder.
- O leitor de tela não anuncia o produto duas vezes.
