const {test}=require('node:test'),assert=require('node:assert/strict');
const V=require('./variance.js'),M=require('./model.js'),fixture=require('./fixtures/variance-fictive.cjs');
const original=JSON.stringify(M.data);
const modelFor=rows=>({...M,total:(m,d,c,y)=>M.total(m,d,c,y,rows)});
const analyze=(rows=fixture.rows,options={})=>V.analyze({model:modelFor(rows),year:2026,month:2,...options});
test('Conversion décimale exacte au centime et dépassements',()=>{
 assert.equal(V.cents(0.29),29);assert.equal(V.cents(-1.01),-101);assert.equal(V.cents(1.001),null);
 for(const v of [null,undefined,NaN,Infinity,'1'])assert.equal(V.cents(v),null);
 assert.equal(V.sum([Number.MAX_SAFE_INTEGER,1]),null);assert.equal(V.sum([1,null]),null);
});
for(const [current,previous,amount,percent,state] of [[13000,10000,3000,30,'available'],[-7000,-10000,3000,30,'available'],[5000,0,5000,null,'zero-base'],[0,0,0,null,'zero-base'],[-5000,10000,-15000,-150,'available'],[null,10000,null,null,'unavailable']])test(`Variation indépendante : ${previous} → ${current}`,()=>{
 const d=V.difference(current,previous);assert.equal(d.amount,amount);assert.equal(d.percent,percent);assert.equal(d.state,state);
});
for(const [key,indicator] of [['E','ebitda'],['H','ebitdaExCapitalized']])test(`Référence indépendante ${key} : cinq divisions et rubriques`,()=>{
 const r=analyze(fixture.rows,{indicator}),e=fixture.expected[key];assert.equal(r.selected.previous,e.previous);assert.equal(r.selected.current,e.current);assert.equal(r.selected.amount,e.amount);
 assert.deepEqual(r.byDivision.map(d=>d.amount),e.divisions);assert.deepEqual(r.byRubric.map(p=>p.amount),e.rubrics);assert.equal(r.complete,true);assert.ok(r.diagnostics.every(d=>d.gap===0));if(key==='E')assert.equal(r.selected.percent,10);
});
test('Charges déjà négatives et signe inverse des retraitements',()=>{
 const r=analyze(fixture.rows,{indicator:'ebitdaExCapitalized'});assert.equal(r.byRubric[1].amount,-1000);assert.equal(r.byRubric[4].rawAmount,200);assert.equal(r.byRubric[4].amount,-200);assert.equal(r.byRubric[5].amount,-100);
});
test('Contributions opposées visibles même si la variation totale est nulle',()=>{
 const rows=fixture.rows.map(r=>r.division==='4390'&&r.month===2?{...r,purchases:-50}:r).map(r=>['4389','4578'].includes(r.division)&&r.month===2?{...r,revenue:100,payroll:-30}:r);
 const r=analyze(rows);assert.equal(r.consolidated.amount,0);assert.deepEqual(r.byDivision.map(d=>d.amount),[3000,-3000,0,0,0]);assert.equal(r.complete,true);
});
test('Mois absent : aucune réconciliation partielle conforme',()=>{
 const r=analyze(fixture.rows.filter(r=>!(r.division==='6'&&r.month===1)));assert.equal(r.selected.amount,null);assert.equal(r.byDivision[0].state,'unavailable');assert.equal(r.diagnostics[0].status,'Indisponible');assert.equal(r.complete,false);
});
test('Rubrique absente et retraitement manquant : E indépendant de H',()=>{
 const rows=fixture.rows.map((r,i)=>i===0?{...r,capitalizedACE:null}:r);assert.equal(analyze(rows).complete,true);assert.equal(analyze(rows,{indicator:'ebitdaExCapitalized'}).complete,false);
 const invalid=fixture.rows.map((r,i)=>i===0?{...r,purchases:null}:r);assert.equal(analyze(invalid).selected.state,'unavailable');
});
test('Doublon et montant invalide : analyse indisponible',()=>{
 for(const rows of [[...fixture.rows,fixture.rows[0]],fixture.rows.map((r,i)=>i===0?{...r,revenue:NaN}:r)])assert.equal(analyze(rows).complete,false);
});
test('Janvier recherche décembre de l’exercice précédent sans inventer un zéro',()=>{
 const missing=analyze(fixture.rows,{month:1});assert.deepEqual(missing.previousPeriod,{year:2025,month:12});assert.equal(missing.selected.state,'unavailable');
 const rows=fixture.rows.map(r=>r.month===1?{...r,year:2025,month:12}:{...r,month:1});const r=analyze(rows,{month:1});assert.equal(r.selected.amount,2000);assert.equal(r.complete,true);
});
test('V01 détecte un total consolidé altéré de 1 centime',()=>{
 const base=modelFor(fixture.rows),model={...base,total:(m,d,c,y)=>{const t=base.total(m,d,c,y);return d==='all'&&m===2?{...t,ebitda:220.01}:t;}};
 const r=analyze(fixture.rows,{model});assert.equal(r.diagnostics[0].gap,-1);assert.equal(r.diagnostics[0].status,'Bloquant');
});
test('V02 détecte une décomposition erronée, y compris des erreurs compensées entre divisions',()=>{
 const base=modelFor(fixture.rows),model={...base,total:(m,d,c,y)=>{const t=base.total(m,d,c,y);return m===2&&['6','4390'].includes(d)?{...t,revenue:t.revenue+(d==='6'?1:-1)}:t;}};
 const r=analyze(fixture.rows,{model});assert.equal(r.diagnostics[1].status,'Conforme');assert.equal(r.diagnostics.find(d=>d.id==='V02-6').status,'Bloquant');assert.equal(r.diagnostics.find(d=>d.id==='V02-4390').gap,-100);assert.equal(r.complete,false);
});
test('Sélection de division garde les cinq contributions et détaille ses rubriques',()=>{
 const r=analyze(fixture.rows,{division:'4390'});assert.equal(r.byDivision.length,5);assert.equal(r.selected.amount,-1000);assert.deepEqual(r.byRubric.map(p=>p.amount),[0,-1000,0,0]);
});
test('Sélections invalides et dépassement de précision',()=>{
 for(const options of [{month:0},{month:13},{month:1.5},{division:'9999'},{indicator:'inconnu'},{year:1}])assert.throws(()=>analyze(fixture.rows,options));
 assert.equal(V.difference(Number.MAX_SAFE_INTEGER,-1).state,'unavailable');
});
test('Non-modification du modèle et diagnostics existants',()=>{
 assert.equal(JSON.stringify(M.data),original);assert.equal(M.controls(2,'all').checks.length,16);
});
