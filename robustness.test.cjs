const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('./model.js');
const original=JSON.stringify(M.data);
const check=(id,source=M.data,calculate=M.total,month=2,division='6',year=2026)=>M.controls(month,division,year,source,calculate).checks.find(c=>c.id===id);
const clone=()=>M.data.map(r=>({...r}));
function blocked(c,gap){assert.ok(c);assert.equal(c.status,'Bloquant');assert.equal(c.kind,'internal');if(gap!==undefined)assert.equal(c.gap,gap);}

test('C01 : mois absent, doublon et six montants invalides',()=>{
 const missing=clone().filter(r=>!(r.division==='6'&&r.month===1));
 const duplicate=[...clone(),{...M.data[0]}];
 for(const source of [missing,duplicate]){blocked(check('C01',source),1);assert.equal(M.total(2,'6',true,2026,source).ebitda,null);}
 for(const key of ['revenue','purchases','payroll','other','capitalizedACE','capitalizedPayroll'])for(const value of [null,NaN,Infinity,'100']){
  const source=clone();source[0][key]=value;blocked(check('C01',source),1);
  assert.equal(M.total(1,'6',false,2026,source).ebitdaExCapitalized,null);
 }
 const missingAdjustment=clone();missingAdjustment[0].capitalizedACE=null;
 assert.equal(M.total(1,'6',false,2026,missingAdjustment).ebitda,75000);
});

const scenarios=[
 ['C02','ebitda','6',true,()=>100],
 ['C03','ebitda','all',false,()=>100],
 ['C04','ebitda','all',true,()=>100],
 ['C05','ebitdaExCapitalized','6',true,()=>100],
 ['C06','ebitdaExCapitalized','all',false,(m)=>-M.total(m,'4579').ebitdaExCapitalized],
 ['C07','ebitdaExCapitalized','all',true,(m)=>-M.total(m,'4579',true).ebitdaExCapitalized],
 ['C08','capitalizedACE','6',true,()=>-12000],
 ['C09','capitalizedACE','all',false,()=>50],
 ['C10','capitalizedACE','all',true,()=>50],
 ['C11','capitalizedPayroll','6',true,()=>18000],
 ['C12','capitalizedPayroll','all',false,m=>-M.total(m,'4390').capitalizedPayroll],
 ['C13','capitalizedPayroll','all',true,m=>-M.total(m,'4390',true).capitalizedPayroll],
 ['C14','ebitdaExCapitalized','6',false,m=>M.total(m,'6').capitalizedPayroll],
 ['C15','ebitdaExCapitalized','6',true,m=>2*M.total(m,'6',true).capitalizedACE]
];
for(const [id,key,division,cumulative,delta] of scenarios)test(`${id} : résultat volontairement altéré`,()=>{
 const calculate=(m,d,c,y,source)=>{const t=M.total(m,d,c,y,source);return m===2&&d===division&&c===cumulative?{...t,[key]:t[key]+delta(m)}:t;};
 const baseline=check(id);assert.equal(baseline.status,'Conforme');
 const c=check(id,M.data,calculate);blocked(c,delta(2));
 assert.equal(Math.round((c.actual-c.expected)*100),Math.round(delta(2)*100));
});

test('C16 : division inconnue ajoutée, paramètres et périodes invalides',()=>{
 blocked(check('C16',[...clone(),{...M.data[0],division:'9999'}]),1);
 blocked(check('C16',[...clone(),{...M.data[0],division:6}]),1);
 for(const month of [0,13,1.5,NaN,Infinity]){blocked(check('C16',M.data,M.total,month));assert.equal(M.total(month).ebitda,null);}
 blocked(check('C16',M.data,M.total,2,'9999'));
 blocked(check('C16',M.data,M.total,2,'6','2026'));
 for(const month of [0,13,1.5])blocked(check('C16',[...clone(),{...M.data[0],month}]),1);
 // Une division inconnue d'un autre exercice ne fait pas partie du périmètre choisi.
 assert.equal(check('C16',[...clone(),{...M.data[0],year:2025,division:'9999'}]).status,'Conforme');
});

test('Les 16 contrôles nominaux : identifiants uniques et stables, 54 sélections',()=>{
 for(let m=1;m<=9;m++)for(const d of ['all',...M.divisions]){
  const report=M.controls(m,d);assert.equal(report.checks.length,16);
  assert.deepEqual(report.checks.map(c=>c.id),Array.from({length:16},(_,i)=>'C'+String(i+1).padStart(2,'0')));
  assert.ok(report.checks.every(c=>c.status==='Conforme'&&c.gap===0));
 }
});

// Jeu indépendant : aucune valeur issue du générateur de démonstration.
// Chaque ligne : produits, achats, personnel, autres, ACE, personnel immobilisé.
const fixture=[
 ['6',1,1000,-200,-300,-100,20,30],['6',2,1100,-200,-300,-100,25,35],
 ['4390',1,2000,-400,-600,-200,40,60],['4390',2,2200,-400,-600,-200,50,70],
 ['4389',1,3000,-600,-900,-300,60,90],['4389',2,3300,-600,-900,-300,75,105],
 ['4578',1,4000,-800,-1200,-400,80,120],['4578',2,4400,-800,-1200,-400,100,140],
 ['4579',1,5000,-1000,-1500,-500,100,150],['4579',2,5500,-1000,-1500,-500,125,175]
].map(([division,month,revenue,purchases,payroll,other,capitalizedACE,capitalizedPayroll])=>({division,month,year:2026,revenue,purchases,payroll,other,capitalizedACE,capitalizedPayroll}));
const expected=[
 ['6',400,350,500,440,900,790],['4390',800,700,1000,880,1800,1580],
 ['4389',1200,1050,1500,1320,2700,2370],['4578',1600,1400,2000,1760,3600,3160],
 ['4579',2000,1750,2500,2200,4500,3950],['all',6000,5250,7500,6600,13500,11850]
];
test('REF01 : résultats attendus indépendants, cinq divisions et organisation',()=>{
 for(const [d,e1,h1,e2,h2,ey,hy] of expected){
  assert.deepEqual([M.total(1,d,false,2026,fixture).ebitda,M.total(1,d,false,2026,fixture).ebitdaExCapitalized],[e1,h1]);
  assert.deepEqual([M.total(2,d,false,2026,fixture).ebitda,M.total(2,d,false,2026,fixture).ebitdaExCapitalized],[e2,h2]);
  assert.deepEqual([M.total(2,d,true,2026,fixture).ebitda,M.total(2,d,true,2026,fixture).ebitdaExCapitalized],[ey,hy]);
 }
 const y=M.total(2,'all',true,2026,fixture);assert.equal(y.capitalizedACE,675);assert.equal(y.capitalizedPayroll,975);
});
test('REF02 : montant erroné cohérent en interne, détecté par référence indépendante',()=>{
 const source=fixture.map((r,i)=>i===0?{...r,revenue:r.revenue+1000}:r);
 assert.ok(M.controls(2,'all',2026,source).checks.every(c=>c.status==='Conforme'));
 assert.equal(M.total(2,'all',true,2026,source).ebitda-13500,1000);
});
test('REF03 : retraitements compensés, H inchangé mais rubriques erronées',()=>{
 const source=fixture.map((r,i)=>i===0?{...r,capitalizedACE:r.capitalizedACE+10,capitalizedPayroll:r.capitalizedPayroll-10}:r);
 assert.ok(M.controls(2,'all',2026,source).checks.every(c=>c.status==='Conforme'));
 const y=M.total(2,'all',true,2026,source);assert.equal(y.ebitdaExCapitalized,11850);assert.equal(y.capitalizedACE-675,10);assert.equal(y.capitalizedPayroll-975,-10);
});
test('Bornes : exercice absent, division absente, zéro et retraitement négatif',()=>{
 blocked(check('C01',fixture,M.total,2,'all',2025));
 const absent=fixture.filter(r=>r.division!=='4579');blocked(check('C01',absent,M.total,2,'all'),2);blocked(check('C03',absent),null);
 const source=fixture.map(r=>r.division==='6'?{...r,capitalizedACE:0,capitalizedPayroll:-10}:r);
 assert.ok(M.controls(2,'6',2026,source).checks.every(c=>c.status==='Conforme'));
 assert.equal(M.total(1,'6',false,2026,source).ebitdaExCapitalized,410);
});
test('Centimes : comparaison exacte, sans modifier la règle d’arrondi existante',()=>{
 const source=fixture.map((r,i)=>i===0?{...r,revenue:1000.01,capitalizedACE:20.02}:r);
 const t=M.total(1,'6',false,2026,source);assert.equal(t.ebitda,400.01);assert.equal(t.ebitdaExCapitalized,349.99);
 assert.ok(M.controls(2,'all',2026,source).checks.every(c=>c.status==='Conforme'));
});
test('Le jeu de démonstration reste inchangé',()=>assert.equal(JSON.stringify(M.data),original));
