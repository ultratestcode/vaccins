// Liste des personnes + formulaire d'ajout. Le formulaire poste vers
// /api/persons : écriture réelle, puis redirect. Design system « Comptoir ».

import Link from "next/link";
import { connection } from "next/server";
import { getVaccinsService } from "@/server/data/vaccins-service";
import { Button } from "@/components/ui/button";
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
  // moment de la requête ; ici elle ne sert qu'au message d'accueil.
  await connection();

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold mb-6">Check vaccinal</h1>

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded border border-destructive/40 bg-destructive/10 p-3 text-destructive"
        >
          {error}
        </p>
      ) : null}
      {added ? (
        <p className="mb-4 rounded border border-accent-foreground/25 bg-accent p-3 text-accent-foreground">
          Personne ajoutée.
        </p>
      ) : null}

      <form action="/api/persons" method="post" className="mb-8 grid gap-4">
        <Field id="person-name" name="name" label="Nom *" required />
        <Field
          id="person-birthdate"
          name="birthDate"
          label="Date de naissance *"
          type="date"
          required
        />
        <Button type="submit" className="justify-self-start">
          Ajouter
        </Button>
      </form>

      {people.length === 0 ? (
        <p className="text-muted-foreground">
          Aucune personne pour le moment. Ajoutez-en une ci-dessus.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/60 hover:bg-secondary/60">
              <TableHead>Nom</TableHead>
              <TableHead className="text-right">Date de naissance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.map((person) => (
              <TableRow key={person.id}>
                <TableCell className="py-3 font-medium">
                  <Link
                    href={`/vaccins/${person.id}`}
                    className="underline decoration-border underline-offset-4 hover:decoration-primary"
                  >
                    {person.name}
                  </Link>
                </TableCell>
                <TableCell className="py-3 text-right text-muted-foreground tabular-nums">
                  {person.birthDate}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}
