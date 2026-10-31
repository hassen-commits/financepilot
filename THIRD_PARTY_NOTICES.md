# Dépendances embarquées V2.3.1

Aucun CDN n’est utilisé par les pages de FinancePilot. Les fichiers suivants sont distribués localement dans `vendor/`. Le téléchargement initial a servi uniquement à préparer le projet ; aucun classeur n’a été envoyé.

## SheetJS Community Edition 0.20.3

SheetJS Community Edition — https://sheetjs.com/
Copyright (C) 2012-present SheetJS LLC.
Licence Apache-2.0, copie intégrale : `vendor/SheetJS-LICENSE.txt`.

Distribution originale non modifiée : `vendor/xlsx-0.20.3.full.min.js`.
Provenance : https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js
Licence : https://cdn.sheetjs.com/xlsx-0.20.3/package/LICENSE
Documentation de redistribution : https://docs.sheetjs.com/docs/miscellany/license/

SHA-256 : `cc015130aa8521e7f088f88898eba949ccdcbfb38df0bd129b44b7273c3a6f41`.

Cette bibliothèque lit la structure OOXML et les types des cellules. Elle ne recalcule pas les formules pour cet import ; leurs valeurs enregistrées ne sont pas acceptées dans les champs mappés. Les décimaux financiers numériques sont relus depuis les jetons XML pour éviter une conversion flottante silencieuse.

## JSZip 3.10.1 et pako inclus

JSZip — https://stuk.github.io/jszip/
Copyright (c) 2009-2016 Stuart Knightley et contributeurs.
Licence choisie : MIT (JSZip est proposé sous MIT ou GPLv3).
Distribution originale non modifiée : `vendor/jszip-3.10.1.min.js`.
Provenance de cette copie : package JSZip 3.10.1 du runtime local fourni, distribution amont https://github.com/Stuk/jszip/tree/v3.10.1.
Licence intégrale : `vendor/JSZip-LICENSE.markdown`.

SHA-256 : `acc7e41455a80765b5fd9c7ee1b8078a6d160bbbca455aeae854de65c947d59e`.

La distribution JSZip contient pako sous licence MIT ; copie de la licence : `vendor/pako-LICENSE.txt`. Les notices intégrées à la distribution restent intactes.

JSZip sert à contrôler et limiter la décompression avant la lecture Excel. Les bibliothèques ne sont pas des garanties de validation comptable. Toute mise à jour devra vérifier les licences et réexécuter les tests.
