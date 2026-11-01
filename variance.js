(function(root){
 'use strict';
 const divisions=['6','4390','4389','4578','4579'];
 const definitions=[['revenue','Produits',1],['purchases','Achats et prestations',1],['payroll','Personnel',1],['other','Autres charges',1],['capitalizedACE','Retraitement production immobilisée ACE',-1],['capitalizedPayroll','Retraitement production immobilisée personnel',-1]];
 function cents(value){
  if(!Number.isFinite(value))return null;
  // Lire la représentation décimale au lieu de multiplier un flottant par 100.
  const match=String(value).match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);
  if(!match)return null;
  const n=(BigInt(match[2])*100n+BigInt((match[3]||'').padEnd(2,'0')))*(match[1]?-1n:1n);
  return safe(n);
 }
 function safe(n){return n>BigInt(Number.MAX_SAFE_INTEGER)||n<BigInt(Number.MIN_SAFE_INTEGER)?null:Number(n);}
 function sum(values){return values.every(Number.isSafeInteger)?safe(values.reduce((s,v)=>s+BigInt(v),0n)):null;}
 function difference(current,previous){
  const amount=current===null||previous===null?null:sum([current,-previous]);
  if(amount===null)return {amount:null,percent:null,state:'unavailable',message:'Comparaison indisponible : donnée absente, invalide ou précision dépassée.'};
  if(previous===0)return {amount,percent:null,state:'zero-base',message:'Non calculable : base précédente nulle.'};
  return {amount,percent:amount/Math.abs(previous)*100,state:'available',message:'Comparaison disponible.'};
 }
 function diagnostic(id,label,contributions,variation){
  const total=sum(contributions),gap=total===null||variation===null?null:sum([total,-variation]);
  return {id,label,total,variation,gap,status:gap===null?'Indisponible':gap===0?'Conforme':'Bloquant'};
 }
 function analyze({model,year,month,division='all',indicator='ebitda'}){
  if(!Number.isInteger(year)||year<2||!Number.isInteger(month)||month<1||month>12||!['all',...divisions].includes(division)||!['ebitda','ebitdaExCapitalized'].includes(indicator))throw Error('Sélection d’analyse invalide.');
  const previousPeriod={year:month===1?year-1:year,month:month===1?12:month-1};
  const read=(d,previous=false)=>model.total(previous?previousPeriod.month:month,d,false,previous?previousPeriod.year:year);
  const pair=d=>{const current=cents(read(d)[indicator]),previous=cents(read(d,true)[indicator]);return {division:d,current,previous,...difference(current,previous)};};
  const consolidated=pair('all'),selected=division==='all'?consolidated:pair(division),byDivision=divisions.map(pair);
  const defs=definitions.slice(0,indicator==='ebitda'?4:6);
  function rubricRows(d){const current=read(d),previous=read(d,true);return defs.map(([field,label,coefficient])=>{
   const m=cents(current[field]),p=cents(previous[field]),delta=difference(m,p);
   return {field,label,coefficient,current:m,previous:p,rawAmount:delta.amount,amount:delta.amount===null?null:delta.amount*coefficient,state:delta.state};
  });}
  const byRubric=rubricRows(division);
  const diagnostics=[diagnostic('V01','Somme des divisions / variation consolidée',byDivision.map(d=>d.amount),consolidated.amount),diagnostic('V02','Somme des rubriques / variation sélectionnée',byRubric.map(r=>r.amount),selected.amount)];
  // Diagnostiquer aussi chaque division : des écarts de décomposition opposés ne s’annulent pas.
  for(const d of byDivision)diagnostics.push(diagnostic('V02-'+d.division,'Rubriques / variation · division '+d.division,rubricRows(d.division).map(r=>r.amount),d.amount));
  return {year,month,previousPeriod,division,indicator,selected,consolidated,byDivision,byRubric,diagnostics,complete:diagnostics.every(d=>d.status==='Conforme')};
 }
 const api={analyze,cents,sum,difference};root.FinanceVariance=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
