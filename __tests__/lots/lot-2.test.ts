// Lot 2 bout en bout sur vraie base temporaire : les cinq profils de
// docs/lots.md, avec le CALENDRIER RÉEL servi par le dépôt.

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(path.join(tmpdir(), "vaccins-lot2-"));
const TODAY = "2026-11-23";

beforeAll(() => {
  process.env.VACCINS_DB_PATH = path.join(dir, "lot2.db");
});
afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

const scheduleFor = async (birthDate: string) => {
  const { getVaccinsService } = await import("@/server/data/vaccins-service");
  const service = await getVaccinsService();
  return service.scheduleFor(birthDate, TODAY);
};

const have = (due: { ruleId: string }[], prefix: string) =>
  due.some((d) => d.ruleId.startsWith(prefix));

describe("les cinq profils du lot 2 (calendrier réel)", () => {
  it("nourrisson de 3 mois : 2e dose combinée à venir, MenB de 3 mois dû aujourd'hui", async () => {
    const due = await scheduleFor("2026-08-23");
    const deuxieme = due.find((d) => d.ruleId === "combi-4m");
    expect(deuxieme).toMatchObject({ dueDate: "2026-12-23", enRetard: false });
    const menb = due.find((d) => d.ruleId === "menb-3m");
    // Échéance exactement aujourd'hui : due, mais pas encore en retard.
    expect(menb).toMatchObject({ dueDate: TODAY, enRetard: false, kind: "obligatoire" });
    // La dose de 2 mois, elle, est bien passée : en retard.
    expect(due.find((d) => d.ruleId === "combi-2m")).toMatchObject({
      enRetard: true,
    });
  });

  it("adulte de 30 ans : rappel de 25 ans en retard, pas encore celui de 45", async () => {
    const due = await scheduleFor("1996-05-10");
    expect(due.find((d) => d.ruleId === "dtcapolio-25")).toMatchObject({
      dueDate: "2021-05-10",
      enRetard: true,
    });
    expect(have(due, "dtcapolio-45")).toBe(false);
  });

  it("ado de 12 ans : HPV dû, badge recommandé", async () => {
    const due = await scheduleFor("2014-03-02");
    expect(due.find((d) => d.ruleId === "hpv-11")).toMatchObject({
      kind: "recommande",
    });
  });

  it("né en 1990 sans ROR : le rattrapage ROR figure", async () => {
    const due = await scheduleFor("1990-07-07");
    expect(have(due, "ror-rattrapage")).toBe(true);
  });

  it("personne de 70 ans : grippe annuelle et zona figurent", async () => {
    const due = await scheduleFor("1956-02-01");
    expect(have(due, "grippe")).toBe(true);
    expect(have(due, "zona")).toBe(true);
  });

  it("le calendrier réel est sourcé et daté", async () => {
    const { CALENDRIER_FRANCE, SOURCE_CALENDRIER } = await import(
      "@/server/data/calendrier"
    );
    expect(CALENDRIER_FRANCE.length).toBeGreaterThan(10);
    expect(CALENDRIER_FRANCE.every((r) => r.id && r.label && r.kind)).toBe(true);
    expect(SOURCE_CALENDRIER).toMatch("ameli.fr");
  });
});
