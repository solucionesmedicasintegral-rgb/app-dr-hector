function prepararCorreo(evento, result) {
 const p=result.encontrado === true ? result.paciente : null;
 const id=String(p?.id||p?.person_id||p?.patient_id||'');
 const liga=evento.tipo==='liga_solicitada';
 const transferencia=evento.tipo==='transferencia_elegida';
 const interno=liga||transferencia;
 const email=interno?'smedicahr@gmail.com':String(p?.email||'').trim().toLowerCase();
 if(id!==evento.paciente_id || !/^\S+@\S+\.\S+$/.test(email))throw new Error('Expediente y correo no coinciden');
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const date=new Date(evento.starts_at);
 const fecha=new Intl.DateTimeFormat('es-MX',{dateStyle:'full',timeZone:'America/Mexico_City'}).format(date);
 const hora=new Intl.DateTimeFormat('es-MX',{hour:'numeric',minute:'2-digit',timeZone:'America/Mexico_City'}).format(date);
 if(interno){
  const nombre=String(p?.nombre||[p?.first_name,p?.last_name].filter(Boolean).join(' ')||'Paciente');
  const asunto=(evento.prueba?'[PRUEBA] ':'')+(transferencia?'Transferencia elegida · Dr. Héctor Carrillo':'Liga de pago solicitada · Dr. Héctor Carrillo');
  const titulo=evento.prueba?'Prueba del aviso de '+(transferencia?'transferencia':'solicitud de liga'):transferencia?'La paciente eligió transferencia':'Nueva solicitud de liga de pago';
  const aviso=evento.prueba?'Este es un aviso de prueba. No hay una solicitud ni un cobro real.':transferencia?'La paciente eligió pagar por transferencia desde la app. El pago sigue pendiente; revisa la recepción del dinero antes de confirmarlo.':'La paciente solicitó una liga de pago desde la app. Revisa su cita y envíale la liga correspondiente.';
  const html=`<div style="background:#f7f4ec;padding:24px;font-family:Arial;color:#272727"><div style="max-width:560px;margin:auto;background:white;border-radius:20px;overflow:hidden"><div style="background:#2d371d;color:white;padding:24px;font-size:21px;font-weight:bold">Dr. Héctor Carrillo</div><div style="padding:24px"><h1>${esc(titulo)}</h1><p>${esc(aviso)}</p><p><b>Paciente:</b> ${esc(nombre)}<br><b>Teléfono:</b> ${esc(evento.telefono)}<br><b>Cita:</b> ${esc(evento.cita_id)}<br><b>Fecha:</b> ${esc(fecha)}<br><b>Hora:</b> ${esc(hora)}<br><b>Importe solicitado:</b> ${esc(new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(evento.monto||0))}</p><a href="https://solucionesmedicasintegral-rgb.github.io/app-dr-hector/admin.html" style="display:inline-block;background:#2d371d;color:white;padding:14px 20px;border-radius:12px;text-decoration:none">Abrir administración</a><p style="font-size:12px;color:#777">Solicitud pendiente. Este aviso no acredita un pago.</p></div></div></div>`;
  return {...evento,email,asunto,html};
 }
 const pago=evento.tipo==='pago_confirmado';
 const asunto=(evento.prueba?'[PRUEBA] ':'')+(pago?'Pago confirmado':'Cita agendada')+' · Dr. Héctor Carrillo';
 const titulo=evento.prueba?'Prueba del aviso de '+(pago?'pago':'cita'):pago?'Recibimos tu pago':'Tu cita quedó agendada';
 const monto=new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(evento.monto||0);
 const texto=evento.prueba?'Este es un correo de prueba del sistema. No crea una cita ni registra un pago real.':pago?'El consultorio confirmó tu pago por '+monto+'.':'Registramos tu cita con el Dr. Héctor Carrillo. Puedes consultar el estado de tu pago en la app.';
 const html=`<div style="background:#f7f4ec;padding:24px;font-family:Arial;color:#272727"><div style="max-width:560px;margin:auto;background:white;border-radius:20px;overflow:hidden"><div style="background:#2d371d;color:white;padding:24px;font-size:21px;font-weight:bold">Dr. Héctor Carrillo</div><div style="padding:24px"><h1>${esc(titulo)}</h1><p>${esc(texto)}</p><p><b>Fecha:</b> ${esc(fecha)}<br><b>Hora:</b> ${esc(hora)}<br><b>Modalidad:</b> ${evento.modalidad==='virtual'?'Virtual':'Presencial'}</p><a href="https://solucionesmedicasintegral-rgb.github.io/app-dr-hector/" style="display:inline-block;background:#2d371d;color:white;padding:14px 20px;border-radius:12px;text-decoration:none">Ver mi cita</a><p style="font-size:12px;color:#777">Si necesitas ayuda, contacta al consultorio.</p></div></div></div>`;
 return {...evento,email,asunto,html};
}

if (typeof module !== 'undefined') module.exports = prepararCorreo;
