// Détail d'une personne : ses doses dues calculées par le service, triées
// par date. Lecture seule — cocher arrivera au lot 3.

import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getVaccinsService } from "@/server/data/vaccins-service";
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

// Page pilotée par les params et la base : rendu bloquant assumé.
export const instant = false;

export default async function PersonSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = await getVaccinsService();
  const person = await service.getPerson(id);
  if (!person) notFound();

  // L'horloge est une valeur instable sous Cache Components : connection()
  // déclare qu'on est au moment de la requête, « aujourd'hui » est le jour
  // de chaque requête (garde blocking-prerender-current-time).
  await connection();
  const today = new Date().toISOString().slice(0, 10);
  const due = await service.scheduleFor(person.birthDate, today);
  const retards = due.filter((d) => d.enRetard).length;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold mb-1">{person.name}</h1>
      <p className="mb-6 text-sm text-muted-foreground tabular-nums">
        Né(e) le {person.birthDate}
        {retards > 0 ? ` · ${retards} dose(s) en retard` : ""}
      </p>

      {due.length === 0 ? (
        <p className="text-muted-foreground">
          Aucune dose due ou à venir dans l&apos;année.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/60 hover:bg-secondary/60">
              <TableHead>Vaccin</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead className="text-right">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {due.map((dose) => (
              <TableRow key={dose.ruleId}>
                <TableCell className="py-3 font-medium">{dose.label}</TableCell>
                <TableCell className="py-3 text-muted-foreground tabular-nums">
                  {dose.dueDate}
                  {dose.enRetard ? (
                    <span className="ml-1.5 text-destructive">en retard</span>
                  ) : null}
                </TableCell>
                <TableCell className="py-3 text-right">
                  <Badge
                    variant={dose.kind === "obligatoire" ? "default" : "outline"}
                  >
                    {dose.kind === "obligatoire" ? "Obligatoire" : "Recommandé"}
                  </Badge>
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
