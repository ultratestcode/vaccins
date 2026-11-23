// Filtre par type (lot 4) : normalisation depuis l'URL et application aux
// listes. Règle métier pure, testée sans base ni page.

import { describe, expect, it } from "vitest";
import {
  normalizeScheduleType,
  filterByKind,
} from "@/server/domain/schedule-filter";

const doses = [
  { id: "a", kind: "obligatoire" as const },
  { id: "b", kind: "recommande" as const },
  { id: "c", kind: "obligatoire" as const },
];

describe("normalizeScheduleType", () => {
  it("absent ou vide = pas de filtre", () => {
    expect(normalizeScheduleType(null)).toBeNull();
    expect(normalizeScheduleType("")).toBeNull();
    expect(normalizeScheduleType("   ")).toBeNull();
  });

  it("accepte les deux types, trimé et en minuscules", () => {
    expect(normalizeScheduleType(" Obligatoire ")).toBe("obligatoire");
    expect(normalizeScheduleType("RECOMMANDE")).toBe("recommande");
  });

  it("une valeur inconnue ignore le filtre plutôt que de tout cacher", () => {
    expect(normalizeScheduleType("rouge")).toBeNull();
  });
});

describe("filterByKind", () => {
  it("sans type, tout passe", () => {
    expect(filterByKind(doses, null)).toHaveLength(3);
  });

  it("obligatoire ne garde que les obligatoires", () => {
    expect(filterByKind(doses, "obligatoire").map((d) => d.id)).toEqual([
      "a",
      "c",
    ]);
  });

  it("recommande ne garde que les recommandés", () => {
    expect(filterByKind(doses, "recommande").map((d) => d.id)).toEqual(["b"]);
  });
});
