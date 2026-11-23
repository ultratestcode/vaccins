// Cas d'usage du lot 1 sur faux dépôt : la couche service ne connaît la
// base que par le port VaccinsRepository (aucun import de la base).

import { describe, expect, it } from "vitest";
import { VaccinsService, type VaccinsRepository } from "@/server/services/persons";
import type { Person } from "@/server/domain/persons";
import type { RegleVaccinale } from "@/server/domain/schedule";

const TODAY = "2026-11-23";

class FakeRepo implements VaccinsRepository {
  added: Array<{ name: string; birthDate: string }> = [];
  people: Person[] = [];

  async add(input: { name: string; birthDate: string }): Promise<Person> {
    this.added.push(input);
    const person: Person = {
      id: `p${this.added.length}`,
      name: input.name,
      birthDate: input.birthDate,
      createdAt: "2026-11-23T10:00:00.000Z",
      updatedAt: "2026-11-23T10:00:00.000Z",
    };
    this.people.push(person);
    return person;
  }

  async list(): Promise<Person[]> {
    return this.people;
  }

  async getById(id: string): Promise<Person | null> {
    return this.people.find((p) => p.id === id) ?? null;
  }
  async scheduleRules(): Promise<RegleVaccinale[]> {
    return [];
  }
  async markDose(): Promise<void> {
    /* non utilisé ici */
  }
  async doneDoses(): Promise<string[]> {
    return [];
  }
}

describe("addPerson", () => {
  it("écrit la personne normalisée quand la saisie est valide", async () => {
    const repo = new FakeRepo();
    const service = new VaccinsService(repo);
    const created = await service.addPerson(
      { name: "  Jeanne  ", birthDate: "1990-05-17" },
      TODAY,
    );
    expect(created).toMatchObject({ name: "Jeanne", birthDate: "1990-05-17" });
    expect(repo.added).toEqual([{ name: "Jeanne", birthDate: "1990-05-17" }]);
  });

  it("refuse et n'écrit rien quand le nom est vide", async () => {
    const repo = new FakeRepo();
    const service = new VaccinsService(repo);
    await expect(
      service.addPerson({ name: "  ", birthDate: "1990-05-17" }, TODAY),
    ).rejects.toThrow("Le nom est obligatoire.");
    expect(repo.added).toHaveLength(0);
  });

  it("refuse et n'écrit rien quand la date est invalide", async () => {
    const repo = new FakeRepo();
    const service = new VaccinsService(repo);
    await expect(
      service.addPerson({ name: "A", birthDate: "2026-11-24" }, TODAY),
    ).rejects.toThrow("La date de naissance ne peut pas être dans le futur.");
    expect(repo.added).toHaveLength(0);
  });
});

describe("listPersons", () => {
  it("retourne exactement ce que dit le dépôt", async () => {
    const repo = new FakeRepo();
    const service = new VaccinsService(repo);
    await service.addPerson({ name: "Jeanne", birthDate: "1990-05-17" }, TODAY);
    await service.addPerson({ name: "Marc", birthDate: "2024-01-08" }, TODAY);
    const people = await service.listPersons();
    expect(people.map((p) => p.name)).toEqual(["Jeanne", "Marc"]);
  });
});
