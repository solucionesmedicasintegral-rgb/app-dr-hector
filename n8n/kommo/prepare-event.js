const e=$('Validar aviso').first().json;
if(e.tipo!=='cita_agendada')return [];
const r=$('Buscar expediente').first().json;
const candidates=Array.isArray(r.pacientes)?r.pacientes:(r.paciente?[r.paciente]:[]);
const p=r.encontrado===true?candidates.find(p=>String(p.id||p.person_id||p.patient_id||'')===String(e.paciente_id)):null;
if(!p)throw new Error('El expediente de la cita no coincide');
const nombre=String(p.nombre||p.full_name||[p.first_name,p.middle_name,p.last_name,p.maternal_name].filter(Boolean).join(' ')).trim();
return [{json:{tipo:e.tipo,cita_id:String(e.cita_id),paciente_id:String(e.paciente_id),telefono:String(e.telefono||''),paciente_nombre:nombre,paciente_email:String(p.email||''),starts_at:String(e.starts_at||''),motivo_consulta:String(e.motivo_consulta||''),encounter_type_id:String(e.encounter_type_id||'')}}];
