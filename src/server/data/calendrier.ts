// Jeu de référence du calendrier vaccinal français (population générale).
// Couche données : c'est ici, et seulement ici, que vivent les règles.
//
// SOURCE_CALENDRIER porte la source et sa date ; les arrondis « démo » sont
// documentés au même endroit (projet de démonstration, INTENT.md).

import type { RegleVaccinale } from "@/server/domain/schedule";

export const SOURCE_CALENDRIER =
  "Assurance Maladie (ameli.fr), pages « vaccins obligatoires chez le " +
  "nourrisson » (maj 21/05/2026) et « vaccins recommandés » (maj 22/05/2026), " +
  "vérifié le 23/11/2026. Arrondis démo : 2e dose ROR posée à 18 mois " +
  "(prévue 16-18 mois), rappel dTcaPolio « entre 11 et 13 ans » posé à 12 ans, " +
  "HPV représenté par une dose repère à 11 ans (rattrapage jusqu'à 26 ans).";

const OBLIGATOIRE = "obligatoire" as const;
const RECOMMANDE = "recommande" as const;

export const CALENDRIER_FRANCE: RegleVaccinale[] = [
  // Nourrisson : vaccin combiné diphtérie-tétanos-poliomyélite-coqueluche-
  // hépatite B-Haemophilus b-pneumocoque (12 vaccins obligatoires depuis 2025).
  { id: "combi-2m", label: "Vaccin combiné (1re dose, 2 mois)", kind: OBLIGATOIRE, echeance: { type: "mois", mois: 2 } },
  { id: "combi-4m", label: "Vaccin combiné (2e dose, 4 mois)", kind: OBLIGATOIRE, echeance: { type: "mois", mois: 4 } },
  { id: "combi-11m", label: "Vaccin combiné (rappel, 11 mois)", kind: OBLIGATOIRE, echeance: { type: "mois", mois: 11 } },
  // Méningocoque B : obligatoire depuis 2025 (3, 5, 12 mois).
  { id: "menb-3m", label: "Méningocoque B (1re dose, 3 mois)", kind: OBLIGATOIRE, echeance: { type: "mois", mois: 3 } },
  { id: "menb-5m", label: "Méningocoque B (2e dose, 5 mois)", kind: OBLIGATOIRE, echeance: { type: "mois", mois: 5 } },
  { id: "menb-12m", label: "Méningocoque B (rappel, 12 mois)", kind: OBLIGATOIRE, echeance: { type: "mois", mois: 12 } },
  // Méningocoques ACWY : remplace le C depuis 2025 (6 et 12 mois).
  { id: "acwy-6m", label: "Méningocoques ACWY (1re dose, 6 mois)", kind: OBLIGATOIRE, echeance: { type: "mois", mois: 6 } },
  { id: "acwy-12m", label: "Méningocoques ACWY (2e dose, 12 mois)", kind: OBLIGATOIRE, echeance: { type: "mois", mois: 12 } },
  // ROR obligatoire du nourrisson.
  { id: "ror-12m", label: "Rougeole-oreillons-rubéole (1re dose, 12 mois)", kind: OBLIGATOIRE, echeance: { type: "mois", mois: 12 } },
  { id: "ror-18m", label: "Rougeole-oreillons-rubéole (2e dose, 16-18 mois)", kind: OBLIGATOIRE, echeance: { type: "mois", mois: 18 } },
  // Rappels de l'enfant et de l'adolescent.
  { id: "dtcapolio-6", label: "Rappel diphtérie-tétanos-poliomyélite-coqueluche (6 ans)", kind: OBLIGATOIRE, echeance: { type: "annees", age: 6 } },
  { id: "dtcapolio-12", label: "Rappel diphtérie-tétanos-poliomyélite-coqueluche (11-13 ans)", kind: OBLIGATOIRE, echeance: { type: "annees", age: 12 } },
  // HPV : recommandé 11-14 ans, rattrapage jusqu'à 26 ans révolus.
  { id: "hpv-11", label: "Papillomavirus (HPV), recommandé 11-14 ans", kind: RECOMMANDE, echeance: { type: "annees", age: 11, ageMax: 26 } },
  // Rappels dTcaPolio de l'adulte : 25, 45, 65 ans puis tous les 10 ans.
  { id: "dtcapolio-25", label: "Rappel dTcaPolio (25 ans)", kind: OBLIGATOIRE, echeance: { type: "annees", age: 25 } },
  { id: "dtcapolio-45", label: "Rappel dTcaPolio (45 ans)", kind: OBLIGATOIRE, echeance: { type: "annees", age: 45 } },
  { id: "dtcapolio-65", label: "Rappel dTcaPolio (65 ans)", kind: OBLIGATOIRE, echeance: { type: "annees", age: 65 } },
  { id: "dtcapolio-75", label: "Rappel dTcaPolio (75 ans)", kind: OBLIGATOIRE, echeance: { type: "annees", age: 75 } },
  { id: "dtcapolio-85", label: "Rappel dTcaPolio (85 ans)", kind: OBLIGATOIRE, echeance: { type: "annees", age: 85 } },
  // Rattrapage rougeole : personnes nées après 1980 sans antécédent connu.
  { id: "ror-rattrapage", label: "Rougeole-oreillons-rubéole (rattrapage, nés après 1980)", kind: RECOMMANDE, echeance: { type: "ne_apres", annee: 1980 } },
  // Dès 65 ans : grippe chaque année, zona (recommandés).
  { id: "grippe-annuel", label: "Grippe saisonnière (chaque année, dès 65 ans)", kind: RECOMMANDE, echeance: { type: "annuel", ageMin: 65 } },
  { id: "zona-65", label: "Zona (dès 65 ans)", kind: RECOMMANDE, echeance: { type: "annees", age: 65 } },
];
