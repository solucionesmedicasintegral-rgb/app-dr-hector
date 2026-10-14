let request={};
try{request=$('Normalizar Request APP').first().json||{}}catch(e){request=$('Datos Prueba').first().json||{}}
const digits=v=>String(v??'').replace(/\D/g,'').slice(-10);
const phone=digits(request.telefono);
if(phone.length!==10)return [{json:{ok:false,encontrado:false,multiple:false,pacientes:[],paciente:null}}];
const rows=$input.all().flatMap(item=>{
 const r=item.json;
 if(Array.isArray(r))return r;
 for(const k of ['people','data','results'])if(Array.isArray(r[k]))return r[k];
 return r.id?[r]:[];
});
const seen=new Set();
const pacientes=rows.filter(p=>{
 const id=p.id||p.person_id||p.patient_id;
 if(!id||seen.has(String(id)))return false;
 if(![p.telephone2,p.telephone,p.phone,p.cellphone,p.mobile].some(v=>digits(v)===phone))return false;
 seen.add(String(id));return true;
}).map(p=>({id:p.id||p.person_id||p.patient_id,nombre:p.full_name||[p.first_name,p.middle_name,p.last_name,p.maternal_name].filter(Boolean).join(' '),first_name:p.first_name||'',last_name:p.last_name||'',telefono:request.telefono,email:p.email||''}));
return [{json:{ok:true,encontrado:pacientes.length>0,multiple:pacientes.length>1,pacientes,paciente:pacientes.length===1?pacientes[0]:null}}];
