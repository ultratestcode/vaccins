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
  markDose(input: {
    personId: string;
    ruleId: string;
    done: boolean;
  }): Promise<void>;
  doneDoses(personId: string): Promise<string[]>;
}

// Vue complète de l'écran détail : la personne, ce qui reste dû, ce qui est
// déjà reçu (avec les libellés du calendrier).
export type ScheduleVue = {
  person: Person;
  due: DoseAttendue[];
  faites: Array<{
    ruleId: string;
    label: string;
    kind: "obligatoire" | "recommande";
  }>;
};

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

  // Lot 3 : la vue de l'écran détail. null si la personne n'existe pas.
  async getSchedule(personId: string, today: string): Promise<ScheduleVue | null> {
    const person = await this.repo.getById(personId);
    if (!person) return null;
    const [rules, doneIds] = await Promise.all([
      this.repo.scheduleRules(),
      this.repo.doneDoses(personId),
    ]);
    return {
      person,
      due: computeDueDoses(person.birthDate, rules, today, doneIds),
      faites: rules
        .filter((r) => doneIds.includes(r.id))
        .map((r) => ({ ruleId: r.id, label: r.label, kind: r.kind })),
    };
  }

  // Cocher/décocher une dose. La personne et la règle sont vérifiées AVANT
  // écriture : un refus ne touche jamais la base.
  async setDoseDone(
    personId: string,
    ruleId: string,
    done: boolean,
  ): Promise<void> {
    const person = await this.repo.getById(personId);
    if (!person) throw new Error("Personne introuvable.");
    const rules = await this.repo.scheduleRules();
    if (!rules.some((r) => r.id === ruleId)) throw new Error("Vaccin inconnu.");
    await this.repo.markDose({ personId, ruleId, done });
  }
}
