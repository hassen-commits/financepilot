# FinancePilot — Prototype V2

## Évolutions V2

Deux indicateurs sont suivis au mois, en cumul et par division : EBITDA principal et EBITDA hors produits immobilisés. Le complémentaire est calculé par soustraction de la production immobilisée ACE et de la production immobilisée liée à la masse salariale. Ces deux composantes sont déjà comprises dans les produits fictifs, sans ajout aux produits de la V1. Les montants EBITDA de la V1 sont donc préservés.

La correspondance structurelle retenue est EBITDA / production immobilisée ACE / production immobilisée masse salariale. Les références de cellules Excel ne sont pas des codes métier. Aucune donnée, formule liée à un fichier professionnel ou chemin professionnel n’est intégré au code. Cette correspondance ne certifie pas une règle comptable.

Pour d = indice de division et m = indice de mois, tous deux à partir de zéro : production immobilisée ACE = 12 000 + 2 000 × d + 500 × m ; production immobilisée personnel = 18 000 + 3 000 × d + 700 × m. Toutes les données restent mensuelles, déterministes et fictives. Aucune transposition des périodes du classeur de référence n’est effectuée. Les calculs additionnent des centimes entiers et restituent des euros.

Le modèle filtre explicitement l’exercice. Un mois absent, un doublon ou un montant nécessaire manquant rend le résultat concerné indisponible (affiché « — »). Un retraitement absent ne rend pas l’EBITDA principal indisponible si ses quatre rubriques sont complètes. Les variations à base nulle restent non calculables. Les retraitements négatifs ne sont pas interdits.

Les contrôles automatiques vérifient la complétude, les cumuls et consolidations mensuelles/cumulées des deux indicateurs et retraitements, et le passage entre indicateurs. La consolidation porte sur les cinq divisions fictives uniquement. Les scénarios illustratifs de statuts sont séparés des résultats automatiques. Ces contrôles techniques ne constituent pas une validation comptable ni un rapprochement avec une source indépendante.

Le tableau de bord garde l’EBITDA principal en avant, ajoute le complémentaire et permet de choisir l’indicateur des graphiques. Le compte de résultat détaille les deux montants à déduire, présentés positivement dans le jeu fictif. Le CSV de démonstration contient désormais neuf colonnes ; l’import reste un aperçu indépendant, sans alimentation des indicateurs. Excel reste non pris en charge.

Tests V2 : résultats attendus indépendants pour janvier/février division 6, deux indicateurs et retraitements, tous les mois/divisions, exercice absent, mois absent, doublon, montant manquant, retraitement négatif et indicateur volontairement erroné. Recette visuelle V2 sur ordinateur et mobile à effectuer ; la recette V1 ci-dessous reste historique.

## Documentation historique V1

Application pédagogique locale, en français, exclusivement fictive.

## Démarrer

Ouvrir `index.html` dans un navigateur récent, sans installation. Ou lancer `node server.cjs` et ouvrir http://127.0.0.1:4173. Ce serveur statique écoute uniquement sur cet ordinateur et ne reçoit aucun import.

## Fonctions réalisées

Quatre écrans : tableau de bord, compte de résultat simplifié, import et contrôles. Filtres communs sur 2026, janvier à septembre et cinq divisions : 6, 4390, 4389, 4578, 4579. Graphiques, EBITDA mensuel et cumulé, variations en euros et pourcentage. Interface adaptée aux petits écrans et navigation clavier.

Import CSV UTF-8, séparé par virgule ou point-virgule, champs entre guillemets et retours à la ligne acceptés, limite 2 Mo et aperçu de 20 lignes. Excel explicitement non pris en charge. L’import ne remplace pas le jeu de démonstration. Aucune transmission, persistance ou validation comptable. Effacer l’aperçu ou recharger supprime les données. Téléchargement du CSV fictif commun disponible.

Les contrôles sont des scénarios simulés : sources dérivées des calculs fictifs, écarts injectés de 1 250 € et 15 000 €, statuts prédéfinis. Aucun seuil officiel ni validation réelle. Aucun contrôle des données importées.

## Calculs vérifiables

45 observations, montants en euros entiers. Formules dans `model.js`, sans aléatoire. Pour l’indice de division d (0 à 4 dans l’ordre ci-dessus) et l’indice de mois m (0 à 8) :

- Produits = 420 000 + d × 92 000 + m × 12 500 + ((m+d) modulo 3) × 7 000.
- Achats = −(145 000 + d × 31 000 + m × 4 200).
- Personnel = −(158 000 + d × 26 000 + m × 1 800).
- Autres charges = −(42 000 + d × 9 000 + m × 1 200).

EBITDA pédagogique = somme des quatre rubriques. Produits positifs, charges négatives. Amortissements, résultat financier et impôts sur les bénéfices exclus. Aucune règle propre à la SNCF. Le tableau ne constitue pas un compte de résultat statutaire complet.

Cumul = somme de janvier au mois sélectionné, jamais une valeur indépendante. Variation = M − M-1 ; variation en % = variation / |M-1| × 100. Base nulle : non calculable. Janvier : comparaison indisponible car décembre 2025 absent. Une variation positive sur une charge traduit une diminution de charge.

## Tests

`node test.cjs` vérifie les observations, la consolidation, tous les cumuls par mois et division, les signes, les bases nulles et les CSV valides/invalides. `node --check script.js` vérifie la syntaxe.

Avant un usage réel : faire valider les définitions et le périmètre par la finance, rapprocher des résultats attendus indépendants, tester les arrondis, les schémas et contrôles métier, les encodages et gros fichiers. Vérifier Chrome/Firefox/Edge, mobile, clavier et lecteur d’écran, et ajouter des tests d’interface automatisés. Définir les exigences de sécurité et de confidentialité avant toute donnée réelle.

Aucune base de données, authentification, persistance navigateur ou dépendance distante. Aucun déploiement effectué. Toute base ou publication nécessite un accord ultérieur.
