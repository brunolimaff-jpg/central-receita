# ADR-0006: Visão Regional — regras do gerente regional migradas do Painel Centro-Oeste

**Status:** proposta (demo, dados fictícios)

## Contexto

O Painel Centro-Oeste (artefato HTML, out/2026) virou a referência de leitura do gerente regional (Centro-Oeste + estados). Ele trazia números pré-calculados em JSON, sem as regras no código. Migrar a tela sem as regras levaria o resultado sem a lógica que o produz.

## Decisão

- Nova view `regional` (`/?view=regional`), com 7 abas: Resumo, Resultado, Forecast de outubro, Executivos (nine box), Qualidade do forecast, Plano da semana e Regras e cálculos.
- As regras viram funções puras em `src/features/comercial-v3/regional/regional-model.ts`, cobertas por `tests/regional-model.test.mjs`.
- **Fonte única de regras:** a constante `REGRAS` alimenta a aba "Regras e cálculos" e o documento [`docs/regional/REGRAS-E-CALCULOS.md`](../regional/REGRAS-E-CALCULOS.md).
- Regras principais: farol 100%/70%; Commit = A, Best case = B+/B, Pipeline = C, D omitido; Base = Ganho + Σ(valor × pb) + fora do congelado; conversão exigida para 70% da meta (verde ≤ 35%, amarelo ≤ 60%); rolagem 58%; simulação com o cliente como unidade de decisão; limpeza do forecast com 8 pendências; nine box por atingimento × cobertura de pipeline.
- Dados: cenário fixo e fictício em `regional-mock.ts` (6 filiais: DF, GO, MS, MT, RO, TO; 15 executivos), com `asOf` declarado e casos adversariais (ADR-0005).
- Vocabulário: Ganho = Ganhos no CRM integrados com ERP (ADR-0001). Assinar não é integrar.

## Consequências

- O recorte por filial é só de tela. Para dados reais, o escopo do gerente precisa ser aplicado no Worker (mapa usuário → filiais), não só na UI.
- `pb` por oportunidade e `TAXA_ROLAGEM` são calibrados no histórico e precisam ser revistos a cada mês fechado.
- Mudar uma regra exige alterar o modelo, o teste e `REGRAS` juntos.
