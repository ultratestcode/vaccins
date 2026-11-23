// Détail d'une personne : doses dues (avec coche) et doses déjà reçues
// (avec annulation). Écritures via /api/persons/doses puis redirect.

import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getVaccinsService } from "@/server/data/vaccins-service";
import type { DoseAttendue } from "@/server/domain/schedule";
import {
  filterByKind,
  normalizeScheduleType,
  type ScheduleType,
} from "@/server/domain/schedule-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Page pilotée par les params, les searchParams et la base : rendu bloquant.
export const instant = false;

function KindBadge({ kind }: { kind: "obligatoire" | "recommande" }) {
  return (
    <Badge variant={kind === "obligatoire" ? "default" : "outline"}>
      {kind === "obligatoire" ? "Obligatoire" : "Recommandé"}
    </Badge>
  );
}

// Une ligne de dose due : ses infos + le bouton qui la marque reçue.
function DueRow({
  dose,
  personId,
}: {
  dose: DoseAttendue;
  personId: string;
}) {
  return (
    <TableRow>
      <TableCell className="py-3 font-medium">{dose.label}</TableCell>
      <TableCell className="py-3 text-muted-foreground tabular-nums">
        {dose.dueDate}
        {dose.enRetard ? (
          <span className="ml-1.5 text-destructive">en retard</span>
        ) : null}
      </TableCell>
      <TableCell className="py-3 text-right">
        <KindBadge kind={dose.kind} />
      </TableCell>
      <TableCell className="py-3 text-right">
        <form action="/api/persons/doses" method="post">
          <input type="hidden" name="personId" value={personId} />
          <input type="hidden" name="ruleId" value={dose.ruleId} />
          <input type="hidden" name="done" value="1" />
          <Button type="submit" variant="outline" size="sm">
            Coché
          </Button>
        </form>
      </TableCell>
    </TableRow>
  );
}

export default async function PersonSchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const doseUpdated = sp.dose !== undefined;

  const service = await getVaccinsService();

  // L'horloge est une valeur instable sous Cache Components : connection()
  // déclare qu'on est au moment de la requête (garde blocking-prerender-
  // current-time) ; « aujourd'hui » est le jour de chaque requête.
  await connection();
  const today = new Date().toISOString().slice(0, 10);

  const vue = await service.getSchedule(id, today);
  if (!vue) notFound();
  const { person, due: toutesDues, faites: toutesFaites } = vue;

  // Lot 4 : le filtre vient de l'URL (?type=) et s'applique aux deux
  // tableaux ; une valeur inconnue est ignorée (le domaine le garantit).
  const type = normalizeScheduleType(
    typeof sp.type === "string" ? sp.type : null,
  );
  const due = filterByKind(toutesDues, type);
  const faites = filterByKind(toutesFaites, type);
  const retards = toutesDues.filter((d) => d.enRetard).length;

  const filterHref = (t: ScheduleType | null) =>
    `/vaccins/${person.id}${t ? `?type=${t}` : ""}`;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold mb-1">{person.name}</h1>
      <p className="mb-6 text-sm text-muted-foreground tabular-nums">
        Né(e) le {person.birthDate}
        {retards > 0 ? ` · ${retards} dose(s) en retard` : ""}
      </p>

      {doseUpdated ? (
        <p className="mb-4 rounded border border-accent-foreground/25 bg-accent p-3 text-accent-foreground">
          Dose mise à jour.
        </p>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button asChild variant={type === null ? "default" : "outline"} size="sm">
          <Link href={filterHref(null)}>Tous</Link>
        </Button>
        <Button
          asChild
          variant={type === "obligatoire" ? "default" : "outline"}
          size="sm"
        >
          <Link href={filterHref("obligatoire")}>Obligatoires</Link>
        </Button>
        <Button
          asChild
          variant={type === "recommande" ? "default" : "outline"}
          size="sm"
        >
          <Link href={filterHref("recommande")}>Recommandés</Link>
        </Button>
      </div>

      <h2 className="mb-3 text-lg font-semibold">
        Doses dues {due.length > 0 ? `(${due.length})` : ""}
      </h2>
      {due.length === 0 ? (
        <p className="mb-8 text-muted-foreground">
          Aucune dose due ou à venir dans l&apos;année.
        </p>
      ) : (
        <div className="mb-8">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                <TableHead>Vaccin</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead className="text-right">Type</TableHead>
                <TableHead className="text-right">Fait</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {due.map((dose) => (
                <DueRow key={dose.ruleId} dose={dose} personId={person.id} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <h2 className="mb-3 text-lg font-semibold">
        Déjà reçues {faites.length > 0 ? `(${faites.length})` : ""}
      </h2>
      {faites.length === 0 ? (
        <p className="text-muted-foreground">Aucune dose cochée pour l&apos;instant.</p>
      ) : (
        <Table>
          <TableBody>
            {faites.map((dose) => (
              <TableRow key={dose.ruleId}>
                <TableCell className="py-3 font-medium">{dose.label}</TableCell>
                <TableCell className="py-3 text-right">
                  <KindBadge kind={dose.kind} />
                </TableCell>
                <TableCell className="py-3 text-right">
                  <form action="/api/persons/doses" method="post">
                    <input type="hidden" name="personId" value={person.id} />
                    <input type="hidden" name="ruleId" value={dose.ruleId} />
                    <input type="hidden" name="done" value="0" />
                    <Button type="submit" variant="ghost" size="sm">
                      Annuler
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="mt-8">
        <Link href="/vaccins">
          <Button variant="outline">Retour à la liste</Button>
        </Link>
      </div>
    </main>
  );
}
