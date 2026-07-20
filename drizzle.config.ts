import { defineConfig } from "drizzle-kit";

// D1 is SQLite under the hood. `prefix: "timestamp"` makes future
// `drizzle-kit generate` migrations use a YYYYMMDDHHMMSS filename prefix
// (the existing migrations were renamed to match).
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema",
  out: "./migrations",
  migrations: {
    prefix: "timestamp",
  },
});
