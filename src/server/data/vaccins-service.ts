// Câblage : la seule porte d'entrée de src/app/ vers les données. Une
// connexion par process, schéma initialisé une fois (lazy).

import type { Client } from "@libsql/client";
import { openDb, initSchema } from "@/server/data/db";
import { LibsqlPersonsRepository } from "@/server/data/persons-repo";
import { VaccinsService } from "@/server/services/persons";

let service: VaccinsService | null = null;
let starting: Promise<VaccinsService> | null = null;

export function getVaccinsService(): Promise<VaccinsService> {
  if (service) return Promise.resolve(service);
  if (!starting) {
    starting = (async () => {
      const db: Client = openDb();
      await initSchema(db);
      service = new VaccinsService(new LibsqlPersonsRepository(db));
      return service;
    })();
  }
  return starting;
}
