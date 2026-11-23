// Couche service : cas d'usage. Elle ne connaît la base que par ce port
// (aucun import de @libsql ni de next — règle .claude/rules/service.md).

import type { NewPersonInput, Person } from "@/server/domain/persons";
import { normalizeNewPersonInput } from "@/server/domain/persons";
import type {
  DoseAttendue,
  RegleVaccinale,
} from "@/server/domain/schedule";
import { computeDueDoses } from "@/server/domain/schedule";

export interface VaccinsRepository {
  add(input: { name: string; birthDate: string }): Promise<Person>;
  list(): Promise<Person[]>;
  getById(id: string): Promise<Person | null>;
  // Le calendrier est une donnée de la couche données, servie par le port :
  // le domaine le reçoit en paramètre, il ne l'importe pas.
  scheduleRules(): Promise<RegleVaccinale[]>;
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

  // Lot 2 : les doses dues d'une date de naissance, calculées par le domaine
  // avec les règles servies par le dépôt. today arrive de l'appelant.
  async scheduleFor(
    birthDate: string,
    today: string,
  ): Promise<DoseAttendue[]> {
    const rules = await this.repo.scheduleRules();
    return computeDueDoses(birthDate, rules, today);
  }

  async getPerson(id: string): Promise<Person | null> {
    return this.repo.getById(id);
  }
}
