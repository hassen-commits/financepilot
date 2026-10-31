const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const Reader=require('./excel-reader.js'),MapExcel=require('./excel-mapping.js'),R=require('./reference.js'),Q=require('./reconciliation.js'),M=require('./model.js'),Zip=require('./vendor/jszip-3.10.1.min.js');
const load=name=>Reader.read(fs.readFileSync('fixtures/excel/'+name));
const config=(end=43)=>({layout:'long',header:3,start:4,end,columns:{year:5,month:4,division:2,rubric:1,amount:3},months:[],exclude:[],aliasMode:'fictitious',units:'EUR',periodicity:'monthly',confirmed:true});
const run=async(name,c)=>{const b=await load(name);return MapExcel.build(b.sheets[1],c||config(b.sheets[1].rows));};
const original=JSON.stringify(M.data);
test('XLSX local : plusieurs feuilles, masquée et préambule, types conservés',async()=>{
 const b=await load('long-multifeuilles.xlsx');assert.equal(b.sheets.length,2);assert.equal(b.sheets[0].hidden,true);assert.equal(b.sheets[1].cells.D4.numeric,'75000');assert.equal(b.sheets[1].cells.D4.formula,false);
});
test('Long fictif : mapping confirmé et équivalence CSV indépendante',async()=>{
 const r=await run('long-multifeuilles.xlsx');assert.equal(r.valid,true);assert.equal(r.records.length,40);assert.deepEqual(r.records,R.validate(fs.readFileSync('fixtures/reference-fictive-janvier-fevrier.csv','utf8')).records);
 assert.deepEqual(r.provenance[0],{sheet:'Référence fictive',row:4,cell:'D4'});
 const report=Q.report({active:{records:r.records},year:2026,closure:2,model:M});assert.equal(report.canValidate,true);
});
test('Large : colonnes mensuelles déplacées et sélection des mois explicite',async()=>{
 const b=await load('large-colonnes-deplacees.xlsx'),r=MapExcel.build(b.sheets[1],{...config(21),layout:'wide',header:1,start:2,columns:{year:0,division:2,rubric:3},months:[{column:4,month:1},{column:1,month:2}]});
 assert.equal(r.valid,true);assert.equal(r.records.length,40);assert.equal(Q.report({active:{records:r.records},year:2026,closure:2,model:M}).canValidate,true);
});
test('Formules : cellule et feuille précises, valeur calculée non importée',async()=>{
 const r=await run('formule-interdite.xlsx');assert.equal(r.valid,false);assert.ok(r.errors.some(e=>e.cell==='D4'&&e.sheet==='Référence fictive'&&e.message.includes('Formule')));
});
for(const [name,motif] of [['doublon.xlsx','Doublon'],['rubrique-inconnue.xlsx','Rubrique inconnue'],['montant-invalide.xlsx','Montant invalide'],['fusion.xlsx','fusionnées']])test(name+' : bloquant',async()=>{
 const r=await run(name);assert.equal(r.valid,false);assert.ok(r.errors.some(e=>e.message.includes(motif)));
});
test('Mois manquant : candidat techniquement valide, rapprochement incomplet',async()=>{
 const r=await run('mois-manquant.xlsx');assert.equal(r.valid,true);const q=Q.report({active:{records:r.records},year:2026,closure:2,model:M});assert.equal(q.missingCount,20);assert.equal(q.canValidate,false);
});
test('Total : interdit sans exclusion explicite, aucune somme détail + total',async()=>{
 const blocked=await run('totaux.xlsx');assert.equal(blocked.valid,false);const c=config(44);c.exclude=[44];const r=await run('totaux.xlsx',c);assert.equal(r.valid,true);assert.equal(r.records.length,40);assert.deepEqual(r.excluded,[44]);
});
test('Structure, unité, périodicité et confirmation obligatoires',async()=>{
 const b=await load('long-multifeuilles.xlsx');for(const patch of [{confirmed:false},{layout:''},{units:'KEUR'},{periodicity:'ytd'},{aliasMode:''},{start:3},{end:44},{columns:{year:5,month:4,division:2,rubric:1,amount:2}},{exclude:[99]}])assert.equal(MapExcel.build(b.sheets[1],{...config(),...patch}).valid,false);
});
test('Mois larges uniques et non superposés aux colonnes identifiantes',async()=>{
 const b=await load('large-colonnes-deplacees.xlsx'),base={...config(21),layout:'wide',header:1,start:2,columns:{year:0,division:2,rubric:3}};
 for(const months of [[],[{column:1,month:0}],[{column:1,month:1},{column:4,month:1}],[{column:0,month:1}]])assert.equal(MapExcel.build(b.sheets[1],{...base,months}).valid,false);
});
test('Montants XML exacts : scientifiques, zéro/négatif et aucune perte par flottant',async()=>{
 assert.equal(MapExcel.decimalCents('1.23e2',true),12300);assert.equal(MapExcel.decimalCents('-0.29',true),-29);assert.equal(MapExcel.decimalCents('1.2300',true),123);assert.equal(MapExcel.decimalCents('0',true),0);
 assert.throws(()=>MapExcel.decimalCents('1.0000000000000001',true));assert.throws(()=>MapExcel.decimalCents('90071992547409.92',true));assert.throws(()=>MapExcel.decimalCents('1,23'));
 const zip=await Zip.loadAsync(fs.readFileSync('fixtures/excel/long-multifeuilles.xlsx'));
 const xml=await zip.file('xl/worksheets/sheet2.xml').async('string');zip.file('xl/worksheets/sheet2.xml',xml.replace('<v>75000</v>','<v>75000.000000000001</v>'));
 const b=await Reader.read(await zip.generateAsync({type:'uint8array'})),r=MapExcel.build(b.sheets[1],config());assert.equal(r.valid,false);assert.ok(r.errors.some(e=>e.cell==='D4'&&e.message.includes('arrondi')));
});
test('Fichier corrompu, non-XLSX et limites de décompression',async()=>{
 await assert.rejects(()=>Reader.read(new Uint8Array([1,2,3])));
 await assert.rejects(()=>Reader.read(new Uint8Array(Reader.limits.fileBytes+1)),/2 Mo/);
 const z=new Zip();z.file('test.xml','x'.repeat(Reader.limits.expandedBytes+1));
 const bytes=await z.generateAsync({type:'uint8array',compression:'DEFLATE'});await assert.rejects(()=>Reader.read(bytes),/8 Mo/);
});
test('Atomicité : candidat refusé ou lecture tardive laisse la référence active intacte',async()=>{
 const session=new R.Session(),r=await run('long-multifeuilles.xlsx');session.accept(session.begin(),'valide.xlsx',r.csv);session.activate();const before=session.active;
 const invalid=await run('formule-interdite.xlsx');session.begin();assert.equal(invalid.valid,false);assert.throws(()=>session.activate());assert.equal(session.active,before);
 const token=session.begin();session.begin();assert.equal(session.accept(token,'tardif.xlsx',r.csv),false);assert.equal(session.active,before);
});
test('Erreurs Excel, cellules vides et dates non interprétées implicitement',async()=>{
 const b=await load('long-multifeuilles.xlsx');for(const cell of [{value:7,type:'e'},{value:45000,type:'n',numeric:'45000',format:'m/d/yy'},{value:null,type:'n'},{value:true,type:'b'}]){
  const sheet={...b.sheets[1],cells:{...b.sheets[1].cells,D4:cell}};assert.equal(MapExcel.build(sheet,config()).valid,false);
 }
});
test('Aucun changement financier ni au tag : données/contrôles intacts',()=>{assert.equal(JSON.stringify(M.data),original);assert.equal(M.controls(2,'all').checks.length,16);});
test('Formule sans valeur en cache : diagnostic formule, pas une cellule vide',async()=>{
 const b=await load('long-multifeuilles.xlsx'),sheet={...b.sheets[1],cells:{...b.sheets[1].cells,D4:{formula:true,type:'n'}}};
 const r=MapExcel.build(sheet,config());assert.equal(r.valid,false);assert.ok(r.errors.some(e=>e.cell==='D4'&&e.message.includes('Formule Excel')));
});
