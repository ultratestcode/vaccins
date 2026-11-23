// Jeu de démonstration : les quatre profils du plan — nourrisson avec
// doses échues, ado avec HPV manquant, adulte à jour, senior avec rappels
// dus. Les écritures passent par l'API HTTP du serveur de dev — le vrai
// chemin présentation → service → données ; les lectures (existence, ids)
// sont en lecture seule sur la base active. Les deux modes sont gérés :
// SQLite local ou Turso, selon .env.local. Idempotent : une personne
// existante est ignorée.
//
// Usage : pnpm dev lancé, puis « node scripts/seed-demo.mjs »
// (BASE=http://127.0.0.1:3001 pour un autre port).

import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const BASE = process.env.BASE ?? "http://127.0.0.1:3001";

// .env.local : mêmes règles que Next (dernière valeur gagnante, # = commentaire).
const env = {};
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trimStart().startsWith("#")) env[m[1]] = m[2];
  }
} catch {
  /* pas de .env.local : mode fichier par défaut */
}

const db = env.TURSO_URL
  ? createClient({ url: env.TURSO_URL, authToken: env.TURSO_AUTH_TOKEN })
  : createClient({ url: `file:${env.VACCINS_DB_PATH || "data/vaccins.db"}` });

async function post(path, fields) {
  await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields),
    redirect: "manual",
  });
}

// Naissance : nombre d'années + jour près dans le passé, en ISO.
const naissance = (annees, jours = 0) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - annees);
  d.setDate(d.getDate() - jours);
  return d.toISOString().slice(0, 10);
};

async function addPerson(name, birthDate, dosesFaite) {
  const found = await db.execute({
    sql: "SELECT id FROM persons WHERE name = ?",
    args: [name],
  });
  if (found.rows.length > 0) {
    console.log(`  existante : ${name}`);
    return;
  }
  await post("/api/persons", { name, birthDate });
  const created = await db.execute({
    sql: "SELECT id FROM persons WHERE name = ?",
    args: [name],
  });
  const id = String(created.rows[0]?.id ?? "");
  if (!id) throw new Error(`personne non relue après ajout : ${name}`);
  for (const ruleId of dosesFaite) {
    await post("/api/persons/doses", { personId: id, ruleId, done: "1" });
  }
  console.log(
    `  ajoutée  : ${name} (née le ${birthDate}, ${dosesFaite.length} dose(s) cochée(s))`,
  );
}

console.log(
  `Seed démo sur ${BASE} (${env.TURSO_URL ? "Turso" : "SQLite local"})`,
);

// Nourrisson ~4 mois : premières doses échues et cochées, suivantes à venir.
await addPerson("Jeanne Petit", naissance(0, 124), ["combi-2m", "menb-3m"]);
// Ado 14 ans : primos vaccinales faites, HPV laissé volontairement manquant.
await addPerson("Lucas Moreau", naissance(14), [
  "dtcapolio-12",
  "ror-12m",
  "menb-12m",
]);
// Adulte 30 ans : rappels faits, rien de dû dans l'année.
await addPerson("Sophie Bernard", naissance(30), ["dtcapolio-25"]);
// Senior 70 ans : rappel 65 ans fait, grippe et zona dus.
await addPerson("Marcel Girard", naissance(70), ["dtcapolio-65"]);

db.close();
console.log(`Voir ${BASE}/vaccins`);
