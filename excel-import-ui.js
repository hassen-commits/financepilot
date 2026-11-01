(function(root){
 'use strict';
 const Reader=root.FinanceExcelReader,Mapping=root.FinanceExcelMapping;
 const state={book:null,name:'',sheet:'',config:null,candidate:null,error:'',busy:false,token:0,referenceToken:0,context:null};
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function reset(){state.token++;state.book=null;state.name='';state.sheet='';state.config=null;state.candidate=null;state.error='';state.busy=false;}
 function invalidate(){state.candidate=null;state.referenceToken=state.context.begin();}
 function defaults(sheet){return {layout:'',header:1,start:2,end:sheet.rows,columns:{year:-1,month:-1,division:-1,rubric:-1,amount:-1},months:[],exclude:[],units:'',periodicity:'',aliasMode:'',confirmed:false};}
 const select=(id,label,options,value)=>`<label>${label}<select id="${id}">${options.map(([v,l])=>`<option value="${v}" ${String(v)===String(value)?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`;
 const table=(heads,rows)=>`<div class="table-wrap" tabindex="0" role="region" aria-label="Aperçu Excel"><table><thead><tr>${heads.map(v=>`<th>${esc(v)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 function mount(context){
  state.context=context;const host=document.querySelector('#excel-import-panel');if(!host)return;
  const sheet=state.book?.sheets.find(s=>s.name===state.sheet),c=state.config;
  const columns=sheet?Array.from({length:sheet.columns},(_,i)=>[i,Reader.column(i)+' · '+String(sheet.cells[Reader.column(i)+c.header]?.value??'(en-tête vide)')]):[];
  let content='';
  if(state.book)content+=select('excel-sheet','Une seule feuille à importer',[['','Choisir explicitement…'],...state.book.sheets.map((s,i)=>[i,`${s.name}${s.hidden?' (masquée)':''} · ${s.rows} lignes / ${s.columns} colonnes`])],sheet?state.book.sheets.indexOf(sheet):'');
  if(sheet){
   const sample=Array.from({length:Math.min(21,sheet.rows)},(_,i)=>[i+1,...Array.from({length:sheet.columns},(_,j)=>{const cell=sheet.cells[Reader.column(j)+(i+1)];return cell?.formula?'[FORMULE — valeur non utilisable]':cell?.value??'';})]);
   content+=`<details open><summary>Aperçu brut · feuille ${esc(sheet.name)} · 20 premières lignes après la première ligne affichée</summary>${table(['Ligne',...columns.map(([i])=>Reader.column(i))],sample)}</details><p>Les formules ne sont jamais exécutées. Les lignes non retenues restent exclues, sans agrégation implicite. Seule la plage explicitement choisie sera importée.</p><div class="reference-filters">${select('excel-layout','Structure',[['','Choisir…'],['long','Long : une ligne / mois'],['wide','Large : colonnes mensuelles']],c.layout)}<label>Ligne d’en-tête<input id="excel-header" type="number" min="1" value="${c.header}"></label><label>Première ligne de données<input id="excel-start" type="number" min="2" value="${c.start}"></label><label>Dernière ligne de données<input id="excel-end" type="number" min="2" value="${c.end}"></label></div><div class="reference-filters">${['year','division','rubric',...(c.layout==='long'?['month','amount']:[])].map(field=>select('excel-col-'+field,{year:'Année',division:'Division',rubric:'Rubrique',month:'Mois',amount:'Montant EUR'}[field],[[-1,'Choisir une colonne…'],...columns],c.columns[field])).join('')}</div>`;
   if(c.layout==='wide')content+=`<h4>Colonnes de montants mensuels — sélection explicite</h4><p>Ne pas sélectionner les colonnes cumul, budget, total ou exercice précédent.</p><div class="reference-filters">${columns.map(([col,label])=>select('excel-period-'+col,label,[['','Non importée'],...Array.from({length:12},(_,i)=>[i+1,'Mois '+(i+1)])],c.months.find(m=>m.column===col)?.month||'')).join('')}</div>`;
   content+=`<div class="reference-filters">${select('excel-alias','Correspondances des valeurs',[['','Choisir…'],['fictitious','Codes fictifs DIV_… / REF_…'],['canonical','Identifiants FinancePilot exacts']],c.aliasMode)}${select('excel-unit','Unité confirmée',[['','Choisir…'],['EUR','Euros uniquement']],c.units)}${select('excel-frequency','Périodicité confirmée',[['','Choisir…'],['monthly','Mensuel uniquement']],c.periodicity)}</div><p>Mapping fictif, sans caractère officiel SAC 36 : DIV_DO → 6 ; DIV_DR1 → 4390 ; DIV_DR2 → 4389 ; DIV_DR3 → 4578 ; DIV_SIEGE → 4579. REF_E/H/A/P → E/H/A/P. Aucun autre code n’est déduit.</p><label>Lignes à exclure explicitement (numéros séparés par des virgules ; ex. 10,12)<input id="excel-exclude" type="text" value="${c.exclude.join(',')}"></label><label class="excel-confirm"><input id="excel-confirm" type="checkbox" ${c.confirmed?'checked':''}> Je confirme cette feuille, les colonnes, les exclusions, l’absence de double comptage, les montants mensuels en euros et les correspondances.</label><button id="excel-check">Contrôler ce mapping et préparer le candidat</button>`;
   if(state.candidate)content+=state.candidate.valid?`<p>Mapping contrôlé : ${state.candidate.rowCount} références candidates ; ${state.candidate.excluded.length} lignes exclues. Utiliser ensuite le bouton d’activation temporaire ci-dessous. Ce contrôle technique ne valide pas les écarts financiers.</p>`:`<p class="error" role="alert">Candidat refusé : ${state.candidate.errors.length} erreur(s).</p><ul>${state.candidate.errors.slice(0,50).map(e=>`<li>${esc(e.sheet)}!${esc(e.cell)} : ${esc(e.message)}</li>`).join('')}</ul>`;
   if(state.candidate?.valid)content+=table(['Feuille / cellule','Année','Mois','Division','Rubrique','Centimes'],state.candidate.records.slice(0,20).map((r,i)=>[sheet.name+'!'+state.candidate.provenance[i].cell,r.year,r.month,r.division,r.rubric,r.cents]));
  }
  host.innerHTML=`<section class="panel reference-section"><h2>Import Excel .xlsx — candidat de référence</h2><p>V2.3.1 — recette fonctionnelle validée et clôturée. Traitement local, sans conversion manuelle CSV, sans transmission. Limites : 2 Mo compressés, 8 Mo décompressés, 12 feuilles, 20 000 cellules, 2 000 lignes et 64 colonnes. Une feuille par activation.</p><label>Choisir un classeur fictif<input id="excel-file" type="file" accept=".xlsx" ${state.busy?'disabled':''}></label><button id="excel-cancel" class="secondary">Annuler / libérer le classeur candidat</button><p aria-live="polite">${state.busy?'Lecture locale en cours…':esc(state.name)} ${state.error?`<span class="error">${esc(state.error)}</span>`:''}</p>${state.book?.externalLinks?'<p class="notice">Liens externes détectés, jamais actualisés. Toute formule dans un champ importé est bloquée.</p>':''}${content}</section>`;
  document.querySelector('#excel-file').onchange=e=>load(e.target.files[0]);
  document.querySelector('#excel-cancel').onclick=()=>{const ctx=state.context;reset();ctx.begin();ctx.refresh();};
  if(state.book)document.querySelector('#excel-sheet').onchange=e=>{invalidate();const s=state.book.sheets[Number(e.target.value)];state.sheet=e.target.value===''?'':s.name;state.config=state.sheet?defaults(s):null;state.context.refresh();};
  if(!sheet)return;
  const bind=(id,fn)=>{const el=document.querySelector('#'+id);if(el)el.onchange=e=>{invalidate();fn(e.target);if(id!=='excel-confirm')c.confirmed=false;state.context.refresh();};};
  bind('excel-layout',el=>{c.layout=el.value;});
  for(const field of ['header','start','end'])bind('excel-'+field,el=>c[field]=Number(el.value));
  for(const field of ['year','month','division','rubric','amount'])bind('excel-col-'+field,el=>c.columns[field]=Number(el.value));
  if(c.layout==='wide')for(const [col] of columns)bind('excel-period-'+col,el=>{c.months=c.months.filter(m=>m.column!==col);if(el.value)c.months.push({column:col,month:Number(el.value)});});
  bind('excel-alias',el=>c.aliasMode=el.value);bind('excel-unit',el=>c.units=el.value);bind('excel-frequency',el=>c.periodicity=el.value);
  bind('excel-exclude',el=>{c.exclude=el.value===''?[]:el.value.split(',').map(v=>/^\d+$/.test(v.trim())?Number(v.trim()):NaN);});
  bind('excel-confirm',el=>c.confirmed=el.checked);
  // Invalider immédiatement un candidat pendant la saisie, sans recréer le champ focalisé.
  for(const field of ['header','start','end','exclude']){
   const input=document.querySelector('#excel-'+field);
   input.oninput=e=>{
    invalidate();c.confirmed=false;
    if(field==='exclude')c.exclude=e.target.value===''?[]:e.target.value.split(',').map(v=>/^\d+$/.test(v.trim())?Number(v.trim()):NaN);
    else c[field]=Number(e.target.value);
    document.querySelector('#excel-confirm').checked=false;
    const activate=document.querySelector('#ref-activate');if(activate)activate.disabled=true;
   };
  }
  document.querySelector('#excel-check').onclick=()=>{
   invalidate();state.candidate=Mapping.build(sheet,c);
   if(state.candidate.valid)state.context.accept(state.referenceToken,state.name,state.candidate);
   state.context.refresh();
  };
 }
 async function load(file){if(!file)return;reset();const token=state.token,ctx=state.context;state.name=file.name;state.busy=true;state.referenceToken=ctx.begin();ctx.refresh();
  try{if(!/\.xlsx$/i.test(file.name))throw Error('Seul le format .xlsx est accepté.');if(file.size>Reader.limits.fileBytes)throw Error('Limite : 2 Mo.');const buffer=await file.arrayBuffer();if(token!==state.token)return;const book=await Reader.read(buffer);if(token!==state.token)return;state.book=book;}
  catch(e){if(token!==state.token)return;state.error=e.message;}
  if(token===state.token){state.busy=false;ctx.refresh();}
 }
 root.mountFinanceExcel=mount;root.resetFinanceExcel=reset;
})(window);
