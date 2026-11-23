// Cocher/décocher une dose : POST formulaire → service (vérifications avant
// écriture) → redirect 303 vers le détail de la personne.

import { redirect } from "next/navigation";
import { getVaccinsService } from "@/server/data/vaccins-service";

export async function POST(request: Request) {
  // Handler POST : jamais prerendu, pas de garde de valeur instable ici.
  const form = await request.formData();
  const personId = String(form.get("personId") ?? "");
  const ruleId = String(form.get("ruleId") ?? "");
  const done = form.get("done") === "1";

  let message: string | null = null;
  try {
    await (await getVaccinsService()).setDoseDone(personId, ruleId, done);
  } catch (error) {
    message = error instanceof Error ? error.message : "Saisie refusée.";
  }
  // redirect hors du try : son exception de contrôle n'est pas un refus métier.
  if (message) {
    redirect(`/vaccins?error=${encodeURIComponent(message)}`);
  }
  redirect(`/vaccins/${personId}?dose=1`);
}
