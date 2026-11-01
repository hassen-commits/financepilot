(function(root){
 'use strict';
 const order=['6','4390','4389','4578','4579'];
 const labels={ebitda:'EBITDA E',ebitdaExCapitalized:'EBITDA hors produits immobilisés H'};
 const money=n=>n===null?'indisponible':new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(n/100);
 const signed=n=>(n>0?'+':'')+money(n);
 const percent=n=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2,signDisplay:'always'}).format(n)+' %';
 const period=p=>String(p.month).padStart(2,'0')+'/'+p.year;
 function sum(values){if(values.some(v=>!Number.isSafeInteger(v)))throw Error('Contribution indisponible ou hors précision.');const s=values.reduce((a,b)=>a+BigInt(b),0n);if(s>BigInt(Number.MAX_SAFE_INTEGER)||s<BigInt(Number.MIN_SAFE_INTEGER))throw Error('Somme des contributions hors précision.');return Number(s);}
 function groups(rows){return {positive:sum(rows.filter(r=>r.amount>0).map(r=>r.amount)),negative:sum(rows.filter(r=>r.amount<0).map(r=>r.amount))};}
 function collect({model,variance,reference,year,month}){
  const E=variance.analyze({model,year,month,division:'all',indicator:'ebitda'});
  const H=variance.analyze({model,year,month,division:'all',indicator:'ebitdaExCapitalized'});
  const periods=[{year,month},E.previousPeriod];
  const controls=periods.map(p=>({period:p,results:['all',...order].map(division=>({division,...model.controls(p.month,division,p.year)}))}));
  const references=periods.map(p=>({period:p,...reference.snapshot(p.year,p.month)}));
  return {year,month,E,H,controls,references};
 }
 function generate(snapshot,{indicator='ebitda',thresholdCents=100000}={}){
  if(!labels[indicator]||!Number.isSafeInteger(thresholdCents)||thresholdCents<0)throw Error('Indicateur ou seuil éditorial invalide.');
  const selected=indicator==='ebitda'?snapshot.E:snapshot.H,sections=[];
  const add=(title,lines)=>sections.push({title,lines});
  add('Périmètre',[`Synthèse de gestion — ${period(snapshot)}. Consolidé des cinq divisions : ${order.join(', ')}. Le filtre division du tableau de bord ne réduit pas ce périmètre.`,`Indicateur détaillé : ${labels[indicator]}. Seuil éditorial inclusif : ${money(thresholdCents)} ; aucun effet sur les calculs ou contrôles.`]);
  add('Situation mensuelle',[['E','ebitda'],['H','ebitdaExCapitalized']].map(([key,id])=>{
   const r=snapshot[key],s=r.consolidated;
   const amounts=`${labels[id]} : M (${period(snapshot)}) = ${money(s.current)} ; M−1 (${period(r.previousPeriod)}) = ${money(s.previous)}.`;
   if(s.state==='unavailable')return amounts+' Comparaison indisponible : données absentes, invalides ou précision dépassée ; aucune substitution par zéro.';
   return amounts+` Variation : ${signed(s.amount)} ; ${s.state==='zero-base'?'Non calculable : base précédente nulle.':percent(s.percent)+'.'}`;
  }));
  const available=selected.byDivision.filter(d=>d.amount!==null),ranked=available.filter(d=>d.amount!==0).slice().sort((a,b)=>Math.abs(b.amount)-Math.abs(a.amount)||order.indexOf(a.division)-order.indexOf(b.division)),top=ranked.slice(0,3),remaining=ranked.slice(3),allGroups=groups(available),rest=groups(remaining);
  const divisionLines=[`${available.length}/5 divisions comparables. ${selected.complete?'Décomposition réconciliée.':'Analyse incomplète ou non réconciliée : contributions disponibles à examiner, aucun total partiel déclaré conforme.'}`];
  divisionLines.push(...top.map(d=>`Division ${d.division} : contribution arithmétique de ${signed(d.amount)}.`));
  if(!top.length)divisionLines.push(available.length?'Aucune contribution non nulle disponible.':'Aucune contribution disponible.');
  divisionLines.push(`Toutes les contributions disponibles : positives ${signed(allGroups.positive)} ; négatives ${signed(allGroups.negative)}. Ces montants restent distincts même en cas de compensation.`,`Autres divisions hors des trois principales : contributions positives ${signed(rest.positive)} ; négatives ${signed(rest.negative)}.`);
  add('Principales contributions par division',divisionLines);
  const rubrics=selected.byRubric.filter(r=>r.amount!==null),significant=rubrics.filter(r=>r.amount!==0&&Math.abs(r.amount)>=thresholdCents).slice().sort((a,b)=>Math.abs(b.amount)-Math.abs(a.amount)||selected.byRubric.indexOf(a)-selected.byRubric.indexOf(b)),omitted=groups(rubrics.filter(r=>!significant.includes(r)));
  add('Contributions par rubrique',[
   ...significant.map(r=>`${r.label} : contribution arithmétique de ${signed(r.amount)}.`),
   ...(significant.length?[]:['Aucune contribution non nulle n’atteint le seuil éditorial.']),
   `Rubriques non présentées individuellement : contributions positives ${signed(omitted.positive)} ; négatives ${signed(omitted.negative)}.`,
   ...(rubrics.length<selected.byRubric.length?[`${selected.byRubric.length-rubrics.length} rubrique(s) indisponible(s) ; la décomposition est incomplète.`]:[]),
   ...(indicator==='ebitdaExCapitalized'?['Les productions immobilisées sont des retraitements : leur contribution est l’opposé de leur variation. Les charges déjà négatives conservent leurs signes.']:['Les charges déjà négatives conservent leurs signes.'])
  ]);
  const internal=[];
  for(const block of snapshot.controls){const anomalies=block.results.flatMap(r=>r.checks.filter(c=>c.status!=='Conforme').map(c=>`${c.id} · ${r.division==='all'?'consolidé':'division '+r.division} : ${c.status}${c.gap===null?' (valeur indisponible)':` (écart ${c.gap} centime(s))`}.`));
   internal.push(`${period(block.period)} : ${anomalies.length?anomalies.length+' résultat(s) interne(s) non conforme(s).':'Aucune anomalie détectée par C01–C16 ; cela ne constitue pas une validation effectuée.'}`,...anomalies);
   for(const result of block.results)internal.push(...result.issues.map(issue=>`${period(block.period)} · ${result.division} : ${issue}.`));
  }
  add('Contrôles internes C01–C16',internal);
  const variationLines=[];
  for(const [key,id] of [['E','ebitda'],['H','ebitdaExCapitalized']])for(const d of snapshot[key].diagnostics)variationLines.push(`${labels[id]} · ${period(snapshot.E.previousPeriod)} → ${period(snapshot)} · ${d.id} : ${d.status} ; résiduel ${d.gap===null?'indisponible':d.gap+' centime(s)'}.`);
  add('Réconciliation interne des variations V01/V02',variationLines);
  const financial=[],validation=[];
  for(const block of snapshot.references){
   const p=period(block.period),r=block.report;
   if(!block.active){financial.push(`${p} : rapprochement Non contrôlé : aucune référence activée.`);}
   else{
    const bad=r.rows.filter(row=>row.status==='Bloquant');
    financial.push(`${p} · références de janvier à ${block.period.month}/${block.period.year} : ${r.blocking} résultat(s) Bloquant(s), ${r.missingCount} référence(s) mensuelle(s) obligatoire(s) manquante(s).`);
    financial.push(...bad.map(row=>`${p} · ${row.cumulative?'cumul janvier → '+row.month:'mois '+row.month} · ${row.division==='all'?'consolidé':'division '+row.division} · ${row.rubric} : Bloquant, écart ${row.gap===null?'indisponible':row.gap+' centime(s)'} ; ${row.reason}`));
    financial.push(...r.referenceIssues.map(issue=>`${issue.month}/${issue.year} · division ${issue.division} : ${issue.status} ; ${issue.message}`));
    if(r.missingCount)financial.push(`${p} : références obligatoires manquantes = Non contrôlé ; la validation globale est impossible.`);
    if(!bad.length&&!r.missingCount&&!r.referenceIssues.length)financial.push(`${p} : rapprochements financiers conformes ; les contrôles internes restent distincts.`);
   }
   validation.push(`${p} : ${block.validated?'validation globale explicitement effectuée pour ce périmètre fictif.':r.canValidate?'périmètre éligible ; validation globale non effectuée explicitement.':'validation globale non effectuée pour ce périmètre ; conditions de validation non réunies.'}`);
   if(block.validationScope&&!block.validated)validation.push(`Dernière validation explicite mémorisée : janvier → ${block.validationScope.month}/${block.validationScope.year}, périmètre distinct.`);
  }
  add('Rapprochement source / CRD V2.2',financial);add('Validation globale du périmètre',validation);
  add('Limites',['Les contributions décrivent des différences arithmétiques, jamais des causes économiques ou opérationnelles démontrées. Aucune donnée manquante ni aucun poste supplémentaire n’est inventé.','Synthèse déterministe locale sur données fictives ; aucune IA externe ni certification comptable.']);
  const text=sections.map(s=>s.title+'\n'+s.lines.join('\n')).join('\n\n');
  return {sections,text,indicator,thresholdCents,topDivisions:top.map(d=>d.division),significantRubrics:significant.map(r=>r.field)};
 }
 const api={collect,generate};root.FinanceManagementSummary=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
