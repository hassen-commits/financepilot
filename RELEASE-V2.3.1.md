# FinancePilot v2.3.1-recette-validee

## Version figée localement

Branche : `codex/v2.3.1-excel-import`.
Base préservée : `v2.3-recette-validee`, commit `cbb65df2d2e22c21887bea201e16414aec524fcf`.
Le tag annoté `v2.3.1-recette-validee` identifie le commit contenant cette note.

La recette fonctionnelle a été déclarée validée et clôturée par l’utilisateur : six vérifications navigateur conformes, import et activation de 40 références fictives, rapprochement et validation globale conformes, aucune anomalie bloquante constatée. Aucun détail supplémentaire sur les six vérifications n’est inféré ; les limites techniques restent documentées dans le protocole.

## Changements inclus

Import .xlsx local, formats long et large mensuel, choix explicite d’une feuille et des colonnes, prévisualisation, correspondances fictives confirmées, erreurs localisées, refus des formules mappées et activation atomique de références V2.2 uniquement. Conservation du CSV, des données financières, des formules E/H, de C01–C16 et du rapprochement source / CRD.

La modification finale de préparation stable porte uniquement sur les mentions de version et la documentation de clôture. Le dossier dist reste la publication antérieure ; il n’est pas actualisé et ne représente pas cette version source.

## Contrôles avant commit

- 103 tests automatisés nommés réexécutés avant figement : 103 réussis, aucun échec. Les scripts historiques test.cjs et ui-test.cjs passent également.
- Fichiers applicatifs et documentaires et contenu XML des neuf classeurs fictifs examinés : aucun motif de secret, chemin personnel, identifiant personnel ou donnée professionnelle détecté. Les codes fonctionnels fictifs et les attributions publiques des bibliothèques sont conservés.
- Aucun fichier temporaire ajouté : sélection explicite des sources, fixtures, tests et notices. Ni clé, ni archive de déploiement, ni capture de l’ordinateur.
- SheetJS CE 0.20.3 et JSZip 3.10.1 : empreintes SHA-256 conformes à THIRD_PARTY_NOTICES.md ; notices Apache-2.0 et MIT présentes, y compris pako embarqué. Aucune modification des distributions originales.
- Le tag V2.3 et son commit sont contrôlés avant et après création du nouveau tag.

Une recherche par motifs n’est pas un audit exhaustif de sécurité. La lecture synchrone, les limites de ressources et les formats non pris en charge restent décrits dans RECETTE-V2.3.1.md.

## Publication distincte

Le figement demandé est local. Un éventuel envoi distant devra être confirmé explicitement par l’utilisateur et porter uniquement sur la branche dédiée et le nouveau tag ; il ne devra ni déplacer le tag V2.3 ni déployer le site. Aucune opération distante n’est nécessaire à cette préparation.
