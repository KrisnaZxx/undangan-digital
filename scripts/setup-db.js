import { readFile } from "node:fs/promises";
import { getDatabase } from "../lib/db.js";

const schema = await readFile(
  new URL("../database/schema.sql", import.meta.url),
  "utf8",
);
try {
  const sql = getDatabase();
  const statements = schema
    .split(/;\s*(?:\r?\n|$)/)
    .map((part) => part.trim())
    .filter(Boolean);
  await sql.transaction(statements.map((statement) => sql.query(statement)));
  console.log("Tabel RSVP dan ucapan siap digunakan.");
} catch {
  console.error(
    "Setup database gagal. Periksa DATABASE_URL dan koneksi jaringan.",
  );
  process.exitCode = 1;
}
