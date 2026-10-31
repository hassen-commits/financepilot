(function(root){
 'use strict';
 const R=typeof module!=='undefined'?require('./reference.js'):root.FinanceReference;
 const Reader=typeof module!=='undefined'?require('./excel-reader.js'):root.FinanceExcelReader;
 const aliases=Object.freeze({division:{DIV_DO:'6',DIV_DR1:'4390',DIV_DR2:'4389',DIV_DR3:'4578',DIV_SIEGE:'4579'},rubric:{REF_E:'E',REF_H:'H',REF_A:'A',REF_P:'P'}});
 function decimalCents(value,numeric=false){
  if(!numeric)return R.parseAmount(String(value));
  const m=String(value).match(/^(-?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/);if(!m)throw Error('Valeur numérique Excel invalide.');
  const exponent=Number(m[4]||0)-(m[3]||'').length+2;
  if(Math.abs(exponent)>100)throw Error('Exposant hors limites.');
  let n=BigInt(m[2]+(m[3]||''));
  if(exponent>=0)n*=10n**BigInt(exponent);else{const divisor=10n**BigInt(-exponent);if(n%divisor!==0n)throw Error('Plus de deux décimales : aucun arrondi autorisé.');n/=divisor;}
  if(m[1])n=-n;
  if(n>BigInt(Number.MAX_SAFE_INTEGER)||n<BigInt(Number.MIN_SAFE_INTEGER))throw Error('Montant hors précision en centimes.');return Number(n);
 }
 const euro=c=>{const n=BigInt(c),absolute=n<0?-n:n;return (n<0?'-':'')+absolute/100n+'.'+String(absolute%100n).padStart(2,'0');};
 function build(sheet,config){
  const errors=[],records=[],provenance=[],excluded=[];
  const fail=(cell,message)=>errors.push({sheet:sheet.name,cell,message});
  const cols=config.columns||{},months=config.months||[];
  if(!config.confirmed||!['long','wide'].includes(config.layout)||config.units!=='EUR'||config.periodicity!=='monthly'||!['fictitious','canonical'].includes(config.aliasMode)){
   fail('—','Confirmer la structure, les correspondances, le caractère mensuel et l’unité EUR.');return {valid:false,errors};
  }
  if(!Number.isInteger(config.header)||config.header<1||!Number.isInteger(config.start)||config.start<=config.header||!Number.isInteger(config.end)||config.end<config.start||config.end>sheet.rows){fail('—','Plage invalide : en-tête puis lignes de données, dans les limites de la feuille.');return {valid:false,errors};}
  const fields=config.layout==='long'?['year','month','division','rubric','amount']:['year','division','rubric'];
  const used=fields.map(k=>cols[k]).concat(config.layout==='wide'?months.map(m=>m.column):[]);
  if(used.some(c=>!Number.isInteger(c)||c<0||c>=sheet.columns)||new Set(used).size!==used.length){fail('—','Colonnes obligatoires non choisies, dupliquées ou hors plage.');return {valid:false,errors};}
  if(config.layout==='wide'&&(!months.length||months.some(m=>!Number.isInteger(m.month)||m.month<1||m.month>12)||new Set(months.map(m=>m.month)).size!==months.length)){fail('—','Choisir au moins une colonne mensuelle ; chaque mois doit être unique.');return {valid:false,errors};}
  if(sheet.merges.some(m=>m.endRow>=config.start&&m.startRow<=config.end&&used.some(c=>c>=m.startColumn&&c<=m.endColumn))){fail('—','Cellules fusionnées dans la zone mappée : aucun remplissage implicite.');return {valid:false,errors};}
  const skip=new Set(config.exclude||[]);
  if([...skip].some(r=>!Number.isInteger(r)||r<config.start||r>config.end)){fail('—','Ligne exclue hors de la plage.');return {valid:false,errors};}
  const value=(row,col,amount=false)=>{
   const address=Reader.column(col)+row,c=sheet.cells[address];
   if(c?.formula)throw {cell:address,message:'Formule Excel interdite dans un champ importé ; valeur enregistrée non utilisée.'};
   if(!c||c.value===undefined||c.value===null||c.value==='')throw {cell:address,message:'Cellule obligatoire vide.'};
   if(c.type==='e'||c.type==='b'||c.type==='d')throw {cell:address,message:'Erreur Excel, booléen ou date non pris en charge.'};
   if(c.type==='n'&&/[dy]/i.test(c.format.replace(/"[^"]*"/g,'')))throw {cell:address,message:'Date Excel : une année et un mois explicites sont requis.'};
   if(amount){try{return decimalCents(c.type==='n'?c.numeric:c.value,c.type==='n');}catch(e){throw {cell:address,message:e.message};}}
   if(c.type==='n'){
    try{const n=decimalCents(c.numeric,true);if(n%100!==0)throw Error('Identifiant ou période numérique non entier.');return String(n/100);}
    catch(e){throw {cell:address,message:e.message};}
   }
   return String(c.value);
  };
  for(let row=config.start;row<=config.end;row++){
   if(skip.has(row)){excluded.push(row);continue;}
   try{
    const year=value(row,cols.year),divisionRaw=value(row,cols.division),rubricRaw=value(row,cols.rubric);
    const division=config.aliasMode==='canonical'?divisionRaw:aliases.division[divisionRaw],rubric=config.aliasMode==='canonical'?rubricRaw:aliases.rubric[rubricRaw];
    if(!/^[1-9]\d{3}$/.test(year))throw {cell:Reader.column(cols.year)+row,message:'Année invalide : quatre chiffres.'};
    if(!R.divisions.includes(division))throw {cell:Reader.column(cols.division)+row,message:'Division inconnue pour le mapping confirmé.'};
    if(!R.rubrics.includes(rubric))throw {cell:Reader.column(cols.rubric)+row,message:'Rubrique inconnue pour le mapping confirmé.'};
    const periods=config.layout==='long'?[{month:value(row,cols.month),column:cols.amount}]:months;
    for(const period of periods){
     try{
      if(!/^(?:[1-9]|1[0-2])$/.test(String(period.month)))throw {cell:Reader.column(cols.month)+row,message:'Mois invalide : 1 à 12.'};
      const cents=value(row,period.column,true);
      records.push({year:Number(year),month:Number(period.month),division,rubric,cents});provenance.push({sheet:sheet.name,row,cell:Reader.column(period.column)+row});
     }catch(e){fail(e.cell||'—',e.message);}
    }
   }catch(e){fail(e.cell||'—',e.message);}
  }
  const csv='annee;mois;division;rubrique;montant_eur\n'+records.map(r=>[r.year,r.month,r.division,r.rubric,euro(r.cents)].join(';')).join('\n');
  const validation=R.validate(csv);
  for(const error of validation.errors){const p=provenance[error.line-2];fail(p?.cell||'—',error.message);}
  return {valid:errors.length===0,errors,csv,records:validation.records,provenance,excluded,rowCount:records.length,config:JSON.parse(JSON.stringify(config)),sheet:sheet.name};
 }
 const api={build,decimalCents,aliases};root.FinanceExcelMapping=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
