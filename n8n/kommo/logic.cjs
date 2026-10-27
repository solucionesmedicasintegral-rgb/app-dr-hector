function unpack(r){for(let i=0;i<5;i++){if(typeof r==='string'){r=JSON.parse(r);continue;}if(r?._embedded)return r;if(r?.data!==undefined){r=r.data;continue;}if(r?.body!==undefined){r=r.body;continue;}break;}return r||{};}
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const phone=s=>String(s||'').replace(/\D/g,'').slice(-10);
const PIPELINE=8678943,CONFIRMACION=68204659,FECHA_FIELD=1989801;
function validateEvent(e){
 if(e.tipo!=='cita_agendada')return null;
 const citaId=String(e.cita_id||''),pid=String(e.paciente_id||''),tel=phone(e.telefono),nombre=String(e.paciente_nombre||'').replace(/[\r\n\t]/g,' ').trim().slice(0,140),starts=String(e.starts_at||'');
 if(!/^[1-9]\d{0,19}$/.test(citaId)||!/^[1-9]\d{0,19}$/.test(pid)||tel.length!==10||!nombre||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:?\d{2})$/.test(starts)||!Number.isFinite(Date.parse(starts)))throw Error('Datos de cita incompletos para Kommo');
 return {tipo:e.tipo,cita_id:citaId,paciente_id:pid,telefono:tel,paciente_nombre:nombre,email:/^\S+@\S+\.\S+$/.test(String(e.paciente_email||''))?String(e.paciente_email).trim().toLowerCase():'',starts_at:starts,marker:'[APPHC'+citaId+']',query:'APPHC'+citaId,dry_run:e.dry_run===true};
}
function chooseContact(job,response){
 const rows=unpack(response)?._embedded?.contacts||[];
 const exact=rows.filter(c=>(c.custom_fields_values||[]).some(f=>f.field_code==='PHONE'&&(f.values||[]).some(v=>phone(v.value)===job.telefono)));
 const names=exact.filter(c=>norm(c.name)===norm(job.paciente_nombre));
 const chosen=names.length===1?names[0]:exact.length===1?exact[0]:null;
 if(exact.length>1&&!chosen)throw Error('Varios contactos con el mismo teléfono: requiere vinculación manual');
 return {...job,contact_id:chosen?.id||null,contact_name:chosen?.name||'',contact_body:[{name:job.paciente_nombre,custom_fields_values:[{field_code:'PHONE',values:[{value:'+52'+job.telefono,enum_code:'MOB'}]},...(job.email?[{field_code:'EMAIL',values:[{value:job.email,enum_code:'WORK'}]}]:[])]}]};
}
function resolvedContact(job,response){
 const raw=unpack(response),c=raw?._embedded?.contacts?.[0]||raw;
 if(!Number.isInteger(c.id)||c.id<=0||(job.contact_id&&c.id!==job.contact_id))throw Error('Kommo no confirmó el contacto correcto');
 const leads=(c._embedded?.leads||[]).map(l=>Number(l.id)).filter(Number.isSafeInteger);
 if(leads.length>50)throw Error('Demasiados leads del contacto: requiere revisión manual');
 return {...job,contact_id:c.id,contact_name:c.name||job.contact_name,contact_lead_ids:leads};
}
function findAppointmentLead(job,response){
 const rows=unpack(response)?._embedded?.leads||[];
 const exact=rows.filter(l=>Number(l.pipeline_id)===PIPELINE&&String(l.name||'').includes(job.marker));
 if(exact.length>1)throw Error('Más de un lead para esta cita: requiere revisión manual');
 return {...job,app_lead:exact[0]||null};
}
function decideLead(job,response){
 const active=l=>Number(l.pipeline_id)===PIPELINE&&![142,143].includes(Number(l.status_id));
 let lead=job.app_lead;
 if(!lead&&norm(job.contact_name)===norm(job.paciente_nombre)){
  const candidates=(unpack(response)?._embedded?.leads||[]).filter(l=>{
   if(!active(l)||/\[APPHC\d+\]/.test(String(l.name||'')))return false;
   const booked=(l.custom_fields_values||[]).find(f=>Number(f.field_id)===FECHA_FIELD)?.values?.[0]?.value;
   return !booked||Number(booked)*1000<Date.now()||Math.abs(Number(booked)*1000-Date.parse(job.starts_at))<60000;
  });
  if(candidates.length>1)throw Error('Varios leads activos de Héctor: requiere vinculación manual');
  lead=candidates[0]||null;
 }
 const closed=lead&&[142,143].includes(Number(lead.status_id));
 const appExists=Boolean(job.app_lead);
 const existingName=String(lead?.name||job.paciente_nombre+' · Cita Dr. Héctor').replace(/[\r\n\t]/g,' ').trim();
 const name=existingName.includes(job.marker)?existingName:existingName.slice(0,220-job.marker.length)+' '+job.marker;
 const body={...(lead?{id:Number(lead.id)}:{}),name,...(!appExists?{pipeline_id:PIPELINE,status_id:CONFIRMACION}:{}),custom_fields_values:[{field_id:FECHA_FIELD,values:[{value:Math.floor(Date.parse(job.starts_at)/1000)}]}],...(!lead?{_embedded:{contacts:[{id:job.contact_id,is_main:true}]}}:{})};
 return {...job,lead_id:lead?.id||null,noop:Boolean(closed),lead_body:[body]};
}
function result(job,response){const raw=unpack(response),lead=raw?._embedded?.leads?.[0]||raw;if(!Number.isInteger(lead.id)||lead.id<=0||(job.lead_id&&Number(job.lead_id)!==lead.id))throw Error('Kommo no confirmó el lead de la cita');return {ok:true,cita_id:job.cita_id,lead_id:lead.id,pipeline_id:PIPELINE,estado:job.noop?'cerrado_sin_cambios':job.lead_id?'actualizado':'creado',etapa:job.noop?null:job.app_lead?job.app_lead.status_id:CONFIRMACION,cancelacion_automatica:false};}
module.exports={unpack,norm,phone,validateEvent,chooseContact,resolvedContact,findAppointmentLead,decideLead,result};
