const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(clipboard){
 const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',value:'',textContent:'',disabled:false,focus(){this.focused=true;},select(){this.selected=true;},insertAdjacentHTML(position,html){this.innerHTML=position==='afterbegin'?html+this.innerHTML:this.innerHTML+html;}});return elements.get(id);};
 const ctx=vm.createContext({console,Intl,TextDecoder,window:{navigator:{clipboard}},document:{querySelector:el}});
 for(const f of ['model.js','reference.js','reconciliation.js','reference-ui.js','variance.js','management-summary.js','management-summary-ui.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
 const mount=(options={})=>ctx.window.mountFinanceSummary({year:2026,month:2,indicator:'ebitda',...options});
 const threshold=value=>el('#summary-threshold').oninput({target:{value}});
 const text=()=>el('#summary-text').value;
 const upload=async(csv,name='reference.csv')=>{ctx.window.mountFinanceReference();await el('#ref-file').onchange({target:{files:[{name,size:csv.length,arrayBuffer:async()=>new TextEncoder().encode(csv).buffer}]}});};
 return {ctx,el,mount,threshold,text,upload};
}
test('Synthèse UI : consolidé explicite, montants E/H et changement de période',()=>{
 const u=setup();u.mount({division:'6'});assert.match(u.text(),/Consolidé des cinq divisions/);assert.match(u.text(),/703\s*500,00/);assert.match(u.text(),/497\s*500,00/);
 u.mount({month:1});assert.match(u.text(),/01\/2026/);assert.match(u.text(),/12\/2025/);assert.match(u.text(),/Comparaison indisponible/);
});
test('Synthèse UI : E → H → E sans commentaire périmé',()=>{
 const u=setup();u.mount();const e=u.text();u.mount({indicator:'ebitdaExCapitalized'});assert.match(u.text(),/Indicateur détaillé : EBITDA hors produits immobilisés H/);assert.match(u.text(),/Retraitement production immobilisée ACE/);u.mount();assert.equal(u.text(),e);
});
test('Synthèse UI : seuil inclusif actualisé immédiatement, invalide retire le texte',()=>{
 const u=setup();u.mount();u.threshold('21000');assert.match(u.text(),/Seuil éditorial inclusif : 21\s*000,00/);assert.match(u.text(),/Achats et prestations : contribution arithmétique de -21\s*000,00/);assert.doesNotMatch(u.text(),/Personnel : contribution arithmétique/);
 u.threshold('1,00');assert.equal(u.text(),'');assert.match(u.el('#summary-panel').innerHTML,/Synthèse indisponible/);u.threshold('1000.00');assert.match(u.text(),/Situation mensuelle/);
});
test('Synthèse UI : erreur de recalcul retire immédiatement le commentaire précédent',()=>{
 const u=setup();u.mount();assert.ok(u.text());u.ctx.window.FinanceManagementSummary.collect=()=>{throw Error('Échec de recalcul fictif');};u.mount();assert.equal(u.text(),'');assert.match(u.el('#summary-panel').innerHTML,/Échec de recalcul fictif/);
});
test('Synthèse UI : copier le texte brut exact',async()=>{
 let copied;const u=setup({writeText:async text=>copied=text});u.mount();await u.el('#summary-copy').onclick();assert.equal(copied,u.text());assert.equal(u.el('#summary-copy-status').textContent,'Texte copié.');
});
test('Synthèse UI : secours de copie et absence de persistance du seuil',async()=>{
 const u=setup({writeText:async()=>{throw Error('Refus');}});u.mount();await u.el('#summary-copy').onclick();assert.equal(u.el('#summary-text').selected,true);assert.match(u.el('#summary-copy-status').textContent,/Ctrl\+C/);u.threshold('5000');const fresh=setup();fresh.mount();assert.match(fresh.text(),/Seuil éditorial inclusif : 1\s*000,00/);
});
test('Synthèse UI : prévisualisation sans effet, activation/validation/effacement actualisent',async()=>{
 const u=setup();u.mount();const absent=u.text(),csv=fs.readFileSync('fixtures/reference-fictive-janvier-fevrier.csv','utf8');await u.upload(csv);assert.equal(u.text(),absent);
 u.el('#ref-activate').onclick();assert.match(u.text(),/périmètre éligible ; validation globale non effectuée explicitement/);
 u.el('#ref-closure').onchange({target:{value:'2'}});u.el('#ref-validate').onclick();assert.match(u.text(),/02\/2026 : validation globale explicitement effectuée/);
 u.el('#ref-clear').onclick();assert.match(u.text(),/Non contrôlé : aucune référence activée/);assert.doesNotMatch(u.text(),/validation globale explicitement effectuée/);
});
test('Vue de référence en lecture seule et validation limitée à la clôture réelle',async()=>{
 const u=setup();u.mount();await u.upload(fs.readFileSync('fixtures/reference-fictive-janvier-fevrier.csv','utf8'));u.el('#ref-activate').onclick();u.el('#ref-closure').onchange({target:{value:'2'}});u.el('#ref-validate').onclick();
 const view=u.ctx.window.FinanceReferenceView,snapshot=view.snapshot(2026,1);assert.equal(snapshot.validated,false);assert.equal(snapshot.report.canValidate,true);assert.equal(Object.isFrozen(snapshot),true);assert.equal(Object.isFrozen(snapshot.report.rows),true);assert.equal(view.snapshot(2026,2).validated,true);assert.equal('records' in snapshot,false);
 u.mount({month:1});assert.match(u.text(),/périmètre distinct/);
});
test('Synthèse UI : des références activées erronées ne laissent pas le commentaire conforme',async()=>{
 const u=setup();u.mount();const csv=fs.readFileSync('fixtures/reference-fictive-janvier-fevrier.csv','utf8');await u.upload(csv);u.el('#ref-activate').onclick();assert.match(u.text(),/rapprochements financiers conformes/);
 await u.upload(csv.replace('E;75000.00','E;75000.01'),'ecart.csv');u.el('#ref-activate').onclick();assert.match(u.text(),/écart -1 centime/);assert.doesNotMatch(u.text(),/02\/2026 : rapprochements financiers conformes/);
});
test('Copie asynchrone : résultat tardif ne confirme pas un commentaire retiré',async()=>{
 let release;const u=setup({writeText:()=>new Promise(r=>release=r)});u.mount();const pending=u.el('#summary-copy').onclick();u.threshold('invalide');release();await pending;assert.equal(u.text(),'');assert.notEqual(u.el('#summary-copy-status').textContent,'Texte copié.');
});
