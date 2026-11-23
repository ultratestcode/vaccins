// Couche domaine : filtre par type (lot 4), pur et testable.
// Comme pour la recherche de Pipeline, une valeur d'URL inconnue NE faut
// pas : elle ignore le filtre plutôt que de cacher la liste.

export type ScheduleType = "obligatoire" | "recommande";

export function normalizeScheduleType(
  value: string | null | undefined,
): ScheduleType | null {
  const v = value?.trim().toLowerCase() ?? "";
  if (v === "obligatoire" || v === "recommande") return v;
  return null; // absent, vide ou inconnu : pas de filtre
}

// Filtre générique : toute ligne portant un champ kind est filtrable.
export function filterByKind<T extends { kind: ScheduleType }>(
  items: T[],
  type: ScheduleType | null,
): T[] {
  if (!type) return items;
  return items.filter((item) => item.kind === type);
}
