# FinancePilot — Prototype V2.3 locale

## Analyse mensuelle V2.3

Le bloc Analyse mensuelle du tableau de bord compare M à M−1 pour E et H. Il affiche les contributions signées des cinq divisions et des rubriques existantes, ainsi que des diagnostics internes V01/V02 de réconciliation au centime. Aucun poste ni cause économique n’est inventé. Une base nulle est distincte d’une donnée manquante. Les données, C01–C16 et le rapprochement V2.2 restent inchangés.

Recette détaillée : `RECETTE-V2.3.md`. Tests supplémentaires : `node --test variance.test.cjs variance-ui.test.cjs`, à compléter par les suites V2.1/V2.2 et les scripts historiques. Aucun déploiement ou envoi GitHub effectué.

## Rapprochement indépendant V2.2

Dans Import ou Contrôles : choisir un CSV fictif de référence, vérifier le diagnostic technique, l’activer explicitement en mémoire, consulter les écarts financiers, puis valider le périmètre complet si tout est conforme. Le périmètre obligatoire inclut les cinq divisions et E/H/A/P, de janvier au mois de clôture choisi. Les filtres de détail ne réduisent pas la validation globale.

CSV strict : `annee;mois;division;rubrique;montant_eur`, UTF-8, point-virgule, montants signés avec point et deux décimales maximum. Les montants manquants ne deviennent jamais zéro. Les écarts sont exprimés en centimes et les statuts sont Conforme, Bloquant ou Non contrôlé. Les écarts financiers n’empêchent pas l’activation d’un CSV techniquement valide ; ils interdisent la validation globale.

Exemple indépendant écrit séparément : `fixtures/reference-fictive-janvier-fevrier.csv`. Choisir une clôture en février 2026 pour une recette complète de cet exemple. Il ne remplace pas les données de démonstration. Les références sont effacées au rechargement.

Tests : `node --test robustness.test.cjs reconciliation.test.cjs reference-ui.test.cjs`, `node test.cjs`, `node ui-test.cjs`. Voir `RECETTE-V2.2.md` pour le contrat, les tests, les limites et la recette manuelle. Les données, le modèle et les 16 contrôles V2.1 sont préservés. Aucune connexion externe, publication GitHub ou mise à jour du site hébergé effectuée.

## Robustesse V2.1 locale

Les 15 contrôles internes portent désormais les identifiants C01 à C15. C16 vérifie le périmètre et les paramètres. La sélection invalide produit un diagnostic Bloquant sans calcul ; les divisions inconnues ne passent plus silencieusement les contrôles. L’écran affiche les identifiants et distingue explicitement les contrôles internes des scénarios illustratifs.

Exécuter `node --test robustness.test.cjs` : 23 tests de robustesse, avec anomalies ciblées, références fictives indépendantes et vérification de non-modification des données. Compléter par `node test.cjs` et `node ui-test.cjs`. Voir `RECETTE-V2.1.md` pour la matrice et les limites. Les références indépendantes sont des assertions de test, sans réconciliation avec une source professionnelle. Aucun déploiement V2.1 effectué.

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
