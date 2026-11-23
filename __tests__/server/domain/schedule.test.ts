// Logique pure de calcul des doses dues, sur jeu de règles injecté et
// horloge figée : le domaine ne lit jamais l'horloge ni le calendrier.

import { describe, expect, it } from "vitest";
import {
  addMois,
  addAnnees,
  computeDueDoses,
  type RegleVaccinale,
} from "@/server/domain/schedule";

const TODAY = "2026-11-23";

const regles: RegleVaccinale[] = [
  {
    id: "combi-4m",
    label: "Diphtérie tétanos poliomyélite (2e dose)",
    kind: "obligatoire",
    echeance: { type: "mois", mois: 4 },
  },
  {
    id: "rappel-25",
    label: "Rappel dTcaPolio (25 ans)",
    kind: "obligatoire",
    echeance: { type: "annees", age: 25 },
  },
  {
    id: "rappel-45",
    label: "Rappel dTcaPolio (45 ans)",
    kind: "obligatoire",
    echeance: { type: "annees", age: 45 },
  },
  {
    id: "hpv-11",
    label: "HPV (1re dose)",
    kind: "recommande",
    echeance: { type: "annees", age: 11, ageMax: 26 },
  },
  {
    id: "grippe-65",
    label: "Grippe (annuel, dès 65 ans)",
    kind: "recommande",
    echeance: { type: "annuel", ageMin: 65 },
  },
  {
    id: "ror-apres-1980",
    label: "ROR (nés après 1980)",
    kind: "recommande",
    echeance: { type: "ne_apres", annee: 1980 },
  },
];

const ids = (naissance: string) =>
  computeDueDoses(naissance, regles, TODAY).map((d) => d.ruleId);

describe("addMois / addAnnees (arithmétique de dates civile, sans Date)", () => {
  it("ajoute des mois en changeant d'année si nécessaire", () => {
    expect(addMois("2026-01-31", 2)).toBe("2026-03-31");
    expect(addMois("2026-11-15", 4)).toBe("2027-03-15");
  });

  it("ramène le 29 février au 28 février non bissextile", () => {
    expect(addMois("2024-08-29", 6)).toBe("2025-02-28");
    expect(addAnnees("2024-02-29", 1)).toBe("2025-02-28");
  });
});

describe("computeDueDoses", () => {
  it("nourrisson de 3 mois : la dose de 4 mois est à venir, celle de 2 mois est en retard", () => {
    const due = computeDueDoses("2026-08-23", regles, TODAY);
    const combi = due.find((d) => d.ruleId === "combi-4m");
    expect(combi).toBeDefined();
    expect(combi?.dueDate).toBe("2026-12-23");
    expect(combi?.enRetard).toBe(false);
  });

  it("adulte de 30 ans : rappel de 25 ans en retard, celui de 45 ans pas encore visible", () => {
    const due = computeDueDoses("1996-05-10", regles, TODAY);
    const r25 = due.find((d) => d.ruleId === "rappel-25");
    expect(r25?.dueDate).toBe("2021-05-10");
    expect(r25?.enRetard).toBe(true);
    expect(due.find((d) => d.ruleId === "rappel-45")).toBeUndefined();
  });

  it("rappel imminent (dans moins d'un an) : visible, non en retard", () => {
    // 44 ans depuis mai, 45 ans en mai 2027 : le rappel arrive.
    const due = computeDueDoses("1982-05-10", regles, TODAY);
    const r45 = due.find((d) => d.ruleId === "rappel-45");
    expect(r45?.dueDate).toBe("2027-05-10");
    expect(r45?.enRetard).toBe(false);
  });

  it("ado de 12 ans : HPV dû et recommandé ; adulte de 36 ans : HPV sauté", () => {
    expect(ids("2014-03-02")).toContain("hpv-11");
    expect(ids("1990-03-02")).not.toContain("hpv-11");
  });

  it("senior de 70 ans : grippe annuelle due ; 64 ans : absente", () => {
    const due = computeDueDoses("1956-02-01", regles, TODAY);
    const grippe = due.find((d) => d.ruleId === "grippe-65");
    expect(grippe?.dueDate).toBe("2026-02-01");
    expect(grippe?.enRetard).toBe(true);
    expect(ids("1962-02-01")).not.toContain("grippe-65");
  });

  it("ROR : né en 1990 concerné, né en 1979 non", () => {
    expect(ids("1990-07-07")).toContain("ror-apres-1980");
    expect(ids("1979-07-07")).not.toContain("ror-apres-1980");
  });

  it("les doses sont triées par date croissante", () => {
    const due = computeDueDoses("1996-05-10", regles, TODAY);
    const dates = due.map((d) => d.dueDate);
    expect([...dates].sort()).toEqual(dates);
  });
});
