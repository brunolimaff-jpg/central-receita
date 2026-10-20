# Legado

Código anterior à Central de Receita atual, guardado para consulta. Nada aqui é compilado,
testado ou publicado pelo app da raiz.

## `dash-com-ia/`

Primeira versão ("Pulso Comercial"): Next.js + Prisma + SQLite, com API em `src/app/api`
e domínio em `src/lib/domain`. É o código que a SPEC Aurora e o adendo de performance
auditaram — por isso os caminhos citados neles existem aqui, e não no app da raiz.

Vale como referência de regra de negócio, principalmente os ADRs em `dash-com-ia/docs/adr/`
(assinado não é ganho, pipeline de conferência, honestidade de fonte).

Ficaram de fora de propósito: `.env`, o banco `db/custom.db`, `node_modules`, `.next`,
capturas de tela, `src.7z` e restos do gerador do projeto. Os dados do `prisma/seed.ts`
são sintéticos (declarado no próprio arquivo).
