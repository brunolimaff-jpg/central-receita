# Contrato de correção — CENTRAL-001 (construção pausada)

**SHA congelado:** `c9c78c91f0e1ffeedd47157a0f1e65b702ed19fe` (base do demo `bd1dfe9`, 10/11)
**Modo:** somente leitura. Nada alterado, nada publicado, nenhum serviço externo tocado.
**Fonte deste contrato:** inventário [INVENTARIO-NUMEROS-CENTRAL-VENDAS.md](INVENTARIO-NUMEROS-CENTRAL-VENDAS.md), releitura do código em `src/features/comercial-v3/`, `docs/REGRAS-NEGOCIO.md`, `docs/EVIDENCIA-REALIZADO-E-PENDENCIAS.md` e estado do GitHub lido por API.
**Lacuna registrada:** não li a resposta do Copilot na conversa do Bruno. O que ele apontou me chegou só como resumo do Chief (mistura de métricas, populações e origens; manter pausa). Tratei como alegação, não como prova; nada abaixo depende dele.

---

## 1. Inconsistências demonstradas (corrigir antes de retomar)

| # | Inconsistência | Evidência (arquivo:linha) | Impacto nos painéis |
|---|---|---|---|
| I1 | **Duas metas para o mesmo período na mesma tela:** R$ 12,0 mi (mock) e R$ 119,0 mi (export real) | bloco real em `screens/system-screen.tsx`; mock em `mock-data.ts:66-72`; `real-branches.json` (total) | Todo painel de meta/atingimento nasce com duas verdades; e a regra do projeto diz que meta vem do Acordo de Metas, não da carga (`REGRAS-NEGOCIO.md:75`) |
| I2 | **"Ganhos no CRM" rotulado como "já integrado no ERP"** | `regional/cso-screen.tsx:37`; `regional/territorio-screen.tsx:70` | Rótulo contraria a regra vigente: "É ganho no CRM, não realizado de vendas" (`REGRAS-NEGOCIO.md:10`) e "ganho não é realizado" (`:47`). Tela de decisão apresentando ganho como realizado |
| I3 | **Dois "realizados" com semânticas diferentes:** export chama de realizado os **pedidos integrados**; o New Name conta só **conferido**, e integrado sem `DATA CONFERENCIA` não entra | `real-branches.json` (`realizadoMeaning: "pedidos integrados"`); `new-name-model.ts:15-16,409`; `EVIDENCIA-REALIZADO-E-PENDENCIAS.md` (conflito entre fontes) | O "realizado" da Home/carga não é o "integrado" do agregado real. Comparar os dois é comparar coisas diferentes |
| I4 | **13 filiais sintéticas × 22 reais**, com o filtro do topo listando as 22 | `regional/regional-mock.ts` (13); `real-branches.json` (22); `commercial-v3-app.tsx:217` | Recorte de filial e topologia mudam conforme a tela; "Filiais no recorte 13" não conversa com o filtro |
| I5 | **Quatro datas na mesma sessão:** filtro set/2026; CSO out/2026 (dados de 28/10); carga 22/10/2026; snapshot 19/09/2026 | `mock-data.ts` (asOf); `regional-mock.ts:229-231`; carga importada | Competência ambígua em qualquer leitura; risco de comparar meses diferentes |
| I6 | **Selo "dados fictícios" desaparece quando há carga** — inclusive carga de fixture | `executive-page.tsx:285` (bloco sintético só em `sem-carga`); selo em `components/mrr-reading.tsx` | Demo com CSV de teste passa a parecer dado real |
| I7 | **Menu promete telas que não existem:** Carteira abre em "Nó não encontrado"; Forecast, New Name e Oportunidades renderizam a mesma Home | `sem-carga-carteira.txt`; `commercial-v3-app.tsx:144` (`executiveView`); dumps idênticos das três rotas | Navegação não corresponde ao produto; revisão de tela fica ambígua |

## 2. Dados demonstrativos que podem permanecer (com rótulo)

| # | Bloco | Valor | Rótulo atual | Condição para manter |
|---|---|---|---|---|
| M1 | Home — leitura de MRR | 12,0 / 8,4 / 10,2 / 11,0 mi; 7 contas | "Cenário demonstrativo · dados fictícios" + nota "não é receita nem pedido integrado" | Não conviver com o bloco real na mesma tela sem separação explícita (hoje convive no Sistema) |
| M2 | Diretorias 2027 | MRR R$ 77,5 mi; 4.092 grupos; 38,0/15,0/14,5/10,0 | "base declarada no planejamento", "modelo em construção" | Manter como base declarada; nunca somar com meta/realizado de carga |
| M3 | Matriz Territórios × Verticais | 20 células; soma R$ 77,4 mi × R$ 77,5 mi (resíduo R$ 123 mil) | "valores ilustrativos, não oficiais" + limite de vertical | Manter; resíduo já exposto é comportamento correto (não redistribuir) |
| M4 | Jornada | volumes 2.400→541, conversões, dias | "Demonstrativo fixo … não responde aos filtros" | Manter |
| M5 | Contas | 18 clientes · 18 oportunidades | "Cenário simulado" | Manter |
| M6 | CSO / Território (13 filiais) | base/meta/% por território e filial | "cenário demonstrativo, dados fictícios" | Manter **se** I2, I4 e I5 forem corrigidos antes |

## 3. Decisões comerciais necessárias

| # | Pergunta | Por que é decisão, não bug | Impacto |
|---|---|---|---|
| Q1 | **Qual marco é o realizado oficial** e qual evento/data vale (conferência, integração ou outro)? | Já aberto: `REGRAS-NEGOCIO.md:97-102`; `EVIDENCIA-REALIZADO-E-PENDENCIAS.md` (perguntas 1-6); ADR-0001 diz integração, decisão de 20/10 agrupa conferido+integrado sem validar equivalência | Bloqueia Home, Forecast, New Name, New Name e qualquer atingimento |
| Q2 | **Qual é a meta oficial** e de onde vem (Acordo de Metas por competência e filial)? | `REGRAS-NEGOCIO.md:75`: meta não está na carga; hoje a tela usa mock de 12,0 mi e o export traz 119,0 mi | Define a régua de todos os painéis; sem isso não há % confiável |
| Q3 | **Qual população é a fonte de verdade** (90.984 históricas / 44.993 snapshot / 11.343 pedidos / 2.458 ausentes) e como reconciliar com o agregado de 22 filiais? | As quatro populações não aparecem no app; só o agregado mensal | Define o que entra no painel e o que é reconciliação |
| Q4 | **Território × vertical terá regra de atribuição por vigência?** | Hoje não existe; a tela declara "sem regra de atribuição" | Define se a matriz vira dado oficial ou fica ilustrativa |
| Q5 | **Recorte oficial de filiais:** 13 (demonstrativo) ou 22 (export)? | I4 | Define topologia, filtros e comparabilidade |
| Q6 | **Rótulo do marco comercial:** "Ganhos no CRM" pode aparecer como "integrado"? | I2; decisão de 20/10 cria três marcos gerenciais | Um rótulo errado contamina apresentação executiva |
| Q7 | **Data de referência única** da interface (competência do mês × data da carga × snapshot) | I5 | Toda comparação depende disso |

## Ordem sugerida (quando a pausa for levantada)

1. **Rótulos falsos (I2, I6)** — independem de decisão, são correção de honestidade de tela; menor diff.
2. **Separar universos (I1, I3, M1 × bloco real)** — depende de Q1/Q2; enquanto não decidido, o bloco real fica isolado com rótulo próprio.
3. **Recorte e data (I4, I5)** — depende de Q5/Q7.
4. **Rotas (I7)** — depende de decisão de produto sobre a navegação.
5. **Base oficial (Q3, Q4)** — última, porque reescreve as fontes.

## Estado verificado do ambiente

- Porta **3012 fechada** (nenhum processo ouvindo); meu Chrome encerrado; nenhum job meu ativo.
- Porta **9222 aberta**: é a sessão de navegador usada para falar com o Copilot, não a minha. Fechar quando a revisão terminar.
- Cópia do app em `c9c78c9`, com apenas `next-env.d.ts` modificado (arquivo gerado pelo `next dev`, não é código).
- GitHub: 2 PRs **draft** abertas (#19, #20). A API lista como HEAD da branch padrão `d0248a1` (29/10); a base do demo `bd1dfe9` (10/11) existe no repositório — a relação entre as duas (branch) **não foi verificada**. Nada foi pushado a partir desta cópia.
