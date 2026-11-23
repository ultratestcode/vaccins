// Route POST /api/persons/doses : cocher/décocher traverse service puis
// données, écrit une vraie ligne, et survit à une réouverture de base.

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { openLocalDb, initSchema } from "@/server/data/db";
import { LibsqlPersonsRepository } from "@/server/data/persons-repo";

const dir = mkdtempSync(path.join(tmpdir(), "vaccins-doses-route-"));
let personId = "";

beforeAll(async () => {
  process.env.VACCINS_DB_PATH = path.join(dir, "doses.db");
  const db = openLocalDb();
  await initSchema(db);
  const repo = new LibsqlPersonsRepository(db);
  const p = await repo.add({ name: "Jean", birthDate: "1996-05-10" });
  personId = p.id;
  db.close();
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

const post = async (fields: Record<string, string>) =>
  (await import("@/app/api/persons/doses/route")).POST(
    new Request("http://localhost/api/persons/doses", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fields),
    }),
  );

describe("POST /api/persons/doses", () => {
  it("coche une dose : ligne écrite, redirect, survit à une réouverture", async () => {
    await expect(
      post({ personId, ruleId: "dtcapolio-25", done: "1" }),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    // Réouverture du fichier : la coche est toujours là, la dose quitte les dues.
    const db = openLocalDb();
    await initSchema(db);
    const repo = new LibsqlPersonsRepository(db);
    expect(await repo.doneDoses(personId)).toEqual(["dtcapolio-25"]);
    db.close();
  });

  it("décoche la dose quand done=0", async () => {
    await expect(
      post({ personId, ruleId: "dtcapolio-25", done: "0" }),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    const db = openLocalDb();
    await initSchema(db);
    const repo = new LibsqlPersonsRepository(db);
    expect(await repo.doneDoses(personId)).toEqual([]);
    db.close();
  });

  it("refuse une personne inconnue sans rien écrire", async () => {
    await expect(
      post({ personId: "fantome", ruleId: "dtcapolio-25", done: "1" }),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    const db = openLocalDb();
    await initSchema(db);
    const repo = new LibsqlPersonsRepository(db);
    expect(await repo.doneDoses("fantome")).toEqual([]);
    db.close();
  });
});
