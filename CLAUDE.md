# CLAUDE.md

## Projet

Check vaccinal français mono-utilisateur. **`INTENT.md` à la racine fait
autorité** sur le produit, l'architecture et le hors-périmètre (pas d'auth,
pas de cas particuliers médicaux) : le lire avant toute évolution et ne pas
le contredire. Les critères de chaque lot sont dans `docs/lots.md`.

## Commandes

```bash
pnpm dev            # serveur de dev sur le port 3001 (pipeline garde 3000)
pnpm build          # build de prod — À LANCER AVANT LES TESTS (route types)
pnpm test           # vitest run
pnpm lint           # eslint
pnpm exec tsc --noEmit
pnpm vitest run __tests__/chemin/vers/fichier.test.ts  # un seul fichier
```

## Architecture : 3 couches, dépendances à sens unique

présentation → service → données. **Seul `src/server/data/` parle à la base.**

- `src/server/domain/` — types et moteur de calcul pur (horloge injectée,
  jamais d'horloge interne). Aucun import de la base ni de Next.
- `src/server/services/` — cas d'usage ; définit le port
  `VaccinsRepository` ; ne connaît la base que par ce port.
- `src/server/data/` — `@libsql/client` + `db.ts` (seul fichier de câblage :
  SQLite local par défaut, Turso si `TURSO_URL`), dépôt, **jeu de référence
  du calendrier vaccinal** (données versionnées avec source et date),
  câblage `getVaccinsService()` (seule porte d'entrée de `src/app/`).
- `src/app/` — UI en design system « Comptoir » (composants `@/components/ui`
  + tokens de `globals.css`), mode clair/sombre existant.

Base locale : `data/vaccins.db` (gitignorée, surcharge `VACCINS_DB_PATH`).
Le critère « survit au redémarrage » est verrouillé par un test
d'intégration qui insère, ferme la connexion, rouvre le fichier et vérifie.

## Pièges propres à ce repo (repris de pipeline)

- **Next 16 + `cacheComponents`** : `export const dynamic = "force-dynamic"`
  est interdit. Une page qui lit la base ou les `searchParams` au rendu
  déclare `export const instant = false`. `searchParams` est une Promise.
  Lire `node_modules/next/dist/docs/` avant d'utiliser une API Next.
- **`await connection()` (import `next/server`) avant tout `new Date()`** dans
  une page : l'horloge est une valeur instable au prerender (garde
  « blocking-prerender-current-time »).
- Écritures : routes API qui postent puis **redirect 303** avec message dans
  l'URL (`?ajoute=1`, `?erreur=…`).
- Tests dans `__tests__/` (racine), arborescence miroir de `src/` : règles et
  moteur sur horloge figée avec faux dépôt ; persistance sur **vraie base**
  dans un fichier temporaire — jamais de mock pour prouver la persistance.
- Git : branche par défaut `dev`, PRs vers `main`, fusion à la main de
  l'utilisateur ; pas de commit ni push sans demande explicite.
