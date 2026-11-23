// Couche service : cas d'usage. Elle ne connaît la base que par ce port
// (aucun import de @libsql ni de next — règle .claude/rules/service.md).

import type { NewPersonInput, Person } from "@/server/domain/persons";
import { normalizeNewPersonInput } from "@/server/domain/persons";

export interface VaccinsRepository {
  add(input: { name: string; birthDate: string }): Promise<Person>;
  list(): Promise<Person[]>;
  getById(id: string): Promise<Person | null>;
}

export class VaccinsService {
  constructor(private readonly repo: VaccinsRepository) {}

  // La règle s'exécute AVANT toute écriture : un refus ne touche jamais la
  // base (prouvé par le test sur faux dépôt).
  async addPerson(input: NewPersonInput, today: string): Promise<Person> {
    const clean = normalizeNewPersonInput(input, today);
    return this.repo.add(clean);
  }

  async listPersons(): Promise<Person[]> {
    return this.repo.list();
  }
}
