import postgres from "postgres";
import { readFile } from "node:fs/promises";
if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL before running db:setup");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
try {
  await sql.unsafe(
    await readFile(new URL("../database/schema.sql", import.meta.url), "utf8"),
  );
  console.log(
    "Database schema ready. Products are deliberately not seeded as live inventory.",
  );
} finally {
  await sql.end();
}
