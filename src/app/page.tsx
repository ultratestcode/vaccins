import Link from "next/link";
import { Button } from "@/components/ui/button";

// Page d'accueil statique : aucun accès aux données. L'écran du check
// vaccinal (/vaccins) arrive avec le lot 1.
export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold mb-4">Vaccins</h1>
      <p className="mb-6 text-muted-foreground">
        Check vaccinal selon le calendrier français : enregistrez une personne,
        voyez ses prochains vaccins et leurs dates, cochez ce qui est déjà fait.
      </p>
      <Link href="/vaccins">
        <Button>Accéder au check vaccinal</Button>
      </Link>
      <p className="mt-8 text-xs text-muted-foreground">
        Outil indicatif fondé sur le calendrier vaccinal français en vigueur
        (sources Assurance Maladie, mise à jour mai 2026). Il ne remplace pas
        un avis médical.
      </p>
    </main>
  );
}
