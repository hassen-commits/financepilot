# FinancePilot V2.3.1 — import Excel local, recette utilisateur validée

Branche de travail : `codex/v2.3.1-excel-import`. Base : tag `v2.3-recette-validee`, commit `cbb65df2d2e22c21887bea201e16414aec524fcf`, inchangé.

## Statut et portée

Développement local uniquement, aucune publication GitHub ou mise à jour du site hébergé. La recette fonctionnelle est validée et clôturée par l’utilisateur : six vérifications navigateur conformes, activation de 40 références fictives, rapprochement conforme, validation globale conforme et aucune anomalie bloquante constatée. Cette déclaration utilisateur complète les observations de développement ci-dessous ; elle ne constitue pas une certification comptable.

Le CSV existant reste utilisable. Le nouveau lecteur .xlsx alimente exclusivement les références de rapprochement V2.2. Les données de calcul, les formules E/H, les contrôles C01–C16 et les diagnostics V2.3 ne sont pas modifiés. L’activation ne signifie ni conformité financière ni validation globale.

## Contrat du lecteur

- Une feuille sélectionnée explicitement par activation, y compris les feuilles masquées identifiées comme telles.
- Formats long et large mensuel ; aucune détection de structure ambiguë validée automatiquement.
- Ligne d’en-tête, première/dernière ligne et colonnes choisies explicitement.
- En large, chaque colonne de montant est associée explicitement à un mois distinct. Colonnes d’identité et de montants distinctes.
- Année, mois et identifiants explicites ; pas de conversion depuis une date Excel, un cumul ou une unité différente de l’euro.
- Deux profils confirmables : identifiants FinancePilot exacts ou alias entièrement fictifs DIV_DO/DR1/DR2/DR3/SIEGE et REF_E/H/A/P. Aucun code officiel SAC 36 n’est intégré.
- Toute formule dans les champs mappés, avec ou sans cache, est bloquée et signalée feuille/cellule/motif. Erreurs Excel, dates et booléens sont rejetés. Aucun lien externe actualisé.
- Aucune addition automatique de lignes détaillées, totaux ou sous-totaux. Les lignes hors plage et les exclusions explicites ne sont pas importées. Les doublons de clé normalisée sont bloquants, identiques ou non. Les cellules fusionnées dans la zone mappée sont bloquées.
- Montants en centimes exacts : décimaux et écritures scientifiques numériques OOXML sont normalisés par arithmétique entière ; précision excédentaire non nulle et dépassements rejetés. Les textes monétaires conservent le contrat strict V2.2 (point décimal, au maximum deux décimales).

Le lecteur récupère les valeurs XML financières originales : un affichage Excel arrondi ne remplace pas la valeur sous-jacente. Aucun résultat financier n’est modifié pour le rendre conforme. H manquant n’est jamais fabriqué à partir de E/A/P.

## Atomicité et mémoire

Fichier lu, candidat de mapping, référence active et validation globale restent distincts. Aucun remplacement avant confirmation explicite. Tout changement de mapping ou saisie de plage invalide immédiatement le candidat et sa confirmation. Un échec laisse la référence active précédente intacte. Des jetons de lecture empêchent un résultat tardif de remplacer un candidat plus récent.

L’activation mémorise les références normalisées et la provenance (feuille, cellules, mapping), puis libère le classeur candidat. Annuler libère le candidat sans supprimer la référence active. « Effacer toutes les références » supprime les deux. Recharger efface toute la session. Aucun localStorage, IndexedDB, base ou serveur d’import.

Le lecteur borne les archives : 2 Mo compressés, 8 Mo réellement décompressés, 256 composants ZIP, 12 feuilles, 20 000 cellules, 2 000 lignes et 64 colonnes sur l’ensemble lu. ZIP64, chiffrement, macros, composants binaires et déclarations XML externes ne sont pas pris en charge. Le dépassement sur une autre feuille bloque également le fichier : toutes les feuilles doivent pouvoir être inventoriées dans ces limites.

## Dépendances et réseau

SheetJS CE 0.20.3 et JSZip 3.10.1 sont embarqués ; voir `THIRD_PARTY_NOTICES.md` et les licences dans vendor. Aucun script distant dans la page. La politique CSP locale interdit les connexions sortantes (`connect-src 'none'`), les objets, les bases et les envois de formulaire. Les fichiers choisis sont lus par File API ; aucun code d’import n’utilise fetch, XMLHttpRequest ou WebSocket.

Le lancement facultatif `node server.cjs` sert uniquement des fichiers statiques autorisés, sur 127.0.0.1:4173 ; aucune route ne reçoit d’import. Ce n’est pas un serveur externe. L’ouverture directe de index.html reste prévue, mais le parcours complet en protocole file doit être recetté séparément dans Chrome.

## Classeurs fictifs fournis

`fixtures/excel/` contient :

- `long-multifeuilles.xlsx` : préambule, en-tête ligne 3, colonnes déplacées, 40 références janvier/février, feuille Notes masquée.
- `large-colonnes-deplacees.xlsx` : janvier/février inversés physiquement, 20 lignes de rubriques à déplier en 40 références.
- `formule-interdite.xlsx` : formule dans Référence fictive!D4.
- `doublon.xlsx`, `mois-manquant.xlsx`, `rubrique-inconnue.xlsx`, `montant-invalide.xlsx`, `totaux.xlsx`, `fusion.xlsx`.

Ces neuf fichiers sont fabriqués par `node fixtures/build-excel-fixtures.cjs`, à partir du CSV fictif indépendant existant, sans appel au moteur de calcul. Aucun fichier professionnel ni extraction SAC réelle n’a été utilisé.

## Vérifications automatisées

```text
node --test charts.test.cjs robustness.test.cjs reconciliation.test.cjs reference-ui.test.cjs variance.test.cjs variance-ui.test.cjs excel.test.cjs excel-ui.test.cjs
node test.cjs
node ui-test.cjs
```

Les nouvelles suites couvrent lecture Excel réelle en Node, formats long/large, feuilles masquées, mapping, exclusions, formules/cache, montants XML exacts, erreurs, ZIP/décompression, limites, atomicité, invalidation à la saisie, changement de candidat et maintien du CSV. Les tests d’interface automatisés utilisent un DOM simulé ; ils ne prouvent pas l’accessibilité ou la performance du navigateur.

Résultat de la campagne locale : 103 tests nommés exécutés, 103 réussis, aucun échec (78 tests historiques et 25 Excel : 18 lecteur/mapping et 7 interface). Les deux scripts historiques test.cjs et ui-test.cjs passent également. Après l’ajout de l’affichage de provenance de la feuille active, les 13 tests d’interface référence/Excel concernés ont été réexécutés avec succès.

## Vérification navigateur déjà réalisée par l’agent

Dans le navigateur intégré réel, sur le serveur statique local :

1. Ouverture de la page Import avec bibliothèques locales.
2. Sélection de long-multifeuilles.xlsx par le sélecteur de fichier natif.
3. Inventaire des deux feuilles, dont Notes masquée.
4. Choix de Référence fictive, format long, en-tête 3, plage 4–43 et mapping détaillé ci-dessous.
5. Confirmation, préparation de 40 références candidates et activation explicite.
6. Clôture février : 40 clés obligatoires présentes, rapprochements conformes, bouton de validation globale disponible. Ce bouton n’a pas été actionné.
7. Aucune erreur console observée pendant ce parcours. Une saisie de plage nécessitait une meilleure prise en compte des événements : corrigée et retestée dans ce parcours.

Ces observations ne constituent pas une validation finale. Aucun test complet hors ligne, relevé de requêtes réseau, mesure de mémoire, campagne de performance, parcours clavier complet ou campagne mobile n’a été certifié par l’agent.

## Protocole de recette utilisateur — conservé pour reproductibilité

### A. Préparation

1. Ouvrir index.html localement dans Chrome récent, ou lancer `node server.cjs` puis ouvrir http://127.0.0.1:4173/#import.
2. Vérifier la mention « V2.3.1 — recette validée ». Le site hébergé antérieur ne contient pas cette branche.
3. Ouvrir les outils de développement. Dans Network, vider le journal après chargement. Ne sélectionner que les classeurs fictifs fournis.

### B. Long : parcours nominal

1. Dans le bloc Import Excel, choisir long-multifeuilles.xlsx.
2. Vérifier que rien n’est activé et qu’aucune feuille n’est choisie automatiquement.
3. Choisir Référence fictive, structure Long, en-tête 3, première ligne 4, dernière ligne 43.
4. Mapper Année → F, Division → C, Rubrique → B, Mois → E, Montant → D.
5. Confirmer alias fictifs, EUR et mensuel. Cocher la confirmation puis contrôler le mapping.
6. Vérifier 40 références candidates, zéro exclusion, provenance visible, aucune activation implicite.
7. Activer temporairement, choisir février comme clôture. Attendus : 40 références obligatoires et 72 résultats conformes.
8. Sur le consolidé cumulé, E = 1 366 500 €, H = 960 500 €, A = 162 500 €, P = 243 500 €.
9. La validation globale peut alors être cliquée par l’utilisateur pour ce périmètre fictif. Recharger doit supprimer références et validation.

### C. Large

1. Choisir large-colonnes-deplacees.xlsx, feuille Référence fictive, format Large.
2. En-tête 1, plage 2–21 ; Année → A, Division → C, Rubrique → D.
3. Colonnes mensuelles : E → mois 1, B → mois 2. Laisser toutes les autres non importées.
4. Confirmer alias fictifs, EUR, mensuel et le mapping ; contrôler puis activer.
5. Attendre les mêmes 40 références et mêmes résultats que le format long. Associer deux colonnes au même mois doit bloquer.

### D. Erreurs et atomicité

1. Garder une référence valide active, puis choisir formule-interdite.xlsx et reproduire le mapping long. Vérifier un refus précis Référence fictive!D4, sans modification de l’actif.
2. Tester doublon, rubrique inconnue, montant invalide et fusion : refus avant activation.
3. Tester mois-manquant.xlsx : mapping long, en-tête 3, plage 4–23. Le candidat est techniquement activable, mais janvier manque et la validation globale est impossible.
4. Tester totaux.xlsx avec plage 4–44 : refus sur TOTAL. Exclure explicitement la ligne 44, reconfirmer et obtenir 40 références, sans addition du total.
5. Après préparation d’un candidat, changer une colonne ou saisir une nouvelle plage : le candidat doit devenir inactivable jusqu’à nouveau contrôle.
6. Annuler pendant une lecture ; aucun résultat tardif ne doit réapparaître. Charger ensuite un CSV V2.2 valide pour confirmer le maintien du mode CSV.

### E. Réseau et hors ligne — à relever manuellement

1. Une fois la page chargée, vider Network et importer/mapper/activer les deux fichiers nominaux.
2. Attendu : aucune requête réseau supplémentaire provoquée par l’import, aucun POST, aucun chargement CDN. Conserver une capture du journal vide ; ne pas confondre les requêtes initiales de scripts locaux avec une transmission de fichier.
3. Basculer Network en Offline, sans recharger la page, puis répéter l’import. Il doit fonctionner.
4. Tester aussi index.html en protocole file, réseau de l’ordinateur déconnecté, bibliothèques vendor présentes. Aucun accès réseau ne doit être nécessaire.
5. Revenir Online à la fin des essais.

### F. Mémoire, réactivité et limites — à relever manuellement

1. Dans Performance Monitor / Memory, relever l’état initial, importer, activer, annuler et effacer dix fois. Rechercher une croissance persistante ; une collecte mémoire différée n’est pas à elle seule une fuite.
2. Vérifier la réactivité sur l’ordinateur cible avec des fichiers fictifs proches des limites. La décompression est asynchrone mais la lecture SheetJS est synchrone et peut temporairement bloquer le fil principal.
3. Aucun seuil de temps ou mémoire n’est déclaré validé. Noter matériel, navigateur, taille, temps et éventuels blocages. Si nécessaire, une évolution Worker séparée sera requise.
4. Tester fichiers dépassant les limites : refus sans remplacement de référence active. Le bouton Annuler invalide le résultat ; il ne garantit pas l’interruption instantanée d’un calcul synchrone déjà engagé.

### G. Clavier et mobile — à relever manuellement

1. Tout parcourir avec Tab, Maj+Tab, flèches, Espace et Entrée : sélecteur de fichier, feuille, mapping, confirmation, contrôle, activation et validation globale.
2. Vérifier un focus visible, l’absence de piège clavier et la lisibilité des diagnostics. Tester avec lecteur d’écran si disponible.
3. En mode responsive 390 px et sur téléphone physique : boutons accessibles, colonnes choisissables, tableaux défilant dans leur cadre, aucun élargissement global de page.
4. Confirmer les contrôles C01–C16 et la bascule E → H → E des graphiques V2.3.

## Limites connues

Ce n’est pas un interpréteur universel d’extractions SAC 36. Aucun mapping officiel n’est supposé. La détection sémantique d’un cumul ou d’un total ayant un identifiant identique à une ligne mensuelle ne peut pas être garantie : le périmètre et le niveau sont explicitement confirmés. Les inconnues ou doublons ne sont jamais corrigés automatiquement.

Une seule feuille, une année par ligne, périodes mensuelles en colonnes ou en lignes ; pas de pivot à plusieurs axes implicites, pas de dates Excel ni cellule fusionnée à remplir, pas de montant texte localisé avec virgule. Les formules hors zone mappée ne sont pas importées ni exécutées. Le lecteur OOXML de jetons numériques vise les exports .xlsx ordinaires ; un document atypique non reconnu sera refusé plutôt qu’interprété approximativement.

Les limites d’archive réduisent les risques de surcharge sans constituer une garantie absolue contre tout fichier hostile. La recette réelle de performance et l’examen complet de sécurité ne sont pas terminés. Le tag de référence n’a pas été changé, aucun déploiement ni publication effectué.
