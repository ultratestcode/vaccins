// Détail d'une personne : doses dues (avec coche) et doses déjà reçues
// (avec annulation). Écritures via /api/persons/doses puis redirect.

import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  PartyPopper,
  ShieldCheck,
  Undo2,
} from "lucide-react";
import { getVaccinsService } from "@/server/data/vaccins-service";
import type { DoseAttendue } from "@/server/domain/schedule";
import {
  filterByKind,
  normalizeScheduleType,
  type ScheduleType,
} from "@/server/domain/schedule-filter";
import { formatDateFr, formatDateLongueFr } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

// Le statut passe sous le libellé en dessous de sm : la colonne date +
// badge + bouton ne rentre pas en dessous de ~400 px et ferait déborder
// le tableau (issue #6).
function DoseStatut({ dose }: { dose: DoseAttendue }) {
  return dose.enRetard ? (
    <Badge variant="destructive">En retard</Badge>
  ) : (
    <KindBadge kind={dose.kind} />
  );
}

// Une ligne de dose due : ses infos + le bouton qui la marque reçue.
function DueRow({ dose, personId }: { dose: DoseAttendue; personId: string }) {
  return (
    <TableRow>
      {/* Libellé autorisé à wrapper : sans ça, whitespace-nowrap du
          composant impose une largeur minimale et fait apparaître un scroll
          horizontal dans la Card (issue #6). */}
      <TableCell className="py-3.5 font-medium whitespace-normal">
        {dose.label}
        <span className="mt-1.5 block sm:hidden">
          <DoseStatut dose={dose} />
        </span>
      </TableCell>
      <TableCell className="py-3.5 text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <CalendarDays className="hidden size-3.5 sm:inline" aria-hidden />
          {formatDateFr(dose.dueDate)}
        </span>
      </TableCell>
      <TableCell className="hidden py-3.5 text-right sm:table-cell">
        <DoseStatut dose={dose} />
      </TableCell>
      <TableCell className="py-3.5 text-right">
        <form action="/api/persons/doses" method="post">
          <input type="hidden" name="personId" value={personId} />
          <input type="hidden" name="ruleId" value={dose.ruleId} />
          <input type="hidden" name="done" value="1" />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            aria-label={`Marquer fait : ${dose.label}`}
          >
            <Check className="sm:hidden" aria-hidden />
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <Check data-icon="inline-start" />
              Fait
            </span>
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
      <Link
        href="/vaccins"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Toutes les personnes
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {person.name}
        </h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>Né(e) le {formatDateLongueFr(person.birthDate)}</span>
          {retards > 0 ? (
            <Badge variant="destructive" className="gap-1">
              <ShieldCheck className="size-3" aria-hidden />
              {retards} dose{retards > 1 ? "s" : ""} en retard
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <ShieldCheck className="size-3" aria-hidden />
              À jour des échéances passées
            </Badge>
          )}
        </p>
      </header>

      {doseUpdated ? (
        <p className="mb-4 rounded-xl border border-accent-foreground/25 bg-accent p-3 text-accent-foreground">
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

      <Card className="mb-8 py-0">
        <CardHeader>
          <CardTitle className="text-base">
            Doses dues {due.length > 0 ? `(${due.length})` : ""}
          </CardTitle>
          <CardDescription>
            Échéances calculées depuis la date de naissance, dans l&apos;année
            qui vient.
          </CardDescription>
        </CardHeader>
        {due.length === 0 ? (
          <CardContent>
            <p className="flex items-center gap-2 text-muted-foreground">
              <PartyPopper className="size-4" aria-hidden />
              Rien à prévoir — aucune dose due ni imminente.
            </p>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                  <TableHead>Vaccin</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    Statut
                  </TableHead>
                  <TableHead className="text-right">Fait</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {due.map((dose) => (
                  <DueRow key={dose.ruleId} dose={dose} personId={person.id} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>

      <Card className="py-0">
        <CardHeader>
          <CardTitle className="text-base">
            Déjà reçues {faites.length > 0 ? `(${faites.length})` : ""}
          </CardTitle>
        </CardHeader>
        {faites.length === 0 ? (
          <CardContent>
            <p className="text-muted-foreground">
              Aucune dose cochée pour l&apos;instant.
            </p>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {faites.map((dose) => (
                  <TableRow key={dose.ruleId}>
                    <TableCell className="py-3.5 font-medium whitespace-normal">
                      {dose.label}
                    </TableCell>
                    <TableCell className="py-3.5 text-right">
                      <KindBadge kind={dose.kind} />
                    </TableCell>
                    <TableCell className="py-3.5 text-right">
                      <form action="/api/persons/doses" method="post">
                        <input
                          type="hidden"
                          name="personId"
                          value={person.id}
                        />
                        <input type="hidden" name="ruleId" value={dose.ruleId} />
                        <input type="hidden" name="done" value="0" />
                        <Button type="submit" variant="ghost" size="sm">
                          <Undo2 data-icon="inline-start" />
                          Annuler
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </main>
  );
}
