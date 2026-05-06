ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "oauth_provider" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "oauth_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "oauth_picture" text;