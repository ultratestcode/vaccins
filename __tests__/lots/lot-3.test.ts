// Lot 3 bout en bout sur vraie base : cocher fait disparaître la dose des
// dues, la coche survit au redémarrage, décocher la fait revenir.

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(path.join(tmpdir(), "vaccins-lot3-"));
const TODAY = "2026-11-23";

beforeAll(() => {
  process.env.VACCINS_DB_PATH = path.join(dir, "lot3.db");
});
afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

const getService = async () =>
  (await import("@/server/data/vaccins-service")).getVaccinsService();

describe("cocher les doses reçues", () => {
  it("cycle complet : due → cochée (persistée) → recochée", async () => {
    const service = await getService();
    const p = await service.addPerson(
      { name: "Bebe", birthDate: "2026-08-23" },
      TODAY,
    );

    // Due aujourd'hui (MenB 3 mois = 23/11/2026).
    let vue = await service.getSchedule(p.id, TODAY);
    expect(vue?.due.some((d) => d.ruleId === "menb-3m")).toBe(true);

    // Je la coche : elle quitte les dues, rejoint « faites ».
    await service.setDoseDone(p.id, "menb-3m", true);
    vue = await service.getSchedule(p.id, TODAY);
    expect(vue?.due.some((d) => d.ruleId === "menb-3m")).toBe(false);
    expect(vue?.faites.some((d) => d.ruleId === "menb-3m")).toBe(true);

    // La connexion du service est unique : on rouvre le fichier à la main
    // pour prouver que la coche est bien sur disque, pas en mémoire.
    const { openLocalDb, initSchema } = await import("@/server/data/db");
    const { LibsqlPersonsRepository } = await import("@/server/data/persons-repo");
    const db = openLocalDb();
    await initSchema(db);
    const relu = await new LibsqlPersonsRepository(db).doneDoses(p.id);
    db.close();
    expect(relu).toContain("menb-3m");

    // Décochée, elle revient dans les dues.
    await service.setDoseDone(p.id, "menb-3m", false);
    vue = await service.getSchedule(p.id, TODAY);
    expect(vue?.due.some((d) => d.ruleId === "menb-3m")).toBe(true);
  });
});
