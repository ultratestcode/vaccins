# Couche présentation

`src/app/` n'appelle que la couche service, jamais la couche données. Sa
seule porte d'entrée vers les données est le module de câblage
`getVaccinsService()` (`src/server/data/vaccins-service.ts`) ; elle
n'importe ni le client de base, ni le dépôt, ni `db.ts`, ni le calendrier.

Elle n'utilise que les composants et tokens du design system « Comptoir » :
les composants shadcn de `src/components/ui/` habillés par les variables de
`globals.css`, en mode clair comme en mode sombre. Jamais de couleur en dur,
uniquement les classes de rôles (`bg-background`, `text-muted-foreground`,
`bg-primary`…). Pas d'élément brut stylé à la main quand le composant existe.

## Comment vérifier
Dans `src/app/`, les seuls imports de `src/server/data` sont
`vaccins-service` ; aucune valeur hexadécimale (`#…`) sauf `globals.css` ;
les écrans importent leurs composants de `@/components/ui/` (grep
`from "@/components/ui"` non vide dans chaque `page.tsx`).
