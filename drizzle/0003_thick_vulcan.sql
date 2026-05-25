CREATE TYPE "public"."todo_origin" AS ENUM('heading', 'crew');--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "origin" "todo_origin" DEFAULT 'heading' NOT NULL;