(function(root){
  const divisions=['6','4390','4389','4578','4579'];
  const months=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre'];
  // Montants en euros entiers. Formule reproductible, aucune valeur aléatoire.
  const data=divisions.flatMap((division,d)=>months.map((_,m)=>{
    const revenue=420000+d*92000+m*12500+((m+d)%3)*7000;
    return {division,month:m+1,year:2026,revenue,capitalizedACE:12000+d*2000+m*500,capitalizedPayroll:18000+d*3000+m*700,purchases:-(145000+d*31000+m*4200),payroll:-(158000+d*26000+m*1800),other:-(42000+d*9000+m*1200)};
  }));
  const keys=['revenue','purchases','payroll','other'];
  const inputs=[...keys,'capitalizedACE','capitalizedPayroll'];
  const metrics=[...inputs,'ebitda','ebitdaExCapitalized'];
  const indicators={ebitda:{label:'EBITDA',reference:'H109/RESO/CRAG2/0EBITDA'},ebitdaExCapitalized:{label:'EBITDA hors produits immobilisés',reference:null},capitalizedACE:{label:'Production immobilisée ACE',reference:'H109/RESO/CRAG2/0PROACE'},capitalizedPayroll:{label:'Production immobilisée liée à la masse salariale',reference:'H109/RESO/CRAG2/0PROMASA'}};
  const cents=value=>Math.round(value*100);
  function total(month,division='all',cumulative=false,year=2026,source=data){
    const ds=division==='all'?divisions:[division];
    const ms=cumulative?Array.from({length:month},(_,i)=>i+1):[month];
    const rows=source.filter(r=>r.year===year&&ds.includes(r.division)&&ms.includes(r.month));
    const complete=divisions.includes(ds[0])&&month>=1&&month<=12&&ds.every(d=>ms.every(m=>rows.filter(r=>r.division===d&&r.month===m).length===1));
    const result={};
    for(const k of inputs)result[k]=complete&&rows.every(r=>Number.isFinite(r[k]))?rows.reduce((sum,r)=>sum+cents(r[k]),0)/100:null;
    result.ebitda=keys.every(k=>result[k]!==null)?keys.reduce((sum,k)=>sum+cents(result[k]),0)/100:null;
    result.ebitdaExCapitalized=[result.ebitda,result.capitalizedACE,result.capitalizedPayroll].every(v=>v!==null)?(cents(result.ebitda)-cents(result.capitalizedACE)-cents(result.capitalizedPayroll))/100:null;
    return result;
  }
  function variation(current,previous){if(current===null||previous===null)return {amount:null,percent:null};return {amount:(cents(current)-cents(previous))/100,percent:previous===0?null:(current-previous)/Math.abs(previous)*100};}
  function controls(month,division='all',year=2026,source=data,calculate=total){
    const checks=[];
    const add=(label,expected,actual)=>{const available=Number.isFinite(expected)&&Number.isFinite(actual);const gap=available?(cents(actual)-cents(expected))/100:null;checks.push({label,expected,actual,gap,status:!available?'Bloquant':gap===0?'Conforme':'Bloquant'});};
    const c=calculate(month,division,false,year,source),y=calculate(month,division,true,year,source);
    const sum=values=>values.every(Number.isFinite)?values.reduce((s,v)=>s+cents(v),0)/100:null;
    const selected=division==='all'?divisions:[division];
    const issues=[];
    for(const d of selected)for(let m=1;m<=month;m++){const rows=source.filter(r=>r.year===year&&r.division===d&&r.month===m);if(rows.length!==1)issues.push(`${d}/${m} : ${rows.length===0?'mois absent':'doublon'}`);else if(inputs.some(k=>!Number.isFinite(rows[0][k])))issues.push(`${d}/${m} : montant absent ou invalide`);}
    add('Complétude et unicité (janvier au mois choisi)',0,issues.length);
    for(const k of ['ebitda','ebitdaExCapitalized','capitalizedACE','capitalizedPayroll']){
      add('Cumul · '+(indicators[k]?.label||k),sum(Array.from({length:month},(_,i)=>calculate(i+1,division,false,year,source)[k])),y[k]);
      for(const cumulative of [false,true])add('Consolidation '+(cumulative?'cumulée':'mensuelle')+' · '+(indicators[k]?.label||k),sum(divisions.map(d=>calculate(month,d,cumulative,year,source)[k])),calculate(month,'all',cumulative,year,source)[k]);
    }
    for(const [label,t] of [['mensuelle',c],['cumulée',y]])add('Passage entre indicateurs · '+label,t.ebitda===null||t.capitalizedACE===null||t.capitalizedPayroll===null?null:(cents(t.ebitda)-cents(t.capitalizedACE)-cents(t.capitalizedPayroll))/100,t.ebitdaExCapitalized);
    return {checks,issues};
  }
  function parseCSV(text){
    text=text.replace(/^\uFEFF/,'');
    const first=text.split(/\r?\n/)[0];const separator=first.includes(';')?';':',';
    const rows=[];let row=[],field='',quoted=false;
    for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else if(quoted){quoted=false;}else if(field===''){quoted=true;}else throw Error('Guillemet inattendu dans le CSV.');}
      else if(c===separator&&!quoted){row.push(field);field='';}
      else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(v=>v.trim()))rows.push(row);row=[];field='';}
      else field+=c;
    }
    if(quoted)throw Error('Le CSV contient un champ entre guillemets non fermé.');
    row.push(field);if(row.some(v=>v.trim()))rows.push(row);
    if(rows.length<2)throw Error('Le CSV doit contenir un en-tête et au moins une ligne.');
    if(rows[0].length<2)throw Error('Utilisez un CSV séparé par des virgules ou des points-virgules.');
    if(rows.some(r=>r.length!==rows[0].length))throw Error('Les lignes ne comportent pas toutes le même nombre de colonnes.');
    return rows;
  }
  const api={divisions,months,data,total,variation,parseCSV,controls,indicators,metrics};root.FinanceModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
