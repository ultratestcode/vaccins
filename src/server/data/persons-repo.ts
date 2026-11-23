// Implémentation libsql du port VaccinsRepository. Le SQL est entièrement
// paramétré ; les horodatages sont écrits ici (la couche données est seule à
// lire l'horloge).

import { randomUUID } from "node:crypto";
import type { Client, InValue } from "@libsql/client";
import type { Person } from "@/server/domain/persons";
import type { RegleVaccinale } from "@/server/domain/schedule";
import type { VaccinsRepository } from "@/server/services/persons";
import { CALENDRIER_FRANCE } from "@/server/data/calendrier";

const SELECT_PERSON = `
  SELECT id, name, birth_date, created_at, updated_at
  FROM persons
`;

function toPerson(row: Record<string, InValue | undefined>): Person {
  return {
    id: String(row.id),
    name: String(row.name),
    birthDate: String(row.birth_date),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export class LibsqlPersonsRepository implements VaccinsRepository {
  constructor(private readonly db: Client) {}

  async add(input: { name: string; birthDate: string }): Promise<Person> {
    const now = new Date().toISOString();
    const person: Person = {
      id: randomUUID(),
      name: input.name,
      birthDate: input.birthDate,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.execute({
      sql: `INSERT INTO persons (id, name, birth_date, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        person.id,
        person.name,
        person.birthDate,
        person.createdAt,
        person.updatedAt,
      ],
    });
    return person;
  }

  async list(): Promise<Person[]> {
    const result = await this.db.execute({
      sql: `${SELECT_PERSON} ORDER BY created_at ASC`,
      args: [],
    });
    return result.rows.map((row) => toPerson(row as Record<string, InValue>));
  }

  async getById(id: string): Promise<Person | null> {
    const result = await this.db.execute({
      sql: `${SELECT_PERSON} WHERE id = ?`,
      args: [id],
    });
    const row = result.rows[0];
    return row ? toPerson(row as Record<string, InValue>) : null;
  }

  // Le calendrier est une donnée versionnée, pas une table : le dépôt la
  // sert par le port pour que le domaine la reçoive en paramètre.
  async scheduleRules(): Promise<RegleVaccinale[]> {
    return CALENDRIER_FRANCE;
  }
}
