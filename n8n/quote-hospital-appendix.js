function appendHospitalQuoteRequests(body,requests,fmt){
 if(!Array.isArray(body.hospitales)||!body.hospitales.length)return;
 if(body.hospitales.length>12)throw new Error('Demasiadas opciones de hospital');
 const base=Number(body.total);
 if(!Number.isFinite(base)||base<0)throw new Error('Total de conceptos inválido');
 const clean=v=>String(v||'').replace(/[\r\n\t]/g,' ').trim().slice(0,160);
 const hospitals=body.hospitales.map(h=>{
  const nombre=clean(h.nombre),minimo=Number(h.minimo),maximo=Number(h.maximo);
  if(!nombre||!Number.isFinite(minimo)||!Number.isFinite(maximo)||minimo<=0||maximo<minimo)throw new Error('Rango hospitalario inválido');
  return {nombre,minimo,maximo};
 });
 const range=(a,b)=>a===b?fmt(a):`${fmt(a)} a ${fmt(b)}`;
 const lines=[
  'DR. HÉCTOR CARRILLO',
  'ANEXO · OPCIONES DE HOSPITAL PARA CIRUGÍA',
  `Cotización: ${clean(body.numero_cotizacion)}`,
  `Paciente: ${clean(body.paciente?.nombre)}`,
  `Fecha: ${clean(body.fecha)} · Importes en MXN`,
  '',
  `Total de conceptos cotizados: ${fmt(base)}`,
  'El gasto hospitalario se estima por separado.',
  ''
 ];
 hospitals.forEach((h,i)=>lines.push(`${i+1}. ${h.nombre}`,`Hospital estimado: ${range(h.minimo,h.maximo)}`,`Total estimado (conceptos + hospital): ${range(base+h.minimo,base+h.maximo)}`,''));
 lines.push('REFERENCIA DEL CONSULTORIO · PENDIENTE DE CONFIRMACIÓN',
  'Cada hospital es una alternativa; los importes de diferentes hospitales no se suman entre sí.',
  'Estos rangos no son tarifas oficiales verificadas ni una cotización confirmada del hospital.',
  'El monto definitivo y lo que incluye deben confirmarse para el procedimiento, insumos y estancia requeridos.',
  'El presupuesto hospitalario no está incluido en el total de conceptos de la primera hoja.','');
 requests.push({insertPageBreak:{endOfSegmentLocation:{}}});
 requests.push({insertText:{endOfSegmentLocation:{},text:lines.join('\n')}});
}
