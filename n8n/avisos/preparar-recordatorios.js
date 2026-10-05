function prepararRecordatorios(result,now=new Date()){
 if(result?.ok!==true||!Array.isArray(result.citas))throw new Error('No se pudo consultar la agenda');
 const key=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
 const tomorrow=key(new Date(now.getTime()+86400000));
 const seen=new Set(),events=[];
 for(const c of result.citas){
  if(c.canceled_at||c.cancelled_at||c.canceled||c.cancelled||/cancel/i.test(String(c.status||'')))continue;
  const starts_at=String(c.starts_at||'');const date=new Date(starts_at);
  const paciente_id=String(c.person_id||c.paciente_id||'');
  const cita_id=String(c.cita_id||c.id||'');
  const telefono=String(c.telefono||'').replace(/\D/g,'').slice(-10);
  if(!Number.isFinite(date.getTime())||key(date)!==tomorrow||!/\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:?\d{2})$/.test(starts_at)||!/^\d{1,15}$/.test(paciente_id)||!/^\d{1,15}$/.test(cita_id)||!/^\d{10}$/.test(telefono))continue;
  const id=cita_id+':'+starts_at;if(seen.has(id))continue;seen.add(id);
  events.push({tipo:'recordatorio_cita',paciente_id,cita_id,telefono,starts_at,modalidad:/virtual|online/i.test(String(c.servicio||'')+' '+String(c.motivo||''))?'virtual':'presencial',monto:0});
 }
 return events;
}

if(typeof module!=='undefined')module.exports=prepararRecordatorios;
