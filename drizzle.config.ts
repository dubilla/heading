import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load environment-specific .env file
// Priority: explicit dotenv-cli > NODE_ENV-based > .env.local (default)
if (!process.env.DATABASE_URL) {
  const envFile =
    process.env.NODE_ENV === "production" ? ".env.production" : ".env.local";
  config({ path: envFile });
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
