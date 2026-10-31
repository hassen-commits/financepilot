const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Reader=require('./excel-reader.js'),Mapping=require('./excel-mapping.js');
function setup(){
 const nodes=new Map(),el=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',value:'',insertAdjacentHTML(position,html){this.innerHTML=position==='afterbegin'?html+this.innerHTML:this.innerHTML+html;}});return nodes.get(id);};
 const ctx=vm.createContext({console,Intl,TextDecoder,window:{FinanceExcelReader:Reader,FinanceExcelMapping:Mapping},document:{querySelector:el},fetch(){throw Error('Réseau interdit');}});
 for(const file of ['model.js','reference.js','reconciliation.js','excel-import-ui.js','reference-ui.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 ctx.window.mountFinanceReference();
 const change=(id,value,checked)=>el(id).onchange({target:{value,checked}}),click=id=>el(id).onclick();
 const upload=async name=>{const bytes=fs.readFileSync('fixtures/excel/'+name);await el('#excel-file').onchange({target:{files:[{name,size:bytes.length,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}]}});};
 const configure=()=>{change('#excel-sheet','1');change('#excel-layout','long');change('#excel-header','3');change('#excel-start','4');for(const [field,col] of [['year',5],['month',4],['division',2],['rubric',1],['amount',3]])change('#excel-col-'+field,String(col));change('#excel-alias','fictitious');change('#excel-unit','EUR');change('#excel-frequency','monthly');change('#excel-confirm','',true);click('#excel-check');};
 return {ctx,el,change,click,upload,configure,html:()=>el('#excel-import-panel').innerHTML,reference:()=>el('#reference-panel').innerHTML};
}
test('Excel UI : feuille, mapping explicite, candidat puis activation distincte',async()=>{
 const u=setup();await u.upload('long-multifeuilles.xlsx');assert.match(u.html(),/Notes \(masquée\)/);assert.doesNotMatch(u.html(),/excel-layout/);
 u.configure();assert.match(u.html(),/40 références candidates/);assert.match(u.reference(),/Référence active : <strong>aucune/);
 u.click('#ref-activate');assert.match(u.reference(),/Référence active : <strong>long-multifeuilles.xlsx/);u.change('#ref-closure','2');assert.match(u.reference(),/validation technique globale possible/);assert.doesNotMatch(u.html(),/excel-layout/);
});
test('Excel UI : formule bloquée, erreur feuille/cellule ; référence précédente conservée',async()=>{
 const u=setup();await u.upload('long-multifeuilles.xlsx');u.configure();u.click('#ref-activate');await u.upload('formule-interdite.xlsx');u.configure();assert.match(u.html(),/Référence fictive!D4/);assert.match(u.html(),/Formule Excel interdite/);u.click('#ref-activate');assert.match(u.reference(),/Référence active : <strong>long-multifeuilles.xlsx/);
});
test('Excel UI : changer un mapping invalide le candidat préparé',async()=>{
 const u=setup();await u.upload('long-multifeuilles.xlsx');u.configure();u.change('#excel-col-amount','4');assert.doesNotMatch(u.reference(),/Fichier techniquement valide/);u.click('#ref-activate');assert.match(u.reference(),/Référence active : <strong>aucune/);assert.doesNotMatch(u.html(),/40 références candidates/);
});
test('Excel UI : grand format avec mois explicitement associés',async()=>{
 const u=setup();await u.upload('large-colonnes-deplacees.xlsx');u.change('#excel-sheet','1');u.change('#excel-layout','wide');for(const [f,v] of [['year',0],['division',2],['rubric',3]])u.change('#excel-col-'+f,String(v));u.change('#excel-period-4','1');u.change('#excel-period-1','2');u.change('#excel-alias','fictitious');u.change('#excel-unit','EUR');u.change('#excel-frequency','monthly');u.change('#excel-confirm','',true);u.click('#excel-check');assert.match(u.html(),/40 références candidates/);
});
test('Excel UI : annulation et lecture tardive, puis CSV toujours utilisable',async()=>{
 const u=setup();let release;const bytes=fs.readFileSync('fixtures/excel/long-multifeuilles.xlsx');
 const pending=u.el('#excel-file').onchange({target:{files:[{name:'tardif.xlsx',size:bytes.length,arrayBuffer:()=>new Promise(r=>release=r)}]}});
 u.click('#excel-cancel');release(bytes);await pending;assert.doesNotMatch(u.html(),/excel-sheet/);
 const csv=fs.readFileSync('fixtures/reference-fictive-janvier-fevrier.csv','utf8');await u.el('#ref-file').onchange({target:{files:[{name:'reference.csv',size:csv.length,arrayBuffer:async()=>new TextEncoder().encode(csv).buffer}]}});u.click('#ref-activate');assert.match(u.reference(),/Référence active : <strong>reference.csv/);
});
test('Excel UI : rejet de l’extension et affichage échappé du nom de fichier',async()=>{
 const u=setup();await u.el('#excel-file').onchange({target:{files:[{name:'<img>.xls',size:1,arrayBuffer:async()=>new Uint8Array()}]}});assert.match(u.html(),/Seul le format .xlsx/);assert.match(u.html(),/&lt;img&gt;/);assert.doesNotMatch(u.html(),/<img>/);
});
test('Excel UI : saisie immédiate d’une plage invalide le candidat avant perte de focus',async()=>{
 const u=setup();await u.upload('long-multifeuilles.xlsx');u.configure();u.el('#excel-start').oninput({target:{value:'5'}});
 assert.equal(u.el('#ref-activate').disabled,true);assert.equal(u.el('#excel-confirm').checked,false);u.click('#ref-activate');assert.match(u.reference(),/Référence active : <strong>aucune/);
});
