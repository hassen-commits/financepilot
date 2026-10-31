const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
// Modèle DOM ciblé : remplacer innerHTML remplace les descendants et leurs événements.
// Contrairement à l’ancien double de test, une requête ne renvoie pas un nœud périmé.
function setup(scriptOverride){
 const nodes=new Map();
 class Element{
  constructor(id,parent=null){this.id=id;this.parent=parent;this.children=[];this.value='';this.onchange=null;this.html='';nodes.set('#'+id,this);}
  remove(){this.children.forEach(c=>c.remove());nodes.delete('#'+this.id);}
  set innerHTML(html){this.children.forEach(c=>c.remove());this.children=[];this.html=html;this.parse(html);}
  get innerHTML(){return this.html;}
  parse(html){
   for(const match of html.matchAll(/<(select|input|div|button)\b[^>]*\bid="([^"]+)"[^>]*>/g)){
    const el=new Element(match[2],this);this.children.push(el);
    if(match[1]==='select'){
     const body=html.slice(match.index+match[0].length).split('</select>')[0];
     const selected=body.match(/<option\b[^>]*value="([^"]+)"[^>]*selected[^>]*>/)||body.match(/<option\b[^>]*value="([^"]+)"/);
     if(selected)el.value=selected[1];
    }
   }
  }
  insertAdjacentHTML(position,html){assert.equal(position,'beforeend');this.html+=html;this.parse(html);}
  add(){}
 }
 for(const id of ['screen','page-title','subtitle','month','division','year'])new Element(id);
 nodes.get('#division').value='6';nodes.get('#year').value='2026';
 const ctx=vm.createContext({console,Intl,Option:function(){},location:{hash:'#dashboard'},document:{querySelector:s=>nodes.get(s)||null,querySelectorAll:()=>[]},window:{addEventListener(){}},setTimeout});
 for(const f of ['model.js','reference.js','reconciliation.js','reference-ui.js','variance.js','variance-ui.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
 ctx.FinanceModel=ctx.window.FinanceModel;vm.runInContext(scriptOverride||fs.readFileSync('script.js','utf8'),ctx);
 const change=(id,value)=>{const el=nodes.get(id);assert.ok(el,'Élément présent : '+id);el.value=value;assert.equal(typeof el.onchange,'function','Événement conservé : '+id);el.onchange({target:el});};
 change('#month','2');
 return {nodes,ctx,change,html:()=>nodes.get('#screen').innerHTML,variance:()=>nodes.get('#variance-panel').innerHTML};
}
function verify(u,indicator,value,previous,delta){
 const label=indicator==='ebitda'?'EBITDA':'EBITDA hors produits immobilisés';
 assert.equal(u.nodes.get('#graph-metric').value,indicator);
 assert.equal(u.nodes.get('#variance-indicator').value,indicator);
 const html=u.html(),v=u.variance();
 assert.ok(html.includes('<h2>'+label+' par division</h2>'));
 assert.ok(html.includes('<h2>Évolution · '+label+'</h2>'));
 assert.match(html,new RegExp('class="chart-value">'+value+'\\s*€'));
 assert.match(html,new RegExp('<title>Février : '+value+'\\s*€</title>'));
 assert.match(html,new RegExp('<title>Janvier : '+previous+'\\s*€</title>'));
 assert.ok(v.includes('Contributions des cinq divisions au consolidé · '+label));
 // Valeur de la barre de contribution division 6, pas seulement celle d’une carte.
 assert.match(v,new RegExp('variance-bar-row"><span>6</span>[\\s\\S]*?<span>'+delta+',00\\s*€</span>'));
 assert.match(v,new RegExp('Montant M</div><div class="value">'+value+',00\\s*€'));
 assert.match(v,new RegExp('Variation en euros</div><div class="value">'+delta+',00\\s*€'));
}
test('Graphiques et contributions : sélecteur général E → H → E, valeurs et titres',()=>{
 const u=setup();verify(u,'ebitda','87\\s*300','75\\s*000','12\\s*300');
 u.change('#graph-metric','ebitdaExCapitalized');verify(u,'ebitdaExCapitalized','56\\s*100','45\\s*000','11\\s*100');
 u.change('#graph-metric','ebitda');verify(u,'ebitda','87\\s*300','75\\s*000','12\\s*300');
});
test('Sélecteur Analyse mensuelle E → H → E : synchronisation bidirectionnelle',()=>{
 const u=setup();u.change('#variance-indicator','ebitdaExCapitalized');verify(u,'ebitdaExCapitalized','56\\s*100','45\\s*000','11\\s*100');
 u.change('#variance-indicator','ebitda');verify(u,'ebitda','87\\s*300','75\\s*000','12\\s*300');
});
test('Les filtres conservent H et les événements survivent aux rendus successifs',()=>{
 const u=setup();u.change('#graph-metric','ebitdaExCapitalized');u.change('#division','all');u.change('#division','6');u.change('#month','1');u.change('#month','2');verify(u,'ebitdaExCapitalized','56\\s*100','45\\s*000','11\\s*100');
});
test('Ajout du rapprochement : gestionnaire de l’import générique conservé',()=>{
 const u=setup();u.ctx.location.hash='#import';vm.runInContext('render()',u.ctx);assert.equal(typeof u.nodes.get('#file').onchange,'function');
});
test('Le test détecte la régression historique innerHTML += et la perte du gestionnaire',()=>{
 const old=fs.readFileSync('script.js','utf8').replace("$('#screen').insertAdjacentHTML('beforeend','<div id=\"variance-panel\"></div>');","$('#screen').innerHTML+='<div id=\"variance-panel\"></div>';");
 const u=setup(old);assert.equal(u.nodes.get('#graph-metric').onchange,null);
 assert.throws(()=>u.change('#graph-metric','ebitdaExCapitalized'),/Événement conservé/);
});
