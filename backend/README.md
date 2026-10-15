# Shared manual import Worker

`worker.js` implements `GET` and `PUT /api/imports/current`. It forwards every other non-API request to the native `ASSETS` binding. The published Site uses the `DB` binding and the three import tables. `import_current` is empty; no real CSV has been loaded.

## Storage contract

The browser sends only the normalized `workspace`, the revision it last read (`previousRevision`), and a reference date. The Worker rejects unknown fields, invalid IDs or dates, parser errors, same-order account conflicts, cross-source account conflicts, and records containing fields outside the current import model. It recomputes displayed counts and creates source `savedAt` values on the server. `GET` returns `{ draft, canImport }`; the capability is derived from the server allowlist for that authenticated caller. The UI uses it to present viewers with read-only controls, while every `PUT` still checks authorization server-side.

Each accepted write adds an immutable version row and bounded record chunks. A D1 batch inserts the version and chunks, then switches the single current pointer only when the expected revision still matches and all chunks are present. Competing writers receive `409`; an invalid payload or failed database batch leaves the active revision unchanged. A source keeps its previous `savedAt` when both its SHA-256 and reference date are unchanged. The API returns the latest 20 history entries; older full versions remain stored for future freeze comparisons.

Chunks are at most 800,000 UTF-8 bytes, below D1's 2 MB row limit. The request body is capped at 32 MiB. No original CSV or XLSX is stored. Historical versions are retained without an automatic deletion policy, so choose a retention and capacity policy before sustained use.

`db/schema.ts` is the schema source and `drizzle/0000_shared_import.sql` is the generated initial migration used by Sites. Sites applies pending migrations before uploading the Worker. Do not apply a second copy manually.

## Identity and roles

The Worker reads only `oai-authenticated-user-id`, supplied by the Sites dispatcher. It ignores `X-User-ID`, request-body identity, and caller-selected roles. `IMPORTER_USER_IDS` authorizes `PUT` and `GET`; `VIEWER_USER_IDS` authorizes read-only `GET`. Values are comma or whitespace separated Site-scoped user IDs. Importers can also read. Missing identity returns `401`, an unlisted identity returns `403`, and an absent allowlist returns `503`.

This header is trusted only on requests that pass through the authenticated Sites dispatcher. The Worker code cannot cryptographically distinguish a dispatcher-added header from a caller-forged header on a directly exposed Worker URL. Before activation, route the API only through the Site's authenticated origin and disable or otherwise block direct public Worker access. That routing and the actual identity IDs must be verified on the hosted Site; this local implementation does not claim production authentication is configured.

## Activation boundary

`npm run build:sites` creates `dist/client` static assets and `dist/server/index.js` Worker entrypoint. The `.openai/hosting.json` manifest omits `static` and declares `d1: "DB"`; Sites applied the checked-in migration before uploading the Worker. Runtime IDs and `SITE_ORIGIN` are configured as server-only values. The Site allowlist and import/viewer IDs are configured, but sign-in and cross-user reads have not been verified with Fabi and Giovanni. Before loading a real CSV, confirm that the API is reached through the authenticated Sites origin; an Origin check alone is not authentication.
