# Couche données

Seule la couche données parle à la base. Le client SQLite (`@libsql/client`)
n'est importé que dans `src/server/data/`, et `db.ts` est le seul fichier de
câblage de la connexion (migration Turso = lui seul). Le calendrier vaccinal
est un jeu de données de cette couche, versionné avec sa source et sa date
de vérification ; le domaine le reçoit en paramètre, il ne l'importe pas en
dur depuis l'UI.

## Comment vérifier
`grep -r "@libsql" src/` ne renvoie que des fichiers de `src/server/data/` ;
la persistance est prouvée sur vraie base (insert → fermeture → réouverture) ;
le fichier de calendrier porte sa source et sa date en commentaire.
