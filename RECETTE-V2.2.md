# Recette locale FinancePilot V2.2

## Périmètre et indépendance

Quatre rubriques : E (EBITDA), H (EBITDA hors produits immobilisés), A (production immobilisée ACE), P (production immobilisée liée à la masse salariale). Relation du prototype : H = E − A − P.

La démonstration et les contrôles internes C01 à C16 sont inchangés. La référence importée est conservée séparément en mémoire. Les agrégats de référence sont des sommes des montants CSV ; ce ne sont pas des totaux fournis indépendamment. Ils ne sont jamais calculés en appelant le moteur FinancePilot. Le module de rapprochement utilise ce moteur uniquement pour obtenir le côté « calculé » et ses contrôles internes.

Le fichier `fixtures/reference-fictive-janvier-fevrier.csv` contient 40 montants fictifs écrits séparément, pour les cinq divisions et janvier/février 2026. Les résultats consolidés et cumulés attendus des tests sont fixés séparément. Aucun fichier professionnel utilisé. Un exemple de contrôle arithmétique manuel : février division 4389, H = 132 300 − 16 500 − 24 700 = 91 100 €.

## Quatre étapes distinctes dans Import et Contrôles

1. Validation technique : choisir le CSV dans le bloc « Validation technique du CSV de référence fictif ». Diagnostics et aperçu des 20 premières observations. Aucune activation implicite.
2. Activation temporaire : bouton explicite. Le nouveau candidat remplace alors la référence active, jamais les données de démonstration. Un fichier techniquement valide mais financièrement erroné reste activable. Un candidat invalide conserve la précédente référence active.
3. Rapprochement : année et mois de clôture définissent le périmètre obligatoire. Les filtres de mois, division, rubrique et vue ne modifient que l’affichage. Les tables montrent référence et calculé à deux décimales, écart entier en centimes, statut et motif. Les références manquantes sont identifiables par leur clé.
4. Validation globale : bouton uniquement disponible lorsque l’ensemble obligatoire est conforme. La confirmation est temporaire, propre à la référence active, à l’année et au mois de clôture. Réactiver une référence, changer le périmètre ou effacer invalide cette confirmation. Changer un filtre de détail ne modifie pas le périmètre validé.

Recharger ou fermer l’onglet supprime les références et la confirmation. Aucun stockage navigateur permanent, serveur d’import ou transmission. Aucun serveur n’est lancé pour cette évolution. Le lanceur statique facultatif déjà présent reste compatible.

## Contrat technique strict

UTF-8 (BOM autorisé), point-virgule, colonnes exactes `annee;mois;division;rubrique;montant_eur`. Leur ordre peut varier, pas leur orthographe. Une ligne de données minimum ; lignes vides internes rejetées. Champs CSV entre guillemets autorisés, avec fermeture stricte. Extension `.csv`, limite 2 Mo. Autres formats, dont Excel, rejetés.

Année de 1000 à 9999 sur quatre chiffres. Mois entier de 1 à 12 sans zéro initial. Divisions textuelles exactes : 6, 4390, 4389, 4578, 4579. Rubriques exactes : E, H, A, P. Clé unique année/mois/division/rubrique ; les doublons identiques sont également rejetés.

Montants : signe moins optionnel, zéro autorisé, point décimal, zéro à deux décimales. Pas d’espaces, de milliers, de signe plus, de notation scientifique ou de valeurs non finies. Conversion textuelle exacte en centimes, sans arrondi silencieux. Rejet au-delà de la limite d’entier sûr JavaScript ; les agrégations contrôlent aussi les dépassements. Aucun signe comptable supplémentaire imposé à A ou P.

La cohérence H = E − A − P est financière : elle ne bloque pas l’activation technique. Elle est signalée Bloquante dans une table distincte de cohérence de référence et interdit la validation globale.

## Statuts et validation globale

- Conforme : référence complète, calcul disponible et écart nul.
- Bloquant : écart non nul, calcul indisponible avec référence présente, ou dépassement de précision. Une référence incohérente et un contrôle interne non conforme bloquent aussi la validation globale.
- Non contrôlé : référence absente. Un agrégat avec une référence composante manquante reste indisponible, jamais une somme partielle déclarée conforme.

Écart = calculé − référence en centimes. Aucun seuil de tolérance et aucune correction automatique. Le total global comprend toujours les cinq divisions et les quatre rubriques de janvier jusqu’au mois de clôture (20 × nombre de mois clés obligatoires). Les comparaisons détaillées, les agrégats mensuels et les cumuls sont tous examinés ; des erreurs compensées entre mois, divisions ou retraitements ne peuvent pas autoriser la validation.

La synthèse interne examine C01–C16 pour tous les mois et divisions du périmètre. La recette de rapprochement est distincte de ces vérifications internes : aucun résultat interne n’est présenté comme une réconciliation de source.

## Exécuter la recette

```text
node --test robustness.test.cjs reconciliation.test.cjs reference-ui.test.cjs
node test.cjs
node ui-test.cjs
```

La suite V2.1 comprend 23 tests. V2.2 ajoute 19 tests du contrat, du moteur et des sessions, plus 6 tests du parcours d’interface sans navigateur. Cas couverts :

- CSV conforme, BOM, CRLF, colonnes réordonnées et champs cités.
- Colonnes invalides, mauvaises clés, doublons, montants invalides, précision et sommes hors limite.
- Référence complète, signe des écarts au centime, référence incohérente mais activable.
- Clés obligatoires manquantes, référence absente, exercice différent, année incomplète et calcul indisponible.
- Compensations entre divisions, mois, ACE et personnel ; impossibilité de validation globale malgré un total conforme.
- Contrôles internes bloquants avec rapprochements concordants.
- Aperçu distinct de l’activation, remplacement explicite, candidat invalide, validation globale explicite et invalidation sur changement de clôture.
- Limite 2 Mo, Excel rejeté, octets UTF-8 invalides, lectures tardives, effacement et nouvel onglet vide.
- Échappement HTML des contenus importés, absence de modification de la démonstration et maintien des 16 contrôles.

Recette manuelle proposée : ouvrir `index.html`, aller dans Import, choisir le CSV fictif du dossier fixtures, activer, sélectionner clôture février. Les 40 références obligatoires sont présentes et les 72 résultats (mensuels et cumulés, divisions et consolidé) doivent être conformes. Cliquer ensuite sur « Valider le périmètre fictif ». Passer à mars doit interdire la validation pour références manquantes. Effacer les références remet les résultats à Non contrôlé.

## Limites

L’interface est testée avec un DOM simulé, sans nouvelle vérification visuelle dans un navigateur réel. Recette visuelle sur ordinateur/mobile, clavier et lecteur d’écran à compléter. Les fichiers sont exclusivement fictifs ; la validation est technique et ne constitue aucune certification comptable.

La démonstration fournit uniquement janvier–septembre 2026. Le moteur de rapprochement accepte une clôture de 1 à 12 et les années présentes dans les références, mais ne fabrique jamais les calculs manquants. Une année complète nécessite les douze mois des deux côtés. Le CSV de recette fourni est volontairement limité à janvier/février.

La limite de précision s’applique à chaque montant et chaque somme. Le modèle historique produit des euros puis le rapprochement convertit au centime ; le contrat strict sans arrondi porte sur le CSV de référence. L’aperçu CSV générique historique demeure séparé et ne peut pas être activé comme référence par son ancien bouton.

L’indépendance d’un fichier utilisateur ne peut pas être prouvée automatiquement : elle relève de sa provenance. Le prototype ne génère pas de référence en utilisant son moteur. Aucune intégration d’une référence en base, aucune piste d’audit persistante, aucune publication. Le dossier `dist/` reste la version hébergée antérieure ; il n’est pas actualisé.
