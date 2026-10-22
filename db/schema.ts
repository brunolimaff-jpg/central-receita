import { sql } from 'drizzle-orm'
import { check, integer, primaryKey, sqliteTable, text, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core'

export const importVersions = sqliteTable('import_versions', {
  sequence: integer('sequence').primaryKey({ autoIncrement: true }),
  revision: text('revision').notNull().unique(),
  previousRevision: text('previous_revision').references((): AnySQLiteColumn => importVersions.revision),
  referenceDate: text('reference_date').notNull(),
  savedAt: text('saved_at').notNull(),
  actorId: text('actor_id').notNull(),
  sourcesJson: text('sources_json').notNull(),
  workspaceJson: text('workspace_json').notNull(),
  /** Resumo numérico da carga para a trajetória; nulo nas versões anteriores à migração. */
  snapshotJson: text('snapshot_json'),
  opportunitiesChunkCount: integer('opportunities_chunk_count').notNull(),
  ordersChunkCount: integer('orders_chunk_count').notNull(),
}, table => [
  check('import_versions_opportunities_chunk_count_check', sql`${table.opportunitiesChunkCount} >= 0`),
  check('import_versions_orders_chunk_count_check', sql`${table.ordersChunkCount} >= 0`),
])

export const importChunks = sqliteTable('import_chunks', {
  revision: text('revision').notNull().references((): AnySQLiteColumn => importVersions.revision),
  kind: text('kind').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  recordCount: integer('record_count').notNull(),
  recordsJson: text('records_json').notNull(),
}, table => [
  check('import_chunks_kind_check', sql`${table.kind} IN ('opportunities', 'orders')`),
  check('import_chunks_index_check', sql`${table.chunkIndex} >= 0`),
  check('import_chunks_record_count_check', sql`${table.recordCount} > 0`),
  check('import_chunks_records_size_check', sql`length(CAST(${table.recordsJson} AS BLOB)) <= 800000`),
  primaryKey({ columns: [table.revision, table.kind, table.chunkIndex] }),
])

export const importCurrent = sqliteTable('import_current', {
  singletonId: integer('singleton_id').primaryKey(),
  revision: text('revision').notNull().references((): AnySQLiteColumn => importVersions.revision),
}, table => [
  check('import_current_singleton_check', sql`${table.singletonId} = 1`),
])
