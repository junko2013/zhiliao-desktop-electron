CREATE TABLE `post` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` integer PRIMARY KEY DEFAULT 0 NOT NULL,
	`account` text DEFAULT '' NOT NULL,
	`nickname` text DEFAULT '' NOT NULL,
	`age` integer DEFAULT 0 NOT NULL
);
