// Écriture : POST formulaire → service (règle avant base) → redirect 303.
// Le message du refus revient à l'écran par l'URL (?error=).

import { redirect } from "next/navigation";
import { getVaccinsService } from "@/server/data/vaccins-service";

export async function POST(request: Request) {
  // Un handler POST n'est jamais prerendu : la garde des valeurs
  // instables (blocking-prerender-current-time) ne s'applique pas ici, pas
  // besoin de connection() — contrairement aux pages.
  const form = await request.formData();
  const name = String(form.get("name") ?? "");
  const birthDate = String(form.get("birthDate") ?? "");
  const today = new Date().toISOString().slice(0, 10);

  let message: string | null = null;
  try {
    await (await getVaccinsService()).addPerson({ name, birthDate }, today);
  } catch (error) {
    message = error instanceof Error ? error.message : "Saisie refusée.";
  }
  // redirect hors du try : sa propre exception de contrôle ne doit pas être
  // confondue avec un refus métier.
  redirect(
    message
      ? `/vaccins?error=${encodeURIComponent(message)}`
      : "/vaccins?ajoute=1",
  );
}
