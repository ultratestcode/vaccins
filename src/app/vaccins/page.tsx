// Liste des personnes + formulaire d'ajout. Le formulaire poste vers
// /api/persons : écriture réelle, puis redirect. Design system « Comptoir ».

import Link from "next/link";
import { connection } from "next/server";
import { ChevronRight, Inbox, Plus, Users } from "lucide-react";
import { getVaccinsService } from "@/server/data/vaccins-service";
import { formatDateFr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Page pilotée par les searchParams et la base : rendu bloquant assumé
// (exigé par Cache Components, à la place de l'ancien « force-dynamic »).
export const instant = false;

// Le champ natif gagne l'id et le nom ; Label ne fait que le nommer.
function Field({
  id,
  name,
  label,
  type = "text",
  required = false,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type={type} required={required} />
    </div>
  );
}

export default async function VaccinsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const added = params.ajoute !== undefined;

  const people = await (await getVaccinsService()).listPersons();

  // L'horloge est une valeur instable sous Cache Components (garde
  // « blocking-prerender-current-time ») : connection() déclare qu'on est au
  // moment de la requête.
  await connection();

  return (
    <main className="mx-auto max-w-2xl p-8">
      <header className="mb-8 flex items-center gap-4">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Users className="size-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Personnes suivies
          </h1>
          <p className="text-sm text-muted-foreground">
            {people.length === 0
              ? "Commencez par ajouter une personne."
              : `${people.length} personne${people.length > 1 ? "s" : ""} · cliquez un nom pour le check vaccinal`}
          </p>
        </div>
      </header>

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-destructive"
        >
          {error}
        </p>
      ) : null}
      {added ? (
        <p className="mb-4 rounded-xl border border-accent-foreground/25 bg-accent p-3 text-accent-foreground">
          Personne ajoutée.
        </p>
      ) : null}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">Ajouter une personne</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action="/api/persons"
            method="post"
            className="grid gap-4 sm:grid-cols-2"
          >
            <Field id="person-name" name="name" label="Nom *" required />
            <Field
              id="person-birthdate"
              name="birthDate"
              label="Date de naissance *"
              type="date"
              required
            />
            <Button type="submit" className="justify-self-start">
              <Plus data-icon="inline-start" />
              Ajouter
            </Button>
          </form>
        </CardContent>
      </Card>

      {people.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
          <Inbox className="size-8 text-muted-foreground/60" aria-hidden />
          <p className="text-muted-foreground">
            Aucune personne pour le moment.
          </p>
        </div>
      ) : (
        <Card className="py-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                  <TableHead>Nom</TableHead>
                  <TableHead className="text-right">
                    Date de naissance
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {people.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell className="py-3.5 font-medium">
                      <Link
                        href={`/vaccins/${person.id}`}
                        className="underline decoration-border underline-offset-4 hover:decoration-primary"
                      >
                        {person.name}
                      </Link>
                    </TableCell>
                    <TableCell className="py-3.5 text-right text-muted-foreground tabular-nums">
                      {formatDateFr(person.birthDate)}
                    </TableCell>
                    <TableCell className="py-3.5 text-right">
                      <Link href={`/vaccins/${person.id}`} aria-label={`Voir ${person.name}`}>
                        <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
