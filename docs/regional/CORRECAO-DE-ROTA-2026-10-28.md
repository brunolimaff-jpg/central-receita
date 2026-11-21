# Correção de rota — Territórios (28/10/2026, depois do parecer)

Aviso ao Planejador sobre o que mudou no entendimento do objeto. O parecer de
`PARECER-TERRITORIOS-2026-10-28.md` continua válido nos defeitos técnicos
(B1, T1, T2 corrigidos; M1, M2 em aberto). O que muda é **o que é um território**.

## O erro de rota

Eu inventei dois territórios — "Centro-Oeste" e "Norte" — como agrupamentos de
filiais da demonstração. Não é isso.

VERIFICADO: o organograma real já existe em `src/features/comercial-v3/org-2027.ts:140-151`
e declara **cinco** territórios, com UFs:

| # | Nome | UFs | Base própria |
| --- | --- | --- | --- |
| 1 | Território 01 | RS · SC · PR | sim |
| 2 | Território 02 | MT + MS · DF · GO / TO | sim |
| 3 | Território 03 | São Paulo Capital · Interior | sim |
| 4 | Território 04 | Nordeste · MG · RJ / ES | sim |
| 5 | Território 05 | Norte | **não** — novos negócios via canais, base anexa ao 02 |

VERIFICADO: a home já desenha esses cinco em `components/diretorias-section.tsx:452`
(`TERRITORIOS.filter(t => t.porVertical)`) e `:500` (os sem base própria).

VERIFICADO: as filiais que o resto do app usa estão em `mock-data.ts:65-73` —
SP, RS, MG, PR, SC, GO, BA, Outras.

## Por que importa

Vem do Bruno, e é decisão de produto: **todos os territórios precisam de dado
mock**. Se só um tiver número, a demonstração lê como favorecimento de um
território sobre os outros — e a tela perderia a função de comparar.

Também do Bruno: **não referenciar o painel do Matheus**. A tela é da Central de
Receita, não de um projeto pessoal. A persona e os comentários que citam o nome
saem.

## O que muda na implementação

1. `TERRITORIOS` em `regional/territorios-model.ts` passa a ser os cinco do
   organograma, mesmo `numero` e mesmas UFs. Fim dos recortes inventados.
2. `regional-mock.ts` passa a cobrir filiais dos cinco territórios, todas com
   meta e movimento. Nenhum território com dado vazio.
3. A persona deixa de ser uma pessoa do painel do Matheus.

## O que NÃO muda

- Os defeitos do parecer e as correções já feitas (B1, T1, T2).
- O aviso de escopo: o recorte é só de tela, não há identidade no Worker.
- M1 e M2 seguem em aberto, com o mesmo diagnóstico.

## Limite assumido

O organograma agrupa por **UF**; a carga agrupa por **filial**
(`UNIDADE NEGOCIO OPORTUNIDADE`). A ponte entre os dois é uma declaração desta
demonstração, não um dado importado — e a tela continua dizendo isso. É a mesma
ressalva que `carteira-territorio.ts:1-20` já registra.

---

## Implementado e verificado

| Item | Resultado |
| --- | --- |
| `TERRITORIOS` = os 5 do organograma | 5 territórios, mesmo número e UFs |
| Mock cobre todos | 13 filiais; os 5 territórios com meta e ganho |
| Persona sem o nome do Matheus | "Diretoria de Mercado · Brasil" |
| `npm test` | 353/353 (eram 351) |
| `npx tsc --noEmit` | exit 0 |
| `npm run build:visual` | passa |
| Tela | Território 05 47% · 04 55% · 01 61% · 02 72% · 03 80% — todos com dado |

### Bug de build encontrado e corrigido no caminho
O gerador de nomes de cliente era `for(;;)` sobre 10 prefixos × 20 nomes = 200
combinações fixas. Com 6 filiais cabia; com 13 e 29 executivos passou de 200 e o
laço **nunca terminava** — a suíte e o build travavam sem mensagem de erro.

Corrigido em duas partes: o pool virou 10 × 44 = 440, e o laço passou a ter
limite com fallback determinístico. Um pool finito nunca mais pode travar o
build em silêncio.

### Novo teste
`todo território tem movimento: nenhum fica vazio na comparação` — garante que
cada um dos cinco territórios tem filial, meta e ganho. É a regra do Bruno
("se só um tiver número, parece favorecimento") virada em verificação.
