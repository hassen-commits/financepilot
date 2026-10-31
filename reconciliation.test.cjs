const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const R=require('./reference.js'),Q=require('./reconciliation.js'),M=require('./model.js');
const text=fs.readFileSync('fixtures/reference-fictive-janvier-fevrier.csv','utf8');
const original=JSON.stringify(M.data),header='annee;mois;division;rubrique;montant_eur\n';
const active=t=>({records:R.validate(t).records});
const report=(t=text,closure=2,year=2026,model=M)=>Q.report({active:active(t),year,closure,model});
const row=(r,month,division,rubric,cumulative=false)=>r.rows.find(x=>x.month===month&&x.division===division&&x.rubric===rubric&&x.cumulative===cumulative);

test('CSV strict : référence manuscrite indépendante, BOM, CRLF, colonnes réordonnées',()=>{
 assert.equal(R.validate(text).valid,true);assert.equal(R.validate('\uFEFF'+text.replace(/\n/g,'\r\n')).valid,true);
 assert.equal(R.validate('rubrique;montant_eur;division;mois;annee\nE;0;6;1;2026').valid,true);
 assert.equal(R.validate(header+'2026;1;6;E;"1.20"').valid,true);
});
test('Montants : centimes exacts, zéros et négatifs, limites de précision',()=>{
 assert.equal(R.parseAmount('0'),0);assert.equal(R.parseAmount('-1.25'),-125);assert.equal(R.parseAmount('0.01'),1);
 for(const value of ['','1.001','1,20','1e3','NaN','Infinity','1 000',' 1','1 ','+1','01','90071992547409.92'])assert.throws(()=>R.parseAmount(value));
 assert.equal(R.parseAmount('90071992547409.91'),Number.MAX_SAFE_INTEGER);
});
test('Structure invalide : colonnes et délimiteurs, guillemets et lignes',()=>{
 for(const t of ['',header,header.replace('rubrique','inconnue')+'2026;1;6;E;1',header.replace('division','mois')+'2026;1;6;E;1',text.replaceAll(';',','),header+'2026;1;6;E',header+'2026;1;6;E;"1',header+'2026;1;6;E;"1"x',header+'2026;1;6;E;1\n\n'])assert.equal(R.validate(t).valid,false,t);
});
test('Domaines : années, mois, divisions et rubriques exacts',()=>{
 for(const cells of [['026','1','6','E','0'],['2026','0','6','E','0'],['2026','13','6','E','0'],['2026','01','6','E','0'],['2026','1','9999','E','0'],['2026','1','06','E','0'],['2026','1','6','e','0'],['2026','1','6','X','0']])assert.equal(R.validate(header+cells.join(';')).valid,false);
});
test('Doublons identiques et contradictoires bloquent la technique',()=>{
 for(const amount of ['1','2']){const v=R.validate(header+'2026;1;6;E;1\n2026;1;6;E;'+amount);assert.equal(v.valid,false);assert.match(v.errors[0].message,/Doublon/);}
});
test('Référence complète : mois, cinq divisions, consolidé et cumul vérifiés séparément',()=>{
 const r=report();assert.equal(r.required,40);assert.equal(r.rows.length,72);assert.equal(r.canValidate,true);assert.ok(r.rows.every(x=>x.status==='Conforme'));
 assert.equal(row(r,1,'all','E').reference,66300000);assert.equal(row(r,2,'all','E').reference,70350000);
 assert.equal(row(r,2,'all','E',true).reference,136650000);
 assert.equal(row(r,2,'all','H',true).reference,96050000);
 assert.equal(row(r,2,'all','A',true).reference,16250000);
 assert.equal(row(r,2,'all','P',true).reference,24350000);
});
test('Un centime de différence est Bloquant, avec le signe calculé − référence',()=>{
 for(const [amount,gap] of [['75000.01',-1],['74999.99',1]]){const t=text.replace('E;75000.00','E;'+amount);assert.equal(R.validate(t).valid,true);const r=report(t);assert.equal(row(r,1,'6','E').gap,gap);assert.equal(row(r,1,'6','E').status,'Bloquant');assert.equal(r.canValidate,false);}
});
test('Incohérence H=E−A−P : techniquement valide, activable, financièrement bloquante',()=>{
 const s=new R.Session(),t=text.replace('H;45000.00','H;45001.00');s.accept(s.begin(),'incoherent.csv',t);s.activate();const r=Q.report({active:s.active,year:2026,closure:2,model:M});
 assert.equal(r.referenceIssues.length,1);assert.equal(r.referenceIssues[0].status,'Bloquant');assert.equal(r.canValidate,false);
});
test('Référence obligatoire absente : détail et agrégats Non contrôlés, pas de somme partielle',()=>{
 const t=text.replace('2026;1;6;A;12000.00\n',''),r=report(t);assert.equal(r.missingCount,1);
 for(const [month,d,cumulative] of [[1,'6',false],[1,'all',false],[2,'6',true],[2,'all',true]]){const v=row(r,month,d,'A',cumulative);assert.equal(v.status,'Non contrôlé');assert.equal(v.reference,null);assert.ok(v.missing.includes('2026/1/6/A'));}
 assert.equal(r.canValidate,false);
});
test('Aucun fichier actif : tous Non contrôlés et validation impossible',()=>{
 const r=Q.report({year:2026,closure:2,model:M});assert.equal(r.missingCount,40);assert.ok(r.rows.every(x=>x.status==='Non contrôlé'));assert.equal(r.canValidate,false);
});
test('Période sans calcul : référence présente Bloquante ; année isolée',()=>{
 const r=report(text.replaceAll('2026;','2027;'),2,2027);assert.equal(r.missingCount,0);assert.ok(r.rows.every(x=>x.status==='Bloquant'));assert.equal(r.canValidate,false);
 assert.equal(report(text,2,2027).missingCount,40);
 assert.equal(report(text,12).required,240);assert.equal(report(text,12).canValidate,false);
});
test('Compensation entre divisions : consolidé conforme, détails Bloquants',()=>{
 const t=text.replace('E;75000.00','E;75010.00').replace('H;45000.00','H;45010.00').replace('E;108000.00','E;107990.00').replace('H;73000.00','H;72990.00');
 const r=report(t);assert.equal(row(r,1,'all','E').status,'Conforme');assert.equal(row(r,1,'6','E').status,'Bloquant');assert.equal(row(r,1,'4390','E').status,'Bloquant');assert.equal(r.canValidate,false);assert.equal(r.referenceIssues.length,0);
});
test('Compensation entre mois : cumul conforme, détails Bloquants',()=>{
 const t=text.replace('E;75000.00','E;75010.00').replace('H;45000.00','H;45010.00').replace('E;87300.00','E;87290.00').replace('H;56100.00','H;56090.00');
 const r=report(t);assert.equal(row(r,2,'6','E',true).status,'Conforme');assert.equal(row(r,1,'6','E').status,'Bloquant');assert.equal(r.canValidate,false);
});
test('Retraitements compensés : H conforme ne masque pas A et P',()=>{
 const r=report(text.replace('A;12000.00','A;12010.00').replace('P;18000.00','P;17990.00'));assert.equal(row(r,1,'6','H').status,'Conforme');assert.equal(row(r,1,'6','A').gap,-1000);assert.equal(row(r,1,'6','P').gap,1000);assert.equal(r.referenceIssues.length,0);assert.equal(r.canValidate,false);
});
test('Contrôle interne Bloquant interdit validation même si CSV et résultats concordent',()=>{
 const model={...M,controls:(...args)=>{const r=M.controls(...args);return {...r,checks:r.checks.map(c=>c.id==='C14'?{...c,status:'Bloquant'}:c)};}};
 const r=report(text,2,2026,model);assert.ok(r.rows.every(x=>x.status==='Conforme'));assert.ok(r.internal.length>0);assert.equal(r.canValidate,false);
});
test('Sommes sûres et dépassements : jamais de conformité sur une perte de précision',()=>{
 assert.equal(Q.safeSum([Number.MAX_SAFE_INTEGER,1]),null);assert.equal(Q.safeSum([null,1]),null);
 const r=report(text.replace('E;75000.00','E;90071992547409.91'));assert.equal(r.canValidate,false);assert.equal(row(r,2,'all','E',true).status,'Bloquant');
});
test('Session : aperçu distinct, activation explicite, nouveau fichier invalide conserve actif',()=>{
 const s=new R.Session();s.accept(s.begin(),'premier.csv',text);assert.equal(s.active,null);assert.equal(s.draft.valid,true);s.activate();const before=s.active;
 s.accept(s.begin(),'invalide.csv','erreur');assert.throws(()=>s.activate());assert.equal(s.active,before);
});
test('Session : résultats tardifs ignorés, effacement annule lectures et références',()=>{
 const s=new R.Session(),old=s.begin(),current=s.begin();assert.equal(s.accept(old,'ancien.csv',text),false);s.accept(current,'courant.csv',text);s.activate();const token=s.begin();s.clear();assert.equal(s.accept(token,'tardif.csv',text),false);assert.equal(s.active,null);assert.equal(s.draft,null);assert.equal(new R.Session().active,null);
});
test('Les données et 16 contrôles de démonstration sont préservés',()=>{
 assert.equal(JSON.stringify(M.data),original);assert.equal(M.controls(2,'all').checks.length,16);assert.ok(M.controls(2,'all').checks.every(c=>c.status==='Conforme'));
});
