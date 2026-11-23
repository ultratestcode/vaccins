// Cas d'usage « voir ses vaccins dus » sur faux dépôt : le service passe par
// le port pour obtenir les règles, puis délègue le calcul au domaine.

import { describe, expect, it } from "vitest";
import { VaccinsService, type VaccinsRepository } from "@/server/services/persons";
import type { Person } from "@/server/domain/persons";
import type { RegleVaccinale } from "@/server/domain/schedule";

const TODAY = "2026-11-23";

class FakeRepo implements VaccinsRepository {
  rules: RegleVaccinale[] = [
    {
      id: "rappel-25",
      label: "Rappel dTcaPolio (25 ans)",
      kind: "obligatoire",
      echeance: { type: "annees", age: 25 },
    },
  ];
  async add(): Promise<Person> {
    throw new Error("non utilisé ici");
  }
  async list(): Promise<Person[]> {
    return [];
  }
  async getById(): Promise<Person | null> {
    return null;
  }
  async scheduleRules(): Promise<RegleVaccinale[]> {
    return this.rules;
  }
}

describe("scheduleFor", () => {
  it("calcul les doses dues à partir des règles du dépôt", async () => {
    const service = new VaccinsService(new FakeRepo());
    const due = await service.scheduleFor("1996-05-10", TODAY);
    expect(due).toHaveLength(1);
    expect(due[0]).toMatchObject({
      ruleId: "rappel-25",
      dueDate: "2021-05-10",
      enRetard: true,
      kind: "obligatoire",
    });
  });
});
