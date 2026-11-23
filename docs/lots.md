# Lots · Vaccins

Découpage en lots verticaux (chacun traverse présentation → service →
données), conformément à INTENT.md. Le lot 1 est le plus petit : un écran,
une écriture, il valide le socle (3 couches + persistance).

## Lot 1 · Enregistrer une personne

Depuis la liste, je saisis un nom et une date de naissance ; la personne
apparaît dans la liste et survit au redémarrage.

- Étant donné le formulaire vide, quand j'envoie un nom et une date valides,
  alors la personne apparaît dans la liste et la ligne est écrite en base.
- Étant donné le formulaire, quand j'envoie sans nom ou sans date, alors un
  bandeau d'erreur s'affiche et rien n'est écrit en base.
- Étant donné une date de naissance dans le futur, quand j'envoie, alors le
  service la refuse.
- Étant donné une personne ajoutée, quand je ferme et rouvre la base, alors
  elle est toujours listée.

## Lot 2 · Afficher les vaccins dus

Pour une personne, l'app calcule ses vaccins attendus : chaque dose due avec
sa date (calculée depuis la naissance), badge obligatoire/recommandé, mention
« en retard » si la date est passée, le tout trié par date.

- Étant donné un nourrisson né il y a 3 mois, quand j'ouvre son détail, alors
  la deuxième dose des vaccins combinés (2 mois faite, 4 mois à venir) figure
  avec sa date.
- Étant donné un adulte de 30 ans, quand j'ouvre son détail, alors le rappel
  dTcaPolio de 25 ans apparaît « en retard » et celui de 45 ans à sa date.
- Étant donné un adolescent de 12 ans, quand j'ouvre son détail, alors le HPV
  figure avec le badge « recommandé ».
- Étant donné une personne née en 1990 sans ROR, quand j'ouvre son détail,
  alors le ROR « né après 1980 » figure.
- Étant donné une personne de 70 ans, quand j'ouvre son détail, alors la
  grippe annuelle et le zona figurent.

## Lot 3 · Cocher les doses reçues

Je coche une dose faite ; elle disparaît des doses dues et le choix est
persisté ; je peux décocher.

- Étant donné une dose due, quand je la coche, alors elle quitte la liste des
  dues, apparaît dans « faites », et la base est à jour.
- Étant donné une dose cochée, quand je recharge, alors elle reste cochée.
- Étant donné une dose cochée, quand je la décoche, alors elle revient dans
  les doses dues.

## Lot 4 · Filtrer obligatoire et recommandé

Je filtre la liste des doses par type depuis l'URL ; le filtre est rejouable.

- Étant donné le filtre « obligatoire », quand j'applique l'URL, alors seules
  les doses obligatoires restent.
- Étant donné le filtre « recommande », quand j'applique l'URL, alors seules
  les doses recommandées non obligatoires restent.
- Étant donné un filtre actif, quand je recharge l'URL, alors le même filtre
  est appliqué ; sans paramètre, tout s'affiche.

## Lot 5 · Passer du clair au sombre

Le bouton de thème bascule le mode et le choix survit au rechargement.

- Étant donné le mode clair, quand je clique « Mode sombre », alors toute
  l'UI passe en thème sombre (tokens `.dark`).
- Étant donné le thème choisi, quand je recharge la page, alors le même thème
  s'affiche sans flash du thème inverse.
