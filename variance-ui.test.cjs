const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const M=require('./model.js'),fixture=require('./fixtures/variance-fictive.cjs');
function setup(model=M){
 const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:''});return elements.get(id);};
 const ctx=vm.createContext({window:{FinanceModel:model},document:{querySelector:el},Intl});
 for(const f of ['variance.js','variance-ui.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
 const mount=options=>ctx.window.mountFinanceVariance({year:2026,month:2,division:'all',...options});
 return {mount,html:()=>el('#variance-panel').innerHTML,select:indicator=>el('#variance-indicator').onchange({target:{value:indicator}})};
}
test('Interface : montants M et M−1, variation et diagnostics V01/V02',()=>{
 const u=setup();u.mount();assert.match(u.html(),/Analyse mensuelle/);assert.match(u.html(),/663\s*000,00/);assert.match(u.html(),/703\s*500,00/);assert.match(u.html(),/40\s*500,00/);assert.match(u.html(),/V01/);assert.match(u.html(),/Décomposition complète/);
});
test('Interface : sélection de H et d’une division sans supprimer les autres contributions',()=>{
 const u=setup();u.mount({division:'6'});u.select('ebitdaExCapitalized');assert.match(u.html(),/Retraitement production immobilisée ACE/);assert.match(u.html(),/11\s*100,00/);assert.match(u.html(),/division 6/);for(const d of M.divisions)assert.match(u.html(),new RegExp('<td>'+d+'</td>'));
});
test('Interface : janvier absent distinct de base zéro',()=>{
 const u=setup();u.mount({month:1});assert.match(u.html(),/Comparaison indisponible/);assert.match(u.html(),/12\/2025/);assert.match(u.html(),/Indisponible/);assert.doesNotMatch(u.html(),/Décomposition complète/);
 const model={...M,total:(m,d,c,y)=>{const t=M.total(m,d,c,y);return m===1?{...t,ebitda:0}:t;}};
 const z=setup(model);z.mount();assert.match(z.html(),/Non calculable/);assert.match(z.html(),/base précédente nulle/);
});
test('Interface : contributions négatives, positives et zéro, sans cause économique inventée',()=>{
 const model={...M,total:(m,d,c,y)=>M.total(m,d,c,y,fixture.rows)},u=setup(model);u.mount();
 assert.match(u.html(),/negative/);assert.match(u.html(),/positive/);assert.match(u.html(),/-10,00/);assert.match(u.html(),/30,00/);assert.match(u.html(),/Aucune cause économique démontrée/);assert.match(u.html(),/ne remplacent ni C01–C16/);
});
test('Interface : anomalie visible et aucun rapprochement avec une source prétendu',()=>{
 const model={...M,total:(m,d,c,y)=>{const t=M.total(m,d,c,y);return m===2&&d==='all'?{...t,ebitda:t.ebitda+0.01}:t;}},u=setup(model);u.mount();
 assert.match(u.html(),/Bloquant/);assert.match(u.html(),/Analyse non réconciliée ou incomplète/);assert.match(u.html(),/diagnostics V01\/V02 sont internes/);
});
