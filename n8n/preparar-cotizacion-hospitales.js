const body = $input.first().json.body || $input.first().json;
const fmt = (n) => { const num = Number(n) || 0; return '$' + num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
const items = Array.isArray(body.items) ? body.items.slice(0, 8) : [];
if (!body.numero_cotizacion) throw new Error('Falta numero_cotizacion');
if (!body.paciente?.nombre) throw new Error('Falta paciente.nombre');
if (!items.length) throw new Error('La cotizacion no tiene conceptos');
const replacements = {
  numero_cotizacion: String(body.numero_cotizacion || ''),
  fecha: String(body.fecha || ''),
  paciente: String(body.paciente?.nombre || ''),
  telefono: String(body.paciente?.telefono || ''),
  correo: String(body.paciente?.correo || ''),
  vigencia_dias: String(body.vigencia_dias || '30'),
  vigencia_fecha: String(body.vigencia_fecha || ''),
  total: fmt(body.total)
};
for (let i = 0; i < 8; i++) {
  const it = items[i] || {};
  const n = i + 1;

  const precioLista = Number(
    it.precio_lista ??
    it.precio ??
    0
  );

  const precioPromo = Number(
    it.precio_promo ||
    0
  );

  let precioTexto = '';

  if (precioPromo > 0 && precioPromo < precioLista) {
    precioTexto =
      `Lista: ${fmt(precioLista)}\n` +
      `PROMO: ${fmt(precioPromo)}`;
  } else {
    precioTexto = precioLista ? fmt(precioLista) : '';
  }

  replacements[`fila${n}_concepto`] =
    String(it.concepto || '');

  replacements[`fila${n}_descripcion`] =
    String(it.descripcion || '');

  replacements[`fila${n}_incluye`] =
    String(it.incluye || '');

  replacements[`fila${n}_precio`] =
    precioTexto;}
const requests = Object.entries(replacements).map(([tag,value])=>({replaceAllText:{containsText:{text:`{{${tag}}}`,matchCase:true},replaceText:value}}));
appendHospitalQuoteRequests(body,requests,fmt);
return [{json:{numero_cotizacion:body.numero_cotizacion,paciente_id:body.paciente?.id||'',paciente_nombre:replacements.paciente,paciente_telefono:replacements.telefono,paciente_correo:replacements.correo,total:Number(body.total||0),items,requests,pdf_nombre:`Cotizacion_${body.numero_cotizacion}_${replacements.paciente}`.replace(/[^a-zA-Z0-9-_áéíóúÁÉÍÓÚñÑ ]/g,'').replace(/\s+/g,'_')+'.pdf'}}];
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
