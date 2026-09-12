CREATE TABLE `artifacts` (
	`learner_id` text NOT NULL,
	`artifact_id` text NOT NULL,
	`world_id` text NOT NULL,
	`unlocked_at` text NOT NULL,
	`source_mission_id` text NOT NULL,
	`code` text NOT NULL,
	PRIMARY KEY(`learner_id`, `artifact_id`)
);
--> statement-breakpoint
CREATE TABLE `code_autosave` (
	`learner_id` text NOT NULL,
	`mission_id` text NOT NULL,
	`code` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`learner_id`, `mission_id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `events_time_idx` ON `events` (`learner_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `learner_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`streak_days` integer DEFAULT 0 NOT NULL,
	`last_active_at` text,
	`last_world_id` text,
	`created_at` text NOT NULL,
	`settings` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mission_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`mission_id` text NOT NULL,
	`mission_version` integer NOT NULL,
	`mode` text DEFAULT 'mission' NOT NULL,
	`review_item_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`runs` integer DEFAULT 0 NOT NULL,
	`hints_used` integer DEFAULT 0 NOT NULL,
	`max_hint_level` integer DEFAULT 0 NOT NULL,
	`duration_ms` integer DEFAULT 0 NOT NULL,
	`final_code` text,
	`predicted` text,
	`explain_why_correct` integer,
	`test_summary` text
);
--> statement-breakpoint
CREATE INDEX `attempts_mission_idx` ON `mission_attempts` (`learner_id`,`mission_id`);--> statement-breakpoint
CREATE INDEX `attempts_status_idx` ON `mission_attempts` (`learner_id`,`status`);--> statement-breakpoint
CREATE TABLE `review_items` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`mission_id` text NOT NULL,
	`interval_idx` integer DEFAULT 0 NOT NULL,
	`next_review_at` text NOT NULL,
	`last_result` text,
	`reviews_done` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `review_due_idx` ON `review_items` (`learner_id`,`next_review_at`);--> statement-breakpoint
CREATE TABLE `skill_state` (
	`learner_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`understanding` real DEFAULT 0 NOT NULL,
	`recall` real DEFAULT 0 NOT NULL,
	`application` real DEFAULT 0 NOT NULL,
	`independence` real DEFAULT 0 NOT NULL,
	`times_practiced` integer DEFAULT 0 NOT NULL,
	`reviews_done` integer DEFAULT 0 NOT NULL,
	`interval_idx` integer DEFAULT 0 NOT NULL,
	`last_practiced_at` text,
	`next_review_at` text,
	PRIMARY KEY(`learner_id`, `skill_id`)
);
--> statement-breakpoint
CREATE TABLE `tutor_interactions` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`attempt_id` text,
	`mission_id` text,
	`role` text NOT NULL,
	`mode` text NOT NULL,
	`content` text NOT NULL,
	`hint_level` integer,
	`provider` text NOT NULL,
	`tokens_in` integer DEFAULT 0 NOT NULL,
	`tokens_out` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tutor_attempt_idx` ON `tutor_interactions` (`attempt_id`);--> statement-breakpoint
CREATE INDEX `tutor_day_idx` ON `tutor_interactions` (`learner_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `world_state` (
	`learner_id` text NOT NULL,
	`world_id` text NOT NULL,
	`operational_pct` integer DEFAULT 0 NOT NULL,
	`layers` text NOT NULL,
	`stats` text NOT NULL,
	`unlocked` integer DEFAULT false NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`learner_id`, `world_id`)
);
