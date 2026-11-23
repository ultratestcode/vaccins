// Couche données : seul endroit du projet qui parle à la base.
// Dev : fichier SQLite local. Prod : Turso via url/authToken — seul ce
// fichier changera à la migration (INTENT.md, Architecture).

import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "vaccins.db");

// Choix du moteur, seul endroit du projet où il se décide (règle données).
// Turso dès que TURSO_URL est posé (prod Vercel) ; sinon fichier local
// (dev et tests).
export type DbConfig =
  | { kind: "file"; path: string }
  | { kind: "turso"; url: string; authToken?: string };

type DbEnv = { [key: string]: string | undefined };

export function resolveDbConfig(env: DbEnv = process.env): DbConfig {
  const url = env.TURSO_URL?.trim();
  if (url) {
    return { kind: "turso", url, authToken: env.TURSO_AUTH_TOKEN?.trim() };
  }
  return { kind: "file", path: env.VACCINS_DB_PATH ?? DEFAULT_DB_PATH };
}

export function openDb(env?: DbEnv): Client {
  const config = resolveDbConfig(env);
  if (config.kind === "turso") {
    return createClient({ url: config.url, authToken: config.authToken });
  }
  return openLocalDb(config.path);
}

export function openLocalDb(
  dbPath = process.env.VACCINS_DB_PATH ?? DEFAULT_DB_PATH,
): Client {
  mkdirSync(path.dirname(dbPath), { recursive: true });
  return createClient({ url: `file:${dbPath}` });
}

export async function initSchema(db: Client): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS persons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  // Lot 3 : doses déjà reçues, une ligne par (personne, règle).
  await db.execute(`
    CREATE TABLE IF NOT EXISTS done_doses (
      person_id TEXT NOT NULL REFERENCES persons(id),
      rule_id TEXT NOT NULL,
      done_at TEXT NOT NULL,
      PRIMARY KEY (person_id, rule_id)
    )
  `);
}
