# Couche service

`src/server/domain/` porte le moteur vaccinal pur (calcul des doses dues,
normalisation, filtre) et `src/server/services/` les cas d'usage. Le port
`VaccinsRepository` y est défini : cette couche ne connaît la base que par
ce port. Le domaine ne lit jamais l'horloge lui-même : le calcul prend une
date « aujourd'hui » en paramètre.

Les tests d'une règle ou d'un cas d'usage sont écrits avant le code :
test rouge d'abord, implémentation ensuite.

## Comment vérifier
Aucun import de `@libsql/client` ni de `next/*` dans `src/server/services/`
et `src/server/domain/` ; aucun `new Date()` dans `src/server/domain/` ;
dans l'historique git, le commit de test précède le commit de code pour
chaque règle.
