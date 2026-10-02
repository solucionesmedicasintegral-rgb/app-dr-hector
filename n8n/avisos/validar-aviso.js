function validarAviso(raw){
 if(!['cita_agendada','pago_confirmado','liga_solicitada','transferencia_elegida'].includes(raw.tipo))throw new Error('Tipo no permitido');
 const paciente_id=String(raw.paciente_id||'');
 const cita_id=String(raw.cita_id||'');
 const telefono=String(raw.telefono||'').replace(/\D/g,'').slice(-10);
 if(!/^\d{1,15}$/.test(paciente_id)||!/^\d{1,15}$/.test(cita_id)||!/^\d{10}$/.test(telefono))throw new Error('Datos incompletos');
 if(typeof raw.starts_at!=='string'||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:?\d{2})$/.test(raw.starts_at)||!Number.isFinite(Date.parse(raw.starts_at)))throw new Error('Fecha inválida');
 const monto=Number(raw.monto||0);
 if(!Number.isFinite(monto)||monto<0)throw new Error('Monto inválido');
 if(raw.tipo==='pago_confirmado'&&(!Number.isFinite(monto)||monto<=0))throw new Error('Monto inválido');
 return {prueba:raw.prueba===true,tipo:raw.tipo,evento_id:`${raw.tipo}:${cita_id}`,paciente_id,cita_id,telefono,starts_at:raw.starts_at,modalidad:raw.modalidad==='virtual'?'virtual':'presencial',monto};
}

if (typeof module !== 'undefined') module.exports = validarAviso;
