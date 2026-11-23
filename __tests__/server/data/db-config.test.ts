// Choix du moteur de base (pur, sans ouvrir de connexion) : la bascule
// SQLite local ↔ Turso est décidée uniquement par resolveDbConfig.

import { describe, expect, it } from "vitest";
import path from "node:path";
import { resolveDbConfig } from "@/server/data/db";

describe("resolveDbConfig", () => {
  it("retombe sur le fichier par défaut sans variable", () => {
    const config = resolveDbConfig({});
    expect(config).toEqual({
      kind: "file",
      path: path.join(process.cwd(), "data", "vaccins.db"),
    });
  });

  it("utilise VACCINS_DB_PATH pour le fichier local", () => {
    const config = resolveDbConfig({ VACCINS_DB_PATH: "/tmp/ma-base.db" });
    expect(config).toEqual({ kind: "file", path: "/tmp/ma-base.db" });
  });

  it("choisit Turso dès que TURSO_URL est posé", () => {
    const config = resolveDbConfig({
      TURSO_URL: "libsql://exemple.test.turso.io",
      TURSO_AUTH_TOKEN: "  jeton  ",
    });
    expect(config).toEqual({
      kind: "turso",
      url: "libsql://exemple.test.turso.io",
      authToken: "jeton",
    });
  });

  it("ignore un TURSO_URL vide (espaces compris)", () => {
    const config = resolveDbConfig({ TURSO_URL: "   " });
    expect(config.kind).toBe("file");
  });
});
