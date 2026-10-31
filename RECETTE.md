# Recette du prototype V1

## Vérifications effectuées

- Tests automatiques réussis : 45 observations, consolidation des divisions, cumuls mensuels, variations et lecture CSV.
- Syntaxe JavaScript et absence d’erreurs d’espacement Git vérifiées.
- Captures utilisateur sur ordinateur : aperçu CSV de 45 lignes / 7 colonnes ; rejet explicite d’Excel ; tableau de bord septembre toutes divisions à 882 000 €, cumul à 6 984 000 €, variation à 19 500 € / +2,3 %.
- Captures utilisateur : janvier division 6 à 75 000 € mensuels et cumulés, comparaison précédente indisponible ; cohérence du compte de résultat et maintien des filtres.
- Capture des contrôles : écarts 0 €, 1 250 €, 15 000 €, 0 €, statuts attendus et avertissement de simulation visible.
- Captures en émulation mobile à 400 pixels : menu lisible, cartes empilées, filtre division corrigé sur une ligne entière, défilement horizontal interne du compte de résultat jusqu’au cumul de 6 984 000 €.
- L’utilisateur confirme que tout fonctionne après ces vérifications.

## Limites de cette recette

Ces essais portent sur des données fictives et ne constituent pas une validation comptable réelle. L’émulation mobile ne remplace pas un essai sur téléphone physique. La navigation complète au clavier, les lecteurs d’écran et les autres navigateurs restent à tester spécifiquement.

Excel reste non pris en charge. Les imports sont des aperçus en mémoire et ne modifient pas les indicateurs. Les contrôles sont des scénarios prédéfinis. Aucune base de données ni publication.
