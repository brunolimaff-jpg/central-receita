# 03 — Snapshot no histórico (exige migração)

Status: ready-for-agent
Bloqueia: 06
Bloqueado por: —

> **Aprovado por Bruno em 2026-10-20.** A migração D1 está autorizada. Rodar
> primeiro em ambiente de teste, conferir que carga antiga abre com
> `snapshot_json` nulo, e só então aplicar em produção.

## ⚠️ A v2 dizia "sem migração". Está errado.

No modo compartilhado, o histórico **não vem do cliente**. `backend/worker.js:267-274`
o reconstrói lendo `import_versions`:

```js
const history = d1Rows(historyResult).map(entry => ({
  at: entry.saved_at, referenceDate: entry.reference_date, sources: JSON.parse(entry.sources_json),
}))
```

Só três campos saem. Um `snapshot` enviado pelo cliente é descartado.

E o corpo do PUT é validado com chave exata em `worker.js:364`:

```js
if (!hasExactKeys(body, ['workspace', 'previousRevision', 'referenceDate']) || ...)
```

Qualquer chave nova é rejeitada com `invalid_request`.

## Por que isto precisa do Bruno

É **migração de schema em banco D1 de produção compartilhada**. A regra do
projeto é parar e pedir OK textual antes de migração. Este ticket fica em
`decisao-do-bruno` até a aprovação.

## O que a migração envolve

1. Coluna nova em `import_versions`:
   ```sql
   ALTER TABLE import_versions ADD COLUMN snapshot_json TEXT;
   ```
   Gerada por `npm run db:generate` (drizzle-kit), revisada à mão.

2. `backend/worker.js`:
   - `persist()` grava a coluna (linha ~326);
   - `readVersion()` devolve o campo junto dos outros três (linha ~271).

3. Nenhuma mudança no formato do corpo do PUT. O `snapshot` é calculado **no
   worker**, a partir do `workspace` que já chega lá — não é enviado pelo
   cliente.

4. `manual-import-client.ts`: no modo local (IndexedDB), o campo entra direto
   em `saveImportDraft`, sem schema.

## Tipo

```ts
export type TrajectorySnapshot = {
  forecastTotal: number   // reais
  entered: number         // reais
  exited: number          // reais
  changed: number         // reais
  realized: number        // reais
}
```

## Compatibilidade

- Linha antiga tem `snapshot_json` nulo.
- Leitura tolerante: entrada sem snapshot é ignorada na série, não quebra.
- `history` continua truncado em `MAX_HISTORY = 20` (`worker.js:6`).

## Alternativa sem migração

Se a migração não for desejada agora: **regime C fica indisponível**. A
trajetória funciona inteira no regime A e B; só não evolui para três ou mais
pontos. A spec não depende deste ticket para entregar valor.

Registrar a escolha antes de implementar.

## Testes (após aprovação)

| Cenário | Esperado |
|---|---|
| save com carga válida | linha tem `snapshot_json` preenchido |
| versão anterior à migração | `snapshot_json` nulo, leitura não lança |
| duas cargas | dois snapshots distintos |
| mais de 20 cargas | continua truncando em 20 |
| PUT com chave extra no corpo | rejeitado (comportamento atual preservado) |

## Critério de aceite

- Migração aplicada em ambiente de teste antes de produção.
- Carga antiga abre normalmente após a migração.
- `npm test` e typecheck limpos.
- **Nada roda em produção sem OK textual do Bruno.**
