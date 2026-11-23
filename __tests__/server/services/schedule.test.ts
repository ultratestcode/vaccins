// Cas d'usage « voir ses vaccins dus » et « cocher ce qui est fait » sur
// faux dépôt : le service passe par le port, ne connaît pas la base.

import { describe, expect, it } from "vitest";
import {
  VaccinsService,
  type VaccinsRepository,
} from "@/server/services/persons";
import type { Person } from "@/server/domain/persons";
import type { RegleVaccinale } from "@/server/domain/schedule";

const TODAY = "2026-11-23";

const regle: RegleVaccinale = {
  id: "rappel-25",
  label: "Rappel dTcaPolio (25 ans)",
  kind: "obligatoire",
  echeance: { type: "annees", age: 25 },
};

const AUTRE: RegleVaccinale = {
  id: "grippe-annuel",
  label: "Grippe (annuel, dès 65 ans)",
  kind: "recommande",
  echeance: { type: "annuel", ageMin: 65 },
};

class FakeRepo implements VaccinsRepository {
  people: Person[] = [];
  done = new Map<string, Set<string>>();
  markWrites: Array<{ personId: string; ruleId: string; done: boolean }> = [];

  async add(input: { name: string; birthDate: string }): Promise<Person> {
    const p: Person = {
      id: `p${this.people.length + 1}`,
      name: input.name,
      birthDate: input.birthDate,
      createdAt: "2026-11-23T10:00:00.000Z",
      updatedAt: "2026-11-23T10:00:00.000Z",
    };
    this.people.push(p);
    return p;
  }
  async list(): Promise<Person[]> {
    return this.people;
  }
  async getById(id: string): Promise<Person | null> {
    return this.people.find((p) => p.id === id) ?? null;
  }
  async scheduleRules(): Promise<RegleVaccinale[]> {
    return [regle, AUTRE];
  }
  async markDose(input: {
    personId: string;
    ruleId: string;
    done: boolean;
  }): Promise<void> {
    this.markWrites.push(input);
    const set = this.done.get(input.personId) ?? new Set<string>();
    this.done.set(input.personId, set);
    if (input.done) set.add(input.ruleId);
    else set.delete(input.ruleId);
  }
  async doneDoses(personId: string): Promise<string[]> {
    return [...(this.done.get(personId) ?? [])];
  }
}

describe("getSchedule", () => {
  it("retourne la personne, ses doses dues et ses doses faites", async () => {
    const repo = new FakeRepo();
    const service = new VaccinsService(repo);
    const p = await service.addPerson(
      { name: "Jean", birthDate: "1996-05-10" },
      TODAY,
    );
    await service.setDoseDone(p.id, "rappel-25", true);

    const vue = await service.getSchedule(p.id, TODAY);
    expect(vue?.person.name).toBe("Jean");
    expect(vue?.due.find((d) => d.ruleId === "rappel-25")).toBeUndefined();
    expect(vue?.faites).toEqual([
      { ruleId: "rappel-25", label: "Rappel dTcaPolio (25 ans)", kind: "obligatoire" },
    ]);
  });

  it("retourne null pour une personne inconnue", async () => {
    const service = new VaccinsService(new FakeRepo());
    expect(await service.getSchedule("fantome", TODAY)).toBeNull();
  });
});

describe("setDoseDone", () => {
  it("écrit la coche pour une personne connue", async () => {
    const repo = new FakeRepo();
    const service = new VaccinsService(repo);
    const p = await service.addPerson(
      { name: "Jean", birthDate: "1996-05-10" },
      TODAY,
    );
    await service.setDoseDone(p.id, "rappel-25", true);
    expect(repo.markWrites).toEqual([
      { personId: p.id, ruleId: "rappel-25", done: true },
    ]);
  });

  it("refuse et n'écrit rien pour une personne inconnue", async () => {
    const repo = new FakeRepo();
    const service = new VaccinsService(repo);
    await expect(
      service.setDoseDone("fantome", "rappel-25", true),
    ).rejects.toThrow("Personne introuvable.");
    expect(repo.markWrites).toHaveLength(0);
  });

  it("refuse une règle qui n'existe pas dans le calendrier", async () => {
    const repo = new FakeRepo();
    const service = new VaccinsService(repo);
    const p = await service.addPerson(
      { name: "Jean", birthDate: "1996-05-10" },
      TODAY,
    );
    await expect(
      service.setDoseDone(p.id, "regle-inventee", true),
    ).rejects.toThrow("Vaccin inconnu.");
    expect(repo.markWrites).toHaveLength(0);
  });
});
