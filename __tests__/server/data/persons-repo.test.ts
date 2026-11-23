// Persistance prouvée sur VRAIE base (jamais de mock ici) : insert →
// fermeture → réouverture du fichier → la personne est toujours là.

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { openLocalDb, initSchema } from "@/server/data/db";
import { LibsqlPersonsRepository } from "@/server/data/persons-repo";

const dir = mkdtempSync(path.join(tmpdir(), "vaccins-repo-test-"));
const dbPath = path.join(dir, "persons.db");

const repoOn = async () => {
  const db = openLocalDb(dbPath);
  await initSchema(db);
  return { db, repo: new LibsqlPersonsRepository(db) };
};

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("LibsqlPersonsRepository", () => {
  it("ajoute et liste les personnes dans l'ordre de création", async () => {
    const { db, repo } = await repoOn();
    await repo.add({ name: "Jeanne", birthDate: "1990-05-17" });
    await repo.add({ name: "Marc", birthDate: "2024-01-08" });
    const people = await repo.list();
    db.close();
    expect(people.map((p) => p.name)).toEqual(["Jeanne", "Marc"]);
  });

  it("survit à une fermeture puis réouverture du fichier", async () => {
    const first = await repoOn();
    const created = await first.repo.add({
      name: "Après redémarrage",
      birthDate: "2000-02-29",
    });
    first.db.close();

    // Réouverture du MÊME fichier : nouvelle connexion, données reluées.
    const second = await repoOn();
    const found = await second.repo.getById(created.id);
    second.db.close();

    expect(found).toMatchObject({
      name: "Après redémarrage",
      birthDate: "2000-02-29",
    });
  });

  it("retourne null pour un identifiant inconnu", async () => {
    const { db, repo } = await repoOn();
    const found = await repo.getById("inconnu");
    db.close();
    expect(found).toBeNull();
  });
});
