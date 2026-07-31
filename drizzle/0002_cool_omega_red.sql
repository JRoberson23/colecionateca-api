ALTER TABLE "produtos" ADD COLUMN "categoria" varchar(50);--> statement-breakpoint
ALTER TABLE "produtos" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "produtos" DROP COLUMN "console";--> statement-breakpoint
ALTER TABLE "produtos" DROP COLUMN "ano";