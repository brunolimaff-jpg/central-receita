# Central de Receita

Mock local de Revenue Intelligence para transformar mudanças comerciais em casos, evidência e decisões executivas. A interface é fictícia e usa exclusivamente dados sintéticos.

## Identidade e modelo

- Direção visual: **Senior Emerald Liquid** — conteúdo claro e sólido; glass contido no chrome, nos filtros e nos painéis contextuais.
- Marca: wordmark Senior branco extraído da lâmina de logos do arquivo autorizado `Icones Senior.pptx`; variantes coloridas e brancas preservadas em `public/brand/senior-official-logos/`.
- Verde institucional `#00968C` e tipografia **Public Sans** (pesos 400–700) conforme a direção Senior já adotada no projeto; a fonte é carregada por `next/font/google`.
- Jornada orientadora: Originação → MQL → SAL → SQL → Conta → Oportunidade → Forecast → Win/Loss → Pedido.
- SQL, Conta, Oportunidade, Win, Pedido e Pedido conferido permanecem objetos/estados diferentes.
- Classificação, tipo/subtipo e IDs fornecidos estão no fixture local. Não representam catálogo ou regra de produção.
- Nenhuma conexão corporativa, dado real, modelo de linguagem externo, workflow persistente ou processo agendado.

Veja [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md), [TAXONOMIA_UI.md](./TAXONOMIA_UI.md), [DECISION_MODEL.md](./DECISION_MODEL.md), [DEPLOY_RAILWAY.md](./DEPLOY_RAILWAY.md) e [references/design-research/README.md](./references/design-research/README.md).

## Executar localmente no Windows

Requisitos: Node.js 22, dependências npm e o SQLite fictício em `db/custom.db`.

```powershell
npm install --no-package-lock
npx prisma generate
npm run dev
```

O comando `dev` usa Turbopack, liga apenas em `127.0.0.1:3001` e aceita somente o SQLite sintético do projeto (`file:../db/custom.db`). Se o ambiente fornecer outra origem para `DATABASE_URL`, o launcher para com erro sem exibir o valor; `.env` não é alterado. Para escolher outra porta:

```powershell
npm run dev -- --port 3000
```

Há um único servidor `next dev` por checkout. Para trocar a porta, encerre primeiro a instância atual; o lock do Next não permite duas portas simultâneas na mesma pasta.

O atalho [START_CENTRAL_LOCAL.cmd](./START_CENTRAL_LOCAL.cmd) verifica o endpoint local, inicia o servidor se necessário e abre o Chrome com perfil isolado e depuração local em 9222. O perfil do mock fica em `%TEMP%`; logs do servidor também ficam em `%TEMP%`. A depuração fica restrita ao loopback e o atalho pede ao Chrome desativar extensões e sincronização nesse perfil.

### Atualizar schema e seed sintético

Somente para manutenção do mock. O seed limpa e recria as tabelas do fixture; não o execute contra uma base diferente da SQLite local.

```powershell
$env:DATABASE_URL = 'file:../db/custom.db'
npx prisma db push
node --disable-warning=ExperimentalWarning --experimental-strip-types prisma/seed.ts
```

## Verificações

Com o servidor iniciado em `127.0.0.1:3001`:

```powershell
npx tsc --noEmit
npx eslint .
node --test tests/central-contract.test.mjs tests/runtime-guards.test.mjs
node --disable-warning=ExperimentalWarning --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --test tests/forecast-headline.test.mjs tests/command-search.test.mjs
npx next build
```

Encerre `npm run dev` antes de executar `npx next build`, pois Next usa o mesmo diretório de saída. Os testes de contrato cobrem taxonomia sintética, filtros de classificação/filial, horizonte de Forecast, consistência da janela Win/Loss, Fio da Receita, sanitização de Pergunte, assinatura do servidor local, headline de Forecast, busca textual da command palette e resposta 404 para ID inexistente.

## Arquitetura legada preservada

Os fluxos abaixo permanecem no checkout para reversibilidade, mas não compõem a Home V2 ativa em `/`.

- **Briefing:** cockpit visual de resultado PEX, Forecast móvel, entradas/saídas, fila mensal New Name/Cross, composição do pipeline por etapa, riscos e agenda. As barras e gráficos usam valores rotulados diretamente; controles alternam 30/60/90 dias, escala dos visuais e densidade Executiva/Completa.
- **Pergunte à Receita:** conversa completa e balão contextual nas demais telas; respostas seguem determinísticas e locais.
- **Explorar:** Forecast (Pipeline e Mudanças), Oportunidades (Carteira e Win/Loss) e Atenção (Sinais e Decisões).
- **Visões:** atalhos para Forecast, fila New Name, revisão de Cross e Win/Loss; salvamentos duram somente na sessão.
- **Apoio:** Fontes & Regras e Validações.

`Ctrl/Cmd+K` abre busca e comandos. Filial e classificação permanecem no contexto das leituras; o horizonte móvel acompanha Briefing, Forecast e Pergunte; busca acompanha Oportunidades e o detalhe correspondente. Detalhes abertos por uma análise aparecem em painel e preservam a origem; deep links diretos continuam válidos.

## Limitações conhecidas

- O snapshot anterior e as associações não fornecidas pelo usuário são gerados pelo seed sintético e têm limites documentados.
- Categorias de etapa sem comprovação são agregadas como “Não comprovado”. Origens, suborigens e segmentos restantes são valores de fixture.
- A lista de ganhos/perdas, motivos e resumo usam a mesma janela de 90 dias; Pedido e conferência são mostrados como estados posteriores distintos.
- O NPM reportou 4 vulnerabilidades moderadas e 5 altas nas dependências declaradas durante esta sessão. Nenhuma correção automática foi aplicada.
- O pacote ainda contém scripts auxiliares orientados a ambientes POSIX; o fluxo de desenvolvimento local acima é compatível com PowerShell.

## Desenvolvimento e governança

- [HANDOFF_AI.md](./HANDOFF_AI.md) registra o checkpoint e os próximos passos da validação pós-review.
- [QA_VISUAL.md](./QA_VISUAL.md) registra os fluxos verificados e o alcance da revisão visual ao vivo.
- [worklog.md](./worklog.md) registra as decisões e mudanças desta execução.
- Nenhum commit, deploy, publicação, cronjob ou scheduler foi criado.

## Home V2 — baseline atual

A raiz `/` agora usa a referência V2 orientada a decisão. O novo código está isolado em `src/components/revenue-home/` e `src/lib/revenue-home/`; os fluxos anteriores permanecem no checkout apenas como legado reversível e não são usados pela nova Home.

Veja `docs/CENTRAL_RECEITA_V2.md` para o contrato desta passagem.
