// Génère uniquement des classeurs 100 % fictifs, sans appel au moteur financier.
const X=require('../vendor/xlsx-0.20.3.full.min.js'),fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'excel');fs.mkdirSync(dir,{recursive:true});
const rows=fs.readFileSync(path.join(__dirname,'reference-fictive-janvier-fevrier.csv'),'utf8').trim().split(/\r?\n/).slice(1).map(s=>s.split(';'));
const division={'6':'DIV_DO','4390':'DIV_DR1','4389':'DIV_DR2','4578':'DIV_DR3','4579':'DIV_SIEGE'};
const long=[['Extraction entièrement fictive — pas un format SAC officiel'],[],['Note','Rubrique fictive','Division fictive','Montant EUR mensuel','Mois','Année'],...rows.map(([y,m,d,r,a])=>['fictif','REF_'+r,division[d],Number(a),Number(m),Number(y)])];
function save(name,data,edit){
 const w=X.utils.book_new(),ws=X.utils.aoa_to_sheet(data);
 if(edit)edit(ws);
 X.utils.book_append_sheet(w,X.utils.aoa_to_sheet([['Informations fictives — ne pas importer'],['Notes masquées']]),'Notes');
 X.utils.book_append_sheet(w,ws,'Référence fictive');w.Workbook={Sheets:[{Hidden:1},{Hidden:0}]};
 fs.writeFileSync(path.join(dir,name),X.write(w,{type:'buffer',bookType:'xlsx',compression:true}));
}
save('long-multifeuilles.xlsx',long);
save('formule-interdite.xlsx',long,ws=>{ws.D4={t:'n',f:'100+1',v:101};});
save('doublon.xlsx',[...long,long[3]]);
save('mois-manquant.xlsx',long.filter((r,i)=>i<3||r[4]!==1));
save('rubrique-inconnue.xlsx',long.map((r,i)=>i===3?r.map((v,c)=>c===1?'REF_X':v):r));
save('montant-invalide.xlsx',long.map((r,i)=>i===3?r.map((v,c)=>c===3?'1,000.001':v):r));
save('totaux.xlsx',[...long,['total','REF_E','TOTAL',999999,2,2026]]);
save('fusion.xlsx',long,ws=>{ws['!merges']=[X.utils.decode_range('B4:B5')];});
const wide=[['Année','Février EUR','Division fictive','Rubrique fictive','Janvier EUR']];
for(const d of Object.keys(division))for(const rubric of ['E','H','A','P']){
 const r1=rows.find(r=>r[1]==='1'&&r[2]===d&&r[3]===rubric),r2=rows.find(r=>r[1]==='2'&&r[2]===d&&r[3]===rubric);
 wide.push([2026,Number(r2[4]),division[d],'REF_'+rubric,Number(r1[4])]);
}
save('large-colonnes-deplacees.xlsx',wide);
console.log('9 classeurs de test fictifs créés.');
