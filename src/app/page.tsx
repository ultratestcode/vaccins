import Link from "next/link";
import { ArrowRight, ShieldCheck, Syringe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Page d'accueil statique : aucun accès aux données.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-8 p-8">
      <div className="flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Syringe className="size-6" aria-hidden />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Vaccins</h1>
          <p className="text-muted-foreground">
            Le calendrier vaccinal français, remis à jour pour chaque personne.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Le check en trois gestes</CardTitle>
          <CardDescription>
            Enregistrer une personne · voir ses vaccins dus avec leurs dates
            · cocher ce qui est déjà reçu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/vaccins" className="block">
            <Button className="w-full" size="lg">
              Accéder au check vaccinal
              <ArrowRight data-icon="inline-end" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          Outil indicatif fondé sur le calendrier vaccinal français en vigueur
          (sources Assurance Maladie, mise à jour mai 2026). Il ne remplace
          pas un avis médical.
        </span>
      </p>
    </main>
  );
}
