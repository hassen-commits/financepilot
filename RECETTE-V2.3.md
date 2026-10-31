# Recette locale V2.3 — analyse mensuelle

## Correction de synchronisation des graphiques

Cause confirmée dans le code local : après affectation de `onchange` au sélecteur des graphiques, `screen.innerHTML += ...` recréait les descendants de l’écran pour ajouter le bloc Analyse mensuelle. Le nouveau sélecteur ne conservait pas son gestionnaire. Le choix H pouvait ainsi être visible sans recalcul des graphiques. Le double DOM historique des tests conservait artificiellement les mêmes objets et ne révélait pas cette destruction.

Correction : ajout des blocs par `insertAdjacentHTML('beforeend', ...)`, sans remplacement des descendants. Même correction pour le panneau de référence qui provoquait le même risque sur le sélecteur de fichier générique. Les deux sélecteurs d’indicateur sont maintenant synchronisés dans les deux sens : graphiques généraux et contributions V2.3 suivent la même sélection, y compris les titres et le libellé accessible des barres.

`node --test charts.test.cjs` couvre cinq tests : bascule générale E/H/E avec montants de barres et points de courbe, bascule depuis Analyse mensuelle, conservation de H après changements de filtres, conservation de l’événement de fichier, et réintroduction contrôlée de l’ancien défaut pour prouver sa détection. Son modèle DOM ciblé remplace effectivement les descendants lors d’une réaffectation de innerHTML. Il ne remplace pas un navigateur complet.

Attendus indépendants février 2026 / division 6 : E = 87 300 €, H = 56 100 €, contribution E = +12 300 €, contribution H = +11 100 €. Résultat après correction : 78 tests nommés réussis (23 V2.1, 25 V2.2, 25 V2.3, 5 graphiques), plus les deux scripts historiques réussis. Aucun changement financier ni publication.

## Fonctionnement

Dans le tableau de bord, le bloc Analyse mensuelle lit uniquement les données fictives existantes. Il suit les filtres exercice, mois et division ; son sélecteur d’indicateur permet de choisir EBITDA (E) ou EBITDA hors produits immobilisés (H).

Les quatre cartes montrent M−1, M, la variation en euros à deux décimales et la variation en pourcentage. La contribution d’une division est son montant M moins son montant M−1. La table et les barres avec axe zéro montrent les cinq divisions en permanence. Le filtre division sélectionne le détail des rubriques et les cartes sans masquer les contributions au consolidé.

E est décomposé en quatre rubriques présentes : produits, achats et prestations, personnel et autres charges. Les charges sont déjà négatives : leur contribution est directement M − M−1. Pour H, deux contributions supplémentaires sont déduites : −Δ production immobilisée ACE et −Δ production immobilisée personnel. Les différences brutes et les coefficients sont affichés séparément pour éviter toute confusion de signe.

Les principales contributions sont les trois variations non nulles de plus forte valeur absolue. Toutes les contributions, y compris nulles et opposées, restent présentes dans les tableaux complets. Ce sont des contributions arithmétiques, jamais des causes économiques démontrées. Aucun compte détaillé, volume, prix ou commentaire métier n’est inventé.

## Précision, indisponibilités et diagnostics

Les résultats en euros du modèle existant sont convertis par lecture décimale en centimes entiers. Les différences et sommes utilisent des entiers et BigInt pour contrôler les dépassements de capacité. Aucun arrondi silencieux dans le module de variation : une valeur avec plus de deux décimales ou hors capacité devient indisponible. Les pourcentages utilisent variation / valeur absolue de M−1 × 100, arrondis uniquement pour l’affichage.

- Base M−1 nulle avec deux valeurs disponibles : variation en euros disponible, pourcentage « Non calculable ».
- Valeur absente, invalide ou précision dépassée : « Comparaison indisponible », valeur manquante affichée « — ».
- Janvier : recherche de décembre de l’exercice précédent. Il est absent de la démonstration actuelle ; aucun zéro ne le remplace.
- Retraitement manquant : H indisponible, E reste analysable si ses quatre rubriques sont disponibles.
- Division ou rubrique absente : les lignes disponibles restent visibles, mais aucune somme partielle n’est déclarée conforme.

V01 compare la somme des cinq contributions à la variation consolidée. V02 compare la somme des contributions de rubriques à la variation de la sélection. V02-6, V02-4390, V02-4389, V02-4578 et V02-4579 effectuent aussi cette vérification par division : des erreurs opposées entre divisions ne peuvent pas rendre l’analyse complète.

Résiduel = somme des contributions − variation, en centimes. Statut Conforme si résiduel nul, Bloquant si non nul, Indisponible si une valeur requise manque. Tous ces diagnostics sont internes et distincts de C01–C16 et du rapprochement source / CRD V2.2. Ils ne modifient pas la validation globale V2.2.

## Recette manuelle

1. Ouvrir `index.html`, aller au Tableau de bord, sélectionner février 2026 / toutes divisions et descendre au bloc Analyse mensuelle.
2. Pour E, vérifier M−1 = 663 000 €, M = 703 500 €, variation = +40 500 €, pourcentage affiché = +6,11 %.
3. Contributions des divisions dans l’ordre 6, 4390, 4389, 4578, 4579 : +12 300 €, +12 300 €, −8 700 €, +12 300 €, +12 300 €.
4. Contributions des rubriques : produits +76 500 €, achats −21 000 €, personnel −9 000 €, autres −6 000 €. Somme = +40 500 €. Les barres négatives et positives doivent toutes être visibles.
5. Choisir H : M−1 = 463 000 €, M = 497 500 €, variation = +34 500 €, pourcentage affiché = +7,45 %. Les deux contributions de retraitement valent −2 500 € et −3 500 €.
6. Sélectionner division 6 : E passe de 75 000 € à 87 300 € (+12 300 €) ; H passe de 45 000 € à 56 100 € (+11 100 €). Le tableau des cinq divisions reste visible.
7. Sélectionner janvier : le montant de janvier reste affiché, décembre 2025 est indisponible, la comparaison et les diagnostics dépendants sont indisponibles.
8. Parcourir Compte de résultat, Import et Contrôles ; vérifier que C01–C16 et les quatre étapes de rapprochement V2.2 restent présentes. La référence V2.2 reste une session séparée.
9. Vérifier l’affichage mobile et le défilement horizontal des tableaux. Au clavier, tester les sélecteurs et les régions de tableaux défilantes.

## Tests automatisés

```text
node --test robustness.test.cjs reconciliation.test.cjs reference-ui.test.cjs variance.test.cjs variance-ui.test.cjs
node test.cjs
node ui-test.cjs
```

V2.3 ajoute 20 tests unitaires et 5 tests d’interface avec DOM simulé. Le jeu `fixtures/variance-fictive.cjs` comporte des entrées et attentes écrites séparément du moteur : E +20 € et H +17 €, avec contributions positives, négatives et nulles. Il est utilisé uniquement par les tests, jamais pour remplacer la démonstration.

Les tests couvrent base nulle, valeurs négatives, signes des charges et retraitements, compensation, mois absent, doublon, rubrique absente, passage entre exercices, sélection de division, total altéré de 1 centime, décomposition altérée par division et dépassements de précision. Les suites V2.1 et V2.2 sont réexécutées sans modification de leurs règles.

## Limites

Les données restent janvier–septembre 2026. Aucun détail comptable ni cause économique n’est disponible. La réconciliation des variations est interne : elle n’atteste pas l’exactitude d’une source indépendante. L’exactitude monétaire du nouveau module est vérifiée au centime ; le moteur historique conserve ses propres règles, inchangées. Le pourcentage est un ratio en virgule flottante destiné à l’affichage et n’entre pas dans les contrôles de réconciliation.

Les tests d’interface ne remplacent pas la recette visuelle réelle, le lecteur d’écran ou un téléphone physique. Aucun serveur lancé, connexion externe, publication GitHub ou déploiement. Le dossier dist reste la publication antérieure.
