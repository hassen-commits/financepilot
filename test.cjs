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
