ALTER TABLE "usuarios" ADD COLUMN "reset_token" varchar(255);--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "reset_token_expires" timestamp;