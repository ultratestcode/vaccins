// Test d'intégration de la couche présentation : POST /api/persons traverse
// service puis données et écrit une vraie ligne SQLite. Pas de mock.

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(path.join(tmpdir(), "vaccins-route-test-"));

beforeAll(() => {
  // À poser avant le premier appel de getVaccinsService() (singleton lazy).
  process.env.VACCINS_DB_PATH = path.join(dir, "route.db");
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

const readPeople = async () => {
  const { openLocalDb, initSchema } = await import("@/server/data/db");
  const { LibsqlPersonsRepository } = await import("@/server/data/persons-repo");
  const db = openLocalDb();
  await initSchema(db);
  const people = await new LibsqlPersonsRepository(db).list();
  db.close();
  return people;
};

describe("POST /api/persons", () => {
  it("insère la personne en base puis redirige", async () => {
    const { POST } = await import("@/app/api/persons/route");
    const request = new Request("http://localhost/api/persons", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ name: "Jeanne", birthDate: "1990-05-17" }),
    });

    // En dehors du runtime Next, redirect() lève une erreur à digest 303.
    await expect(POST(request)).rejects.toThrow(/NEXT_REDIRECT/);

    const people = await readPeople();
    expect(people).toHaveLength(1);
    expect(people[0]).toMatchObject({
      name: "Jeanne",
      birthDate: "1990-05-17",
    });
  });

  it("refuse une saisie invalide sans rien écrire", async () => {
    const { POST } = await import("@/app/api/persons/route");
    const request = new Request("http://localhost/api/persons", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ name: "   ", birthDate: "1990-05-17" }),
    });

    await expect(POST(request)).rejects.toThrow(/NEXT_REDIRECT/);

    const people = await readPeople();
    expect(people).toHaveLength(1); // toujours la même ligne, rien d'ajouté
  });
});
