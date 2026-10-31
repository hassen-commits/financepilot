# Recette de robustesse V2.1

Exécution : `node --test robustness.test.cjs`, puis `node test.cjs` et `node ui-test.cjs`.

Toutes les anomalies utilisent des copies en mémoire ou un calculateur de test. Les 45 observations de démonstration ne sont pas modifiées. Aucun accès réseau nécessaire.

## Contrôles internes

Identifiants stables exposés par le modèle et affichés dans l’écran Contrôles. Tous les scénarios nominaux sont Conformes. Un écart non nul ou une valeur nécessaire indisponible est Bloquant. Alerte reste réservé aux exemples illustratifs, sans seuil métier inventé.

E = EBITDA ; H = EBITDA hors produits immobilisés ; A = production immobilisée ACE ; P = production immobilisée liée à la masse salariale. M = mois sélectionné, Y = somme depuis janvier. Les consolidations portent toujours sur les cinq divisions ; les cumuls et passages portent sur la division sélectionnée. Le même exercice est utilisé des deux côtés. Comparaisons en centimes, écart = calculé − attendu.

| ID | Règle / réussite | Anomalie automatisée, attendue Bloquante |
|---|---|---|
| C01 | Une ligne par division sélectionnée et mois de janvier à M, six montants finis ; zéro anomalie | Mois absent, doublon, null, NaN, Infinity, texte numérique |
| C02 | Y(E) = somme des M(E) | Cumul division 6 majoré de 100 € |
| C03 | M(E organisation) = somme des divisions | Total mensuel majoré de 100 € |
| C04 | Y(E organisation) = somme des divisions | Total cumulé majoré de 100 € |
| C05 | Y(H) = somme des M(H) | Cumul division 6 majoré de 100 € |
| C06 | M(H organisation) = somme des divisions | Division 4579 omise dans le total mensuel |
| C07 | Y(H organisation) = somme des divisions | Division 4579 omise dans le total cumulé |
| C08 | Y(A) = somme des M(A) | Janvier omis dans le cumul division 6 |
| C09 | M(A organisation) = somme des divisions | Total mensuel majoré de 50 € |
| C10 | Y(A organisation) = somme des divisions | Total cumulé majoré de 50 € |
| C11 | Y(P) = somme des M(P) | Janvier compté deux fois dans le cumul division 6 |
| C12 | M(P organisation) = somme des divisions | Division 4390 omise dans le total mensuel |
| C13 | Y(P organisation) = somme des divisions | Division 4390 omise dans le total cumulé |
| C14 | M(H) = M(E) − M(A) − M(P) | Déduction de P oubliée |
| C15 | Y(H) = Y(E) − Y(A) − Y(P) | A ajouté au lieu d’être déduit |
| C16 | Sélection valide et aucune ligne hors périmètre attendu | Division 9999 ou numérique ajoutée ; mois invalide ; sélection invalide |

Les tests C02 à C15 vérifient individuellement l’identifiant, le statut et l’écart exact du contrôle ciblé. Les tests nominaux couvrent les 54 combinaisons mois/division (neuf mois et cinq divisions plus l’organisation). C01 est vérifié sur les six rubriques et plusieurs types de montants invalides.

C16 examine toutes les divisions sur l’exercice sélectionné et les mois jusqu’à M, même lorsqu’une seule division est affichée. Les numéros de mois invalides de cet exercice sont aussi signalés. Les lignes d’un autre exercice sont hors périmètre. Une sélection invalide renvoie uniquement C16 Bloquant et un diagnostic, sans lancer les calculs. Une division attendue absente relève de C01 et rend les consolidations dépendantes indisponibles.

## Références indépendantes de test

REF01 utilise dix lignes fictives écrites séparément du générateur : deux mois et cinq divisions. Les résultats attendus sont fixés à la main pour chaque mois, chaque division et l’organisation, ainsi que les cumuls des deux indicateurs et les cumuls des retraitements. Aucun résultat attendu n’est produit par le moteur testé.

REF02 augmente un produit de 1 000 € : les contrôles internes restent conformes, mais la référence indépendante révèle l’écart de 1 000 €. REF03 augmente A de 10 € et diminue P de 10 € : H reste correct et les contrôles internes restent conformes, mais les références de chaque rubrique révèlent les deux écarts.

Ces références sont des assertions de recette, pas des contrôles supplémentaires affichés dans l’application. Elles ne rapprochent aucune source professionnelle.

## Autres bornes et limites

Tests sur exercice absent, division absente, retraitement nul ou négatif, deux décimales, et maintien de l’EBITDA principal lorsqu’un seul retraitement manque. Une assertion confirme que le jeu de démonstration n’a pas été modifié.

La règle existante arrondit chaque montant au centime avant agrégation ; aucune nouvelle politique d’acceptation des montants à plus de deux décimales n’est introduite. Cette politique reste à décider avant un import métier.

Les tests de rendu utilisent un DOM simulé. Ils ne remplacent pas une recette visuelle, les lecteurs d’écran ou un téléphone physique. Aucun déploiement V2.1 effectué. Les fichiers `dist/` correspondent à la publication V2 antérieure et devront être régénérés à partir des sources lors d’une future publication autorisée.
