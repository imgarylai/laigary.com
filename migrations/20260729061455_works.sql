CREATE TABLE `work_tags` (
	`work_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`work_id`, `tag_id`),
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_work_tags_tag_id` ON `work_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `works` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`content_md` text DEFAULT '' NOT NULL,
	`cover_image_url` text,
	`project_url` text,
	`repo_url` text,
	`role` text,
	`year` integer NOT NULL,
	`end_year` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`pinned` integer DEFAULT 0 NOT NULL,
	`published_at` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `works_slug_unique` ON `works` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_works_status_published` ON `works` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `idx_works_slug` ON `works` (`slug`);