const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const csv=fs.readFileSync('fixtures/reference-fictive-janvier-fevrier.csv','utf8');
function setup(){
 const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',value:''});return elements.get(id);};
 const ctx=vm.createContext({window:{},document:{querySelector:el},Intl,console,TextDecoder});
 for(const f of ['model.js','reference.js','reconciliation.js','reference-ui.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
 const mount=()=>ctx.window.mountFinanceReference();mount();
 const file=(text=csv,name='reference.csv')=>({name,size:Buffer.byteLength(text),arrayBuffer:async()=>new TextEncoder().encode(text).buffer});
 const change=(id,value)=>el(id).onchange({target:{value}});
 const upload=f=>el('#ref-file').onchange({target:{files:[f]}});
 const html=()=>el('#reference-panel').innerHTML;
 return {el,ctx,mount,file,change,upload,html};
}
test('Parcours UI : technique, aperçu, activation, rapprochement, validation globale',async()=>{
 const u=setup();assert.match(u.html(),/Référence active : <strong>aucune/);
 await u.upload(u.file());assert.match(u.html(),/Fichier techniquement valide/);assert.match(u.html(),/Référence active : <strong>aucune/);
 u.el('#ref-activate').onclick();u.change('#ref-closure','2');assert.match(u.html(),/validation technique globale possible/);
 assert.match(u.html(),/Périmètre non validé/);u.el('#ref-validate').onclick();assert.match(u.html(),/Périmètre fictif validé temporairement/);
 u.change('#ref-rubric','H');assert.match(u.html(),/Périmètre fictif validé temporairement/);
 u.change('#ref-closure','3');assert.match(u.html(),/Validation globale impossible/);assert.match(u.html(),/Périmètre non validé/);
 u.el('#ref-validate').onclick();assert.doesNotMatch(u.html(),/Périmètre fictif validé temporairement/);
});
test('UI : CSV techniquement valide avec écart activable et validation globale interdite',async()=>{
 const u=setup();await u.upload(u.file(csv.replace('E;75000.00','E;75000.01')));assert.match(u.html(),/Fichier techniquement valide/);
 u.el('#ref-activate').onclick();u.change('#ref-closure','2');assert.match(u.html(),/Écart financier/);assert.match(u.html(),/>-1<\/td>/);assert.match(u.html(),/Validation globale impossible/);
 u.change('#ref-division','consolidated');assert.match(u.html(),/Consolidé/);assert.match(u.html(),/Validation globale impossible/);
});
test('UI : filtres détaillés ne masquent pas le blocage global',async()=>{
 const u=setup();await u.upload(u.file(csv.replace('E;75000.00','E;75010.00').replace('H;45000.00','H;45010.00').replace('E;108000.00','E;107990.00').replace('H;73000.00','H;72990.00')));
 u.el('#ref-activate').onclick();u.change('#ref-closure','2');u.change('#ref-division','consolidated');u.change('#ref-view','ytd');u.change('#ref-month','2');u.change('#ref-rubric','E');
 assert.match(u.html(),/1 résultats affichés/);assert.match(u.html(),/Validation globale impossible/);
});
test('UI : taille, extension, UTF-8 invalide et nouvelle référence invalide',async()=>{
 const u=setup();await u.upload(u.file());u.el('#ref-activate').onclick();
 for(const file of [u.file('x','test.xlsx'),{...u.file(),size:2097153},{...u.file(),arrayBuffer:async()=>new Uint8Array([255]).buffer},u.file('mauvais')]){
  await u.upload(file);assert.match(u.html(),/Activation impossible/);assert.match(u.html(),/Référence active : <strong>reference.csv/);
 }
});
test('UI : effacement annule une lecture tardive ; nouvel onglet sans référence',async()=>{
 const u=setup();let resolve;
 const pending=u.upload({...u.file(),arrayBuffer:()=>new Promise(r=>resolve=r)});
 u.el('#ref-clear').onclick();resolve(new TextEncoder().encode(csv).buffer);await pending;
 assert.match(u.html(),/Aucun candidat en aperçu/);assert.match(u.html(),/Référence active : <strong>aucune/);
 assert.match(setup().html(),/Référence active : <strong>aucune/);
});
test('UI : contenu CSV échappé dans l’aperçu et les diagnostics',async()=>{
 const u=setup();await u.upload(u.file(csv.replace('75000.00','<img src=x onerror=alert(1)>')));
 assert.match(u.html(),/&lt;img/);assert.doesNotMatch(u.html(),/<img/);
});
