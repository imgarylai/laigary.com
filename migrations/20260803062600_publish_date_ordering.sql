DROP INDEX `idx_interview_notes_section_listing`;--> statement-breakpoint
CREATE INDEX `idx_interview_notes_published_at` ON `interview_notes` (`published_at`);--> statement-breakpoint
CREATE INDEX `idx_interview_notes_section_listing` ON `interview_notes` (`section_id`,`status`,`pinned`,`published_at`);--> statement-breakpoint
--
-- Backfill: every published row now needs a publish timestamp.
--
-- `published_at` used to be stamped only on the draft -> published transition,
-- so anything published before that existed (and every interview note, whose
-- listings ordered by `created_at`) still carries NULL. The public reads now
-- both ORDER BY and filter on `published_at` (`published_at <= now` is what
-- makes a future date a schedule), and NULL sorts last and fails that
-- comparison — a backfilled row would silently vanish from the site.
--
-- `created_at` is the honest stand-in: it is what the interview listings were
-- already ordering and dating themselves by.
UPDATE `posts` SET `published_at` = `created_at` WHERE `status` = 'published' AND `published_at` IS NULL;--> statement-breakpoint
UPDATE `interview_notes` SET `published_at` = `created_at` WHERE `status` = 'published' AND `published_at` IS NULL;
