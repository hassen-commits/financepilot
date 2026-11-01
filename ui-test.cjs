// Test de rendu sans navigateur : vérifie les routes et interactions de filtre.
// Ne remplace pas la recette visuelle, le clavier ou les lecteurs d’écran.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const elements=new Map();
function element(key){if(!elements.has(key))elements.set(key,{value:key==='#division'?'all':key==='#year'?'2026':'',innerHTML:'',textContent:'',insertAdjacentHTML(position,html){this.innerHTML+=html;},add(){}});return elements.get(key);}
const ctx=vm.createContext({console,Intl,Number,Math,Set,Option:function(){},location:{hash:'#dashboard'},document:{querySelector:element,querySelectorAll:()=>[]},window:{addEventListener(){}},setTimeout});
vm.runInContext(fs.readFileSync('model.js','utf8'),ctx);ctx.FinanceModel=ctx.window.FinanceModel;
for(const file of ['reference.js','reconciliation.js','reference-ui.js','variance.js','variance-ui.js','management-summary.js','management-summary-ui.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
vm.runInContext(fs.readFileSync('script.js','utf8'),ctx);
assert.match(element('#screen').innerHTML,/882\s*000/);
assert.match(element('#screen').innerHTML,/EBITDA hors produits immobilisés/);
element('#graph-metric').onchange({target:{value:'ebitdaExCapitalized'}});
assert.match(element('#screen').innerHTML,/EBITDA hors produits immobilisés par division/);
element('#month').value='1';element('#division').value='6';element('#month').onchange();
assert.match(element('#screen').innerHTML,/45\s*000/);
for(const route of ['income','controls','import']){ctx.location.hash='#'+route;vm.runInContext('render()',ctx);assert.ok(element('#screen').innerHTML.length>100);}
ctx.location.hash='#controls';vm.runInContext('render()',ctx);assert.match(element('#screen').innerHTML,/16\/16 contrôles conformes/);
console.log('Rendu V2 : quatre routes, filtres, graphiques et contrôles vérifiés sans navigateur.');
