// Formatage d'affichage des dates (couche présentation uniquement).
// Les données voyagent en ISO AAAA-MM-JJ ; ici on les rend seulement en
// français. Déterministe : découpage manuel pour court, dateLocale fr-FR
// pour la version longue — jamais la locale de la machine.

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function formatDateFr(iso: string | null | undefined): string {
  if (!iso) return "—";
  const m = ISO.exec(iso);
  if (!m) return iso;
  const [, year, month, day] = m;
  return `${day}/${month}/${year}`;
}

export function formatDateLongueFr(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}
