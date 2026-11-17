# Central de Vendas — documentação da entrega CENTRAL-001-HOME

Este diretório guarda os relatórios e as evidências sintéticas que sustentam a entrega da
Home da **Central de Vendas** (projeto `central-receita`). Ele vem acompanhado do código da
entrega no mesmo pull request.

## Estado

- Branch deste PR: **`pr/central-001-home`**, criada a partir de **`local/cloudflare-a19b386`** (`bd1dfe9`), que é o baseline do trabalho.
- **Este PR não integra a `main`.** A `main` remota (`d0248a1`) **diverge** do baseline: `bd1dfe9` tem 77 commits que não estão nela, e ela tem 2 que não estão em `bd1dfe9`. Publicar este branch não corrige essa divergência; apenas coloca o trabalho em um lugar visível e revisável.
- Dois commits: o primeiro aplica a entrega (código e testes) sobre `bd1dfe9` — commit `11540a0`; o segundo acrescenta esta documentação.

> **Aviso sobre SHAs.** Os relatórios citam `b3e5074`, `c9c78c9`, `cf9a426`, `0187047`,
> `fe00eea`, `c954f94` e `f2a80f8`. Esses hashes são de uma **cópia local** (história própria,
> raiz recriada a partir do conteúdo de `bd1dfe9`) e **não existem neste repositório**. Aqui o
> conteúdo equivalente é o commit `11540a0` deste branch. Ao ler, use os hashes como referência
> interna dos relatórios, não como objeto consultável no GitHub.

## Relatórios

Copiados sem edição dos originais; o SHA-256 de cada arquivo é idêntico ao da origem.

| Arquivo | Bytes | SHA-256 | O que prova |
|---|---|---|---|
| `2026-11-17-INVENTARIO-NUMEROS-CENTRAL-VENDAS.md` | 14477 | `DBE00C0EAA79808A12D2436E10906F2A233A407F2883C7F6CF2A830746753A27` | cada número do app, com origem, unidade e população |
| `2026-11-17-MATRIZ-ACHADOS-COPILOT-0187047.md` | 11792 | `4075F6B8BCB2E75ADBD4B16B3B27EAC1928990CBF8BF5748D2BD70CD42DC4BAB` | achados A1–A9 e X1–X5 classificados, com veredito e fonte |
| `2026-11-17-RECONCILIACAO-HISTORICO-GITHUB.md` | 6290 | `46FEC3FC319A5F3950D9B3CB665428D22D5AA0F56F8879462A183EDDE9021C85` | história local × remoto, raiz recriada, árvores idênticas |
| `2026-11-17-VERIFICACAO-ETAPA2-fe00eea.md` | 5841 | `A512EF8ED13F83A8231C4E7AB6AB73A5E2D8D9C40C6C1E94A678C6531E79AA89` | verificação independente de A1/A7 (prova original) |
| `2026-11-17-VERIFICACAO-ETAPA3-c954f94.md` | 4149 | `EE92A1AB8A23C04A1FFDF40BBA8CF9CB205B7881729F362EA245B5F380CB21AB` | verificação da precisão de valores e da concordância |
| `2026-11-17-VERIFICACAO-DIFF-f2a80f8.md` | 2465 | `C84ECC0500DB4067933E8DCA063B1FC6DD5F274360A586940AD954514BA92908` | SHA final contém só o comentário corrigido |
| `2026-11-17-RELATORIO-CENTRAL-001-HOME.md` | 7912 | `DB7A5ABB6D3D809AF3DFC6E1EA7F45FF2ABEB4B58BF59B3C69064D1FFC04A278` | entrega da Home (lado de quem implementou) |
| `2026-11-17-RELATORIO-RESSALVAS-0187047.md` | 7014 | `0AC0CDAA40C3097C8E0B1330D25EC2F9BF653155BAF52448E96F9789A96B21FE` | fechamento das ressalvas da primeira verificação |
| `2026-11-17-RELATORIO-ETAPA2-A1-A7-fe00eea.md` | 5753 | `AA6CA02487BBACE1AC78BAA22D1FBF500C8300A33571D37C2595C27BCC589AF6` | correção do sinal da tabela (A1) e da competência da carga (A7) |
| `2026-11-17-RELATORIO-AJUSTE-CARGA-c954f94.md` | 4937 | `F0E0BE92CE0A04CC1EC160B3C2A4B725B92E695E03E196ABB7E2B42006383363` | valor preciso e concordância no bloco da carga, com adendo do último commit |
| `2026-11-17-CONTRATO-CORRECAO-CENTRAL-001.md` | 7387 | `E068BECDE5638641695D9A6CC60C0DC4CC176E60F675634BC2D6AD4B660BFDD9` | inconsistências e decisões que não são bug |

## Evidências sintéticas

CSVs **fictícios**, sem dado de cliente. Servem para repetir à mão as provas de A1/A7 e da
precisão de valores. Hashes idênticos à origem.

| Arquivo | Bytes | SHA-256 | Conteúdo |
|---|---|---|---|
| `evidencias/oportunidades-mistas-3-meses.csv` | 622 | `6CE01D4092E1D9E8573A7C493C95E6616294338C512A7AEE4004C423DAF30497` | 8 registros em 3 meses; 1 sem data, 1 sem valor, 1 perdida |
| `evidencias/oportunidades-precisao-plural.csv` | 396 | `B8915C1182ED0FEF0D19B0151D93B4FF58789C4B1C3125D4F21E30D08A18B80D` | 4 registros; totais de R$ 10.000 e R$ 26.000 |
| `evidencias/oportunidades-precisao-singular.csv` | 272 | `5E955472DB17381169364C85B4E72ABD771251F708AA07C45A59C78886233600` | 2 registros; R$ 1.500 e R$ 9.999 |

**Como repetir:** abra `Configurações`, informe a data de referência **22/10/2026**, carregue o
CSV de oportunidades (e qualquer CSV de pedidos válido, se a tela pedir os dois) e salve a
prévia local. Na Home, com carga, o bloco "Carga de teste" deve mostrar:

| CSV | Ganhos no CRM | Em aberto | Oportunidades | Fora dos totais |
|---|---|---|---|---|
| `oportunidades-mistas-3-meses.csv` | `R$ 4 mil` · 1 fechada e ganha | `R$ 1.500` · 1 aberta com previsão | 8 | 2 com data em outro mês · 2 sem data válida · 1 sem valor |
| `oportunidades-precisao-singular.csv` | `R$ 1.500` · 1 fechada e ganha | `R$ 9.999` · 1 aberta com previsão | 2 | nenhum |
| `oportunidades-precisao-plural.csv` | `R$ 10 mil` · 2 fechadas e ganhas | `R$ 26 mil` · 2 abertas com previsão | 4 | nenhum |

Abaixo de R$ 10 mil o cartão mostra o valor exato (é o ajuste que fechou a última rodada); de
R$ 10 mil em diante usa o formato compacto do app.

## Pendências e decisões em aberto

1. **Q2 — escopo da meta:** a tela mostra as duas leituras (MRR só e MRR+NR contra a mesma
   meta) e declara que a fonte não define o escopo. Decisão de negócio pendente.
2. **Datas divergentes:** a topbar do cenário usa set/2026 e o CSO out/2026. Fora do escopo do lote.
3. **Persona:** a Home cumprimenta "Giovanni"; o organograma traz "Giovanne Farias". Decisão pendente.
4. **B1–B6** (itens do contrato) não aprovados; A3, A4, A8, A9 e X1 continuam como estão.
5. **Capturas e logs não entram neste PR:** são locais e pesados. Os relatórios os citam por
   nome; a prova visual fica na máquina de origem.
6. **`next-env.d.ts`** não foi commitado (alteração gerada pelo `next dev` na cópia local).

## O que este PR não é

Não é merge, não publica o app, não corrige a divergência da `main` e não contém dados reais:
os CSVs são sintéticos e os números da tela, quando demonstrativos, estão rotulados como tal.
