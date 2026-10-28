/* Core validates the live Nimbo and Google calendars before offering or saving a slot. */
(function(root){
 const blocks=[];
 function allowed(slot,duration){
  const start=Date.parse(String(slot?.fecha||'')+'T'+String(slot?.hora||'')+':00-06:00');
  const minutes=Number(duration);
  if(!Number.isFinite(start)||!Number.isFinite(minutes)||minutes<=0)return false;
  const end=start+minutes*60000;
  return !blocks.some(block=>start<block.end&&end>block.start);
 }
 function guard(body){
  let slot;
  if(body.action==='crear_cita')slot={fecha:body.fecha,hora:body.hora};
  if(body.action==='validar_reagendacion'&&body.nueva_fecha&&body.nueva_hora)slot={fecha:body.nueva_fecha,hora:body.nueva_hora};
  if(slot&&!allowed(slot,body.duracion||60))throw Error('Ese horario no está disponible. Actualiza la agenda y elige otro.');
 }
 function filter(response,body){
  if(body.action!=='consultar_disponibilidad'||!Array.isArray(response?.horarios))return response;
  const horarios=response.horarios.filter(slot=>allowed(slot,body.duracion||response.duracion||60));
  return {...response,horarios,total_disponibles:horarios.length};
 }
 root.HECTOR_SCHEDULING={allowed,guard,filter};
})(typeof window==='undefined'?globalThis:window);
