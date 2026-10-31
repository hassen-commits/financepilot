(function(root){
  const divisions=['6','4390','4389','4578','4579'];
  const months=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre'];
  // Montants en euros entiers. Formule reproductible, aucune valeur aléatoire.
  const data=divisions.flatMap((division,d)=>months.map((_,m)=>{
    const revenue=420000+d*92000+m*12500+((m+d)%3)*7000;
    return {division,month:m+1,year:2026,revenue,purchases:-(145000+d*31000+m*4200),payroll:-(158000+d*26000+m*1800),other:-(42000+d*9000+m*1200)};
  }));
  const keys=['revenue','purchases','payroll','other'];
  function total(month,division='all',cumulative=false){
    const result={revenue:0,purchases:0,payroll:0,other:0};
    data.filter(r=>(division==='all'||r.division===division)&&(cumulative?r.month<=month:r.month===month)).forEach(r=>keys.forEach(k=>result[k]+=r[k]));
    result.ebitda=keys.reduce((s,k)=>s+result[k],0);return result;
  }
  function variation(current,previous){return {amount:current-previous,percent:previous===0?null:(current-previous)/Math.abs(previous)*100};}
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
  const api={divisions,months,data,total,variation,parseCSV};root.FinanceModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
