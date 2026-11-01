(function(root){
 'use strict';
 const G=root.FinanceManagementSummary;
 let threshold='1000.00',context=null,copyVersion=0;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function mount(options){
  if(options)context=options;
  const host=document.querySelector('#summary-panel');if(!host||!context)return;
  const version=++copyVersion;let result=null,error='';
  // Retirer le commentaire avant tout recalcul susceptible d’échouer.
  host.innerHTML='<p role="status">Actualisation de la synthèse…</p>';
  try{
   const cents=root.FinanceReference.parseAmount(threshold);if(cents<0)throw Error('Le seuil doit être positif ou nul.');
   result=G.generate(G.collect({model:root.FinanceModel,variance:root.FinanceVariance,reference:root.FinanceReferenceView,year:context.year,month:context.month}),{indicator:context.indicator,thresholdCents:cents});
  }catch(e){error=e.message;}
  host.innerHTML=`<section class="panel summary-section"><h2>Synthèse de gestion</h2><p>V2.4 — recette fonctionnelle validée le 1er novembre 2026. Consolidé des cinq divisions, indépendamment du filtre division du tableau de bord. Rédaction déterministe locale.</p><label>Seuil éditorial inclusif en euros (point décimal, deux décimales maximum)<input id="summary-threshold" type="text" inputmode="decimal" value="${esc(threshold)}"></label><p>Le seuil reste dans cette session et ne modifie aucun calcul ou contrôle.</p><div id="summary-feedback" role="status" aria-live="polite">${error?`<p class="error">Synthèse indisponible : ${esc(error)}. Le commentaire précédent a été retiré.</p>`:'Synthèse actualisée pour la période et l’indicateur sélectionnés.'}</div><button id="summary-copy" ${result?'':'disabled'}>Copier le texte</button><label>Texte de synthèse — sélection et copie manuelle possibles<textarea id="summary-text" readonly rows="24" ${result?'':'disabled'}>${result?esc(result.text):''}</textarea></label><p id="summary-copy-status" aria-live="polite">En cas de refus du presse-papiers, sélectionner le texte puis utiliser Ctrl+C (ou la commande Copier sur mobile).</p></section>`;
  const input=document.querySelector('#summary-threshold');
  input.oninput=e=>{threshold=e.target.value;const start=e.target.selectionStart,end=e.target.selectionEnd;mount();const next=document.querySelector('#summary-threshold');next.focus?.();if(typeof start==='number')next.setSelectionRange?.(start,end);};
  input.onchange=()=>mount();input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();mount();}};
  const area=document.querySelector('#summary-text');area.value=result?result.text:'';
  document.querySelector('#summary-copy').onclick=async()=>{
   if(!result||version!==copyVersion)return;
   const status=document.querySelector('#summary-copy-status');
   try{if(!root.navigator?.clipboard?.writeText)throw Error('Presse-papiers indisponible');await root.navigator.clipboard.writeText(result.text);if(version===copyVersion)status.textContent='Texte copié.';}
   catch{if(version===copyVersion){area.focus?.();area.select?.();status.textContent='Copie automatique indisponible. Texte sélectionné : utilisez Ctrl+C ou Copier.';}}
  };
 }
 root.mountFinanceSummary=mount;
 root.clearFinanceSummary=()=>{copyVersion++;const text=document.querySelector('#summary-text');if(text){text.value='';text.disabled=true;}const host=document.querySelector('#summary-panel');if(host)host.innerHTML='<p role="status">Synthèse en attente de recalcul ; commentaire précédent retiré.</p>';};
 root.FinanceReferenceView.subscribe(()=>mount());
})(window);
