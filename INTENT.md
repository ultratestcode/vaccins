# INTENT · Vaccins — check vaccinal français

Ce fichier fait autorité sur le produit, l'architecture et le hors-périmètre.
Aucune évolution ne doit le contredire ; on le modifie explicitement ou pas du tout.

## Le produit

Mini-app mono-utilisateur pour vérifier une vaccination selon le calendrier
français. Trois verbes :

1. **Enregistrer** une personne : nom + date de naissance.
2. **Voir** ses vaccins dus : la liste calculée des vaccins attendus à son âge,
   avec la date de chaque dose (calculée depuis la naissance), le badge
   « obligatoire » ou « recommandé », et la mention « en retard » quand la date
   est passée.
3. **Cocher** ce qui est déjà reçu : la dose cochée disparaît des « dus » et
   la décision est persistée.

## Utilisateur unique

Un seul utilisateur (moi, pour ma famille). Pas de comptes, pas de
multi-utilisateur, pas de droits.

## Données vaccinales

- Calendrier **français** uniquement, vaccins **en français**.
- Périmètre **population générale** : obligations du nourrisson (12 vaccins
  depuis 2025), rappels dTcaPolio (6 ans, 11-13 ans, 25, 45, 65 ans puis tous
  les 10 ans), ROR pour les nés après 1980, HPV recommandé (11-14 ans,
  rattrapage jusqu'à 26 ans), grippe annuelle et zona dès 65 ans.
- Le jeu de règles est des **données du projet** (couche données), versionnées
  avec la source et sa date : Assurance Maladie (ameli.fr), pages « vaccins
  obligatoires » et « vaccins recommandés », vérifiées le 2026-11-23
  (pages mises à jour les 21 et 22 mai 2026).
- Chaque règle porte sa référence (vaccin, âge ou intervalle, obligatoire ou
  recommandé) ; aucune posologie ni recommandation individuelle.

## Hors périmètre (volontaire)

- Pas de cas particuliers : grossesse, immunodépression, voyageurs, métiers
  exposés, nourrisson prématuré, rattrapages complexes.
- Pas de compte utilisateur, d'authentification ni de rôle.
- Aucune donnée de santé au-delà des cases « dose reçue » : pas de carnet
  numérique, pas de lot de vaccin, pas de prescripteur.
- Aucun rappel par e-mail ou notification.
- Avertissement permanent : outil indicatif, ne remplace pas un avis médical.

## Architecture

3 couches, dépendances à sens unique : présentation → service → données.

- `src/server/domain/` — types (`Person`, `DoseAttendue`), moteur pur
  `computeDueDoses(dateNaissance, dosesFaites, aujourdhui)` avec **horloge
  injectée** (aucun `new Date()` dans le domaine), normalisation et filtre.
  Aucun import de la base ni de Next.
- `src/server/services/` — cas d'usage derrière le port `VaccinsRepository`
  (interface) : la couche service ne connaît la base que par ce port.
- `src/server/data/` — seul endroit qui parle à la base (`@libsql/client`) :
  `db.ts` (seul fichier de câblage ; SQLite local `VACCINS_DB_PATH` par
  défaut, Turso si `TURSO_URL` est posé), dépôt, jeu de référence du
  calendrier, câblage `getVaccinsService()` (seule porte d'entrée de
  `src/app/`).
- `src/app/` — UI en design system « Comptoir » (tokens + composants
  hérités de pipeline), mode clair/sombre par classe `.dark` persistée en
  localStorage.

## Persistance

- Base SQLite locale en dev/tests ; Turso en production (Vercel serverless :
  le fichier ne survivrait pas). Un seul fichier à modifier pour la bascule.
- Critère verrouillé par test d'intégration : une personne et ses cases
  insérées **survivent à une fermeture puis réouverture** de la base.

## Écran

Une liste de personnes ; le détail d'une personne montre ses doses dues
(triées par date) puis ses doses faites, avec filtres par l'URL
(`?type=obligatoire|recommande`) rejouables au rechargement.
