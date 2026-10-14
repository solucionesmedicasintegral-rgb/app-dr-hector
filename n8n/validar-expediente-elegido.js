const result=$input.first()?.json||{};
const requested=$('Validar petición').first().json;
const candidates=Array.isArray(result.pacientes)?result.pacientes:(result.paciente?[result.paciente]:[]);
const p=result.encontrado===true?candidates.find(p=>String(p.id||p.person_id||p.patient_id||'')===String(requested.paciente_id)):null;
const id=String(p?.id||p?.person_id||p?.patient_id||'');
const email=String(p?.email||'').trim().toLowerCase();
if(id!==String(requested.paciente_id)||!/^\S+@\S+\.\S+$/.test(email))throw new Error('Expediente sin correo verificable');
return [{json:{paciente_id:id,email}}];
