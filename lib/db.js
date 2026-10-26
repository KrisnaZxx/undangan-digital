import { neon } from "@neondatabase/serverless";
import { readFileSync, existsSync } from "node:fs";

const localConfig = new URL("../config/database.local.json", import.meta.url);

function localConnection() {
  // Kredensial lokal tidak dibundel untuk deployment Vercel.
  if (process.env.VERCEL || !existsSync(localConfig)) return undefined;
  return JSON.parse(readFileSync(localConfig, "utf8")).connectionString;
}

export function getDatabase() {
  const connection = process.env.DATABASE_URL ?? localConnection();
  if (!connection) throw new Error("DATABASE_URL belum dikonfigurasi.");
  return neon(connection, {
    fetchOptions: { signal: AbortSignal.timeout(10000) },
  });
}
