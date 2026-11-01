const {test}=require('node:test'),assert=require('node:assert/strict');
const G=require('./management-summary.js'),fixture=require('./fixtures/management-summary-fictive.cjs'),M=require('./model.js'),V=require('./variance.js'),Q=require('./reconciliation.js');
const original=JSON.stringify(M.data),noReference={snapshot:(year,month)=>({active:false,validated:false,validationScope:null,report:Q.report({year,closure:month,model:M})})};
const section=(result,title)=>result.sections.find(s=>s.title===title).lines.join('\n');
test('Texte déterministe, structuré et sans mutation',()=>{
 const input=fixture(),before=JSON.stringify(input),a=G.generate(input),b=G.generate(input);assert.equal(a.text,b.text);assert.equal(JSON.stringify(input),before);assert.equal(a.sections.length,9);assert.match(a.text,/Consolidé des cinq divisions/);assert.match(a.text,/jamais des causes économiques/);
});
test('Attentes indépendantes E et H, montants et variations dans le texte',()=>{
 const r=G.generate(fixture());const s=section(r,'Situation mensuelle');assert.match(s,/6\s*000,00/);assert.match(s,/5\s*000,00/);assert.match(s,/\+1\s*000,00/);assert.match(s,/\+20 %/);assert.match(s,/4\s*970,00/);assert.match(s,/\+970,00/);assert.match(s,/\+24,25 %/);
});
test('Top trois absolu signé, égalités selon ordre stable',()=>{
 const r=G.generate(fixture());assert.deepEqual(r.topDivisions,['6','4390','4389']);const s=section(r,'Principales contributions par division');assert.match(s,/Division 4390 : contribution arithmétique de -1\s*000,00/);assert.match(s,/Autres divisions[^\n]*négatives -500,00/);
});
test('Seuil 1000 inclusif, 999,99 exclu ; omissions positives et négatives séparées',()=>{
 const r=G.generate(fixture());assert.deepEqual(r.significantRubrics,['revenue','purchases']);const s=section(r,'Contributions par rubrique');assert.match(s,/positives \+999,99/);assert.match(s,/négatives -999,99/);assert.doesNotMatch(s,/Personnel :/);
});
test('Seuil configurable, nul et supérieur à toute contribution',()=>{
 assert.equal(G.generate(fixture(),{thresholdCents:0}).significantRubrics.length,4);assert.equal(G.generate(fixture(),{thresholdCents:300000}).significantRubrics.length,0);
 for(const thresholdCents of [-1,NaN,Infinity,0.5])assert.throws(()=>G.generate(fixture(),{thresholdCents}));assert.throws(()=>G.generate(fixture(),{indicator:'inconnu'}));
});
test('H : deux retraitements, coefficients déjà appliqués sans inversion supplémentaire',()=>{
 const r=G.generate(fixture(),{indicator:'ebitdaExCapitalized',thresholdCents:0});const s=section(r,'Contributions par rubrique');assert.match(s,/ACE : contribution arithmétique de -50,00/);assert.match(s,/personnel : contribution arithmétique de \+20,00/);assert.match(s,/opposé de leur variation/);
});
test('Base nulle distincte de comparaison indisponible',()=>{
 const s=fixture();s.E.consolidated={previous:0,current:5000,amount:5000,percent:null,state:'zero-base'};s.H.consolidated={previous:null,current:5000,amount:null,percent:null,state:'unavailable'};
 const t=G.generate(s).text;assert.match(t,/Non calculable : base précédente nulle/);assert.match(t,/Comparaison indisponible/);assert.match(t,/Variation : \+50,00/);
});
test('Valeurs négatives et contributions compensées visibles même à variation nulle',()=>{
 const s=fixture();s.E.consolidated={previous:-10000,current:-7000,amount:3000,percent:30,state:'available'};s.E.byDivision[0].amount=100000;s.E.byDivision[1].amount=-100000;s.E.byDivision.slice(2).forEach(d=>d.amount=0);
 const r=G.generate(s);assert.match(r.text,/-70,00/);assert.match(r.text,/\+30 %/);assert.match(r.text,/positives \+1\s*000,00/);assert.match(r.text,/négatives -1\s*000,00/);
});
test('Données manquantes : pas de total partiel prétendu complet',()=>{
 const s=fixture();s.E.complete=false;s.E.byDivision[0].amount=null;s.E.byRubric[0].amount=null;
 const t=G.generate(s).text;assert.match(t,/4\/5 divisions comparables/);assert.match(t,/aucun total partiel déclaré conforme/);assert.match(t,/1 rubrique\(s\) indisponible/);
});
test('C01–C16 : anomalie localisée par période/division et diagnostic V01 distinct',()=>{
 const s=fixture();s.controls[0].results.push({division:'4390',checks:[{id:'C16',status:'Bloquant',gap:1}],issues:['Division inconnue']});s.E.diagnostics[0]={id:'V01',status:'Bloquant',gap:1};
 const r=G.generate(s);assert.match(section(r,'Contrôles internes C01–C16'),/02\/2026/);assert.match(r.text,/C16 · division 4390 : Bloquant/);assert.match(section(r,'Réconciliation interne des variations V01/V02'),/V01 : Bloquant ; résiduel 1 centime/);
});
test('Référence absente : Non contrôlé et aucune validation déduite',()=>{
 const r=G.generate(fixture());assert.match(r.text,/Non contrôlé : aucune référence activée/);assert.match(r.text,/validation globale non effectuée/);assert.doesNotMatch(r.text,/validation globale explicitement effectuée/);
});
test('Rapprochement conforme : éligible n’est pas explicitement validé',()=>{
 const s=fixture();s.references[0]={period:{year:2026,month:2},active:true,report:{rows:[],blocking:0,missingCount:0,referenceIssues:[],canValidate:true},validated:false,validationScope:null};
 assert.match(G.generate(s).text,/périmètre éligible ; validation globale non effectuée explicitement/);
 s.references[0].validated=true;assert.match(G.generate(s).text,/02\/2026 : validation globale explicitement effectuée/);
});
test('Écarts source, manques et incohérence de référence distincts des contrôles internes',()=>{
 const s=fixture();s.references[0]={period:{year:2026,month:2},active:true,validated:false,validationScope:{year:2026,month:1},report:{rows:[{status:'Bloquant',cumulative:false,month:2,division:'6',rubric:'E',gap:-1,reason:'Écart financier.'}],blocking:1,missingCount:2,referenceIssues:[{year:2026,month:2,division:'6',status:'Bloquant',message:'H incohérent'}],canValidate:false}};
 const t=G.generate(s).text;assert.match(t,/division 6 · E : Bloquant, écart -1 centime/);assert.match(t,/2 référence\(s\).*manquante/);assert.match(t,/H incohérent/);assert.match(t,/périmètre distinct/);
});
test('Collecte réelle locale : consolidé indépendant du filtre division et décembre précédent',()=>{
 const s=G.collect({model:M,variance:V,reference:noReference,year:2026,month:1});assert.equal(s.E.division,'all');assert.deepEqual(s.E.previousPeriod,{year:2025,month:12});assert.equal(s.references[1].period.year,2025);assert.match(G.generate(s).text,/12\/2025/);
});
test('Regroupements hors précision : erreur visible, aucun arrondi silencieux',()=>{
 const s=fixture();s.E.byDivision[0].amount=Number.MAX_SAFE_INTEGER;s.E.byDivision[1].amount=1;assert.throws(()=>G.generate(s),/précision/);
});
test('Données financières inchangées',()=>assert.equal(JSON.stringify(M.data),original));
