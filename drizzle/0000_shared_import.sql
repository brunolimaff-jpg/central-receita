CREATE TABLE `import_chunks` (
	`revision` text NOT NULL,
	`kind` text NOT NULL,
	`chunk_index` integer NOT NULL,
	`record_count` integer NOT NULL,
	`records_json` text NOT NULL,
	PRIMARY KEY(`revision`, `kind`, `chunk_index`),
	FOREIGN KEY (`revision`) REFERENCES `import_versions`(`revision`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "import_chunks_kind_check" CHECK("import_chunks"."kind" IN ('opportunities', 'orders')),
	CONSTRAINT "import_chunks_index_check" CHECK("import_chunks"."chunk_index" >= 0),
	CONSTRAINT "import_chunks_record_count_check" CHECK("import_chunks"."record_count" > 0),
	CONSTRAINT "import_chunks_records_size_check" CHECK(length(CAST("import_chunks"."records_json" AS BLOB)) <= 800000)
);
--> statement-breakpoint
CREATE TABLE `import_current` (
	`singleton_id` integer PRIMARY KEY NOT NULL,
	`revision` text NOT NULL,
	FOREIGN KEY (`revision`) REFERENCES `import_versions`(`revision`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "import_current_singleton_check" CHECK("import_current"."singleton_id" = 1)
);
--> statement-breakpoint
CREATE TABLE `import_versions` (
	`sequence` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`revision` text NOT NULL,
	`previous_revision` text,
	`reference_date` text NOT NULL,
	`saved_at` text NOT NULL,
	`actor_id` text NOT NULL,
	`sources_json` text NOT NULL,
	`workspace_json` text NOT NULL,
	`opportunities_chunk_count` integer NOT NULL,
	`orders_chunk_count` integer NOT NULL,
	FOREIGN KEY (`previous_revision`) REFERENCES `import_versions`(`revision`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "import_versions_opportunities_chunk_count_check" CHECK("import_versions"."opportunities_chunk_count" >= 0),
	CONSTRAINT "import_versions_orders_chunk_count_check" CHECK("import_versions"."orders_chunk_count" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `import_versions_revision_unique` ON `import_versions` (`revision`);