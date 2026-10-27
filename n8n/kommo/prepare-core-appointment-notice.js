const c=$('Procesar Cita Creada').first().json.cita||{};
const r=$('Normalizar Request APP').first().json;
if(!c.id||!c.person_id||!c.starts_at||!r.telefono)return [];
return [{json:{tipo:'cita_agendada',paciente_id:String(c.person_id),cita_id:String(c.id),telefono:r.telefono,starts_at:c.starts_at,modalidad:r.modalidad,motivo_consulta:String(c.motivo_consulta||''),encounter_type_id:String(c.encounter_type_id||'')}}];
