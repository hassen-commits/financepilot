(function(root){
 'use strict';
 const X=typeof module!=='undefined'?require('./vendor/xlsx-0.20.3.full.min.js'):root.XLSX;
 const Zip=typeof module!=='undefined'?require('./vendor/jszip-3.10.1.min.js'):root.JSZip;
 const limits=Object.freeze({fileBytes:2097152,expandedBytes:8388608,entries:256,sheets:12,cells:20000,rows:2000,columns:64});
 const text=b=>new TextDecoder('utf-8',{fatal:true}).decode(b);
 function centralGuard(bytes){
  if(bytes.length>limits.fileBytes)throw Error('Classeur trop volumineux : 2 Mo maximum.');
  const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let end=-1;
  for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--)if(v.getUint32(p,true)===0x06054b50&&p+22+v.getUint16(p+20,true)===bytes.length){end=p;break;}
  if(end<0||v.getUint16(end+4,true)||v.getUint16(end+6,true))throw Error('Archive XLSX invalide, chiffrée ou multi-volume.');
  const count=v.getUint16(end+10,true);let p=v.getUint32(end+16,true),expanded=0;const names=new Set();
  if(count>limits.entries||count===65535)throw Error('Trop de composants dans le classeur.');
  for(let i=0;i<count;i++){
   if(p+46>end||v.getUint32(p,true)!==0x02014b50)throw Error('Répertoire ZIP invalide.');
   const flags=v.getUint16(p+8,true),method=v.getUint16(p+10,true),size=v.getUint32(p+24,true),n=v.getUint16(p+28,true),extra=v.getUint16(p+30,true),comment=v.getUint16(p+32,true);
   if(p+46+n+extra+comment>end)throw Error('Composant ZIP tronqué.');
   const name=text(bytes.subarray(p+46,p+46+n));
   if(flags&1||![0,8].includes(method)||size===0xffffffff||names.has(name)||name.includes('..')||name.startsWith('/'))throw Error('Composant ZIP interdit ou dupliqué.');
   names.add(name);expanded+=size;if(expanded>limits.expandedBytes)throw Error('Décompression limitée à 8 Mo.');
   p+=46+n+extra+comment;
  }
  if(p!==end)throw Error('Archive ZIP non standard ou ZIP64 non prise en charge.');
 }
 async function unpack(bytes){
  centralGuard(bytes);const zip=await Zip.loadAsync(bytes),clean=new Zip();let total=0;
  for(const entry of Object.values(zip.files)){
   if(entry.dir)continue;
   const chunks=[];
   await new Promise((resolve,reject)=>{
    const stream=entry.internalStream('uint8array');let failed=false;
    stream.on('data',chunk=>{if(failed)return;total+=chunk.length;if(total>limits.expandedBytes){failed=true;stream.pause();reject(Error('Décompression réelle supérieure à 8 Mo.'));}else chunks.push(chunk);});
    stream.on('error',reject);stream.on('end',resolve);stream.resume();
   });
   const size=chunks.reduce((s,c)=>s+c.length,0),content=new Uint8Array(size);let pos=0;for(const chunk of chunks){content.set(chunk,pos);pos+=chunk.length;}
   if(/\.xml$|\.rels$/i.test(entry.name)&&/<!DOCTYPE|<!ENTITY/i.test(text(content)))throw Error('Déclaration XML externe interdite.');
   clean.file(entry.name,content);
  }
  for(const name of ['[Content_Types].xml','xl/workbook.xml','xl/_rels/workbook.xml.rels'])if(!clean.file(name))throw Error('Structure .xlsx absente.');
  const contentTypes=await clean.file('[Content_Types].xml').async('string');
  if(!contentTypes.includes('spreadsheetml.sheet.main+xml')||Object.keys(zip.files).some(n=>/vbaProject|\.bin$/i.test(n)))throw Error('Seul le classeur .xlsx sans macros ni composant binaire est accepté.');
  return clean;
 }
 const decode=s=>s.replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
 const attrs=s=>Object.fromEntries([...s.matchAll(/([\w:]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(m=>[m[1],decode(m[2]??m[3])]));
 async function read(buffer){
  const bytes=buffer instanceof Uint8Array?buffer:new Uint8Array(buffer),zip=await unpack(bytes);
  const rels=await zip.file('xl/_rels/workbook.xml.rels').async('string'),paths=new Map();
  for(const m of rels.matchAll(/<(?:\w+:)?Relationship\b([^>]*)\/?\s*>/g)){const a=attrs(m[1]);if(a.TargetMode==='External')continue;let p=a.Target?.startsWith('/')?a.Target.slice(1):'xl/'+a.Target;paths.set(a.Id,p);}
  const safeBytes=await zip.generateAsync({type:'uint8array',compression:'STORE'});
  const workbook=X.read(safeBytes,{type:'array',cellFormula:true,cellDates:false,cellText:false,cellNF:true,bookVBA:false});
  if(workbook.SheetNames.length>limits.sheets)throw Error('Douze feuilles maximum.');
  const sheets=[];let cellCount=0;
  for(const [i,name] of workbook.SheetNames.entries()){
   const ws=workbook.Sheets[name],meta=workbook.Workbook?.Sheets?.[i]||{},path=paths.get(meta.id);
   if(!path||!zip.file(path))throw Error('Feuille XML non prise en charge : '+name);
   const xml=await zip.file(path).async('string'),raw=new Map();
   for(const m of xml.matchAll(/<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g)){
    const a=attrs(m[1]),body=m[2]||'',value=body.match(/<(?:\w+:)?v\b[^>]*>([^<]*)<\/(?:\w+:)?v>/)?.[1];
    if(a.r)raw.set(a.r,{numeric:value,type:a.t,formula:/<(?:\w+:)?f(?:\s|\/|>)/.test(body)});
   }
   const cells={};let lastRow=0,lastColumn=0;
   for(const address of Object.keys(ws).filter(k=>!k.startsWith('!'))){
    const pos=X.utils.decode_cell(address);if(pos.r>=limits.rows||pos.c>=limits.columns||++cellCount>limits.cells)throw Error('Limite : 2 000 lignes, 64 colonnes et 20 000 cellules par classeur.');
    const c=ws[address],original=raw.get(address)||{};
    cells[address]={value:c.v,type:c.t,format:c.z||'',formula:original.formula||typeof c.f==='string',numeric:original.numeric};
    lastRow=Math.max(lastRow,pos.r+1);lastColumn=Math.max(lastColumn,pos.c+1);
   }
   const ranges=ws['!merges']||[];
   sheets.push({name,hidden:!!meta.Hidden,cells,rows:lastRow,columns:lastColumn,merges:ranges.map(r=>({startRow:r.s.r+1,endRow:r.e.r+1,startColumn:r.s.c,endColumn:r.e.c}))});
  }
  return {sheets,cellCount,externalLinks:Object.keys(zip.files).some(n=>n.startsWith('xl/externalLinks/'))};
 }
 const column=index=>X.utils.encode_col(index);
 const api={read,limits,column};root.FinanceExcelReader=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
