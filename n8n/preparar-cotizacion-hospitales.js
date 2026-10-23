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

return [{json:{numero_cotizacion:body.numero_cotizacion,paciente_id:body.paciente?.id||'',paciente_nombre:replacements.paciente,paciente_telefono:replacements.telefono,paciente_correo:replacements.correo,total:Number(body.total||0),items,requests,pdf_nombre:`Cotizacion_${body.numero_cotizacion}_${replacements.paciente}`.replace(/[^a-zA-Z0-9-_áéíóúÁÉÍÓÚñÑ ]/g,'').replace(/\s+/g,'_')+'.pdf'}}];