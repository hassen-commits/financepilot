const assert=require('node:assert/strict'),M=require('./model.js');
assert.equal(M.data.length,45);assert.equal(new Set(M.data.map(r=>r.division+':'+r.month)).size,45);
for(const d of ['all',...M.divisions])for(let m=1;m<=9;m++){
 const t=M.total(m,d),y=M.total(m,d,true);assert.equal(t.ebitda,t.revenue+t.purchases+t.payroll+t.other);
 for(const k of Object.keys(t))assert.equal(y[k],Array.from({length:m},(_,i)=>M.total(i+1,d)[k]).reduce((a,b)=>a+b,0));
}
for(let m=1;m<=9;m++)assert.equal(M.total(m).ebitda,M.divisions.reduce((s,d)=>s+M.total(m,d).ebitda,0));
assert.equal(M.total(1,'6').ebitda,75000);
assert.deepEqual(M.variation(-90,-100),{amount:10,percent:10});assert.equal(M.variation(100,0).percent,null);
assert.deepEqual(M.parseCSV('\uFEFFdivision;montant\r\n6;100\r\n'),[['division','montant'],['6','100']]);
assert.deepEqual(M.parseCSV('libelle,montant\n"Produit, fictif",100'),[['libelle','montant'],['Produit, fictif','100']]);
assert.deepEqual(M.parseCSV('a;b\n"un\ntexte";"deux ""mots"""'),[['a','b'],['un\ntexte','deux "mots"']]);
assert.throws(()=>M.parseCSV('a;b\n1'));assert.throws(()=>M.parseCSV('a;b\n"non ferme;2'));assert.throws(()=>M.parseCSV('a;b'));
console.log('Tests réussis : données, consolidation, cumuls, variations et CSV.');
// Résultats attendus indépendants, calculés à la main pour janvier / division 6.
assert.equal(M.total(1,'6').capitalizedACE,12000);
assert.equal(M.total(1,'6').capitalizedPayroll,18000);
assert.equal(M.total(1,'6').ebitdaExCapitalized,45000);
assert.equal(M.total(2,'6').ebitdaExCapitalized,56100);
assert.equal(M.total(2,'6',true).ebitdaExCapitalized,101100);
for(let month=1;month<=9;month++)for(const division of ['all',...M.divisions]){
 assert.ok(M.controls(month,division).checks.every(c=>c.status==='Conforme'));
 for(const cumulative of [false,true]){
  const t=M.total(month,division,cumulative);
  assert.equal(t.ebitdaExCapitalized,t.ebitda-t.capitalizedACE-t.capitalizedPayroll);
 }
}
assert.equal(M.total(1,'6',false,2025).ebitda,null);
assert.equal(M.total(0,'6').ebitda,null);
assert.equal(M.total(10,'all',true).ebitda,null);
assert.deepEqual(M.variation(100,null),{amount:null,percent:null});
const missing=M.data.slice(1),duplicate=[...M.data,M.data[0]],invalid=M.data.map((r,i)=>i===0?{...r,capitalizedACE:null}:r);
for(const source of [missing,duplicate,invalid]){
 assert.ok(M.controls(1,'6',2026,source).checks.some(c=>c.status==='Bloquant'));
 assert.equal(M.total(1,'6',false,2026,source).ebitdaExCapitalized,null);
}
assert.equal(M.total(1,'6',false,2026,invalid).ebitda,75000);
// Un mauvais indicateur doit être repéré par le contrôle de passage.
const broken=(...args)=>{const t=M.total(...args);return {...t,ebitdaExCapitalized:t.ebitdaExCapitalized===null?null:t.ebitdaExCapitalized+1};};
assert.ok(M.controls(1,'6',2026,M.data,broken).checks.some(c=>c.label.startsWith('Passage')&&c.status==='Bloquant'));
const signedRows=[{...M.data[0],capitalizedACE:-12000,capitalizedPayroll:0}];
assert.equal(M.total(1,'6',false,2026,signedRows).ebitdaExCapitalized,87000);
console.log('Tests V2 réussis : deux indicateurs, exercices, complétude et détection des anomalies.');
