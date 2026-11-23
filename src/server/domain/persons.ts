// Couche domaine : types et règles pures de la personne. Aucun import de la
// base ni de Next. L'horloge n'est jamais lue ici : « aujourd'hui » arrive en
// paramètre (règle .claude/rules/service.md).

export type Person = {
  id: string;
  name: string;
  birthDate: string; // AAAA-MM-JJ
  createdAt: string;
  updatedAt: string;
};

export type NewPersonInput = {
  name: string;
  birthDate: string;
};

const BIRTH_RE = /^\d{4}-\d{2}-\d{2}$/;

// Date civile valide sans objet Date : mois 1-12, jour dans le mois,
// février géré selon l'année bissextile ( divisible par 4, sauf siècles
// non divisibles par 400 ).
function isRealDate(date: string): boolean {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  if (month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1];
}

// Normalise et valide une saisie de personne ; lève une Error au message
// porté à l'écran. `today` (AAAA-MM-JJ) borne la règle « pas dans le futur ».
export function normalizeNewPersonInput(
  input: NewPersonInput,
  today: string,
): { name: string; birthDate: string } {
  const name = input.name?.trim() ?? "";
  if (!name) throw new Error("Le nom est obligatoire.");
  if (!BIRTH_RE.test(input.birthDate ?? "") || !isRealDate(input.birthDate)) {
    throw new Error("Date de naissance invalide.");
  }
  if (input.birthDate > today) {
    throw new Error("La date de naissance ne peut pas être dans le futur.");
  }
  return { name, birthDate: input.birthDate };
}
