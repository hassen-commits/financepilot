# FinancePilot V2.4 — Synthèse automatique de gestion

## Statut

Développement local sur `codex/v2.4-synthese-gestion`, depuis `fdcd7a0` (tag `v2.3.1-recette-validee`). Recette fonctionnelle officiellement validée et clôturée par l’utilisateur le 1er novembre 2026. Bilan déclaré : 11 tests de recette utilisateur conformes, 129 tests automatisés réussis selon le compte rendu de développement, aucun défaut bloquant. Fonctionnement hors ligne, copie, clavier, mobile et actualisation conformes. Cette validation reste limitée au prototype local et aux données fictives. Ni main ni les tags validés ne sont modifiés. Aucun déploiement ni publication GitHub.

## Fonctionnement et règles

Le bloc Synthèse de gestion est placé à la suite de l’analyse mensuelle dans le tableau de bord. Son périmètre est toujours le consolidé des divisions 6, 4390, 4389, 4578 et 4579, indépendamment du filtre division. Les deux indicateurs E et H sont présentés au mois M et M−1 ; l’indicateur des graphiques détermine celui détaillé par contributions. Le texte est entièrement déterministe, sans hasard, horloge implicite, service réseau ou IA.

Le collecteur lit FinanceModel, FinanceVariance et une vue en lecture seule de la session de référence. Le générateur reçoit un contexte et produit neuf sections : périmètre, situation mensuelle, principales divisions, rubriques, C01–C16, V01/V02, rapprochement source / CRD, validation globale et limites. Il ne modifie aucun montant ou statut et ne prétend jamais démontrer une cause économique.

Les trois premières divisions non nulles sont triées en valeur absolue décroissante, signe conservé, puis départagées selon l’ordre stable 6, 4390, 4389, 4578, 4579. Les contributions hors top trois sont regroupées séparément en positif et négatif. Les totaux positifs et négatifs de toutes les contributions disponibles sont également présentés, même lorsque le net est nul. Moins de trois contributions disponibles n’entraîne aucune invention.

Le seuil éditorial, par défaut 1 000,00 €, est inclusif et uniquement rédactionnel. Une rubrique non nulle est citée si sa contribution absolue est supérieure ou égale au seuil. Les rubriques omises sont regroupées en totaux positifs et négatifs distincts. Un seuil zéro inclut toutes les contributions non nulles. Les zéros restent dans les tableaux financiers existants, sans phrase individuelle dans la synthèse.

Le seuil accepte un montant positif ou nul avec point décimal et au plus deux décimales, reste en mémoire dans cet onglet et revient à 1 000,00 € après rechargement. Chaque saisie régénère le texte. Une entrée invalide retire le commentaire et désactive la copie. Les calculs et tableaux financiers ne dépendent pas du seuil.

Charges déjà négatives et coefficients des deux retraitements H sont repris de FinanceVariance sans nouvelle inversion. Montants/contributions sont en centimes ; regroupements contrôlés par BigInt et rejetés hors précision. Les pourcentages sont ceux de V2.3, arrondis pour affichage seulement. Une base précédente nulle est Non calculable, distincte des données absentes et des comparaisons indisponibles. Janvier recherche décembre de l’année précédente.

Une analyse partielle ou non réconciliée est signalée. Les contributions disponibles restent consultables, mais aucun total partiel n’est déclaré complet. Une donnée absente ne devient jamais zéro.

## Contrôles, référence et validation

La synthèse lit C01–C16 pour M et M−1, pour le consolidé et chaque division. Ces contrôles conservent leurs portées propres, dont les cumuls de janvier à la clôture. Les anomalies comportent période, identifiant et division ; les diagnostics V01/V02 sont affichés séparément pour E et H avec la période comparée et le résiduel en centimes.

La vue `FinanceReferenceView` renvoie une copie profondément gelée des rapports, de l’existence de références actives et de l’état de validation, sans exposer les données de référence ni leur mécanisme de modification. Les rapports sont calculés pour l’année et la clôture demandées par la synthèse, indépendamment des filtres d’affichage d’Import. Les références prévisualisées mais non activées n’influencent pas le texte.

Le rapprochement précise : absence de référence (Non contrôlé), nombre de références obligatoires manquantes, écarts bloquants détaillés et incohérences H = E − A − P. Des écarts détaillés compensés ne sont jamais cachés par une conformité consolidée. Les agrégats de référence restent des sommes du fichier actif, pas des totaux indépendants fournis séparément.

Une conformité ou l’absence d’anomalie ne signifie jamais qu’une validation a été réalisée. Le texte distingue périmètre éligible, validation non effectuée et validation explicitement effectuée pour la version de référence, l’année et la clôture exactes. Une validation de février n’est pas étendue à janvier. Les règles V2.2 d’invalidation sur changement de périmètre sont conservées.

Activation, effacement et changement de validation notifient les lecteurs de synthèse. Le remplacement du commentaire est atomique du point de vue d’affichage : l’ancien texte est retiré avant collecte ; toute erreur laisse une explication et aucun texte ancien à copier. Les rendus du tableau de bord effacent également la synthèse avant recalcul. Une confirmation tardive du presse-papiers ne peut pas confirmer la copie d’une nouvelle synthèse.

## Copie

Le bouton utilise navigator.clipboard.writeText si disponible et autorisé. En cas de refus ou d’absence, le texte est sélectionné et une instruction Ctrl+C / Copier est affichée. La zone de texte reste lisible, sélectionnable, redimensionnable et en lecture seule. Le bouton n’est pas une action de validation comptable.

## Tests automatisés

```text
node --test charts.test.cjs robustness.test.cjs reconciliation.test.cjs reference-ui.test.cjs variance.test.cjs variance-ui.test.cjs excel.test.cjs excel-ui.test.cjs management-summary.test.cjs management-summary-ui.test.cjs
node test.cjs
node ui-test.cjs
```

La V2.4 ajoute 16 tests du générateur/collecteur et 10 tests d’interface/vues. `fixtures/management-summary-fictive.cjs` contient des attentes indépendantes du générateur : E +1 000 € / +20 %, H +970 € / +24,25 %, égalités de classement, contributions de 1 000 € et 999,99 €, signes opposés. Aucun appel au générateur testé ne produit ces attentes.

Campagne locale exécutée : 129 tests nommés réussis, aucun échec (103 existants et 26 nouveaux). Les scripts historiques test.cjs et ui-test.cjs passent également. Vérification Git : model.js, reconciliation.js et variance.js identiques au tag de référence ; main et les tags validés inchangés.

Cas : déterminisme, absence de mutation, classement stable, seuil inclusif/configurable, omissions signées, coefficients H, base nulle, données manquantes, anomalies internes, écarts source, validation explicite distincte, période antérieure, dépassement de précision, invalidation du texte, copie exacte/secours, notification des références et confirmation de copie tardive.

Les tests historiques de graphiques et de navigation chargent les nouveaux modules en conservant leurs assertions existantes ; les tests de bascule vérifient en plus l’indicateur détaillé dans la synthèse.

## Vérification navigateur réalisée pendant le développement

Sur le serveur statique local 127.0.0.1:4173 :

- Affichage de la synthèse septembre 2026, E/H et diagnostics distincts.
- Passage à février / filtre division 6 / indicateur H : périmètre de synthèse toujours consolidé et valeurs E/H attendues.
- Seuil saisi à 21 000 € : achats à −21 000 € inclus, rubriques de plus faible amplitude regroupées.
- Seuil invalide : texte immédiatement vide et message d’indisponibilité.
- Restauration du seuil à 1 000 € puis bouton Copier : confirmation « Texte copié ».
- Aucune erreur console observée dans ce parcours.

Ces observations de développement sont complétées par la recette utilisateur clôturée le 1er novembre 2026 : hors ligne, copie, clavier, mobile et actualisation déclarés conformes. Le journal réseau détaillé, le lecteur d’écran et la performance sur machines moins puissantes ne sont pas explicitement attestés dans le bilan utilisateur ; aucun seuil de performance n’est déclaré validé.

## Protocole de recette fonctionnelle utilisateur

1. Ouvrir index.html localement dans Chrome ou lancer `node server.cjs` et ouvrir http://127.0.0.1:4173/#dashboard. Le site hébergé reste une version antérieure. Vérifier « V2.4 — recette validée ».
2. Choisir février 2026 et toutes divisions ; descendre à Synthèse de gestion. E : 663 000 € → 703 500 €, +40 500 € / +6,11 %. H : 463 000 € → 497 500 €, +34 500 € / +7,45 %.
3. En E, top trois : 6, 4390, 4578, chacun +12 300 €. Toutes les contributions : positives +49 200 €, négatives −8 700 €. Autres divisions hors top trois : +12 300 € et −8 700 €.
4. Sélectionner division 6 sur le tableau de bord : la synthèse doit rester consolidée, avec les mêmes montants. Le bloc Analyse mensuelle peut en revanche détailler la division 6.
5. Basculer E → H → E avec les sélecteurs existants. En H, top trois : 6, 4390, 4578, chacun +11 100 €. Totaux de toutes les contributions : +44 400 € et −9 900 €.
6. En E, saisir le seuil 21000 : produits +76 500 € et achats −21 000 € cités individuellement ; rubriques omises : positives 0 €, négatives −15 000 €. En H, les rubriques omises totalisent −21 000 €. Tester aussi 0, 21000.01, un très grand seuil et une valeur invalide. Aucun tableau financier ne doit changer.
7. Choisir janvier : décembre 2025 absent et comparaison indisponible. Le texte ne doit pas remplacer décembre par zéro. Les contrôles et rapports antérieurs doivent être datés 12/2025.
8. Sans référence activée, vérifier « Non contrôlé » et « validation globale non effectuée », malgré des contrôles internes conformes.
9. Dans Import, prévisualiser le CSV fictif janvier/février sans l’activer ; revenir à la synthèse : aucun changement du rapprochement. Activer ensuite ce fichier et revenir à février : rapprochements conformes mais validation non effectuée explicitement.
10. Dans Import, choisir clôture février puis cliquer Valider le périmètre fictif. Revenir au tableau de bord février : validation explicitement effectuée pour février seulement. En janvier, la synthèse ne doit pas prétendre que janvier a été validé.
11. Remplacer temporairement la référence avec une copie fictive contenant un écart d’un centime : la synthèse doit signaler cet écart, sans ancienne affirmation de conformité. Effacer les références : retour à Non contrôlé.
12. Cliquer Copier, coller dans un éditeur local et vérifier l’intégralité du texte, les signes et accents. Refuser l’accès au presse-papiers si le navigateur permet cet essai : le secours doit sélectionner le texte et indiquer la copie manuelle.
13. Recharger : seuil par défaut, références effacées, aucune validation mémorisée. Aucun stockage permanent.
14. En outils de développement, vider Network après chargement puis changer période/indicateur/seuil et importer une référence fictive : aucune transmission ni dépendance distante déclenchée. Passer hors ligne et répéter sans recharger. Tester aussi l’ouverture file avec les fichiers locaux présents.
15. Tester Tab/Maj+Tab, Entrée pour le seuil, sélection/copie du texte et focus visible. Vérifier 390 px et téléphone physique, retours à la ligne et absence de défilement horizontal global.

## Limites et décisions conservées

Les données financières disponibles restent janvier–septembre 2026. La synthèse se fonde sur des rubriques agrégées et n’identifie pas de comptes détaillés ni de causes économiques. Une référence financière ne devient pas une donnée du compte de résultat. Les contrôles internes ne sont jamais appelés « réconciliation avec la source ».

En présence de nombreuses anomalies, le texte est volontairement plus long : les écarts bloquants ne sont pas tronqués. Les contrôles C01–C16 et les rapports de référence conservent leurs portées cumulées, même si la synthèse est mensuelle. Leur collecte peut rendre une saisie de seuil moins fluide sur une machine lente ; la performance reste à mesurer dans la recette.

La validation globale mémorisée reste celle de V2.2, limitée à la session et invalidée selon ses règles. Ce module ne crée aucune nouvelle validation, n’enregistre pas d’historique persistant et ne modifie aucun statut de contrôle. La validation fonctionnelle V2.4 est clôturée le 1er novembre 2026 ; elle ne constitue pas une validation comptable professionnelle.
