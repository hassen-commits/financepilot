(function(root){
 'use strict';
 const columns=['annee','mois','division','rubrique','montant_eur'];
 const divisions=Object.freeze(['6','4390','4389','4578','4579']);
 const rubrics=Object.freeze(['E','H','A','P']);
 const key=r=>[r.year,r.month,r.division,r.rubric].join('/');
 function parseAmount(value){
  if(!/^-?(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value))throw Error('Montant invalide : décimale point, deux décimales maximum, sans espaces ni exposant.');
  const negative=value.startsWith('-'),parts=value.replace(/^-/,'').split('.');
  const cents=BigInt(parts[0])*100n+BigInt((parts[1]||'').padEnd(2,'0'));
  if(cents>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Montant hors limite de précision en centimes.');
  return Number(negative?-cents:cents);
 }
 // Parseur propre au contrat de référence : aucune détection permissive de séparateur.
 function csvRows(text){
  text=text.replace(/^\uFEFF/,'');const rows=[];let row=[],field='',quoted=false,closed=false;
  const endField=()=>{row.push(field);field='';closed=false;};
  for(let i=0;i<text.length;i++){
   const c=text[i];
   if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
   if(c===';'){endField();continue;}
   if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;endField();rows.push(row);row=[];continue;}
   if(closed)throw Error('Caractère après la fermeture d’un champ entre guillemets.');
   if(c==='"'){if(field!=='')throw Error('Guillemet inattendu.');quoted=true;}else field+=c;
  }
  if(quoted)throw Error('Champ entre guillemets non fermé.');
  if(field!==''||row.length||closed){endField();rows.push(row);}
  return rows;
 }
 function validate(text){
  const errors=[],records=[];let rows;
  try{rows=csvRows(text);}catch(e){return {valid:false,errors:[{line:0,message:e.message}],records:[],preview:[]};}
  const header=rows[0]||[];
  if(header.length!==columns.length||new Set(header).size!==columns.length||columns.some(c=>!header.includes(c)))return {valid:false,errors:[{line:1,message:'Les cinq colonnes exactes sont requises : '+columns.join(';')}],records:[],preview:rows.slice(0,21)};
  if(rows.length<2)errors.push({line:2,message:'Au moins une observation est requise.'});
  const seen=new Set();
  rows.slice(1).forEach((cells,index)=>{
   const line=index+2;
   if(cells.length!==5){errors.push({line,message:'La ligne doit comporter cinq colonnes.'});return;}
   const r=Object.fromEntries(header.map((h,i)=>[h,cells[i]]));
   try{
    if(!/^[1-9]\d{3}$/.test(r.annee))throw Error('Année : quatre chiffres, de 1000 à 9999.');
    if(!/^(?:[1-9]|1[0-2])$/.test(r.mois))throw Error('Mois : entier de 1 à 12, sans zéro initial.');
    if(!divisions.includes(r.division))throw Error('Division inconnue ou format invalide.');
    if(!rubrics.includes(r.rubrique))throw Error('Rubrique inconnue : E, H, A ou P attendue.');
    const record={year:Number(r.annee),month:Number(r.mois),division:r.division,rubric:r.rubrique,cents:parseAmount(r.montant_eur)};
    if(seen.has(key(record)))throw Error('Doublon de clé année/mois/division/rubrique.');
    seen.add(key(record));records.push(Object.freeze(record));
   }catch(e){errors.push({line,message:e.message});}
  });
  return {valid:errors.length===0,errors,records:Object.freeze(records),preview:rows.slice(0,21),rowCount:rows.length-1};
 }
 class Session{
  constructor(){this.active=null;this.draft=null;this.version=0;this.readToken=0;}
  begin(){this.draft=null;return ++this.readToken;}
  accept(token,name,text){if(token!==this.readToken)return false;this.draft={name,...validate(text)};return true;}
  fail(token,message){if(token!==this.readToken)return false;this.draft={name:'',valid:false,errors:[{line:0,message}],records:[],preview:[]};return true;}
  activate(){if(!this.draft?.valid)throw Error('Fichier techniquement invalide ou absent.');this.active=Object.freeze({name:this.draft.name,records:this.draft.records,version:++this.version});return this.active;}
  clear(){this.readToken++;this.draft=null;this.active=null;this.version++;}
 }
 const api={columns,divisions,rubrics,key,parseAmount,validate,Session};
 root.FinanceReference=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
