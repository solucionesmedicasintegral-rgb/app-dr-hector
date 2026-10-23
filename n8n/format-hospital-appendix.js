// n8n Code: after Leer Documento Cotizacion, before Reemplazar Campos Plantilla.
// The live document end is read on every run; no template indexes are hardcoded.
const doc=$input.first().json;
const prepared=$('Preparar Cotizacion').first().json;
const body=$('Webhook Cotizacion Hector').first().json.body || $('Webhook Cotizacion Hector').first().json;
return [{json:{requests:buildHospitalDesignRequests(body,doc,prepared.requests)}}];

function buildHospitalDesignRequests(body,doc,replacements){
 const existing=(replacements||[]).filter(r=>r.replaceAllText);
 if(!Array.isArray(body.hospitales)||!body.hospitales.length)return existing;
 if(body.hospitales.length>12)throw new Error('Máximo 12 opciones de hospital');
 const total=Number(body.total);
 if(!Number.isFinite(total)||total<0)throw new Error('Total de conceptos inválido');
 const clean=v=>String(v??'').replace(/[\r\n\t]/g,' ').trim().slice(0,160);
 const hospitals=body.hospitales.map(h=>{
  const nombre=clean(h.nombre),minimo=Number(h.minimo),maximo=Number(h.maximo);
  if(!nombre||!Number.isFinite(minimo)||!Number.isFinite(maximo)||minimo<=0||maximo<minimo)throw new Error('Rango hospitalario inválido');
  return {nombre,minimo,maximo};
 });
 const content=doc.body?.content||doc.tabs?.[0]?.documentTab?.body?.content;
 const end=content?.[content.length-1]?.endIndex;
 if(!Number.isInteger(end)||end<2)throw new Error('No se pudo leer el documento base');
 const start=end-1;
 const money=n=>'$'+n.toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
 const range=(a,b)=>a===b?money(a):`${money(a)} - ${money(b)}`;
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const assetRoot='https://raw.githubusercontent.com/solucionesmedicasintegral-rgb/app-dr-hector/main/assets/hospitals/';
 const logos=[
  {match:'angeles',file:'angeles.png',w:440,h:90},
  {match:'real san jose',file:'real-san-jose.png',w:159,h:102},
  {match:'lomas providencia',file:'lomas-providencia.png',w:200,h:155},
  {match:'versalles',file:'versalles.png',w:531,h:350},
  {match:'country 2000',file:'country-2000.png',w:210,h:250}
 ];
 const color=hex=>({red:parseInt(hex.slice(0,2),16)/255,green:parseInt(hex.slice(2,4),16)/255,blue:parseInt(hex.slice(4,6),16)/255});
 const green=color('2d371d'),gold=color('a88a44'),gray=color('62665d'),ink=color('282e25'),line=color('dcdccd');
 const rows=[];let text='\n';
 const add=(value,kind,extra={})=>{const row={from:start+text.length,to:start+text.length+value.length,kind,...extra};text+=value+'\n';rows.push(row);return row;};
 const perPage=3;
 const pages=Math.ceil(hospitals.length/perPage);
 for(let page=0;page<pages;page++){
  add('DR. HÉCTOR CARRILLO','brand',{pageBreak:true});
  add('Opciones de hospital','title');
  add(`PRESUPUESTO ESTIMADO PARA CIRUGÍA  |  ${page+1} / ${pages}`,'kicker');
  add(`Paciente: ${clean(body.paciente?.nombre)}`,'meta');
  add(`Cotización: ${clean(body.numero_cotizacion)}   |   ${clean(body.fecha)}   |   MXN`,'meta');
  add(`Conceptos cotizados: ${money(total)}`,'summary');
  add('Compara cada opción. El gasto hospitalario se estima por separado.','intro');
  hospitals.slice(page*perPage,page*perPage+perPage).forEach((h,j)=>{
   const logo=logos.find(l=>normalize(h.nombre).includes(l.match));
   if(logo)add(' ','logo',{logo});
   add(`${String(page*perPage+j+1).padStart(2,'0')}   ${h.nombre}`,'hospital');
   add(`Gasto hospitalario estimado: ${range(h.minimo,h.maximo)}`,'cost');
   add(`Total estimado: ${range(total+h.minimo,total+h.maximo)}`,'total');
   add('Conceptos cotizados + una opción de hospital','caption');
  });
  add('IMPORTANTE PARA TU PRESUPUESTO','noteHeading');
  add('Los hospitales son alternativas: sus importes no se suman entre sí.','note');
  add('Rangos de referencia del consultorio; pendientes de confirmación por el hospital.','note');
  add('El monto y lo que incluye se confirman según procedimiento, insumos y estancia.','note');
  add('El gasto hospitalario no está incluido en el total de conceptos de la primera hoja.','note',{lastNote:true});
 }
 const requests=[{insertText:{location:{index:start},text}}];
 const full={startIndex:start+1,endIndex:start+text.length};
 requests.push({updateTextStyle:{range:full,textStyle:{weightedFontFamily:{fontFamily:'Arial'},fontSize:{magnitude:9,unit:'PT'},bold:false,italic:false,underline:false,foregroundColor:{color:{rgbColor:ink}},backgroundColor:{color:{rgbColor:{red:1,green:1,blue:1}}}},fields:'weightedFontFamily,fontSize,bold,italic,underline,foregroundColor,backgroundColor'}});
 requests.push({updateParagraphStyle:{range:full,paragraphStyle:{namedStyleType:'NORMAL_TEXT',alignment:'START',lineSpacing:110,spaceAbove:{magnitude:0,unit:'PT'},spaceBelow:{magnitude:0,unit:'PT'},indentStart:{magnitude:0,unit:'PT'},indentEnd:{magnitude:0,unit:'PT'},indentFirstLine:{magnitude:0,unit:'PT'},keepWithNext:false,pageBreakBefore:false},fields:'namedStyleType,alignment,lineSpacing,spaceAbove,spaceBelow,indentStart,indentEnd,indentFirstLine,keepWithNext,pageBreakBefore'}});
 const border=c=>({color:{color:{rgbColor:c}},width:{magnitude:0.75,unit:'PT'},padding:{magnitude:7,unit:'PT'},dashStyle:'SOLID'});
 const images=[];
 for(const r of rows){
  const range={startIndex:r.from,endIndex:r.to};
  const p={avoidWidowAndOrphan:true},t={};
  switch(r.kind){
   case 'brand':Object.assign(p,{pageBreakBefore:true,spaceAbove:{magnitude:14,unit:'PT'},spaceBelow:{magnitude:8,unit:'PT'},keepWithNext:true});Object.assign(t,{fontSize:{magnitude:9,unit:'PT'},bold:true,foregroundColor:{color:{rgbColor:gold}}});break;
   case 'title':Object.assign(p,{spaceBelow:{magnitude:5,unit:'PT'},keepWithNext:true});Object.assign(t,{weightedFontFamily:{fontFamily:'Georgia'},fontSize:{magnitude:23,unit:'PT'},foregroundColor:{color:{rgbColor:green}}});break;
   case 'kicker':Object.assign(p,{spaceBelow:{magnitude:14,unit:'PT'},keepWithNext:true});Object.assign(t,{fontSize:{magnitude:8,unit:'PT'},foregroundColor:{color:{rgbColor:gray}}});break;
   case 'meta':Object.assign(p,{spaceBelow:{magnitude:4,unit:'PT'},keepWithNext:true});Object.assign(t,{fontSize:{magnitude:8.5,unit:'PT'},foregroundColor:{color:{rgbColor:gray}}});break;
   case 'summary':Object.assign(p,{spaceAbove:{magnitude:9,unit:'PT'},spaceBelow:{magnitude:13,unit:'PT'},borderBottom:border(gold),keepWithNext:true});Object.assign(t,{fontSize:{magnitude:11,unit:'PT'},bold:true,foregroundColor:{color:{rgbColor:green}}});break;
   case 'intro':Object.assign(p,{spaceBelow:{magnitude:12,unit:'PT'},keepWithNext:true});Object.assign(t,{fontSize:{magnitude:8.5,unit:'PT'},foregroundColor:{color:{rgbColor:gray}}});break;
   case 'logo':Object.assign(p,{alignment:'END',spaceAbove:{magnitude:8,unit:'PT'},spaceBelow:{magnitude:0,unit:'PT'},keepWithNext:true});Object.assign(t,{fontSize:{magnitude:1,unit:'PT'}});{const scale=Math.min(115/r.logo.w,29/r.logo.h);images.push({index:r.from,uri:assetRoot+r.logo.file,w:r.logo.w*scale,h:r.logo.h*scale});}break;
   case 'hospital':Object.assign(p,{spaceAbove:{magnitude:11,unit:'PT'},spaceBelow:{magnitude:7,unit:'PT'},keepWithNext:true});Object.assign(t,{fontSize:{magnitude:11,unit:'PT'},bold:true,foregroundColor:{color:{rgbColor:green}}});break;
   case 'cost':Object.assign(p,{spaceBelow:{magnitude:4,unit:'PT'},keepWithNext:true});Object.assign(t,{fontSize:{magnitude:9,unit:'PT'},foregroundColor:{color:{rgbColor:gray}}});break;
   case 'total':Object.assign(p,{spaceBelow:{magnitude:3,unit:'PT'},keepWithNext:true});Object.assign(t,{fontSize:{magnitude:11,unit:'PT'},bold:true,foregroundColor:{color:{rgbColor:green}}});break;
   case 'caption':Object.assign(p,{spaceBelow:{magnitude:5,unit:'PT'},borderBottom:border(line)});Object.assign(t,{fontSize:{magnitude:7.5,unit:'PT'},foregroundColor:{color:{rgbColor:gray}}});break;
   case 'noteHeading':Object.assign(p,{spaceAbove:{magnitude:14,unit:'PT'},spaceBelow:{magnitude:5,unit:'PT'},keepWithNext:true});Object.assign(t,{fontSize:{magnitude:8,unit:'PT'},bold:true,foregroundColor:{color:{rgbColor:gold}}});break;
   case 'note':Object.assign(p,{spaceBelow:{magnitude:3,unit:'PT'},keepWithNext:!r.lastNote});Object.assign(t,{fontSize:{magnitude:7.5,unit:'PT'},foregroundColor:{color:{rgbColor:gray}}});break;
  }
  requests.push({updateParagraphStyle:{range,paragraphStyle:p,fields:Object.keys(p).join(',')}});
  if(Object.keys(t).length)requests.push({updateTextStyle:{range,textStyle:t,fields:Object.keys(t).join(',')}});
 }
 images.sort((a,b)=>b.index-a.index).forEach(im=>requests.push({insertInlineImage:{location:{index:im.index},uri:im.uri,objectSize:{width:{magnitude:im.w,unit:'PT'},height:{magnitude:im.h,unit:'PT'}}}}));
 return requests.concat(existing);
}
