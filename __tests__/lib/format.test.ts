// Formatage d'affichage des dates (couche présentation) : les données
// restent en ISO AAAA-MM-JJ, seul le rendu change. Déterministe, sans
// dépendre de la locale de la machine.

import { describe, expect, it } from "vitest";
import { formatDateFr, formatDateLongueFr } from "@/lib/format";

describe("formatDateFr", () => {
  it("convertit AAAA-MM-JJ en JJ/MM/AAAA", () => {
    expect(formatDateFr("2026-11-23")).toBe("23/11/2026");
    expect(formatDateFr("1996-05-10")).toBe("10/05/1996");
  });

  it("remplace une valeur absente par un tiret demi-cadratin", () => {
    expect(formatDateFr(null)).toBe("—");
    expect(formatDateFr(undefined)).toBe("—");
  });

  it("laisse passer une valeur déjà illisible sans crasher", () => {
    expect(formatDateFr("pas-une-date")).toBe("pas-une-date");
  });
});

describe("formatDateLongueFr", () => {
  it("écrit le mois en toutes lettres", () => {
    expect(formatDateLongueFr("2026-11-23")).toBe("23 novembre 2026");
  });

  it("remplace une valeur absente par un tiret", () => {
    expect(formatDateLongueFr(null)).toBe("—");
  });
});
