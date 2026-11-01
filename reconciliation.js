(function(root){
 'use strict';
 const R=typeof module!=='undefined'?require('./reference.js'):root.FinanceReference;
 const fields={E:'ebitda',H:'ebitdaExCapitalized',A:'capitalizedACE',P:'capitalizedPayroll'};
 function safeSum(values){if(values.some(v=>!Number.isSafeInteger(v)))return null;const sum=values.reduce((s,v)=>s+BigInt(v),0n);return sum>BigInt(Number.MAX_SAFE_INTEGER)||sum<BigInt(Number.MIN_SAFE_INTEGER)?null:Number(sum);}
 function toCents(value){if(!Number.isFinite(value))return null;const c=Math.round(value*100);return Number.isSafeInteger(c)?c:null;}
 function report({active=null,year,closure,model}){
  if(!Number.isInteger(year)||year<1000||year>9999||!Number.isInteger(closure)||closure<1||closure>12)throw Error('Périmètre invalide.');
  const records=active?.records||[],index=new Map(records.map(r=>[R.key(r),r.cents]));
  const rows=[],referenceIssues=[];
  const periods=Array.from({length:closure},(_,i)=>i+1);
  const amount=(m,d,k)=>index.get([year,m,d,k].join('/'));
  for(const month of periods)for(const division of R.divisions){
   const values=R.rubrics.map(k=>amount(month,division,k));
   if(values.every(Number.isSafeInteger)){
    const [e,h,a,p]=values,expected=safeSum([e,-a,-p]);
    if(expected===null||h!==expected)referenceIssues.push({year,month,division,status:'Bloquant',message:'Référence incohérente : H ≠ E − A − P.'});
   }
  }
  function compare(month,division,rubric,cumulative){
   const ms=cumulative?Array.from({length:month},(_,i)=>i+1):[month],ds=division==='all'?R.divisions:[division];
   const values=[],missing=[];
   for(const m of ms)for(const d of ds){const value=amount(m,d,rubric);if(value===undefined)missing.push([year,m,d,rubric].join('/'));else values.push(value);}
   const reference=missing.length?null:safeSum(values);
   const calculated=toCents(model.total(month,division,cumulative,year)[fields[rubric]]);
   const gap=reference===null||calculated===null?null:safeSum([calculated,-reference]);
   let status,reason;
   if(missing.length){status='Non contrôlé';reason=`${missing.length} référence(s) manquante(s)`;}
   else if(reference===null||calculated===null||gap===null){status='Bloquant';reason='Calcul indisponible ou limite de précision dépassée.';}
   else {status=gap===0?'Conforme':'Bloquant';reason=gap===0?'Écart nul.':'Écart financier.';}
   rows.push({year,month,division,rubric,cumulative,reference,calculated,gap,status,reason,missing});
  }
  for(const month of periods)for(const division of [...R.divisions,'all'])for(const rubric of R.rubrics)compare(month,division,rubric,false);
  for(const division of [...R.divisions,'all'])for(const rubric of R.rubrics)compare(closure,division,rubric,true);
  // Tous les mois et toutes les divisions : un total compensé ne peut pas valider le périmètre.
  const internal=[];
  for(const month of periods)for(const division of ['all',...R.divisions])for(const c of model.controls(month,division,year).checks)if(c.status!=='Conforme')internal.push({month,division,id:c.id,status:c.status});
  const missingCount=rows.filter(r=>!r.cumulative&&r.division!=='all').reduce((n,r)=>n+r.missing.length,0);
  const blocking=rows.filter(r=>r.status==='Bloquant').length;
  const canValidate=!!active&&missingCount===0&&blocking===0&&referenceIssues.length===0&&internal.length===0;
  return {year,closure,rows,referenceIssues,internal,missingCount,blocking,required:closure*20,canValidate};
 }
 const api={report,safeSum,toCents,fields};root.FinanceReconciliation=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
