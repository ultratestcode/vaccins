// Règles métier pures du lot 1 : normalisation d'une nouvelle personne.
// Horloge injectée (today en paramètre) : aucun appel d'horloge interne.

import { describe, expect, it } from "vitest";
import { normalizeNewPersonInput } from "@/server/domain/persons";

const TODAY = "2026-11-23";

describe("normalizeNewPersonInput", () => {
  it("accepte et trimme une saisie valide", () => {
    const clean = normalizeNewPersonInput(
      { name: "  Jeanne Petit  ", birthDate: "1990-05-17" },
      TODAY,
    );
    expect(clean).toEqual({ name: "Jeanne Petit", birthDate: "1990-05-17" });
  });

  it("refuse un nom vide ou absent", () => {
    expect(() =>
      normalizeNewPersonInput({ name: "   ", birthDate: "1990-05-17" }, TODAY),
    ).toThrow("Le nom est obligatoire.");
  });

  it("refuse un format de date autre que AAAA-MM-JJ", () => {
    expect(() =>
      normalizeNewPersonInput({ name: "A", birthDate: "17/05/1990" }, TODAY),
    ).toThrow("Date de naissance invalide.");
  });

  it("refuse une date inexistante (mois ou jour hors bornes)", () => {
    expect(() =>
      normalizeNewPersonInput({ name: "A", birthDate: "2020-13-01" }, TODAY),
    ).toThrow("Date de naissance invalide.");
    expect(() =>
      normalizeNewPersonInput({ name: "A", birthDate: "2021-02-29" }, TODAY),
    ).toThrow("Date de naissance invalide.");
  });

  it("accepte le 29 février d'une année bissextile", () => {
    const clean = normalizeNewPersonInput(
      { name: "A", birthDate: "2024-02-29" },
      TODAY,
    );
    expect(clean.birthDate).toBe("2024-02-29");
  });

  it("refuse une date de naissance dans le futur", () => {
    expect(() =>
      normalizeNewPersonInput({ name: "A", birthDate: "2026-11-24" }, TODAY),
    ).toThrow("La date de naissance ne peut pas être dans le futur.");
  });

  it("accepte une naissance aujourd'hui (bornes incluses)", () => {
    const clean = normalizeNewPersonInput(
      { name: "A", birthDate: TODAY },
      TODAY,
    );
    expect(clean.birthDate).toBe(TODAY);
  });
});
