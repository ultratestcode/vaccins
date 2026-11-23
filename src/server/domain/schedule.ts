// Couche domaine : calcul pur des doses dues. Aucune lecture d'horloge
// (today en paramètre), aucun import de la base ni du calendrier — les
// règles arrivent en paramètre (règle .claude/rules/service.md).

export type Echeance =
  | { type: "mois"; mois: number } // nourrisson : N mois après la naissance
  | { type: "annees"; age: number; ageMax?: number } // dose à un âge donné
  | { type: "annuel"; ageMin: number } // chaque année à partir d'un âge
  | { type: "ne_apres"; annee: number }; // rattrapage selon l'année de naissance

export type RegleVaccinale = {
  id: string;
  label: string;
  kind: "obligatoire" | "recommande";
  echeance: Echeance;
};

export type DoseAttendue = {
  ruleId: string;
  label: string;
  kind: "obligatoire" | "recommande";
  dueDate: string; // AAAA-MM-JJ
  enRetard: boolean;
};

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isBissextile(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number): number {
  return month === 2 && isBissextile(year) ? 29 : DAYS_IN_MONTH[month - 1];
}

const pad = (n: number) => String(n).padStart(2, "0");

// Arithmétique de date civile sur chaînes AAAA-MM-JJ, sans objet Date.
// Un 29 février ramené dans un février non bissextile tombe au 28.
export function addMois(birthDate: string, months: number): string {
  const y = Number(birthDate.slice(0, 4));
  const m = Number(birthDate.slice(5, 7));
  const d = Number(birthDate.slice(8, 10));
  const index = y * 12 + (m - 1) + months;
  const y2 = Math.floor(index / 12);
  const m2 = (index % 12) + 1;
  const d2 = Math.min(d, daysInMonth(y2, m2));
  return `${y2}-${pad(m2)}-${pad(d2)}`;
}

export function addAnnees(birthDate: string, years: number): string {
  return addMois(birthDate, years * 12);
}

// Années révolues à la date de référence (comparaison MM-JJ en chaîne).
function ageRevolu(birthDate: string, ref: string): number {
  const years = Number(ref.slice(0, 4)) - Number(birthDate.slice(0, 4));
  const birthMd = birthDate.slice(5);
  const refMd = ref.slice(5);
  return birthMd <= refMd ? years : years - 1;
}

// Une dose apparaît quand sa date est passée (elle est due, en retard) ou
// quand elle tombe dans l'année qui vient (elle est à venir, datée).
const HORIZON = 12; // mois

export function computeDueDoses(
  birthDate: string,
  rules: RegleVaccinale[],
  today: string,
  doneRuleIds: string[] = [],
): DoseAttendue[] {
  const horizon = addMois(today, HORIZON);
  const doses: DoseAttendue[] = [];

  for (const rule of rules) {
    if (doneRuleIds.includes(rule.id)) continue; // déjà reçue (lot 3)
    const e = rule.echeance;
    let dueDate: string;

    if (e.type === "mois") {
      dueDate = addMois(birthDate, e.mois);
    } else if (e.type === "annees") {
      if (e.ageMax !== undefined && ageRevolu(birthDate, today) > e.ageMax) {
        continue; // fenêtre de recommandation dépassée (ex. HPV après 26 ans)
      }
      dueDate = addAnnees(birthDate, e.age);
    } else if (e.type === "annuel") {
      if (ageRevolu(birthDate, today) < e.ageMin) continue;
      const year = Number(today.slice(0, 4));
      const m = Number(birthDate.slice(5, 7));
      const d = Number(birthDate.slice(8, 10));
      dueDate = `${year}-${pad(m)}-${pad(Math.min(d, daysInMonth(year, m)))}`;
    } else {
      // ne_apres : rattrapage dû dès l'âge de 1 an pour les concernés.
      if (Number(birthDate.slice(0, 4)) <= e.annee) continue;
      dueDate = addAnnees(birthDate, 1);
    }

    const due = dueDate <= today;
    if (!due && dueDate > horizon) continue; // encore trop lointaine
    doses.push({
      ruleId: rule.id,
      label: rule.label,
      kind: rule.kind,
      dueDate,
      enRetard: dueDate < today,
    });
  }

  return doses.sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
}
